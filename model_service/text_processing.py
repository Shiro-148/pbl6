"""Utilities for token cleaning and word-level predictions."""
import re
from typing import Iterable, List

import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from wordfreq import word_frequency

import config
from resources import CHAR_VOCAB, WORD_TOKENIZER, SCALER, THRESHOLDS, FREQ_DICT, AVG_FREQ, MODEL


def clean_token(word: str) -> str:
    word = (word or "").lower().replace("'", "")
    return re.sub(r"[^a-z]", "", word)


def words_to_char_seq(words: Iterable[str]):
    seqs = [[(CHAR_VOCAB or {}).get(ch, 0) for ch in word] for word in words]
    return pad_sequences(seqs, maxlen=config.MAXLEN, padding="post")


def count_syllables(word: str) -> int:
    """Count syllables in a word."""
    word = str(word).lower()
    count = 0
    vowels = "aeiouy"
    if len(word) == 0:
        return 0
    if word[0] in vowels:
        count += 1
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
    if word.endswith("e"):
        count -= 1
    if count == 0:
        count += 1
    return count


def extract_manual_features(words: Iterable[str]):
    """Extract manual features: length, vowels, syllables, consonant ratio, frequency."""
    features = []
    vowels = set("aeiou")
    
    for w in words:
        w_clean = clean_token(w)
        
        length = len(w_clean)
        num_vowels = sum(1 for c in w_clean if c in vowels)
        syllables = count_syllables(w_clean)
        consonant_ratio = (length - num_vowels) / length if length > 0 else 0
        
        # Lookup frequency from dictionary
        if FREQ_DICT and w_clean in FREQ_DICT:
            freq = FREQ_DICT[w_clean]
        elif AVG_FREQ is not None:
            freq = AVG_FREQ
        else:
            freq = 0.0
        
        # Vector: [length, vowels, syllables, consonant_ratio, frequency]
        features.append([length, num_vowels, syllables, consonant_ratio, freq])
    
    return np.array(features)


def classify_score(score: float, th1: float, th2: float) -> str:
    """Classify score into easy/medium/hard."""
    if score < th1:
        return "easy"
    elif score < th2:
        return "medium"
    else:
        return "hard"


def predict_words(words: Iterable[str]):
    """Predict word difficulty using new BiLSTM model with 3 inputs."""
    # Fallback if model not loaded
    if MODEL is None or CHAR_VOCAB is None or WORD_TOKENIZER is None or SCALER is None or THRESHOLDS is None:
        results = []
        for word in words:
            freq = word_frequency(word, "en", minimum=1e-9)
            level = "easy" if freq >= 1e-3 else "medium" if freq >= 1e-5 else "hard"
            results.append({"word": word, "level": level, "probs": [float(freq)]})
        return results

    clean_words = [clean_token(word) for word in words if clean_token(word)]
    if not clean_words:
        return []

    # Input 1: Character sequences
    x_char = words_to_char_seq(clean_words)
    
    # Input 2: Word indices
    x_word_seq = WORD_TOKENIZER.texts_to_sequences(clean_words)
    x_word = np.array([seq[0] if len(seq) > 0 else 0 for seq in x_word_seq])
    
    # Input 3: Manual features (scaled)
    x_man = extract_manual_features(clean_words)
    x_man = SCALER.transform(x_man)
    
    # Predict scores
    pred_scores = MODEL.predict([x_char, x_word, x_man], verbose=0).flatten()
    
    # Get thresholds
    th1 = THRESHOLDS.get("th1", 0.5)
    th2 = THRESHOLDS.get("th2", 1.5)
    
    # Build results
    results = []
    for word, score in zip(clean_words, pred_scores):
        level = classify_score(score, th1, th2)
        results.append({
            "word": word,
            "level": level,
            "probs": [float(round(score, 5))],
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
