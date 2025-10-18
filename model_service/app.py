import os
import re
import pickle
import json
from typing import List

from flask import Flask, request, jsonify

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


# Try to load artifacts at startup
MODEL = safe_load_model()
SCALER = safe_load_pickle(SCALER_FILE)
VOCAB = safe_load_pickle(VOCAB_FILE)


def extract_tokens(text: str, limit_tokens=200):
	# lowercase, keep basic a-z, and accented letters
	txt = (text or '').lower()
	toks = re.sub(r"[^a-zÀ-ỹ0-9\s]", ' ', txt).split()
	uniq = []
	seen = set()
	for t in toks:
		if not t or len(t) < 2:
			continue
		if t in seen:
			continue
		seen.add(t)
		uniq.append(t)
		if len(uniq) >= limit_tokens:
			break
	return uniq


def predict_words(words: List[str]):
	# returns list of dicts: {word, level, probs}
	if MODEL is None or SCALER is None or VOCAB is None or np is None:
		# fallback: return tokens with default level 'easy'
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
	"""Normalize various level representations to 'easy'|'medium'|'hard'.
	Accepts strings like 'A1','a2','B1', or numeric strings/ints (0/1/2), or already 'easy' etc.
	"""
	if level_value is None:
		return None
	lv = str(level_value).strip()
	if not lv:
		return None
	lv_up = lv.upper()
	# direct mappings for CEFR
	if lv_up in ('A1', 'A2'):
		return 'easy'
	if lv_up in ('B1', 'B2'):
		return 'medium'
	if lv_up in ('C1', 'C2'):
		return 'hard'
	# already simple label
	if lv.lower() in ('easy', 'medium', 'hard'):
		return lv.lower()
	# numeric -> map by CLASS_MAP index
	try:
		n = int(float(lv))
		return CLASS_MAP.get(n, None)
	except Exception:
		pass
	return None


@app.route('/classify', methods=['POST'])
def classify():
	# debug: log headers and raw body to help diagnose 400 errors from clients
	try:
		print('DEBUG /classify headers:', dict(request.headers))
		print('DEBUG /classify raw body:', request.get_data(as_text=True))
	except Exception:
		pass

	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or json_in.get('data') or ''
	# Fallbacks: allow form-encoded or raw body payloads
	if not text:
		# form data (application/x-www-form-urlencoded or multipart)
		try:
			tform = request.form.get('text') or request.values.get('text')
			if tform:
				text = tform
		except Exception:
			pass
	if not text:
		# raw body: could be plain text or urlencoded like 'text=...'
		try:
			raw = request.get_data(as_text=True) or ''
			raw = raw.strip()
			if raw:
				# try to parse urlencoded
				from urllib.parse import parse_qs
				parsed = parse_qs(raw)
				if 'text' in parsed and parsed['text']:
					text = parsed['text'][0]
				else:
					# treat whole body as text
					text = raw
		except Exception:
			pass
	if not text:
		return jsonify({'error': 'Missing text'}), 400
	tokens = extract_tokens(text, limit_tokens=200)
	result = predict_words(tokens)
	# normalize levels to easy/medium/hard if model returned CEFR or other labels
	for item in result:
		lvl = map_cefr_to_simple(item.get('level'))
		item['level'] = lvl if lvl is not None else (item.get('level') or 'medium')

	# frontend expects either an array or object with 'words' key — return both
	return jsonify({'words': result, 'classify': result})


@app.route('/flashcards', methods=['POST'])
def flashcards():
	# This endpoint returns simple flashcard-like entries. If the model can provide
	# enriched definitions, use them; otherwise return empty definitions so frontend
	# can still import the terms.
	# debug: log headers and raw body to help diagnose 400 errors from clients
	try:
		print('DEBUG /flashcards headers:', dict(request.headers))
		print('DEBUG /flashcards raw body:', request.get_data(as_text=True))
	except Exception:
		pass

	json_in = request.get_json(force=True, silent=True) or {}
	text = json_in.get('text') or ''
	# Fallbacks for form-encoded or raw body
	if not text:
		try:
			tform = request.form.get('text') or request.values.get('text')
			if tform:
				text = tform
		except Exception:
			pass
	if not text:
		try:
			raw = request.get_data(as_text=True) or ''
			raw = raw.strip()
			if raw:
				from urllib.parse import parse_qs
				parsed = parse_qs(raw)
				if 'text' in parsed and parsed['text']:
					text = parsed['text'][0]
				else:
					text = raw
		except Exception:
			pass
	if not text:
		return jsonify({'error': 'Missing text'}), 400

	tokens = extract_tokens(text, limit_tokens=200)
	words_info = predict_words(tokens)
	entries = []
	for w in words_info:
		# normalize level as well and include it in flashcard entry
		lvl = map_cefr_to_simple(w.get('level'))
		entries.append({'word': w['word'], 'definition': '', 'level': (lvl if lvl is not None else (w.get('level') or 'medium'))})

	return jsonify({'entries': entries})


@app.route('/status', methods=['GET'])
def status():
	"""Return quick diagnostics: which artifacts and libs loaded."""
	info = {
		'model_present': bool(MODEL),
		'scaler_present': bool(SCALER),
		'vocab_present': bool(VOCAB),
		'numpy': None,
		'pandas': None,
		'tensorflow': None,
		'wordfreq': None,
	}
	try:
		import numpy as _np
		info['numpy'] = getattr(_np, '__version__', 'unknown')
	except Exception:
		info['numpy'] = None
	try:
		import pandas as _pd
		info['pandas'] = getattr(_pd, '__version__', 'unknown')
	except Exception:
		info['pandas'] = None
	try:
		import tensorflow as _tf
		info['tensorflow'] = getattr(_tf, '__version__', 'unknown')
	except Exception:
		info['tensorflow'] = None
	try:
		import wordfreq as _wf
		info['wordfreq'] = getattr(_wf, '__version__', 'unknown')
	except Exception:
		info['wordfreq'] = None

	return jsonify(info)


if __name__ == '__main__':
	# Helpful startup banner explaining missing artifacts
	missing = []
	if MODEL is None:
		missing.append('model (word_difficulty_hybrid.h5)')
	if SCALER is None:
		missing.append('scaler.pkl')
	if VOCAB is None:
		missing.append('vocab.pkl')
	if missing:
		print('Warning: some artifacts are missing:', ', '.join(missing))
		print('The service will run but return fallback tokens/levels. To enable real predictions, place the files in the model_service folder.')
	# If running directly with Python, use Flask's dev server
	app.run(host='0.0.0.0', port=5000, debug=True)


# Expose an ASGI-compatible adapter named `asgi_app` so callers like
# `uvicorn app:asgi_app --host 0.0.0.0 --port 5000` can work.
if WsgiToAsgi is not None:
	try:
		asgi_app = WsgiToAsgi(app)
	except Exception as e:
		# keep a defined name even on error so import doesn't fail
		print('Warning: failed to create ASGI adapter:', e)
		asgi_app = None
else:
	asgi_app = None

if asgi_app is None:
	# Helpful runtime hint when user tries to run with uvicorn but asgiref is missing
	# (uvicorn will still raise the original TypeError if you try to call the Flask WSGI app directly)
	pass

