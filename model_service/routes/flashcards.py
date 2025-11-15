"""Flashcard generation endpoint."""
from flask import Blueprint, jsonify, request

from dictionary import fetch_definition, get_concise_definition, short_gloss
from text_processing import extract_tokens, predict_words

bp = Blueprint("flashcards", __name__)


@bp.route("/flashcards", methods=["POST"])
def flashcards():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    def_lang = data.get("def_lang", "vi")
    if not text:
        return jsonify({"error": "Missing text"}), 400

    tokens = extract_tokens(text)
    word_info = predict_words(tokens)
    entries = []

    if def_lang and def_lang.lower() != 'en':
        target = def_lang.lower()
        for info in word_info[:60]:
            level = info.get('level', 'medium')
            try:
                definition = get_concise_definition(info['word'], def_lang=target)
            except Exception:  # pylint: disable=broad-except
                definition = info['word']
            entries.append({'word': info['word'], 'definition': definition, 'level': level})
        return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': True})

    for info in word_info[:60]:
        level = info.get('level', 'medium')
        definition = ''
        try:
            raw_definition = fetch_definition(info['word'], 'en')
            definition = short_gloss(raw_definition, max_words=10) if raw_definition else ''
        except Exception:  # pylint: disable=broad-except
            definition = ''
        if not definition:
            definition = info['word']
        entries.append({'word': info['word'], 'definition': definition, 'level': level})

    return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': False})
