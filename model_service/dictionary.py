"""Definition lookup and translation helpers."""
import re
from functools import lru_cache
from typing import List

import requests

DEF_API = "https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}"

try:
    from googletrans import Translator
    TRANSLATOR = Translator()
except Exception:  # pylint: disable=broad-except
    TRANSLATOR = None

LOCAL_VI_DICT = {
    "apple": "quả táo",
    "computer": "máy tính",
    "timeout": "thời gian chờ / thời gian tạm dừng",
    "destination": "điểm đến",
    "precedence": "sự ưu tiên, thứ tự ưu tiên",
}


@lru_cache(maxsize=512)
def fetch_definition(word: str, lang: str = "en") -> str:
    try:
        url = DEF_API.format(lang=lang, word=requests.utils.quote(word))
        response = requests.get(url, timeout=3)
        if response.status_code != 200:
            return ""
        data = response.json()
        for entry in data:
            for meaning in entry.get("meanings", []):
                definitions = meaning.get("definitions", [])
                if definitions:
                    return definitions[0].get("definition", "")
        return ""
    except Exception:  # pylint: disable=broad-except
        return ""


def translate_texts(texts: List[str], dest: str = "vi"):
    if not texts:
        return texts
    if TRANSLATOR:
        try:
            result = TRANSLATOR.translate(texts, dest=dest)
            return [res.text for res in result] if isinstance(result, list) else [result.text]
        except Exception:  # pylint: disable=broad-except
            pass
    translated = []
    for text in texts:
        try:
            response = requests.get(
                "https://translate.googleapis.com/translate_a/single",
                params={"client": "gtx", "sl": "auto", "tl": dest, "dt": "t", "q": text},
                timeout=3,
            )
            data = response.json()
            translated.append("".join(segment[0] for segment in data[0]))
        except Exception:  # pylint: disable=broad-except
            translated.append("")
    return translated


def short_gloss(text: str, max_words: int = 8) -> str:
    if not text:
        return ""
    sanitized = re.sub(r"\s+", " ", str(text).strip())
    for delim in [';', '\\.', '—', '\\(', ',']:
        parts = re.split(delim, sanitized)
        if parts and parts[0].strip():
            sanitized = parts[0].strip()
            break
    words = sanitized.split()
    if len(words) <= max_words:
        return sanitized
    return " ".join(words[:max_words]).rstrip(' ,') + '...'


def get_concise_definition(word: str, def_lang: str = 'vi') -> str:
    if not word:
        return ''
    token = word.strip()
    target = (def_lang or 'en').lower()

    if target != 'en':
        local = LOCAL_VI_DICT.get(token.lower())
        if local:
            return local
        try:
            translation = translate_texts([token], dest=target)
            if translation and translation[0]:
                return translation[0]
        except Exception:  # pylint: disable=broad-except
            pass
        try:
            en_def = fetch_definition(token, 'en')
            if en_def:
                gloss = short_gloss(en_def, max_words=10)
                translation = translate_texts([gloss], dest=target)
                if translation and translation[0]:
                    return translation[0]
                return gloss
        except Exception:  # pylint: disable=broad-except
            pass
        return LOCAL_VI_DICT.get(token.lower(), token)

    try:
        en_def = fetch_definition(token, 'en')
        if en_def:
            return short_gloss(en_def, max_words=10)
    except Exception:  # pylint: disable=broad-except
        pass
    return token
