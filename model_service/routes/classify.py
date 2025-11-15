"""Classification endpoint."""
from flask import Blueprint, jsonify, request

from text_processing import extract_tokens, predict_words

bp = Blueprint("classify", __name__)


@bp.route("/classify", methods=["POST"])
def classify():
    data = request.get_json(force=True, silent=True) or {}
    text = ""
    if isinstance(data, dict):
        text = data.get("text", "")
    if not text:
        text = request.form.get("text") or request.args.get("text") or (request.get_data(as_text=True) or "")
    if not text:
        return jsonify({"error": "Missing text"}), 400

    tokens = extract_tokens(text)
    result = predict_words(tokens)
    return jsonify({"words": result})
