"""Supplementary Tuesday matrix retains 205 original and 82 tier slots.

Everything here is generated metadata; no actual face or device run is assumed.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.quality_tier_matrix import (
    TIER_MATRIX_VERSION,
    TierLockObservation,
    _hash,
    build_tier_matrix,
    tier_matrix_csv,
    verify_tier_matrix,
)
from plumb_api.commands.quality_tiers import checked_tier
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet


@pytest.fixture(scope="module")
def base() -> str:
    return build_tuesday_lock_packet(
        (), run_id="tuesday-quality", renderer_build="pro-v1",
    ).to_json()


def observation(tier: str, level: int) -> TierLockObservation:
    scale = 2 if tier == "1080" else 4
    return TierLockObservation(
        tier=checked_tier(tier),
        level_tenths=level,
        source_width=960,
        source_height=540,
        output_width=960 * scale,
        output_height=540 * scale,
        factor=scale,
        preview_ms=12.0 + scale,
        export_ms=100.0 + scale,
        cleanup_first=True,
        identity_lock_on=True,
        guarded_preview_steps=2,
        guarded_export_steps=2,
        neutral_reference_exact=True,
        measured_device=False,
    )


def matrix(rows: tuple[TierLockObservation, ...], base: str) -> str:
    return build_tier_matrix(
        rows, original_tuesday_json=base,
        run_id="tuesday-quality", renderer_build="pro-v1",
    )


def test_empty_tier_matrix_is_82_missing_and_not_release(base: str) -> None:
    raw = matrix((), base)
    report = verify_tier_matrix(raw, original_tuesday_json=base)
    assert report["version"] == TIER_MATRIX_VERSION
    assert report["status"] == "incomplete"
    assert report["supplemental_slots"] == 82
    assert report["original_command_slots_unchanged"] == 205
    assert report["production_identity_qualified"] is False
    assert report["release_qualified"] is False
    assert report["independent_realface_result"] == "NOT_RUN"
    assert all(row["status"] == "missing" for row in report["rows"])
    assert report["rows"][0]["tier"] == "1080"
    assert report["rows"][41]["tier"] == "4k"
    csv = tier_matrix_csv(raw, original_tuesday_json=base)
    assert csv.count("\n") == 83
    assert "identity_lock_on" in csv.splitlines()[0]


@pytest.mark.parametrize("tier", ["1080", "4k"])
@pytest.mark.parametrize("level", list(range(10, 51)))
def test_each_tier_level_captures_separate_guard_and_latency(
    tier: str, level: int,
) -> None:
    row = observation(tier, level)
    assert row.safety_findings() == ()
    reading = row.public_metadata(preview_budget_ms=100, export_budget_ms=2000)
    assert reading["tier"] == tier
    assert reading["level_tenths"] == level
    assert reading["guarded_preview_steps"] == 2
    assert reading["guarded_export_steps"] == 2
    assert reading["identity_lock_on"] is True
    assert reading["cleanup_first"] is True
    assert reading["preview_ms"] == row.preview_ms
    assert reading["export_ms"] == row.export_ms
    assert reading["status"] == "synthetic_checked"
    assert not row.measured_device


def test_all_82_synthetic_rows_cannot_claim_release(base: str) -> None:
    items = tuple(observation(tier, step) for tier in ("1080", "4k") for step in range(10, 51))
    raw = matrix(items, base)
    report = verify_tier_matrix(raw, original_tuesday_json=base)
    assert len(report["rows"]) == 82
    assert report["status"] == "technical_review_required"
    assert report["production_identity_qualified"] is False
    assert report["release_qualified"] is False
    assert report["original_tuesday_sha256"] == json.loads(base)["sha256"]
    assert matrix(tuple(reversed(items)), base) == raw


@pytest.mark.parametrize("mutation,expected", [
    (dict(identity_lock_on=False), "identity_not_proved"),
    (dict(guarded_preview_steps=1), "identity_not_proved"),
    (dict(guarded_export_steps=0), "identity_not_proved"),
    (dict(cleanup_first=False), "cleanup_missing"),
    (dict(output_width=1919), "scale_mismatch"),
    (dict(output_height=1079), "aspect_mismatch"),
    (dict(output_width=960, output_height=540), "tier_shortfall"),
    (dict(neutral_reference_exact=False), "neutral_reference_mismatch"),
])
def test_safety_failures_not_marked_eligible(
    mutation: dict[str, object], expected: str, base: str,
) -> None:
    row = replace(observation("1080", 10), **mutation)
    assert expected in row.safety_findings()
    raw = matrix((row,), base)
    report = verify_tier_matrix(raw, original_tuesday_json=base)
    assert report["status"] == "blocked"
    assert report["rows"][0]["status"] == "failed_safety"
    assert expected in report["rows"][0]["findings"]


@pytest.mark.parametrize("field,value", [
    ("preview_ms", 101.0),
    ("export_ms", 2001.0),
])
def test_over_budget_is_reported_as_a_failed_tier(
    field: str, value: float, base: str,
) -> None:
    row = replace(observation("4k", 25), **{field: value})
    raw = matrix((row,), base)
    report = verify_tier_matrix(raw, original_tuesday_json=base)
    assert report["status"] == "blocked"
    assert report["rows"][41 + 15]["status"] == "over_budget"


def test_duplicate_and_wrong_run_rejected(base: str) -> None:
    row = observation("1080", 11)
    with pytest.raises(CommandValidationError):
        matrix((row, row), base)
    with pytest.raises(CommandValidationError):
        build_tier_matrix((), original_tuesday_json=base,
                          run_id="other-run", renderer_build="pro-v1")


def _resign(document: dict[str, object]) -> str:
    content = {key: value for key, value in document.items() if key != "sha256"}
    document["sha256"] = _hash(content)
    return json.dumps(document, sort_keys=True, separators=(",", ":"))


@pytest.mark.parametrize("field,value", [
    ("release_qualified", True),
    ("independent_realface_result", "PASS"),
    ("supplemental_slots", 81),
    ("status", "technical_review_required"),
])
def test_forged_packet_does_not_pass_even_when_rehashed(
    base: str, field: str, value: object,
) -> None:
    raw = json.loads(matrix((), base))
    raw[field] = value
    with pytest.raises(CommandValidationError):
        verify_tier_matrix(_resign(raw), original_tuesday_json=base)


def test_rehashed_forged_row_status_is_rejected(base: str) -> None:
    raw = json.loads(matrix((observation("1080", 13),), base))
    raw["rows"][3]["status"] = "device_checked"
    with pytest.raises(CommandValidationError):
        verify_tier_matrix(_resign(raw), original_tuesday_json=base)


def test_checksum_detects_tampering(base: str) -> None:
    raw = matrix((observation("1080", 50),), base)
    changed = raw.replace('"preview_ms":14.0', '"preview_ms":19.0')
    assert changed != raw
    with pytest.raises(CommandValidationError):
        verify_tier_matrix(changed, original_tuesday_json=base)
