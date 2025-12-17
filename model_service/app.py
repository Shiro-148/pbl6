"""Flask entrypoint that wires together blueprints and resources."""
import warnings
import os

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow INFO and WARNING logs

from flask import Flask
from flask_cors import CORS

import config
from resources import CHAR_VOCAB, MODEL, WORD_TOKENIZER, SCALER, THRESHOLDS, FREQ_DICT
from routes import register_blueprints


def create_app() -> Flask:
    flask_app = Flask(__name__)
    CORS(flask_app, origins=["*", "http://localhost:3000", "http://localhost:5173"])
    register_blueprints(flask_app)
    return flask_app


app = create_app()


if __name__ == "__main__":
    missing = []
    if MODEL is None:
        missing.append("model")
    if CHAR_VOCAB is None:
        missing.append("char_vocab")
    if WORD_TOKENIZER is None:
        missing.append("word_tokenizer")
    if SCALER is None:
        missing.append("scaler")
    if THRESHOLDS is None:
        missing.append("thresholds")
    if FREQ_DICT is None:
        missing.append("freq_dict")
    
    if missing:
        print("⚠️ Thiếu:", ", ".join(missing))
        print("→ Fallback rule-based vẫn hoạt động cho phân loại từ.")
    else:
        print("✅ Tất cả resources đã load thành công!")

    if config.GEMINI_KEY:
        print("🚀 Gemini API key detected (using model):", config.DEFAULT_GEMINI_MODEL)
    else:
        print("⚠️ GEMINI_API_KEY not set. /generate-distractors will return 500.")

    app.run(host="0.0.0.0", port=5000, debug=True)
