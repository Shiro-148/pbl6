"""Sentence generation endpoint."""
import json
import re

from flask import Blueprint, jsonify, request

import config
from gemini_helpers import ensure_model, fallback_sentence_set, try_parse_json_from_text

bp = Blueprint("sentences", __name__)


@bp.route('/generate-sentences', methods=['POST'])
def generate_sentences():
    data = request.get_json(force=True, silent=True) or {}
    single = (data.get("term") or "").strip()
    words = data.get("words") if isinstance(data.get("words"), (list, tuple)) else None

    if not single and not words:
        return jsonify({"error": "Missing 'term' or 'words'"}), 400
    if not config.GEMINI_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    terms = [w.strip() for w in (words or [single]) if (w or "").strip()]
    results = [generate_for_term(term) for term in terms]
    return jsonify({"questions": results})


def generate_for_term(term: str):
    prompt = f'''
You are an English teacher helping learners distinguish correct word usage.
Create exactly 4 English sentences that all include the word "{term}".
- 1 sentence must use "{term}" correctly and naturally.
- 3 sentences must use it incorrectly or unnaturally.
Randomize their order.
Return ONLY valid JSON in this format:
{{
  "sentences": ["sentence1", "sentence2", "sentence3", "sentence4"],
  "correct_index": <number between 0 and 3>
}}
Do not add explanations, Markdown, or extra text outside JSON.
'''

    try:
        model = ensure_model(config.DEFAULT_GEMINI_MODEL)
        response = model.generate_content(prompt)
        raw = getattr(response, "text", "")
        parsed = None
        try:
            parsed = json.loads(raw)
        except Exception:  # pylint: disable=broad-except
            match = re.search(r"(\{[\s\S]*\})", raw)
            if match:
                try:
                    parsed = json.loads(match.group(1))
                except Exception:  # pylint: disable=broad-except
                    parsed = try_parse_json_from_text(raw)
            else:
                parsed = try_parse_json_from_text(raw)

        sentences = []
        correct_index = None
        if isinstance(parsed, dict):
            sentences = parsed.get("sentences") or parsed.get("options") or []
            correct_index = parsed.get("correct_index")
        elif isinstance(parsed, list):
            sentences = parsed

        if not isinstance(sentences, list):
            sentences = []
        sentences = [s.strip() for s in sentences if isinstance(s, str) and s.strip()]
        while len(sentences) < 4:
            sentences.append(f"(Auto placeholder for {term})")
        if correct_index is None:
            correct_index = 0

        return {"word": term, "sentences": sentences[:4], "correct_index": int(correct_index)}
    except Exception:  # pylint: disable=broad-except
        return fallback_sentence_set(term)
