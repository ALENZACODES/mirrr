"""Synthetic-only detection receipt reconciliation regression tests."""
from __future__ import annotations

import copy

import pytest

from plumb_api.vision.receipt_reconciliation_a import ReceiptMismatch, reconcile


PIN = {"commit": "integration-test", "definitions_sha256": "d" * 64,
       "run_id": "frozen-1000-test"}


def fixture() -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    manifest = [{"face_id": "opaque-a", "shard": 0},
                {"face_id": "opaque-b", "shard": 1},
                {"face_id": "opaque-c", "shard": 1}]
    receipts = [dict(PIN, face_id="opaque-a", shard=0, outcome="mesh"),
                dict(PIN, face_id="opaque-b", shard=1, outcome="no_mesh",
                     failure_class="cropped"),
                dict(PIN, face_id="opaque-c", shard=1, outcome="error")]
    return manifest, receipts


def audit(manifest: list[dict[str, object]], receipts: list[dict[str, object]]):
    return reconcile(manifest, receipts, **PIN)


def test_reconciles_all_manifest_rows_and_breakdown() -> None:
    manifest, receipts = fixture()
    result = audit(manifest, receipts)
    assert result.expected == result.received == 3
    assert (result.detected, result.undetected, result.errors) == (1, 1, 1)
    assert result.failure_counts["cropped"] == 1
    assert sum(result.failure_counts.values()) == result.undetected
    assert result.summary()["status"] == "reconciled"


def test_input_order_does_not_change_receipt_hash() -> None:
    manifest, receipts = fixture()
    a = audit(manifest, receipts)
    b = audit(list(reversed(manifest)), list(reversed(receipts)))
    assert a.manifest_sha256 == b.manifest_sha256
    assert a.receipts_sha256 == b.receipts_sha256


@pytest.mark.parametrize("mutation", [
    "missing", "extra", "duplicate", "wrong_shard", "wrong_commit",
    "wrong_definition", "wrong_run", "unknown_outcome", "absent_class",
    "bad_class", "spurious_class", "invalid_id", "bool_shard",
])
def test_refuses_invalid_receipts(mutation: str) -> None:
    manifest, receipts = fixture()
    if mutation == "missing":
        receipts.pop()
    elif mutation == "extra":
        receipts.append(dict(PIN, face_id="opaque-d", shard=1, outcome="mesh"))
    elif mutation == "duplicate":
        receipts.append(copy.deepcopy(receipts[0]))
    elif mutation == "wrong_shard":
        receipts[0]["shard"] = 1
    elif mutation == "wrong_commit":
        receipts[0]["commit"] = "wrong"
    elif mutation == "wrong_definition":
        receipts[0]["definitions_sha256"] = "x" * 64
    elif mutation == "wrong_run":
        receipts[0]["run_id"] = "other"
    elif mutation == "unknown_outcome":
        receipts[0]["outcome"] = "unknown"
    elif mutation == "absent_class":
        del receipts[1]["failure_class"]
    elif mutation == "bad_class":
        receipts[1]["failure_class"] = "glasses"
    elif mutation == "spurious_class":
        receipts[0]["failure_class"] = "group"
    elif mutation == "invalid_id":
        receipts[0]["face_id"] = "  "
    elif mutation == "bool_shard":
        manifest[0]["shard"] = True
    with pytest.raises(ReceiptMismatch):
        audit(manifest, receipts)


def test_empty_manifest_not_a_pass() -> None:
    with pytest.raises(ReceiptMismatch):
        audit([], [])


def test_every_failure_class_is_aggregated() -> None:
    manifest, receipts = fixture()
    classes = ["group", "cropped", "profile", "occlusion", "other"]
    for idx, name in enumerate(classes):
        face_id = f"case-{idx}"
        manifest.append({"face_id": face_id, "shard": 0})
        receipts.append(dict(PIN, face_id=face_id, shard=0,
                             outcome="no_mesh", failure_class=name))
    result = audit(manifest, receipts)
    assert result.undetected == len(classes) + 1
    assert sum(result.failure_counts.values()) == result.undetected
