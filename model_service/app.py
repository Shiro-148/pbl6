"""Flask entrypoint that wires together blueprints and resources."""
from flask import Flask
from flask_cors import CORS

import config
from resources import CHAR_VOCAB, FT_MODEL, MODEL
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
        missing.append("vocab")
    if FT_MODEL is None:
        missing.append("fasttext")
    if missing:
        print("⚠️ Thiếu:", ", ".join(missing))
        print("→ Fallback rule-based vẫn hoạt động cho phân loại từ.")

    if config.GEMINI_KEY:
        print("🚀 Gemini API key detected (using model):", config.DEFAULT_GEMINI_MODEL)
    else:
        print("⚠️ GEMINI_API_KEY not set. /generate-distractors will return 500.")

    app.run(host="0.0.0.0", port=5000, debug=True)
