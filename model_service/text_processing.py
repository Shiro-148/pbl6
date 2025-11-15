"""Utilities for token cleaning and word-level predictions."""
import re
from typing import Iterable, List

import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from wordfreq import word_frequency

import config
from resources import CHAR_VOCAB, FT_MODEL, MODEL


def clean_token(word: str) -> str:
    word = (word or "").lower().replace("'", "")
    return re.sub(r"[^a-z]", "", word)


def words_to_char_seq(words: Iterable[str]):
    seqs = [[(CHAR_VOCAB or {}).get(ch, 0) for ch in word] for word in words]
    return pad_sequences(seqs, maxlen=config.MAXLEN, padding="post")


def words_to_vectors(words: Iterable[str]):
    tokens = list(words)
    if FT_MODEL is None:
        return np.zeros((len(tokens), 300))
    return np.array([FT_MODEL.get_word_vector(word) for word in tokens])


def predict_words(words: Iterable[str]):
    if MODEL is None or CHAR_VOCAB is None or FT_MODEL is None:
        results = []
        for word in words:
            freq = word_frequency(word, "en", minimum=1e-9)
            level = "easy" if freq >= 1e-3 else "medium" if freq >= 1e-5 else "hard"
            results.append({"word": word, "level": level, "probs": [float(freq)]})
        return results

    clean_words = [clean_token(word) for word in words if clean_token(word)]
    if not clean_words:
        return []

    x_char = words_to_char_seq(clean_words)
    x_ft = words_to_vectors(clean_words)
    preds = MODEL.predict([x_char, x_ft], verbose=0)

    results = []
    for word, prob in zip(clean_words, preds):
        idx = int(np.argmax(prob))
        level = config.CLASS_MAP.get(idx, "medium")
        results.append({
            "word": word,
            "level": level,
            "probs": [float(round(val, 4)) for val in prob.tolist()],
        })
    return results


def extract_tokens(text: str, limit: int = 200) -> List[str]:
    raw = (text or "").lower()
    tokens = re.sub(r"[^a-zÀ-ỹ0-9\s]", " ", raw).split()
    uniq, seen = [], set()
    for token in tokens:
        if len(token) < 2 or token in seen:
            continue
        seen.add(token)
        uniq.append(token)
        if len(uniq) >= limit:
            break
    return uniq
