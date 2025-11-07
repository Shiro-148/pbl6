# ==========================================================
# 📘 app.py — English Learning Backend (TensorFlow + FastText + Gemini)
# ==========================================================

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
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Gemini SDK
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

# ==========================================================
# ⚙️ CONFIG
# ==========================================================
APP_DIR = os.path.dirname(__file__)
MODEL_FILE = os.path.join(APP_DIR, "word_difficulty_hybrid_fasttext.h5")
VOCAB_FILE = os.path.join(APP_DIR, "char_vocab.pkl")
FASTTEXT_FILE = os.path.join(APP_DIR, "cc.en.300.bin")
CLASS_MAP = {0: "easy", 1: "medium", 2: "hard"}
MAXLEN = 21

# Gemini configuration
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

app = Flask(__name__)
CORS(app, origins=["*", "http://localhost:3000", "http://localhost:5173"])

# ==========================================================
# 🔧 MODEL LOADING
# ==========================================================
def safe_load_model():
    try:
        if not os.path.exists(MODEL_FILE):
            print(f"⚠️ Missing model: {MODEL_FILE}")
            return None
        print("🔄 Loading TensorFlow model...")
        return tf.keras.models.load_model(MODEL_FILE)
    except Exception as e:
        print("❌ Error loading model:", e)
        return None

def safe_load_vocab():
    try:
        with open(VOCAB_FILE, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        print("⚠️ Missing vocab:", e)
        return None

def safe_load_fasttext():
    if not os.path.exists(FASTTEXT_FILE):
        print(f"⚠️ Missing FastText file: {FASTTEXT_FILE}")
        return None
    try:
        print("🔄 Loading FastText model...")
        return fasttext.load_model(FASTTEXT_FILE)
    except Exception as e:
        print("❌ Error loading FastText:", e)
        return None

MODEL = safe_load_model()
CHAR_VOCAB = safe_load_vocab()
FT_MODEL = safe_load_fasttext()

# ==========================================================
# 🧩 TEXT PROCESSING
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
    if MODEL is None or CHAR_VOCAB is None or FT_MODEL is None:
        results = []
        for w in words:
            freq = word_frequency(w, "en", minimum=1e-9)
            lvl = "easy" if freq >= 1e-3 else "medium" if freq >= 1e-5 else "hard"
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
# 📘 API: CLASSIFY
# ==========================================================
@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json(force=True, silent=True)
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

# ==========================================================
# 📘 API: FLASHCARDS
# ==========================================================
DEF_API = "https://api.dictionaryapi.dev/api/v2/entries/{lang}/{word}"

@lru_cache(maxsize=512)
def fetch_definition(word, lang="en"):
    try:
        url = DEF_API.format(lang=lang, word=requests.utils.quote(word))
        r = requests.get(url, timeout=3)
        if r.status_code != 200:
            return ""
        data = r.json()
        for entry in data:
            for meaning in entry.get("meanings", []):
                defs = meaning.get("definitions", [])
                if defs:
                    return defs[0].get("definition", "")
        return ""
    except Exception:
        return ""

try:
    from googletrans import Translator
    translator = Translator()
except Exception:
    translator = None

LOCAL_VI_DICT = {
    "apple": "quả táo",
    "computer": "máy tính",
    "timeout": "thời gian chờ / thời gian tạm dừng",
    "destination": "điểm đến",
    "precedence": "sự ưu tiên, thứ tự ưu tiên",
}

def translate_texts(texts, dest='vi'):
    if not texts:
        return texts
    if translator:
        try:
            res = translator.translate(texts, dest=dest)
            return [r.text for r in res] if isinstance(res, list) else [res.text]
        except Exception:
            pass
    out = []
    for t in texts:
        try:
            resp = requests.get(
                "https://translate.googleapis.com/translate_a/single",
                params={"client": "gtx", "sl": "auto", "tl": dest, "dt": "t", "q": t},
                timeout=3,
            )
            data = resp.json()
            out.append("".join(seg[0] for seg in data[0]))
        except Exception:
            out.append("")
    return out

def short_gloss(text: str, max_words: int = 8) -> str:
    if not text:
        return ""
    s = re.sub(r"\s+", " ", str(text).strip())
    for delim in [';', '\\.', '—', '\\(', ',']:
        parts = re.split(delim, s)
        if parts and parts[0].strip():
            s = parts[0].strip()
            break
    words = s.split()
    if len(words) <= max_words:
        return s
    return " ".join(words[:max_words]).rstrip(' ,') + '...'

def get_concise_definition(word: str, def_lang: str = 'vi') -> str:
    if not word:
        return ''
    w = word.strip()
    target = (def_lang or 'en').lower()

    if target != 'en':
        local = LOCAL_VI_DICT.get(w.lower())
        if local:
            return local
        try:
            tr = translate_texts([w], dest=target)
            if tr and isinstance(tr, list) and tr[0]:
                return tr[0]
        except Exception:
            pass
        try:
            en_def = fetch_definition(w, 'en')
            if en_def:
                gloss = short_gloss(en_def, max_words=10)
                tr = translate_texts([gloss], dest=target)
                if tr and tr[0]:
                    return tr[0]
                return gloss
        except Exception:
            pass
        return LOCAL_VI_DICT.get(w.lower(), w)

    try:
        en_def = fetch_definition(w, 'en')
        if en_def:
            return short_gloss(en_def, max_words=10)
    except Exception:
        pass
    return w

@app.route("/flashcards", methods=["POST"])
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
        for w in word_info[:60]:
            lvl = w.get('level', 'medium')
            try:
                brief = get_concise_definition(w['word'], def_lang=target)
            except Exception:
                brief = LOCAL_VI_DICT.get(w['word'].lower(), '') or ''
            entries.append({'word': w['word'], 'definition': brief, 'level': lvl})
        return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': True})

    for w in word_info[:60]:
        lvl = w.get('level', 'medium')
        d = ''
        try:
            d_full = fetch_definition(w['word'], 'en')
            d = short_gloss(d_full, max_words=10) if d_full else ''
        except Exception:
            d = ''
        if not d:
            d = w['word']
        entries.append({'word': w['word'], 'definition': d, 'level': lvl})

    return jsonify({'entries': entries, 'def_lang': def_lang, 'translated': False})

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


@app.route('/chat', methods=['POST'])
def chat():
    """
    Lightweight chat endpoint that accepts JSON { "message": "..." }
    or { "messages": [{"role": "user"|"ai", "content": "..."}, ...] }
    Returns: { "reply": "..." }
    """
    data = get_request_json_flexible() or {}
    message = (data.get('message') or '').strip()
    messages = data.get('messages') if isinstance(data.get('messages'), list) else None

    if not message and not messages:
        return jsonify({"error": "Missing message"}), 400

    # system instruction for vocabulary tutor
    system = (
        "You are a friendly Vietnamese-English vocabulary tutor. "
        "Help the user learn words: give concise definitions, example sentences, short quizzes, and follow-up suggestions. "
        "If the user asks for translations, provide them in Vietnamese. Keep replies focused and short when possible."
    )

    convo = system + "\n\n"
    if messages:
        for m in messages:
            role = (m.get('role') or 'user').upper()
            content = (m.get('content') or '')
            convo += f"{role}: {content}\n"

    if message:
        convo += f"USER: {message}\nAI:"

    try:
        if not GEMINI_KEY:
            # fallback simple reply when Gemini not configured
            reply = f"(No Gemini key) Tôi nhận: {message or '[conversation]'}"
        else:
            model = genai.GenerativeModel(DEFAULT_GEMINI_MODEL)
            resp = model.generate_content(convo)
            raw = getattr(resp, 'text', None) or str(resp)
            reply = raw.strip()
    except Exception as e:
        app.logger.exception('Gemini chat failed')
        reply = "Xin lỗi, tôi không thể trả lời ngay bây giờ."

    return jsonify({"reply": reply})

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
