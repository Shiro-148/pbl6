"""Multiple-choice distractor generation endpoint."""
from flask import Blueprint, jsonify, request

import config
from gemini_helpers import ensure_model, normalize_list, shuffle_with_correct, try_parse_json_from_text

bp = Blueprint("distractors", __name__)


@bp.route("/generate-distractors", methods=["POST"])
def generate_distractors():
    data = request.get_json(force=True, silent=True) or {}
    pairs = data.get("pairs", [])
    options_count = int(data.get("options_count", 4))
    n_distractors = options_count - 1

    if not pairs:
        return jsonify({"error": "Missing pairs"}), 400
    if not config.GEMINI_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    prompt_template = (
        "You are a helpful assistant that creates multiple-choice distractors for language learning.\n"
        "Given an English term and its correct Vietnamese definition, produce exactly {n} plausible but incorrect Vietnamese distractors.\n"
        "Return ONLY a JSON object with structure:\n"
        '{{"term":"<term>","distractors":["distr1","distr2",... ]}}\n'
        "Distractors should be short, natural Vietnamese phrases, same grammatical form as the correct definition, and must NOT repeat the correct definition.\n"
    )

    all_defs = [p.get("definition", "").strip() for p in pairs if p.get("definition")]
    questions = []

    for pair in pairs:
        term = (pair.get("term") or "").strip()
        correct = (pair.get("definition") or "").strip()
        if not term:
            continue

        prompt = prompt_template.format(n=n_distractors)
        prompt += f'\nTerm: "{term}"\nCorrect definition (Vietnamese): "{correct}"\n\n'
        prompt += "Return the JSON only."

        try:
            model = ensure_model("models/gemini-2.5-pro" if config.GEMINI_KEY else config.DEFAULT_GEMINI_MODEL)
            response = model.generate_content(prompt)
            raw = getattr(response, "text", None) or str(response)
            parsed = try_parse_json_from_text(raw)

            if isinstance(parsed, dict) and "distractors" in parsed:
                distractors = normalize_list(parsed.get("distractors", []))
            elif isinstance(parsed, dict) and "options" in parsed:
                opts = parsed.get("options", [])
                distractors = [opt for opt in opts if opt.strip().lower() != correct.lower()]
            elif isinstance(parsed, list):
                distractors = normalize_list(parsed)
            else:
                distractors = []
        except Exception:  # pylint: disable=broad-except
            distractors = []

        seen = {correct.lower()}
        finalized = []
        for cand in distractors:
            if cand.lower() in seen or cand.lower() == correct.lower():
                continue
            finalized.append(cand)
            seen.add(cand.lower())

        for candidate in all_defs:
            if len(finalized) >= n_distractors:
                break
            if candidate and candidate.lower() not in seen and candidate.lower() != correct.lower():
                finalized.append(candidate)
                seen.add(candidate.lower())

        while len(finalized) < n_distractors:
            finalized.append(f"Không phải {len(finalized) + 1}")

        options = shuffle_with_correct(correct, finalized, n_distractors)
        questions.append({"term": term, "correct": correct, "options": options})

    return jsonify({"ok": True, "questions": questions})
