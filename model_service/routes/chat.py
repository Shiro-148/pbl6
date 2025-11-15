"""Lightweight chat endpoint."""
from flask import Blueprint, jsonify

import config
from gemini_helpers import ensure_model
from request_utils import get_request_json_flexible

bp = Blueprint("chat", __name__)


@bp.route('/chat', methods=['POST'])
def chat():
    data = get_request_json_flexible() or {}
    message = (data.get('message') or '').strip()
    messages = data.get('messages') if isinstance(data.get('messages'), list) else None

    if not message and not messages:
        return jsonify({"error": "Missing message"}), 400

    system = (
        "You are a friendly Vietnamese-English vocabulary tutor. "
        "Help the user learn words: give concise definitions, example sentences, short quizzes, and follow-up suggestions. "
        "If the user asks for translations, provide them in Vietnamese. Keep replies focused and short when possible."
    )

    convo = system + "\n\n"
    if messages:
        for item in messages:
            role = (item.get('role') or 'user').upper()
            content = (item.get('content') or '')
            convo += f"{role}: {content}\n"
    if message:
        convo += f"USER: {message}\nAI:"

    try:
        if not config.GEMINI_KEY:
            reply = f"(No Gemini key) Tôi nhận: {message or '[conversation]'}"
        else:
            model = ensure_model(config.DEFAULT_GEMINI_MODEL)
            response = model.generate_content(convo)
            raw = getattr(response, 'text', None) or str(response)
            reply = raw.strip()
    except Exception:  # pylint: disable=broad-except
        reply = "Xin lỗi, tôi không thể trả lời ngay bây giờ."

    return jsonify({"reply": reply})
