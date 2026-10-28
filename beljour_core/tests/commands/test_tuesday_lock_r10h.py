"""Tuesday technical dossier is strictly 205 slots and never release approval.

All measurement rows are simulated; no real photo or model is supplied.
Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS, LockObservation
from plumb_api.commands.tuesday_lock import (
    _digest,
    build_tuesday_lock_packet,
    verify_tuesday_lock_json,
)
from plumb_api.commands.types import CommandName


def _observation(command: CommandName, level: int) -> LockObservation:
    return LockObservation(
        command=command,
        level_tenths=level,
        preview_ms=17.0,
        export_ms=105.0,
        identity_applied=True,
        alpha_unchanged=True,
        protected_unchanged=True,
        neutral_correct=True,
        skin_lift_l=1.2 if command is CommandName.STUDIOQUALITY else None,
        pose_minimum_jacobian=0.82 if command is CommandName.POSEONLY else None,
        pose_retention=0.91 if command is CommandName.POSEONLY else None,
        measured_device=False,
    )


def _complete() -> tuple[LockObservation, ...]:
    return tuple(_observation(command, level) for command in COMMANDS for level in LEVELS)


def _resigned(data: dict[str, object]) -> str:
    without_checksum = {key: value for key, value in data.items() if key != "sha256"}
    data["sha256"] = _digest(without_checksum)
    return json.dumps(data)


def _mutate(payload: str, key: str, value: object) -> str:
    data: dict[str, object] = json.loads(payload)
    data[key] = value
    return _resigned(data)


def test_205_synthetic_technical_rows_never_release() -> None:
    report = build_tuesday_lock_packet(_complete(), run_id="tuesday-lab", renderer_build="r10h")
    assert len(report.rows) == 205
    assert report.technical_status == "technical_review_required"
    assert report.matrix.status == "synthetic_ready"
    assert report.rows[0].level_tenths == 10
    assert report.rows[40].level_tenths == 50
    assert report.rows[41].command == COMMANDS[1]
    assert report.blockers == ()
    public = report.payload()
    assert not public["release_qualified"]
    assert not public["production_identity_qualified"]
    assert public["independent_realface_result"] == "NOT_RUN"
    assert "pixel" not in report.to_json()
    assert len(verify_tuesday_lock_json(report.to_json())["rows"]) == 205


def test_empty_matrix_has_exact_missing_slot_count() -> None:
    report = build_tuesday_lock_packet((), run_id="empty-run", renderer_build="r10h")
    assert len(report.rows) == 205
    assert all(row.status == "missing" for row in report.rows)
    assert report.technical_status == "incomplete"
    assert report.matrix.total_checked == 0
    assert report.blockers == tuple(f"{command.value}:missing:41" for command in COMMANDS)
    assert verify_tuesday_lock_json(report.to_json())["technical_status"] == "incomplete"


def test_one_row_is_not_two_hundred_five_passes() -> None:
    report = build_tuesday_lock_packet((_observation(COMMANDS[0], 10),),
                                       run_id="single", renderer_build="r10h")
    assert report.rows[0].status == "synthetic_checked"
    assert report.rows[1].status == "missing"
    assert report.technical_status == "incomplete"
    assert report.matrix.total_checked == 1


@pytest.mark.parametrize("flawed", (
    {"identity_applied": False},
    {"alpha_unchanged": False},
    {"protected_unchanged": False},
    {"neutral_correct": False},
    {"preview_ms": 101.0},
    {"export_ms": 2001.0},
))
def test_bad_rows_cannot_be_promoted_to_technical_ready(flawed: dict[str, object]) -> None:
    clean = _complete()
    corrupt = replace(clean[0], **flawed)
    report = build_tuesday_lock_packet((corrupt, *clean[1:]),
                                       run_id="blocked", renderer_build="r10h")
    assert report.technical_status == "blocked"
    assert report.rows[0].status in ("failed_safety", "over_budget")
    assert report.matrix.status == "blocked"
    assert len(verify_tuesday_lock_json(report.to_json())["rows"]) == 205


def test_studio_and_pose_missing_safety_measurements_block() -> None:
    original = _complete()
    studio_index = COMMANDS.index(CommandName.STUDIOQUALITY) * 41 + 5
    pose_index = COMMANDS.index(CommandName.POSEONLY) * 41 + 5
    altered = list(original)
    altered[studio_index] = replace(original[studio_index], skin_lift_l=None)
    altered[pose_index] = replace(original[pose_index], pose_retention=None)
    report = build_tuesday_lock_packet(tuple(altered), run_id="missing-metrics", renderer_build="r10h")
    assert report.technical_status == "blocked"
    assert report.rows[studio_index].status == "failed_safety"
    assert report.rows[pose_index].status == "failed_safety"


def test_duplicate_and_invalid_identifier_refused() -> None:
    first = _observation(COMMANDS[0], 10)
    with pytest.raises(CommandValidationError):
        build_tuesday_lock_packet((first, first), run_id="duplicate", renderer_build="r10h")
    with pytest.raises(CommandValidationError):
        build_tuesday_lock_packet((), run_id="private/photos/person.png", renderer_build="r10h")
    with pytest.raises(CommandValidationError):
        build_tuesday_lock_packet((), run_id="good", renderer_build="../../escape")


def test_exact_checksum_deterministic_across_observation_order() -> None:
    first = build_tuesday_lock_packet(_complete(), run_id="stable", renderer_build="r10h")
    second = build_tuesday_lock_packet(tuple(reversed(_complete())),
                                       run_id="stable", renderer_build="r10h")
    assert first.to_json() == second.to_json()
    assert json.loads(first.to_json())["sha256"] == json.loads(second.to_json())["sha256"]


def test_changed_bytes_are_refused() -> None:
    text = build_tuesday_lock_packet(_complete(), run_id="tamper", renderer_build="r10h").to_json()
    changed = text.replace('"preview_ms":17.0', '"preview_ms":18.0', 1)
    assert changed != text
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(changed)


@pytest.mark.parametrize("bad_field", (
    "release_qualified", "production_identity_qualified", "independent_realface_result",
    "technical_status", "level_count", "command_count", "total_slots",
))
def test_rechecksum_cannot_override_release_or_matrix_contract(bad_field: str) -> None:
    text = build_tuesday_lock_packet(_complete(), run_id="tamper", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    if bad_field in ("release_qualified", "production_identity_qualified"):
        value: object = True
    elif bad_field == "independent_realface_result":
        value = "PASSED"
    elif bad_field == "technical_status":
        value = "approved_for_release"
    else:
        value = 999
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_mutate(text, bad_field, value))


def test_extra_raw_photo_fields_rejected_even_if_rechecksummed() -> None:
    text = build_tuesday_lock_packet((), run_id="safe", renderer_build="r10h").to_json()
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_mutate(text, "photo_path", "/private/portrait.jpg"))
    data: dict[str, object] = json.loads(text)
    rows = data["rows"]
    assert isinstance(rows, list)
    rows[0]["face_hash"] = "a" * 64
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


def test_rechecksum_cannot_hide_missing_row_data() -> None:
    text = build_tuesday_lock_packet((), run_id="safe", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    rows = data["rows"]
    assert isinstance(rows, list)
    rows[0]["status"] = "synthetic_checked"
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


def test_rechecksum_cannot_hide_false_matrix() -> None:
    text = build_tuesday_lock_packet(_complete(), run_id="safe", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    matrix = data["matrix"]
    assert isinstance(matrix, dict)
    matrix["status"] = "device_measured"
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


def test_rechecksum_cannot_claim_measured_device_without_matrix_match() -> None:
    text = build_tuesday_lock_packet(_complete(), run_id="safe", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    rows = data["rows"]
    assert isinstance(rows, list)
    rows[0]["measured_device"] = True
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


@pytest.mark.parametrize("bad_level", (9, 51, 0, "10", True))
def test_level_mutations_are_refused(bad_level: object) -> None:
    text = build_tuesday_lock_packet((), run_id="safe", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    rows = data["rows"]
    assert isinstance(rows, list)
    rows[0]["level_tenths"] = bad_level
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


def test_nonfinite_or_invalid_measurement_is_refused() -> None:
    text = build_tuesday_lock_packet(_complete(), run_id="safe", renderer_build="r10h").to_json()
    data: dict[str, object] = json.loads(text)
    rows = data["rows"]
    assert isinstance(rows, list)
    rows[0]["preview_ms"] = -1.0
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json(_resigned(data))


def test_packet_size_and_unknown_fields_fail_closed() -> None:
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json("x" * 250_001)
    with pytest.raises(CommandValidationError):
        verify_tuesday_lock_json("not json")
