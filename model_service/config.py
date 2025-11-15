"""Application-wide configuration constants and environment bootstrap."""
import os

import google.generativeai as genai
from dotenv import load_dotenv

# Ensure environment variables from .env are loaded before accessing them
load_dotenv()

APP_DIR = os.path.dirname(__file__)
MODEL_FILE = os.path.join(APP_DIR, "word_difficulty_hybrid_fasttext.h5")
VOCAB_FILE = os.path.join(APP_DIR, "char_vocab.pkl")
FASTTEXT_FILE = os.path.join(APP_DIR, "cc.en.300.bin")
CLASS_MAP = {0: "easy", 1: "medium", 2: "hard"}
MAXLEN = 21

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
