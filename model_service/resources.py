"""Model and embedding resources with safe loaders."""
import os
import pickle

import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import StandardScaler

import config

MODEL = None
CHAR_VOCAB = None
WORD_TOKENIZER = None
SCALER = None
THRESHOLDS = None
FREQ_DICT = None
AVG_FREQ = None


def _log_missing(label: str, path: str) -> None:
    print(f"⚠️ Missing {label}: {path}")


def safe_load_model():
    global MODEL
    if MODEL is not None:
        return MODEL
    try:
        if not os.path.exists(config.MODEL_FILE):
            _log_missing("model", config.MODEL_FILE)
            return None
        print("🔄 Loading TensorFlow BiLSTM model...")
        
        # Custom Attention layer for new model
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
                return tf.keras.backend.sum(x * a, axis=1)
        
        MODEL = tf.keras.models.load_model(
            config.MODEL_FILE,
            custom_objects={"Attention": Attention},
            compile=False
        )
    except Exception as exc:  # pylint: disable=broad-except
        print("❌ Error loading model:", exc)
        MODEL = None
    return MODEL


def safe_load_vocab():
    global CHAR_VOCAB
    if CHAR_VOCAB is not None:
        return CHAR_VOCAB
    try:
        if not os.path.exists(config.VOCAB_FILE):
            _log_missing("vocab", config.VOCAB_FILE)
            CHAR_VOCAB = None
            return CHAR_VOCAB
        with open(config.VOCAB_FILE, "rb") as handle:
            CHAR_VOCAB = pickle.load(handle)
    except Exception as exc:  # pylint: disable=broad-except
        print("⚠️ Missing vocab:", exc)
        CHAR_VOCAB = None
    return CHAR_VOCAB


def safe_load_word_tokenizer():
    global WORD_TOKENIZER
    if WORD_TOKENIZER is not None:
        return WORD_TOKENIZER
    try:
        if not os.path.exists(config.WORD_TOKENIZER_FILE):
            _log_missing("word tokenizer", config.WORD_TOKENIZER_FILE)
            return None
        print("🔄 Loading word tokenizer...")
        with open(config.WORD_TOKENIZER_FILE, "rb") as f:
            WORD_TOKENIZER = pickle.load(f)
    except Exception as exc:  # pylint: disable=broad-except
        print("❌ Error loading word tokenizer:", exc)
        WORD_TOKENIZER = None
    return WORD_TOKENIZER


def safe_load_scaler():
    global SCALER
    if SCALER is not None:
        return SCALER
    try:
        if not os.path.exists(config.SCALER_FILE):
            _log_missing("scaler", config.SCALER_FILE)
            return None
        print("🔄 Loading scaler...")
        with open(config.SCALER_FILE, "rb") as f:
            SCALER = pickle.load(f)
    except Exception as exc:  
        print("❌ Error loading scaler:", exc)
        SCALER = None
    return SCALER


def safe_load_thresholds():
    global THRESHOLDS
    if THRESHOLDS is not None:
        return THRESHOLDS
    try:
        if not os.path.exists(config.THRESHOLDS_FILE):
            _log_missing("thresholds", config.THRESHOLDS_FILE)
            return None
        print("🔄 Loading thresholds...")
        with open(config.THRESHOLDS_FILE, "rb") as f:
            THRESHOLDS = pickle.load(f)
    except Exception as exc:  
        print("❌ Error loading thresholds:", exc)
        THRESHOLDS = None
    return THRESHOLDS


def safe_load_freq_dict():
    global FREQ_DICT, AVG_FREQ
    if FREQ_DICT is not None:
        return FREQ_DICT, AVG_FREQ
    try:
        if not os.path.exists(config.WORD_DIFFICULTY_CSV):
            _log_missing("WordDifficulty.csv", config.WORD_DIFFICULTY_CSV)
            return None, None
        print("🔄 Loading frequency dictionary...")
        df_ref = pd.read_csv(config.WORD_DIFFICULTY_CSV)
        df_ref["clean_word"] = df_ref["Word"].str.lower().str.replace("'", "")
        FREQ_DICT = dict(zip(df_ref["clean_word"], df_ref["Log_Freq_HAL"]))
        AVG_FREQ = df_ref["Log_Freq_HAL"].mean()
        print(f"✅ Loaded {len(FREQ_DICT)} words to frequency dictionary.")
    except Exception as exc:  
        print("❌ Error loading frequency dictionary:", exc)
        FREQ_DICT = None
        AVG_FREQ = None
    return FREQ_DICT, AVG_FREQ


MODEL = safe_load_model()
CHAR_VOCAB = safe_load_vocab()
WORD_TOKENIZER = safe_load_word_tokenizer()
SCALER = safe_load_scaler()
THRESHOLDS = safe_load_thresholds()
FREQ_DICT, AVG_FREQ = safe_load_freq_dict()
