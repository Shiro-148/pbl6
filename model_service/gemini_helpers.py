"""Shared helpers for Gemini-powered endpoints."""
import json
import random
import re
from typing import Any, Dict, List

import google.generativeai as genai

import config


def try_parse_json_from_text(text: str):
    if not text:
        return None
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            candidate = part.strip()
            if candidate.startswith("json"):
                candidate = candidate[4:].strip()
            try:
                return json.loads(candidate)
            except Exception:  # pylint: disable=broad-except
                continue
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if not match:
        return None
    snippet = match.group(0)
    try:
        return json.loads(snippet)
    except Exception:  # pylint: disable=broad-except
        try:
            return json.loads(snippet.replace("'", '"'))
        except Exception:  # pylint: disable=broad-except
            return None


def normalize_list(values: List[str]):
    seen, result = set(), []
    for value in values or []:
        token = (value or "").strip()
        if not token or token.lower() in seen:
            continue
        if token in ["-", "_", "—", "–"]:
            continue
        seen.add(token.lower())
        result.append(token)
    return result


def ensure_model(model_name: str | None = None):
    name = model_name or config.DEFAULT_GEMINI_MODEL
    return genai.GenerativeModel(name)


def shuffle_with_correct(correct: str, distractors: List[str], count: int) -> List[str]:
    options = [correct] + distractors[:count]
    random.shuffle(options)
    return options


def fallback_sentence_set(term: str) -> Dict[str, Any]:
    samples = [
        f"{term} example correct usage.",
        f"Incorrect use of {term} here.",
        f"Wrong {term} usage.",
        f"Another wrong {term} sentence.",
    ]
    random.shuffle(samples)
    return {"word": term, "sentences": samples, "correct_index": 0}
