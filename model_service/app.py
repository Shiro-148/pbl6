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
	from tensorflow.keras.preprocessing.sequence import pad_sequences
	import tensorflow as tf
except Exception:
	# Defer import errors until runtime; we'll handle missing deps gracefully
	np = None
	pd = None
	word_frequency = None
	load_model = None
	pad_sequences = None
	tf = None

APP_DIR = os.path.dirname(__file__)
# Updated to use TensorFlow model only (without FastText for now)
MODEL_FILE = os.path.join(APP_DIR, 'word_difficulty_hybrid_fasttext.h5')
CHAR_VOCAB_FILE = os.path.join(APP_DIR, 'char_vocab.pkl')

CLASS_MAP = {0: 'easy', 1: 'medium', 2: 'hard'}
MAXLEN = 21

app = Flask(__name__)

# Try to expose an ASGI wrapper so this module can be served by Uvicorn
try:
	from asgiref.wsgi import WsgiToAsgi
except Exception:
	WsgiToAsgi = None

# ==============================
# Custom Attention layer từ notebook
# ==============================
if tf:
	class Attention(tf.keras.layers.Layer):
		def __init__(self, **kwargs):
			super(Attention, self).__init__(**kwargs)

		def build(self, input_shape):
			self.W = self.add_weight(name="att_weight", shape=(input_shape[-1], 1),
									 initializer="normal")
			self.b = self.add_weight(name="att_bias", shape=(input_shape[1], 1),
									 initializer="zeros")
			super(Attention, self).build(input_shape)

		def call(self, x):
			e = tf.keras.backend.tanh(tf.keras.backend.dot(x, self.W) + self.b)
			a = tf.keras.backend.softmax(e, axis=1)
			return tf.keras.backend.sum(a * x, axis=1)
else:
	Attention = None

# ==============================
# Load model và char vocabulary (without FastText for now)
# ==============================
# Fallback định nghĩa tối giản tiếng Việt cho một số từ phổ biến
LOCAL_VI_DICT = {
	"apple": "quả táo",
	"computer": "máy tính",
}

def safe_load_tensorflow_model():
	if not os.path.exists(MODEL_FILE) or not Attention:
		return None
	try:
		# Load with custom Attention layer
		if load_model is None:
			return None
		return load_model(MODEL_FILE, compile=False, custom_objects={"Attention": Attention})
	except Exception as e:
		print('Error loading TensorFlow model:', e)
		return None

def safe_load_char_vocab():
	if not os.path.exists(CHAR_VOCAB_FILE):
		return None
	try:
		with open(CHAR_VOCAB_FILE, 'rb') as f:
			return pickle.load(f)
	except Exception as e:
		print('Error loading char vocab:', e)
		return None

def clean_token(w):
	"""Clean word token như trong notebook"""
	w = w.lower().replace("'", "")
	return re.sub(r"[^a-z]", "", w)

def words_to_char_seq(words: List[str], vocab: dict, maxlen=MAXLEN):
	"""Convert words to character sequences như trong notebook"""
	if not vocab:
		return np.zeros((len(words), maxlen), dtype=np.int32)
	seqs = [[vocab.get(c, 0) for c in w] for w in words]
	try:
		if pad_sequences is None:
			raise Exception("pad_sequences not available")
		return pad_sequences(seqs, maxlen=maxlen, padding="post")
	except Exception:
		# Fallback nếu không có keras
		X = np.zeros((len(words), maxlen), dtype=np.int32)
		for i, seq in enumerate(seqs):
			for j, c in enumerate(seq[:maxlen]):
				X[i, j] = c
		return X

def simple_word_vectors(words: List[str], dim=300):
	"""Simple fallback vectors based on word characteristics"""
	vectors = []
	for word in words:
		# Create a simple hash-based vector
		word_hash = hash(word) % 1000000
		vector = np.random.RandomState(word_hash).random(dim) * 0.1
		
		# Add some features based on word characteristics
		vector[0] = len(word) / 20.0  # length feature
		vector[1] = sum(1 for c in word if c in 'aeiou') / len(word)  # vowel ratio
		vector[2] = 1.0 if word[0] in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' else 0.0  # starts with capital
		
		vectors.append(vector)
	
	return np.array(vectors)

def ordinal_decode(p, t1=0.5, t2=1.5):
	"""Decode prediction to difficulty level như trong notebook"""
	if p < t1:
		return 0  # easy
	elif p < t2:
		return 1  # medium
	else:
		return 2  # hard

# Load models
MODEL = safe_load_tensorflow_model()
CHAR_VOCAB = safe_load_char_vocab()

# Compile model if loaded successfully
if MODEL and tf:
	try:
		MODEL.compile(optimizer=tf.keras.optimizers.Adam(1e-4), loss="mse")
		print("✅ TensorFlow model loaded and compiled successfully!")
	except Exception as e:
		print('Error compiling model:', e)

# Print loading status
missing_files = []
if MODEL is None:
	missing_files.append('TensorFlow model')
if CHAR_VOCAB is None:
	missing_files.append('char_vocab.pkl')

if missing_files:
	print(f"⚠️ Warning: missing -> {', '.join(missing_files)}")
	print("Service will run with fallback mode.")
else:
	print("✅ Models loaded successfully! (Using simple vectors instead of FastText)")

# ==============================
# Xử lý token & dự đoán độ khó (simplified version)
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

def predict_word_difficulty_simple(words: List[str], t1=0.5, t2=1.5):
	"""Predict difficulty using TensorFlow model với simple vectors thay cho FastText"""
	if MODEL is None or CHAR_VOCAB is None or np is None:
		# Fallback mode - simple heuristic
		results = []
		for w in words:
			# Simple heuristic based on word length
			if len(w) <= 4:
				level = 'easy'
				level_idx = 0
			elif len(w) <= 8:
				level = 'medium' 
				level_idx = 1
			else:
				level = 'hard'
				level_idx = 2
			
			results.append({
				'word': w, 
				'level': level,
				'difficulty': level_idx,
				'probs': [1.0 if level_idx == i else 0.0 for i in range(3)]
			})
		return results
	
	results = []
	clean_words = [clean_token(w) for w in words if len(clean_token(w)) > 0]
	
	if len(clean_words) == 0:
		return []
	
	try:
		# Prepare inputs
		X_char = words_to_char_seq(clean_words, CHAR_VOCAB, maxlen=MAXLEN)
		X_vectors = simple_word_vectors(clean_words, dim=300)  # Use simple vectors instead of FastText
		
		# Predict
		preds = MODEL.predict([X_char, X_vectors], verbose=0).flatten()
		
		# Convert to results
		for w, p in zip(clean_words, preds):
			level_idx = ordinal_decode(p, t1, t2)
			level = CLASS_MAP.get(level_idx, 'medium')
			results.append({
				'word': w, 
				'level': level,
				'difficulty': level_idx,
				'probs': [float(p), 0.0, 0.0]  # Simplified for compatibility
			})
	except Exception as e:
		print(f"Error in prediction: {e}")
		# Fallback to heuristic
		results = []
		for w in clean_words:
			if len(w) <= 4:
				level = 'easy'
				level_idx = 0
			elif len(w) <= 8:
				level = 'medium'
				level_idx = 1
			else:
				level = 'hard'
				level_idx = 2
			
			results.append({
				'word': w, 
				'level': level,
				'difficulty': level_idx,
				'probs': [1.0 if level_idx == i else 0.0 for i in range(3)]
			})
	
	return results

def predict_words(words: List[str]):
	"""Main prediction function"""
	return predict_word_difficulty_simple(words)

def map_cefr_to_simple(level_value):
	if not level_value:
		return 'medium'
	level_value = str(level_value).upper().strip()
	if level_value in ['A1', 'A2']:
		return 'easy'
	if level_value in ['B1', 'B2']:
		return 'medium'
	if level_value in ['C1', 'C2']:
		return 'hard'
	return 'medium'

# ==============================
# API phân loại từ vựng
# ==============================
@app.route('/classify', methods=['POST'])
def classify():
	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or ''
	if not text:
		tform = request.form.get('text') or request.values.get('text')
		text = tform or (request.get_data(as_text=True) or '')
	if not text:
		return jsonify({'error': 'Missing text'}), 400

	tokens = extract_tokens(text, limit_tokens=200)
	words_info = predict_words(tokens)
	return jsonify({'words': words_info})

# ==============================
# Tra cứu định nghĩa cho flashcards (dùng Free Dictionary API khi có mạng)
# ==============================
DEF_API = "https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}"

def _pick_definition(payload):
	"""Chọn 1 định nghĩa ngắn gọn từ kết quả API free-dictionary.
	Trả về chuỗi hoặc None."""
	if not payload or not isinstance(payload, list) or len(payload) == 0:
		return None
	entry = payload[0]
	meanings = entry.get('meanings', [])
	if not meanings:
		return None
	m = meanings[0]
	defs = m.get('definitions', [])
	if not defs:
		return None
	d = defs[0]
	return d.get('definition', None)

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
	if def_lang and def_lang.lower() != 'en':
		# Fallback: sử dụng dictionary local nếu có
		for idx, w in enumerate(words_info):
			if idx >= 60:  # limit
				break
			word = w['word']
			definition = LOCAL_VI_DICT.get(word.lower(), '')  # Fallback local dict
			
			lvl = map_cefr_to_simple(w.get('level'))
			entries.append({'word': word, 'definition': definition, 'level': lvl or (w.get('level') or 'medium')})
	else:
		# English definitions
		for idx, w in enumerate(words_info):
			if idx >= 60:  # limit to avoid too many API calls
				break
			lvl = map_cefr_to_simple(w.get('level'))
			definition = ''
			if idx < 60:
				ww = w['word']
				if re.fullmatch(r"[A-Za-z][A-Za-z\-']{1,}$", ww):
					definition = fetch_definition(ww.lower(), 'en')
			entries.append({'word': w['word'], 'definition': definition, 'level': lvl or (w.get('level') or 'medium')})

	return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': False})

# ==============================
# API bổ sung định nghĩa cho list từ
# ==============================
@app.route('/enrich', methods=['POST'])
def enrich():
	json_in = request.get_json(force=True, silent=True) or {}
	words = json_in.get('words') or []
	def_lang = json_in.get('def_lang') or json_in.get('lang') or 'en'
	if not words:
		return jsonify({'error': 'Missing words list'}), 400

	entries = []
	for word in words[:100]:  # limit
		definition = ''
		if def_lang.lower() == 'en':
			definition = fetch_definition(word.lower(), 'en')
		else:
			definition = LOCAL_VI_DICT.get(word.lower(), '')
		entries.append({'word': word, 'definition': definition})

	return jsonify({'entries': entries, 'def_lang': def_lang})

# ==============================
# API tình trạng
# ==============================
@app.route('/status', methods=['GET'])
def status():
	info = {
		'model_present': bool(MODEL),
		'char_vocab_present': bool(CHAR_VOCAB),
		'fasttext_present': False,  # Not using FastText in this version
		'mode': 'simplified_vectors'
	}
	try:
		if np: info['numpy'] = np.__version__
		if pd: info['pandas'] = pd.__version__
		if tf: info['tensorflow'] = tf.__version__
		if word_frequency: info['wordfreq'] = 'available'
	except Exception:
		pass
	return jsonify(info)

# ==============================
# Khởi động
# ==============================
if __name__ == '__main__':
	print('🚀 Starting Flask model service (Simplified Version)...')
	print(f'📁 Model file: {MODEL_FILE}')
	print(f'📁 Char vocab: {CHAR_VOCAB_FILE}')
	print('📝 Using simplified vectors instead of FastText')
	
	if WsgiToAsgi is not None:
		print('🌐 ASGI wrapper available (can use with Uvicorn)')
	
	app.run(host='0.0.0.0', port=5000, debug=True)