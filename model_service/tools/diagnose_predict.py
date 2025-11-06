"""Script chẩn đoán: nạp mô hình, in thông tin môi trường và các mảng đầu vào/đầu ra để so sánh với Colab.

Sử dụng: trong venv, chạy: python tools/diagnose_predict.py
"""
import sys
import os
import platform
import json
import numpy as np
import pickle
import traceback

from tensorflow.keras.models import load_model

try:
    import pandas as pd
    from wordfreq import word_frequency
except Exception:
    pd = None
    word_frequency = None

BASE = os.path.dirname(os.path.dirname(__file__))
MODEL_FILE = os.path.join(BASE, 'word_difficulty_hybrid.h5')
SCALER_FILE = os.path.join(BASE, 'scaler.pkl')
VOCAB_FILE = os.path.join(BASE, 'vocab.pkl')

print('Python:', sys.version)
print('Platform:', platform.platform())
print('NumPy:', np.__version__)
try:
    import tensorflow as tf
    print('TensorFlow:', tf.__version__)
except Exception as e:
    print('TensorFlow: import error', e)

print('\nAttempting to load artifacts...')
model = None
scaler = None
vocab = None
try:
    if os.path.exists(MODEL_FILE):
        model = load_model(MODEL_FILE)
        print('Model loaded')
    else:
        print('Model file not found:', MODEL_FILE)
except Exception as e:
    print('Model load error:', e)
    traceback.print_exc()

try:
    if os.path.exists(SCALER_FILE):
        with open(SCALER_FILE, 'rb') as f:
            scaler = pickle.load(f)
        print('Scaler loaded')
    else:
        print('Scaler file not found:', SCALER_FILE)
except Exception as e:
    print('Scaler load error:', e)
    traceback.print_exc()

try:
    if os.path.exists(VOCAB_FILE):
        with open(VOCAB_FILE, 'rb') as f:
            vocab = pickle.load(f)
        print('Vocab loaded: size=', len(vocab))
    else:
        print('Vocab file not found:', VOCAB_FILE)
except Exception as e:
    print('Vocab load error:', e)
    traceback.print_exc()

# small sample text
text = "This is a small test sentence to compare model inputs output."
text = text.lower()
text = __import__('re').sub(r"[^a-z\s]", " ", text)
words = text.split()
words = list(dict.fromkeys(words))
print('\nWords:', words)

numeric_cols = ['Length','Freq_HAL','Log_Freq_HAL','I_Mean_RT','I_SD','Obs','I_Mean_Accuracy','Real_Freq']

if pd is None:
    print('pandas or wordfreq missing; aborting numeric feature build')
    sys.exit(0)

data = pd.DataFrame({'Word': words})
from wordfreq import zipf_frequency

data['Length'] = data['Word'].apply(len)

def wf(w):
    try:
        return 1000 * word_frequency(w, 'en', minimum=1e-6)
    except Exception:
        return 0

data['Freq_HAL'] = data['Word'].apply(wf)
import numpy as np

data['Log_Freq_HAL'] = np.log10(data['Freq_HAL'] + 1)

# handcrafted features copied from the service
data['I_Mean_RT'] = 700 + data['Length'] * 5
data['I_SD'] = 200 + data['Length'] * 10
data['Obs'] = 30
data['I_Mean_Accuracy'] = 0.8 - data['Length'] * 0.01

data['Real_Freq'] = data['Word'].apply(lambda w: word_frequency(w, 'en', minimum=1e-6))

print('\nNumeric features (first rows):')
print(data[numeric_cols].head())

if scaler is not None:
    try:
        X_num = scaler.transform(data[numeric_cols])
        print('\nX_num shape:', X_num.shape)
    except Exception as e:
        print('Scaler transform error:', e)
else:
    print('No scaler loaded')

# char encoding
MAXLEN = 21

def encode_data(words, vocab, maxlen=MAXLEN):
    X = np.zeros((len(words), maxlen), dtype=np.int32)
    for i, w in enumerate(words):
        for j, c in enumerate(w[:maxlen]):
            X[i, j] = vocab.get(c, 0)
    return X

if vocab is not None:
    X_char = encode_data(words, vocab, maxlen=MAXLEN)
    print('\nX_char shape:', X_char.shape)
    print('X_char sample row:', X_char[0])
else:
    print('No vocab loaded')

if model is not None and vocab is not None and scaler is not None:
    try:
        preds = model.predict([X_char, X_num], verbose=0)
        print('\nPreds shape:', preds.shape)
        print('Preds sample:', preds[0])
    except Exception as e:
        print('Model predict error:', e)

# save arrays to disk for manual comparison
out = {'words': words}
if 'X_num' in locals():
    out['X_num'] = X_num
if 'X_char' in locals():
    out['X_char'] = X_char
if 'preds' in locals():
    out['preds'] = preds

np.savez('diagnose_output.npz', **out)
print('\nSaved diagnose_output.npz with arrays (if any)')
