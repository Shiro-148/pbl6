"""Word info endpoint returning AI-generated meaning and examples."""
from flask import Blueprint, jsonify, request

import config
from dictionary import fetch_definition, get_concise_definition, short_gloss, translate_texts
from gemini_helpers import ensure_model, try_parse_json_from_text

bp = Blueprint("word_info", __name__)


def _fallback_word_info(word: str):
	definition_en = short_gloss(fetch_definition(word, "en"), max_words=18) or word
	definition_vi = get_concise_definition(word, def_lang="vi") or definition_en
	example = translate_texts([f"I need to use the word {word} in a sentence."], dest="vi")
	examples = [f"I spoke about {word} in class."]
	if example and example[0]:
		examples.append(example[0])
	return {
		"word": word,
		"definition_en": definition_en,
		"definition_vi": definition_vi,
		"examples": examples,
		"notes": "Fallback definition",
		"part_of_speech": "",
		"phonetic": "",
	}


def _sanitize_examples(value):
	if isinstance(value, list):
		return [str(v).strip() for v in value if str(v).strip()]
	if isinstance(value, str) and value.strip():
		return [value.strip()]
	return []


@bp.route("/word-info", methods=["POST"])
def word_info():
	data = request.get_json(force=True, silent=True) or {}
	word = (data.get("word") or "").strip()
	if not word:
		return jsonify({"error": "Missing 'word'"}), 400

	fallback = _fallback_word_info(word)
	if not config.GEMINI_KEY:
		return jsonify(fallback)

	prompt = f'''
You are a bilingual English-Vietnamese lexicographer. Given the word "{word}", return a compact JSON object with fields:
{{
  "word": "",
  "phonetic": "",
  "part_of_speech": "",
  "definition_en": "",
  "definition_vi": "",
  "examples": ["example sentence 1", "example sentence 2"],
  "notes": "short usage notes in Vietnamese"
}}
- definition_vi must be natural Vietnamese under 25 words.
- Provide 2-3 concise example sentences in English; optionally append Vietnamese translation separated by " - "
- Answer strictly in JSON with double quotes.
'''

	try:
		model = ensure_model()
		response = model.generate_content(prompt)
		raw = getattr(response, "text", None) or str(response)
		parsed = try_parse_json_from_text(raw)
		if isinstance(parsed, dict):
			examples = _sanitize_examples(parsed.get("examples"))
			if not examples:
				examples = _sanitize_examples(parsed.get("example"))
			if not examples:
				examples = fallback["examples"]
			return jsonify({
				"word": (parsed.get("word") or word).strip() or word,
				"phonetic": parsed.get("phonetic", ""),
				"part_of_speech": parsed.get("part_of_speech", ""),
				"definition_en": parsed.get("definition_en") or fallback["definition_en"],
				"definition_vi": parsed.get("definition_vi") or fallback["definition_vi"],
				"examples": examples,
				"notes": parsed.get("notes", fallback["notes"]),
			})
	except Exception:  # pylint: disable=broad-except
		pass

	return jsonify(fallback)
