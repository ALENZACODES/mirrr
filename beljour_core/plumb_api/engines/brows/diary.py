"""Explicit, bounded measurement-diary interchange without photos. Author: John Khan."""
from __future__ import annotations

import json
from typing import Any

from .progress import diary_trend, validate_diary

DIARY_FORMAT = "beljour-brow-lash-diary/1"
MAX_DIARY_BYTES = 32768


def diary_document(entries: Any) -> dict[str, Any]:
    return {"format": DIARY_FORMAT, "author": "John Khan", "entries": validate_diary(entries),
            "attribution": False, "contains_photos": False}


def parse_diary(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        if len(value.encode()) > MAX_DIARY_BYTES:
            raise ValueError("diary exceeds 32 KiB")
        try:
            value = json.loads(value)
        except ValueError as exc:
            raise ValueError("invalid diary JSON") from exc
    if not isinstance(value, dict) or set(value) != {"format", "author", "entries", "attribution", "contains_photos"}:
        raise ValueError("unknown diary document fields")
    if value["format"] != DIARY_FORMAT or value["author"] != "John Khan":
        raise ValueError("unsupported diary format or author")
    if value["attribution"] is not False or value["contains_photos"] is not False:
        raise ValueError("diary cannot contain photographs or efficacy attribution")
    return diary_document(value["entries"])


def export_diary(entries: Any) -> str:
    encoded = json.dumps(diary_document(entries), ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    if len(encoded.encode()) > MAX_DIARY_BYTES:
        raise ValueError("diary exceeds 32 KiB")
    return encoded


def summarize_diary(entries: Any) -> dict[str, Any]:
    validated = validate_diary(entries)
    return {"count": len(validated), "first_date": validated[0]["date"] if validated else None,
            "last_date": validated[-1]["date"] if validated else None,
            "brows": diary_trend(validated, "brows"), "lashes": diary_trend(validated, "lashes"),
            "attribution": False, "photos_stored": False}
