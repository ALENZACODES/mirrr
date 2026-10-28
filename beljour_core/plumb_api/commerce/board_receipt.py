"""Versioned, settings-only JSON receipt for a five-strength hair board.

A receipt holds the chosen edit, the photo's width and height, the numeric
evidence for each of the five stops and their totals. It never holds image
bytes, a photo hash, masks, head landmarks, account data or provider secrets.
Imports validate every field and recompute the totals. Every receipt, issued
or imported, stays ``unverified`` with real-face status ``not_tested``.
Mirrored in web/src/commerce/board-receipt.ts.
Author: John Khan.
"""
from __future__ import annotations

import json
import math
import re
from typing import Any

from .hair_comparison import KINDS, HairComparison
from .level_evidence import FIVE_LEVELS, STATUSES

RECEIPT_VERSION = "beljour-r29f-board-receipt/1"
MAX_RECEIPT_BYTES = 16_384
MAX_EDGE = 4_096
TOP_KEYS = frozenset({"version", "kind", "choice", "width", "height", "levels", "totals",
                      "verification", "real_face_status", "simulated", "provider_calls"})
LEVEL_KEYS = frozenset({"level", "status", "changed_pixels", "region_pixels", "changed_share",
                        "mean_delta", "max_delta", "identity_similarity", "identity_blended",
                        "guard_applied", "refusal_code"})
CHOICE_KEYS = {"fibre": frozenset({"zone", "shade_id"}),
               "palette": frozenset({"shade_id", "allow_lightening"}),
               "short-sides": frozenset({"style_id"})}
_IDENTIFIER = re.compile(r"[a-z0-9][a-z0-9-]{0,63}")
_CODE = re.compile(r"[a-z][a-z_]{0,47}")


class ReceiptError(ValueError):
    """A receipt was malformed, oversized, inconsistent or carried private data."""


def _int(value: object, name: str, low: int, high: int) -> int:
    if type(value) is not int or not low <= value <= high:
        raise ReceiptError(f"{name} must be an integer from {low} to {high}")
    return value


def _fraction(value: object, name: str, *, nullable: bool = False) -> float | None:
    if value is None and nullable:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ReceiptError(f"{name} must be a number")
    number = float(value)
    if not math.isfinite(number) or not 0.0 <= number <= 1.0 or round(number, 4) != number:
        raise ReceiptError(f"{name} must be a fraction with at most four decimals")
    return number


def _choice(kind: str, value: object) -> dict[str, object]:
    if not isinstance(value, dict) or set(value) != CHOICE_KEYS[kind]:
        raise ReceiptError("Receipt choice fields do not match its edit kind")
    for key, item in value.items():
        if key == "allow_lightening":
            if type(item) is not bool:
                raise ReceiptError("allow_lightening must be a boolean")
        elif key == "zone":
            if item not in ("crown", "parting", "hairline"):
                raise ReceiptError("Unknown fibre zone")
        elif item is not None or key != "shade_id" or kind != "fibre":
            if not isinstance(item, str) or not _IDENTIFIER.fullmatch(item):
                raise ReceiptError(f"{key} must be a catalogue identifier")
    return dict(value)


def _level(row: object, expected: float) -> dict[str, object]:
    if not isinstance(row, dict) or set(row) != LEVEL_KEYS:
        raise ReceiptError("Receipt level fields are incomplete or include unknown data")
    if row["level"] != expected or isinstance(row["level"], bool):
        raise ReceiptError("Receipt levels must be exactly 1.0, 2.0, 3.0, 4.0 and 5.0")
    status = row["status"]
    if status not in STATUSES:
        raise ReceiptError("Unknown level status")
    region = _int(row["region_pixels"], "region_pixels", 0, MAX_EDGE * MAX_EDGE)
    changed = _int(row["changed_pixels"], "changed_pixels", 0, region)
    share = _fraction(row["changed_share"], "changed_share")
    _fraction(row["mean_delta"], "mean_delta")
    largest = _int(row["max_delta"], "max_delta", 0, 255)
    similarity = _fraction(row["identity_similarity"], "identity_similarity", nullable=True)
    blended, guarded, code = row["identity_blended"], row["guard_applied"], row["refusal_code"]
    if type(guarded) is not bool:
        raise ReceiptError("guard_applied must be a boolean")
    if status == "refused":
        if not isinstance(code, str) or not _CODE.fullmatch(code):
            raise ReceiptError("A refused level needs a refusal code")
        if changed or largest or share or row["mean_delta"] or similarity is not None or \
                blended is not None or guarded:
            raise ReceiptError("A refused level cannot claim rendered evidence")
    else:
        if code is not None or similarity is None or type(blended) is not bool or not guarded:
            raise ReceiptError("A rendered or unchanged level needs guarded evidence")
        if (status == "unchanged") != (changed == 0):
            raise ReceiptError("Unchanged levels have no changed pixels, rendered levels some")
        # Python and the browser round ties differently, so allow half a unit of the last place.
        exact = changed / region if region else 0.0
        if share is None or abs(share - exact) > 0.00005 + 1e-12:
            raise ReceiptError("changed_share does not match changed and region pixels")
    return dict(row)


def _totals(levels: list[dict[str, object]]) -> dict[str, int]:
    counts: dict[str, int] = {status: sum(1 for row in levels if row["status"] == status)
                              for status in STATUSES}
    return {**counts, "cases": len(levels)}


def issue_receipt(board: HairComparison) -> dict[str, Any]:
    """Settings and numeric evidence only; validated by the same rules as an import."""
    report = board.public()
    receipt = {
        "version": RECEIPT_VERSION, "kind": report["kind"], "choice": report["choice"],
        "width": report["width"], "height": report["height"], "levels": report["levels"],
        "totals": report["totals"], "verification": "unverified",
        "real_face_status": "not_tested", "simulated": True, "provider_calls": 0,
    }
    return validate_receipt(receipt)


def validate_receipt(value: object) -> dict[str, Any]:
    """Strictly check a receipt; totals are recomputed, never trusted."""
    if not isinstance(value, dict) or set(value) != TOP_KEYS:
        raise ReceiptError("Receipt fields are incomplete or include unknown or private data")
    if value["version"] != RECEIPT_VERSION:
        raise ReceiptError("Unsupported receipt version")
    if value["kind"] not in KINDS:
        raise ReceiptError("Unknown edit kind")
    if (value["verification"] != "unverified" or value["real_face_status"] != "not_tested" or
            value["simulated"] is not True or value["provider_calls"] != 0 or
            isinstance(value["provider_calls"], bool)):
        raise ReceiptError("Receipts are unverified local simulations with no provider calls")
    width = _int(value["width"], "width", 8, MAX_EDGE)
    height = _int(value["height"], "height", 8, MAX_EDGE)
    if width * height > 1_048_576:
        raise ReceiptError("Receipt dimensions exceed the board limit")
    levels = value["levels"]
    if not isinstance(levels, list) or len(levels) != len(FIVE_LEVELS):
        raise ReceiptError("A receipt has exactly five levels")
    rows = [_level(row, stop) for row, stop in zip(levels, FIVE_LEVELS, strict=True)]
    if any(isinstance(row["region_pixels"], int) and row["region_pixels"] > width * height
           for row in rows):
        raise ReceiptError("Region pixels exceed the photo size")
    if value["totals"] != _totals(rows):
        raise ReceiptError("Receipt totals do not match its levels")
    return {**value, "choice": _choice(str(value["kind"]), value["choice"]), "levels": rows,
            "totals": _totals(rows)}


def dumps_receipt(receipt: dict[str, Any]) -> str:
    """Canonical JSON text: sorted keys, no spaces, validated first."""
    text = json.dumps(validate_receipt(receipt), sort_keys=True, separators=(",", ":"),
                      allow_nan=False)
    if len(text.encode("utf-8")) > MAX_RECEIPT_BYTES:
        raise ReceiptError("Receipt exceeds its size limit")
    return text


def loads_receipt(text: str) -> dict[str, Any]:
    """Parse an imported receipt; it remains unverified whatever it claims."""
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_RECEIPT_BYTES:
        raise ReceiptError("Receipt text is missing or too large")

    def unique(pairs: list[tuple[str, object]]) -> dict[str, object]:
        result: dict[str, object] = {}
        for key, item in pairs:
            if key in result:
                raise ReceiptError(f"Duplicate receipt field {key}")
            result[key] = item
        return result

    def constant(token: str) -> object:
        raise ReceiptError(f"Receipt number {token} is not allowed")

    try:
        value = json.loads(text, object_pairs_hook=unique, parse_constant=constant)
    except ReceiptError:
        raise
    except ValueError as error:
        raise ReceiptError("Receipt is not valid JSON") from error
    return validate_receipt(value)
