import os
import re
import pickle
import json
from typing import List

from flask import Flask, request, jsonify
import time
from functools import lru_cache
try:
	import requests
except Exception:
	requests = None

try:
	import numpy as np
	import pandas as pd
	from wordfreq import word_frequency
	from tensorflow.keras.models import load_model
except Exception:
	# Defer import errors until runtime; we'll handle missing deps gracefully
	np = None
	pd = None
	word_frequency = None
	load_model = None


APP_DIR = os.path.dirname(__file__)
MODEL_FILE = os.path.join(APP_DIR, 'word_difficulty_hybrid.h5')
SCALER_FILE = os.path.join(APP_DIR, 'scaler.pkl')
VOCAB_FILE = os.path.join(APP_DIR, 'vocab.pkl')

CLASS_MAP = {0: 'easy', 1: 'medium', 2: 'hard'}
MAXLEN = 21
numeric_cols = ['Length','Freq_HAL','Log_Freq_HAL','I_Mean_RT','I_SD','Obs','I_Mean_Accuracy','Real_Freq']

app = Flask(__name__)

# Try to expose an ASGI wrapper so this module can be served by Uvicorn
try:
	from asgiref.wsgi import WsgiToAsgi
except Exception:
	WsgiToAsgi = None


# ==============================
# Load mô hình và scaler
# ==============================
# Fallback định nghĩa tối giản tiếng Việt cho một số từ phổ biến
LOCAL_VI_DICT = {
	"apple": "quả táo",
	"computer": "máy tính",
}
def safe_load_model():
	if load_model is None:
		return None
	if not os.path.exists(MODEL_FILE):
		return None
	try:
		return load_model(MODEL_FILE)
	except Exception as e:
		print('Error loading model:', e)
		return None


def safe_load_pickle(path):
	if not os.path.exists(path):
		return None
	try:
		with open(path, 'rb') as f:
			return pickle.load(f)
	except Exception as e:
		print('Error loading pickle', path, e)
		return None


def encode_data(words: List[str], vocab: dict, maxlen=MAXLEN):
	X = np.zeros((len(words), maxlen), dtype=np.int32)
	for i, w in enumerate(words):
		for j, c in enumerate(w[:maxlen]):
			X[i, j] = vocab.get(c, 0)
	return X


MODEL = safe_load_model()
SCALER = safe_load_pickle(SCALER_FILE)
VOCAB = safe_load_pickle(VOCAB_FILE)


# ==============================
# Xử lý token & dự đoán độ khó
# ==============================
def extract_tokens(text: str, limit_tokens=200):
	txt = (text or '').lower()
	toks = re.sub(r"[^a-zÀ-ỹ0-9\s]", ' ', txt).split()
	uniq, seen = [], set()
	for t in toks:
		if not t or len(t) < 2: continue
		if t in seen: continue
		seen.add(t)
		uniq.append(t)
		if len(uniq) >= limit_tokens:
			break
	return uniq


def predict_words(words: List[str]):
	if MODEL is None or SCALER is None or VOCAB is None or np is None:
		return [{'word': w, 'level': 'easy', 'probs': [1.0, 0.0, 0.0]} for w in words]

	data = pd.DataFrame({'Word': words})
	data['Length'] = data['Word'].apply(len)
	data['Freq_HAL'] = data['Word'].apply(lambda w: 1000 * (word_frequency(w, 'en', minimum=1e-6) if word_frequency else 0))
	data['Log_Freq_HAL'] = np.log10(data['Freq_HAL'] + 1)
	data['I_Mean_RT'] = 700 + data['Length'] * 5
	data['I_SD'] = 200 + data['Length'] * 10
	data['Obs'] = 30
	data['I_Mean_Accuracy'] = 0.8 - data['Length'] * 0.01
	data['Real_Freq'] = data['Word'].apply(lambda w: (word_frequency(w, 'en', minimum=1e-6) if word_frequency else 0))

	X_num = SCALER.transform(data[numeric_cols])
	X_char = encode_data(words, VOCAB, maxlen=MAXLEN)
	preds = MODEL.predict([X_char, X_num], verbose=0)

	out = []
	for w, p in zip(words, preds):
		idx = int(np.argmax(p))
		level = CLASS_MAP.get(idx, 'medium')
		out.append({'word': w, 'level': level, 'probs': [float(round(float(x), 4)) for x in p.tolist()]})
	return out


def map_cefr_to_simple(level_value):
	if level_value is None:
		return None
	lv = str(level_value).strip()
	if not lv:
		return None
	lv_up = lv.upper()
	if lv_up in ('A1', 'A2'): return 'easy'
	if lv_up in ('B1', 'B2'): return 'medium'
	if lv_up in ('C1', 'C2'): return 'hard'
	if lv.lower() in ('easy', 'medium', 'hard'): return lv.lower()
	try:
		n = int(float(lv))
		return CLASS_MAP.get(n, None)
	except Exception:
		return None


# ==============================
# API phân loại từ vựng
# ==============================
@app.route('/classify', methods=['POST'])
def classify():
	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or json_in.get('data') or ''
	if not text:
		tform = request.form.get('text') or request.values.get('text')
		text = tform or (request.get_data(as_text=True) or '')
	if not text:
		return jsonify({'error': 'Missing text'}), 400

	tokens = extract_tokens(text, limit_tokens=200)
	result = predict_words(tokens)
	for item in result:
		lvl = map_cefr_to_simple(item.get('level'))
		item['level'] = lvl if lvl else (item.get('level') or 'medium')
	return jsonify({'words': result, 'classify': result})


# ==============================
# Tra cứu định nghĩa cho flashcards (dùng Free Dictionary API khi có mạng)
# ==============================
DEF_API = "https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}"

def _pick_definition(payload):
	"""Chọn 1 định nghĩa ngắn gọn từ kết quả API free-dictionary.
	Trả về chuỗi hoặc None."""
	try:
		for entry in (payload or []):
			meanings = entry.get('meanings') or []
			for m in meanings:
				for d in (m.get('definitions') or []):
					text = (d or {}).get('definition')
					if text:
						return str(text).strip()
	except Exception:
		return None
	return None


@lru_cache(maxsize=2048)
def fetch_definition(word: str, lang: str = 'en', timeout: float = 2.5) -> str:
	"""Lấy định nghĩa cho 1 từ (mặc định tiếng Anh).
	- Có cache để giảm gọi trùng.
	- Nếu không có requests hoặc lỗi mạng, trả về chuỗi rỗng.
	"""
	if not word or not isinstance(word, str):
		return ''
	if requests is None:
		return ''
	try:
		url = DEF_API.format(lang=(lang or 'en'), word=requests.utils.quote(word))
		resp = requests.get(url, timeout=timeout)
		if resp.status_code != 200:
			return ''
		data = resp.json()
		picked = _pick_definition(data)
		return picked or ''
	except Exception:
		return ''


# ==============================
# API tạo flashcards
# ==============================
@app.route('/flashcards', methods=['POST'])
def flashcards():
	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or ''
	def_lang = json_in.get('def_lang') or json_in.get('lang') or 'vi'
	if not text:
		tform = request.form.get('text') or request.values.get('text')
		text = tform or (request.get_data(as_text=True) or '')
	if not text:
		return jsonify({'error': 'Missing text'}), 400

	tokens = extract_tokens(text, limit_tokens=200)
	words_info = predict_words(tokens)
	entries = []

	# Nếu yêu cầu ngôn ngữ khác tiếng Anh và có translator, dịch trực tiếp từng từ
	if def_lang and def_lang.lower() != 'en' and translator is not None:
		words_to_translate = [w['word'] for w in words_info[:60]]  # giới hạn để tránh chậm
		translations = translate_texts(words_to_translate, dest=def_lang) if words_to_translate else []
		for idx, w in enumerate(words_info):
			lvl = map_cefr_to_simple(w.get('level'))
			vi = ''
			if idx < len(translations):
				vi = translations[idx] or ''
			# Fallback: nếu dịch rỗng và có mapping cục bộ
			if not vi:
				vi = LOCAL_VI_DICT.get(w['word'].lower(), '')
			entries.append({'word': w['word'], 'definition': vi, 'level': lvl or (w.get('level') or 'medium')})
		return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': True})

	# Ngược lại: giữ cơ chế định nghĩa tiếng Anh (offline/online), có thể bổ sung dịch sau
	locked_indices = set()
	for idx, w in enumerate(words_info):
		lvl = map_cefr_to_simple(w.get('level'))
		definition = ''
		if idx < 60:
			ww = w['word']
			if re.fullmatch(r"[A-Za-z][A-Za-z\-']{1,}$", ww):
				definition = fetch_definition(ww.lower(), 'en')
		entries.append({'word': w['word'], 'definition': definition, 'level': lvl or (w.get('level') or 'medium')})

	return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': False})


# ==============================
# 🆕 API DỊCH VĂN BẢN (Google Translate miễn phí)
# ==============================
try:
	from googletrans import Translator
	translator = Translator()
except Exception:
	Translator = None
	translator = None


def translate_texts(texts, dest='vi'):
	"""Dịch danh sách chuỗi sang ngôn ngữ đích bằng googletrans khi khả dụng.
	Giữ nguyên thứ tự, bỏ qua phần tử rỗng. Nếu lỗi, trả về danh sách gốc.
	"""
	if not texts:
		return texts

	# 1) Thử dùng googletrans nếu sẵn sàng
	if translator is not None:
		try:
			res = translator.translate(texts, dest=dest or 'vi')
			if isinstance(res, list):
				return [getattr(r, 'text', t) for r, t in zip(res, texts)]
			return [getattr(res, 'text', texts[0])] + list(texts[1:])
		except Exception:
			pass

	# 2) Fallback nhẹ: gọi endpoint công khai của Google Translate (không chính thức)
	def _gtx_translate_batch(items, src='auto', tl='vi', timeout=3.0):
		if requests is None:
			return None
		out = []
		for t in items:
			if not t:
				out.append('')
				continue
			try:
				url = 'https://translate.googleapis.com/translate_a/single'
				params = {
					'client': 'gtx',
					'sl': src or 'auto',
					'tl': tl or 'vi',
					'dt': 't',
					'q': t,
				}
				resp = requests.get(url, params=params, timeout=timeout)
				if resp.status_code == 200:
					data = resp.json()
					segments = data[0] if data and isinstance(data, list) else None
					translated = ''.join(seg[0] for seg in segments if seg and seg[0]) if segments else ''
					out.append(translated)
				else:
					out.append('')
			except Exception:
				out.append('')
		return out

	gtx = _gtx_translate_batch(texts, tl=(dest or 'vi'))
	if gtx is not None:
		return gtx

	# 3) Cuối cùng: trả về nguyên văn nếu mọi cách đều lỗi
	return texts

@app.route('/translate', methods=['POST'])
def translate():
	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or ''
	target = json_in.get('target') or 'vi'

	if not text:
		tform = request.form.get('text') or request.values.get('text')
		text = tform or (request.get_data(as_text=True) or '')
	if not text:
		return jsonify({'error': 'Missing text'}), 400

	try:
		if translator is None:
			return jsonify({'error': 'Translator not available (package missing)'}), 503
		result = translator.translate(text, dest=target)
		return jsonify({
			'source_text': text,
			'translated_text': result.text,
			'src_lang': result.src,
			'target_lang': target
		})
	except Exception as e:
		return jsonify({'error': str(e)}), 500


# ==============================
# API kiểm tra trạng thái
# ==============================
@app.route('/status', methods=['GET'])
def status():
	info = {
		'model_present': bool(MODEL),
		'scaler_present': bool(SCALER),
		'vocab_present': bool(VOCAB),
		'translator_present': bool(translator),
	}
	try:
		import numpy, pandas, tensorflow, wordfreq
		info['numpy'] = numpy.__version__
		info['pandas'] = pandas.__version__
		info['tensorflow'] = tensorflow.__version__
		info['wordfreq'] = wordfreq.__version__
	except Exception:
		pass
	return jsonify(info)


# ==============================
# Chạy server
# ==============================
if __name__ == '__main__':
	missing = []
	if MODEL is None: missing.append('model')
	if SCALER is None: missing.append('scaler.pkl')
	if VOCAB is None: missing.append('vocab.pkl')
	if missing:
		print('⚠️ Warning: missing files ->', ', '.join(missing))
		print('Service will run with fallback mode.')
	app.run(host='0.0.0.0', port=5000, debug=True)
