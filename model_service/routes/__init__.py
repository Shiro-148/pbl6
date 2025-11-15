"""Flask blueprint registrations for the language service."""
from flask import Flask

from .chat import bp as chat_bp
from .classify import bp as classify_bp
from .distractors import bp as distractors_bp
from .flashcards import bp as flashcards_bp
from .sentences import bp as sentences_bp
from .word_info import bp as word_info_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(classify_bp)
    app.register_blueprint(flashcards_bp)
    app.register_blueprint(distractors_bp)
    app.register_blueprint(sentences_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(word_info_bp)
