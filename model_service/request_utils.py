"""HTTP helper utilities."""
import json
from typing import Any, Dict

from flask import Request, request


def get_request_json_flexible(req: Request | None = None) -> Dict[str, Any]:
    req = req or request
    data: Dict[str, Any] = {}
    try:
        data = req.get_json(force=False, silent=True) or {}
    except Exception:  # pylint: disable=broad-except
        data = {}

    if not data:
        try:
            if req.form:
                data = req.form.to_dict()
        except Exception:  # pylint: disable=broad-except
            pass

    if not data:
        try:
            raw = req.get_data(as_text=True) or ""
            raw = raw.strip()
            if raw:
                try:
                    data = json.loads(raw)
                except Exception:  # pylint: disable=broad-except
                    from urllib.parse import parse_qs

                    parsed = parse_qs(raw)
                    if parsed:
                        data = {key: values[0] for key, values in parsed.items()}
        except Exception:  # pylint: disable=broad-except
            pass

    return data or {}
