"""Application-wide configuration constants and environment bootstrap."""
import os

import google.generativeai as genai
from dotenv import load_dotenv

# Ensure environment variables from .env are loaded before accessing them
load_dotenv()

APP_DIR = os.path.dirname(__file__)
# New BiLSTM model files
MODEL_FILE = os.path.join(APP_DIR, "word_difficulty_bilstm.h5")
VOCAB_FILE = os.path.join(APP_DIR, "char_vocab.pkl")
WORD_TOKENIZER_FILE = os.path.join(APP_DIR, "word_tokenizer.pkl")
SCALER_FILE = os.path.join(APP_DIR, "scaler.pkl")
THRESHOLDS_FILE = os.path.join(APP_DIR, "thresholds.pkl")
WORD_DIFFICULTY_CSV = os.path.join(APP_DIR, "WordDifficulty.csv")
CLASS_MAP = {0: "easy", 1: "medium", 2: "hard"}
MAXLEN = 21

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
