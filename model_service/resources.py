"""Model and embedding resources with safe loaders."""
import os
import pickle

import fasttext
import tensorflow as tf

import config

MODEL = None
CHAR_VOCAB = None
FT_MODEL = None


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
        print("🔄 Loading TensorFlow model...")
        MODEL = tf.keras.models.load_model(config.MODEL_FILE)
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


def safe_load_fasttext():
    global FT_MODEL
    if FT_MODEL is not None:
        return FT_MODEL
    if not os.path.exists(config.FASTTEXT_FILE):
        _log_missing("FastText file", config.FASTTEXT_FILE)
        FT_MODEL = None
        return FT_MODEL
    try:
        print("🔄 Loading FastText model...")
        FT_MODEL = fasttext.load_model(config.FASTTEXT_FILE)
    except Exception as exc:  # pylint: disable=broad-except
        print("❌ Error loading FastText:", exc)
        FT_MODEL = None
    return FT_MODEL


# Load resources eagerly so existing behaviour is unchanged
MODEL = safe_load_model()
CHAR_VOCAB = safe_load_vocab()
FT_MODEL = safe_load_fasttext()
