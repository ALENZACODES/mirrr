"""Transport-neutral request handlers: JSON-style dicts in, JSON-style dicts out.

The routes lane can call handle_make and handle_another from any web framework. Requests
carry the photo as base64; responses carry the virtual-card payload, an optional PNG as
base64 and a small "state" the client sends back for "make another". The state holds only
design numbers and text, never the photo or the face box. Every failure becomes
{"ok": false, "error": {"code", "message", "field"}} instead of an exception.
Author: John Khan.
"""

from __future__ import annotations

import base64
import binascii
import math
import sqlite3
from collections.abc import Callable, Mapping
from typing import Any

from .errors import (
    CardError,
    CardOptionError,
    CardPhotoError,
    CardTextError,
    DesignStoreError,
    MotifError,
    UniquenessExhaustedError,
    UnknownLookError,
    UnknownOccasionError,
)
from .fingerprint import design_key
from .grammar import design_from_seed, format_of
from .occasions import get_occasion
from .photo import FaceBox, load_photo
from .service import Card, export_payload, export_png, make_another, make_card
from .store import DesignStore
from .text import make_text

STATE_VERSION = 1
MAX_PHOTO_B64 = 34 * 1024 * 1024
ERROR_CODES: dict[type[CardError], str] = {
    UnknownOccasionError: "unknown_occasion",
    UnknownLookError: "unknown_look",
    CardTextError: "bad_text",
    CardPhotoError: "bad_photo",
    CardOptionError: "bad_option",
    MotifError: "bad_motif",
    DesignStoreError: "store_unavailable",
    UniquenessExhaustedError: "no_unique_design",
}


def _error(code: str, message: str, field: str | None = None) -> dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message, "field": field}}


def _text_field(request: Mapping[str, Any], key: str) -> str:
    value = request.get(key, "")
    if value is None:
        return ""
    if not isinstance(value, str):
        raise CardTextError(key, "must be text")
    return value


def _photo(request: Mapping[str, Any]) -> bytes:
    raw = request.get("photo_b64")
    if not isinstance(raw, str) or not raw:
        raise CardPhotoError("photo_b64 is required")
    if len(raw) > MAX_PHOTO_B64:
        raise CardPhotoError("photo is too large")
    try:
        return base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise CardPhotoError("photo_b64 is not valid base64") from None


def _face(request: Mapping[str, Any]) -> FaceBox | None:
    face = request.get("face")
    if face is None:
        return None
    if not isinstance(face, Mapping):
        raise CardOptionError("face must be an object with x, y, w, h")
    try:
        box = FaceBox(float(face["x"]), float(face["y"]), float(face["w"]), float(face["h"]))
    except (KeyError, TypeError, ValueError):
        raise CardOptionError("face needs numeric x, y, w and h") from None
    if not all(math.isfinite(v) for v in (box.x, box.y, box.w, box.h)):
        raise CardOptionError("face values must be finite numbers")
    if box.w <= 0 or box.h <= 0:
        raise CardOptionError("face width and height must be positive")
    return box


def _optional_str(request: Mapping[str, Any], key: str) -> str | None:
    value = request.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise CardOptionError(f"{key} must be text")
    return value


def _seed(request: Mapping[str, Any]) -> int | None:
    value = request.get("seed")
    if value is None:
        return None
    try:
        seed = int(str(value))
    except ValueError:
        raise CardOptionError("seed must be a whole number") from None
    if not 0 <= seed < 2 ** 63:
        raise CardOptionError("seed must be between 0 and 2**63 - 1")
    return seed


def card_state(card: Card) -> dict[str, Any]:
    """The small state a client keeps to ask for another design later."""
    return {
        "v": STATE_VERSION,
        "occasion": card.design.occasion,
        "look": card.design.look,
        "look_locked": card.look_locked,
        "format": format_of(card.design),
        "seed": str(card.design.seed),
        "generation": card.generation,
        "fit": card.fit,
        "text": {"to": card.text.to, "from": card.text.sender, "message": card.text.message,
                 "greeting": card.text.greeting},
    }


def card_from_state(state: Mapping[str, Any], photo: bytes, store: DesignStore,
                    face: FaceBox | None = None) -> Card:
    """Rebuild an already issued card from its state (no new reservation)."""
    if not isinstance(state, Mapping) or state.get("v") != STATE_VERSION:
        raise CardOptionError("state is missing or from another version")
    try:
        occasion = str(state["occasion"])
        look = str(state["look"])
        seed = int(str(state["seed"]))
        generation = int(state["generation"])
        locked = state.get("look_locked", False)
        text = state["text"]
        card_format = str(state["format"])
        fit = str(state.get("fit", "cover"))
    except (KeyError, TypeError, ValueError, OverflowError):
        raise CardOptionError("state is incomplete") from None
    if not isinstance(locked, bool):
        raise CardOptionError("state look_locked must be true or false")
    if not 0 <= seed < 2 ** 63 or generation < 0 or not isinstance(text, Mapping):
        raise CardOptionError("state values are out of range")
    occ = get_occasion(occasion)
    occ.look(look)
    try:
        design = design_from_seed(occasion, seed, look, None, card_format)
    except ValueError as exc:
        raise CardOptionError(str(exc)) from None
    clean_text = make_text(text.get("to", ""), text.get("from", ""), text.get("message", ""),
                           text.get("greeting"), occ.greeting)
    return Card(design, clean_text, design_key(design).fingerprint, 0, generation,
                locked, fit, load_photo(photo), face, store,
                None, True)


def _respond(card: Card, request: Mapping[str, Any]) -> dict[str, Any]:
    response: dict[str, Any] = {"ok": True, "state": card_state(card),
                                "payload": export_payload(card)}
    if request.get("include_png"):
        response["png_b64"] = base64.b64encode(export_png(card)).decode("ascii")
    return response


def _guard(request: object, action: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    if not isinstance(request, Mapping):
        return _error("bad_option", "request must be a JSON object")
    try:
        return action()
    except sqlite3.Error as exc:
        return _error("store_unavailable", f"design store error: {exc}")
    except CardTextError as exc:
        return _error("bad_text", str(exc), exc.field)
    except CardError as exc:
        code = next((c for t, c in ERROR_CODES.items() if isinstance(exc, t)), "card_error")
        return _error(code, str(exc))


def handle_make(request: Mapping[str, Any], store: DesignStore) -> dict[str, Any]:
    """Make a new card from a request dict."""

    def run() -> dict[str, Any]:
        card = make_card(
            str(request.get("occasion", "")), _photo(request), to=_text_field(request, "to"),
            sender=_text_field(request, "from"), message=_text_field(request, "message"),
            greeting=_optional_str(request, "greeting"), look=_optional_str(request, "look"),
            seed=_seed(request), face=_face(request), fit=str(request.get("fit", "cover")),
            store=store, card_format=str(request.get("format", "portrait")))
        return _respond(card, request)

    return _guard(request, run)


def handle_another(request: Mapping[str, Any], store: DesignStore) -> dict[str, Any]:
    """Make another design for the card described by request["state"]."""

    def run() -> dict[str, Any]:
        state = request.get("state")
        if not isinstance(state, Mapping):
            raise CardOptionError("state is required")
        card = card_from_state(state, _photo(request), store, _face(request))
        return _respond(make_another(card), request)

    return _guard(request, run)
