# app.py
import os
import re
import json
import random
import pickle
import requests
import traceback
import numpy as np
import tensorflow as tf
import fasttext
import pandas as pd
from functools import lru_cache
from wordfreq import word_frequency
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Gemini SDK
import google.generativeai as genai
# dotenv (tùy chọn)
from dotenv import load_dotenv
load_dotenv()

# ==========================================================
# 🔧 CẤU HÌNH HỆ THỐNG
# ==========================================================
APP_DIR = os.path.dirname(__file__)
MODEL_FILE = os.path.join(APP_DIR, "word_difficulty_hybrid_fasttext.h5")
VOCAB_FILE = os.path.join(APP_DIR, "char_vocab.pkl")
FASTTEXT_FILE = os.path.join(APP_DIR, "cc.en.300.bin")

CLASS_MAP = {0: "easy", 1: "medium", 2: "hard"}
MAXLEN = 21

# Gemini API key (tên biến môi trường: GEMINI_API_KEY)
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_KEY:
    print("⚠️ Warning: GEMINI_API_KEY not set. /generate-distractors will fail if called.")
else:
    genai.configure(api_key=GEMINI_KEY)

# Gemini model to use (adjust if you have pro access)
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "*"])

# Configure basic logging
app.logger.setLevel("INFO")

# ==========================================================
# ⚙️ HÀM NẠP MÔ HÌNH
# ==========================================================
def safe_load_model():
    try:
        if not os.path.exists(MODEL_FILE):
            app.logger.warning("Không tìm thấy mô hình: %s", MODEL_FILE)
            return None
        app.logger.info("🔄 Nạp mô hình TensorFlow...")
        return tf.keras.models.load_model(MODEL_FILE)
    except Exception as e:
        app.logger.exception("Lỗi khi load mô hình")
        return None


def safe_load_vocab():
    try:
        with open(VOCAB_FILE, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        app.logger.warning("❌ Lỗi load vocab: %s", e)
        return None


def safe_load_fasttext():
    if not os.path.exists(FASTTEXT_FILE):
        app.logger.warning("⚠️ Thiếu file FastText: %s", FASTTEXT_FILE)
        return None
    try:
        app.logger.info("🔄 Nạp mô hình FastText...")
        return fasttext.load_model(FASTTEXT_FILE)
    except Exception as e:
        app.logger.exception("❌ Lỗi load FastText")
        return None


MODEL = safe_load_model()
CHAR_VOCAB = safe_load_vocab()
FT_MODEL = safe_load_fasttext()

# ==========================================================
# 🧩 XỬ LÝ NGÔN NGỮ & DỰ ĐOÁN
# ==========================================================
def clean_token(w):
    w = (w or "").lower().replace("'", "")
    return re.sub(r"[^a-z]", "", w)


def words_to_char_seq(words, vocab, maxlen=MAXLEN):
    seqs = [[vocab.get(c, 0) for c in w] for w in words]
    return pad_sequences(seqs, maxlen=maxlen, padding="post")


def words_to_vectors(words, ft_model):
    return np.array([ft_model.get_word_vector(w) for w in words])


def predict_words(words):
    """Dự đoán độ khó của từ."""
    if MODEL is None or CHAR_VOCAB is None or FT_MODEL is None:
        # fallback rule-based
        results = []
        for w in words:
            freq = word_frequency(w, "en", minimum=1e-9)
            if freq >= 1e-3:
                lvl = "easy"
            elif freq >= 1e-5:
                lvl = "medium"
            else:
                lvl = "hard"
            results.append({"word": w, "level": lvl, "probs": [float(freq)]})
        return results

    clean_words = [clean_token(w) for w in words if clean_token(w)]
    if not clean_words:
        return []

    X_char = words_to_char_seq(clean_words, CHAR_VOCAB)
    X_ft = words_to_vectors(clean_words, FT_MODEL)
    preds = MODEL.predict([X_char, X_ft], verbose=0)

    results = []
    for w, p in zip(clean_words, preds):
        idx = int(np.argmax(p))
        lvl = CLASS_MAP.get(idx, "medium")
        results.append({
            "word": w,
            "level": lvl,
            "probs": [float(round(x, 4)) for x in p.tolist()]
        })
    return results

# ==========================================================
# 🧩 CÔNG CỤ PHỤ TRỢ
# ==========================================================
def extract_tokens(text, limit=200):
    txt = (text or "").lower()
    toks = re.sub(r"[^a-zÀ-ỹ0-9\s]", " ", txt).split()
    uniq, seen = [], set()
    for t in toks:
        if len(t) < 2 or t in seen:
            continue
        seen.add(t)
        uniq.append(t)
        if len(uniq) >= limit:
            break
    return uniq

# ==========================================================
# 📘 API: PHÂN LOẠI TỪ
# ==========================================================
@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Missing text"}), 400
    tokens = extract_tokens(text)
    result = predict_words(tokens)
    return jsonify({"words": result})

# ==========================================================
# 📘 API: FLASHCARDS
# ==========================================================
DEF_API = "https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}"

def _pick_definition(payload):
    try:
        for entry in payload or []:
            for meaning in entry.get("meanings", []):
                for d in meaning.get("definitions", []):
                    if d.get("definition"):
                        return d["definition"]
    except Exception:
        pass
    return ""

@lru_cache(maxsize=1024)
def fetch_definition(word, lang="en"):
    try:
        url = DEF_API.format(lang=lang, word=requests.utils.quote(word))
        resp = requests.get(url, timeout=3)
        if resp.status_code != 200:
            return ""
        data = resp.json()
        return _pick_definition(data)
    except Exception:
        return ""

@app.route("/flashcards", methods=["POST"])
def flashcards():
    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "")
    lang = data.get("def_lang", "vi")

    if not text:
        return jsonify({"error": "Missing text"}), 400

    tokens = extract_tokens(text)
    word_info = predict_words(tokens)
    entries = []

    for w in word_info:
        definition = fetch_definition(w["word"], "en") if lang == "en" else ""
        entries.append({
            "word": w["word"],
            "definition": definition,
            "level": w["level"]
        })
    return jsonify({"entries": entries, "def_lang": lang})

# ==========================================================
# 🔮 API: SINH ĐÁP ÁN SAI BẰNG GEMINI
# ==========================================================
def try_parse_json_from_text(text):
    """
    Cố gắng tách JSON từ chuỗi text (xử lý code fences, mô tả, ...)
    Trả về dict/list hoặc None nếu không parse được.
    """
    if not text:
        return None
    # Nếu model trả code fence ```json ... ```
    if "```" in text:
        parts = text.split("```")
        # tìm phần có 'json' hoặc phần giữa các fence
        for part in parts:
            if part.strip().startswith("json"):
                candidate = part.strip()[4:].strip()
            else:
                candidate = part.strip()
            try:
                return json.loads(candidate)
            except Exception:
                continue
    # fallback: tìm JSON bằng regex
    m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        # last resort: try single quotes -> double quotes
        try:
            s = m.group(0).replace("'", '"')
            return json.loads(s)
        except Exception:
            return None

def normalize_list(lst):
    seen, out = set(), []
    for s in lst or []:
        s = (s or "").strip()
        if not s or s.lower() in seen:
            continue
        if s in ["-", "_", "—", "–"]:
            continue
        seen.add(s.lower())
        out.append(s)
    return out


def get_request_json_flexible():
    """Try to obtain request data as a dict from JSON, form-encoded, or raw body.
    This helps avoid 400 when client doesn't set Content-Type properly.
    """
    data = {}
    # 1) try normal JSON parse (non-forced)
    try:
        data = request.get_json(force=False, silent=True) or {}
    except Exception:
        data = {}

    # 2) if empty, try form fields
    if not data:
        try:
            if request.form:
                data = request.form.to_dict()
        except Exception:
            pass

    # 3) if still empty, try raw body (JSON or urlencoded)
    if not data:
        try:
            raw = request.get_data(as_text=True) or ""
            raw = raw.strip()
            if raw:
                try:
                    data = json.loads(raw)
                except Exception:
                    # try parse querystring style: text=...&other=...
                    from urllib.parse import parse_qs
                    parsed = parse_qs(raw)
                    if parsed:
                        data = {k: v[0] for k, v in parsed.items()}
        except Exception:
            pass

    return data or {}

@app.route("/generate-distractors", methods=["POST"])
def generate_distractors():
    data = request.get_json(force=True, silent=True) or {}
    pairs = data.get("pairs", [])
    options_count = int(data.get("options_count", 4))
    n_distr = options_count - 1

    if not pairs:
        return jsonify({"error": "Missing pairs"}), 400

    if not GEMINI_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    model_name = DEFAULT_GEMINI_MODEL

    # prompt hướng dẫn model trả JSON
    # bằng tiếng Anh (để kết quả ổn định), yêu cầu tiếng Việt cho distractors
    prompt_template = (
        "You are a helpful assistant that creates multiple-choice distractors for language learning.\n"
        "Given an English term and its correct Vietnamese definition, produce exactly {n_distr} plausible but incorrect Vietnamese distractors.\n"
        "Return ONLY a JSON object with structure:\n"
        '{{"term":"<term>","distractors":["distr1","distr2",... ]}}\n'
        "Distractors should be short, natural Vietnamese phrases, same grammatical form as the correct definition, and must NOT repeat the correct definition.\n"
    )

    questions = []
    for pair in pairs:
        term = pair.get("term", "").strip()
        correct = pair.get("definition", "").strip()

        if not term:
            continue

        prompt = prompt_template.format(n_distr=n_distr)
        prompt += f"\nTerm: \"{term}\"\nCorrect definition (Vietnamese): \"{correct}\"\n\n"
        prompt += "Return the JSON only."

        try:
            # gọi Gemini (synchronous simple generate_content)
            model = genai.GenerativeModel("models/gemini-2.5-pro")
            resp = model.generate_content(prompt)
            raw = ""
            # response may contain several modalities; .text holds primary text
            raw = getattr(resp, "text", None) or str(resp)
            parsed = try_parse_json_from_text(raw)

            if parsed and "distractors" in parsed:
                distractors = normalize_list(parsed.get("distractors", []))
            elif isinstance(parsed, dict) and "options" in parsed:
                # backward-compatibility: if model returns 'options' include correct
                opts = parsed.get("options", [])
                # remove correct from opts to get distractors
                distractors = [o for o in opts if o.strip() and o.strip().lower() != correct.lower()]
            else:
                # Try to parse as list
                if isinstance(parsed, list):
                    distractors = normalize_list(parsed)
                else:
                    distractors = []

            # ensure distractors don't contain the correct answer
            distractors = [d for d in distractors if d.lower() != correct.lower()]

        except Exception as e:
            app.logger.exception("Gemini generate_content failed for term '%s'", term)
            distractors = []

        # bổ sung từ các định nghĩa có sẵn nếu thiếu
        all_defs = [p.get("definition", "").strip() for p in pairs if p.get("definition")]
        seen = {correct.lower()}
        for cand in (distractors or []):
            seen.add(cand.lower())
        for cand in all_defs:
            if len(distractors) >= n_distr:
                break
            if cand and cand.strip().lower() not in seen and cand.strip().lower() != correct.lower():
                distractors.append(cand.strip())
                seen.add(cand.strip().lower())

        # fill placeholders nếu vẫn thiếu
        while len(distractors) < n_distr:
            distractors.append(f"Không phải {len(distractors)+1}")

        # compose options: correct + distractors (shuffle)
        options = [correct] + distractors[:n_distr]
        random.shuffle(options)

        questions.append({"term": term, "correct": correct, "options": options})

    return jsonify({"ok": True, "questions": questions})
@app.route('/generate-sentences', methods=['POST'])
def generate_sentences():
    """
    Hỗ trợ cả 2 kiểu payload:
      - { "term": "word" }
      - { "words": ["w1", "w2", ...] }
    Trả về:
      { "questions": [ { "word": ..., "sentences": [...], "correct_index": n }, ... ] }
    """
    data = request.get_json(force=True, silent=True) or {}
    single = (data.get("term") or "").strip()
    words = data.get("words") if isinstance(data.get("words"), (list, tuple)) else None

    if not single and not words:
        return jsonify({"error": "Missing 'term' or 'words'"}), 400

    if not GEMINI_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    model = genai.GenerativeModel(DEFAULT_GEMINI_MODEL)

    def gen_for_term(term):
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
            resp = model.generate_content(prompt)
            raw = getattr(resp, "text", "")
            app.logger.debug("Gemini raw for '%s': %s", term, raw[:500])

            parsed = None
            try:
                parsed = json.loads(raw)
            except Exception:
                # try extract json blob or parse heuristically
                m = re.search(r"(\{[\s\S]*\})", raw)
                if m:
                    try:
                        parsed = json.loads(m.group(1))
                    except Exception:
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

            # ensure 4 sentences
            while len(sentences) < 4:
                sentences.append(f"(Auto placeholder for {term})")

            if correct_index is None:
                correct_index = 0

            return {"word": term, "sentences": sentences[:4], "correct_index": int(correct_index)}

        except Exception:
            app.logger.exception("Gemini failed for %s", term)
            s = [f"{term} example correct usage.", f"Incorrect use of {term} here.", f"Wrong {term} usage.", f"Another wrong {term} sentence."]
            random.shuffle(s)
            return {"word": term, "sentences": s, "correct_index": 0}

    questions = []
    if words:
        for w in words:
            w_str = (w or "").strip()
            if not w_str:
                continue
            questions.append(gen_for_term(w_str))
    else:
        questions.append(gen_for_term(single))

    return jsonify({"questions": questions})





# ==========================================================
# 🚀 KHỞI ĐỘNG SERVER
# ==========================================================
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

    if GEMINI_KEY:
        print("🚀 Gemini API key detected (using model):", DEFAULT_GEMINI_MODEL)
    else:
        print("⚠️ GEMINI_API_KEY not set. /generate-distractors will return 500.")

    app.run(host="0.0.0.0", port=5000, debug=True)
