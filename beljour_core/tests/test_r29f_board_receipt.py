"""Settings-only five-strength receipts: strict import, recomputed totals, no private data.

Author: John Khan.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

from plumb_api.commerce.board_receipt import (
    MAX_RECEIPT_BYTES,
    RECEIPT_VERSION,
    ReceiptError,
    dumps_receipt,
    issue_receipt,
    loads_receipt,
    validate_receipt,
)
from plumb_api.commerce.hair_comparison import compare_levels
from tests.test_r29f_hair_comparison import board, scene

SCENE = Path(__file__).resolve().parents[2] / "web/test/r29f-scene.mjs"


def receipt(kind: str = "palette") -> dict[str, Any]:
    return issue_receipt(board(kind))


@pytest.mark.parametrize("kind", ["fibre", "palette", "short-sides"])
def test_round_trip_is_exact_and_unverified(kind: str) -> None:
    issued = receipt(kind)
    assert issued["version"] == RECEIPT_VERSION
    assert issued["verification"] == "unverified" and issued["real_face_status"] == "not_tested"
    assert loads_receipt(dumps_receipt(issued)) == issued


def test_receipt_holds_no_image_or_private_fields() -> None:
    text = dumps_receipt(receipt("fibre"))
    for forbidden in ('"image', '"pixels"', '"mask', '"photo_hash"', '"landmarks"', '"account',
                      '"secret', '"api_key'):
        assert forbidden not in text
    assert len(text.encode()) < MAX_RECEIPT_BYTES


@pytest.mark.parametrize("key", ["photo_hash", "image", "landmarks", "account_id", "api_key"])
def test_private_fields_are_refused(key: str) -> None:
    with pytest.raises(ReceiptError, match="unknown or private"):
        validate_receipt({**receipt(), key: "x"})


def test_totals_are_recomputed_not_trusted() -> None:
    forged = receipt()
    forged["totals"] = {**forged["totals"], "rendered": 5, "unchanged": 0}
    with pytest.raises(ReceiptError, match="totals"):
        validate_receipt(forged)


def test_imported_claims_of_verification_are_refused() -> None:
    for change in ({"verification": "verified"}, {"real_face_status": "passed"},
                   {"provider_calls": 2}, {"simulated": False}):
        with pytest.raises(ReceiptError):
            validate_receipt({**receipt(), **change})


@pytest.mark.parametrize("change", [
    {"level": 2.5}, {"status": "great"}, {"changed_pixels": -1}, {"changed_share": 0.12345},
    {"identity_similarity": 1.5}, {"guard_applied": False}, {"refusal_code": "no_mesh"},
    {"changed_pixels": 0}, {"max_delta": 300}, {"extra": 1},
])
def test_level_rows_are_checked_field_by_field(change: dict[str, object]) -> None:
    forged = receipt()
    forged["levels"] = [dict(row) for row in forged["levels"]]
    forged["levels"][2] = {**forged["levels"][2], **change}
    with pytest.raises(ReceiptError):
        validate_receipt(forged)


def test_refused_levels_cannot_claim_pixels() -> None:
    image, mask, show = scene()
    refused = issue_receipt(compare_levels(image, mask, None, "fibre", scalp_mask=show))
    assert refused["totals"]["refused"] == 5
    forged = json.loads(dumps_receipt(refused))
    forged["levels"][0]["changed_pixels"] = 3
    with pytest.raises(ReceiptError):
        validate_receipt(forged)


def test_choice_must_match_kind() -> None:
    for choice in ({"style_id": "local-low-fade"}, {"shade_id": "Not An Id", "allow_lightening": True},
                   {"shade_id": "natural-03-n", "allow_lightening": "yes"}):
        with pytest.raises(ReceiptError):
            validate_receipt({**receipt(), "choice": choice})


def test_text_import_refuses_duplicates_nan_and_oversize() -> None:
    text = dumps_receipt(receipt())
    with pytest.raises(ReceiptError, match="Duplicate"):
        loads_receipt(text.replace('"kind":"palette"', '"kind":"palette","kind":"palette"'))
    with pytest.raises(ReceiptError):
        loads_receipt(text.replace('"changed_share":0.0', '"changed_share":NaN', 1))
    with pytest.raises(ReceiptError, match="too large"):
        loads_receipt(text + " " * MAX_RECEIPT_BYTES)
    with pytest.raises(ReceiptError):
        loads_receipt("[1, 2]")


def test_browser_scene_holds_the_current_python_receipt() -> None:
    match = re.search(r"PYTHON_RECEIPT = \[(.*?)\]\.join", SCENE.read_text(encoding="utf-8"), re.S)
    assert match is not None
    stored = "".join(re.findall(r"String\.raw`([^`]*)`", match.group(1)))
    assert stored == dumps_receipt(receipt("palette"))
