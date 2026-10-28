"""Tuesday command worksheet reports failures without leaking face inputs.

Only synthetic numeric evidence is exercised here. Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS, LockObservation
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet
from plumb_api.commands.tuesday_sheet import (
    _percentile,
    _ranges,
    render_tuesday_lock_sheet,
)
from plumb_api.commands.types import CommandName


def full_rows() -> tuple[LockObservation, ...]:
    return tuple(
        LockObservation(
            command=command,
            level_tenths=level,
            preview_ms=12.5 + level / 10,
            export_ms=90.0 + level,
            identity_applied=True,
            alpha_unchanged=True,
            protected_unchanged=True,
            neutral_correct=True,
            skin_lift_l=1.2 if command is CommandName.STUDIOQUALITY else None,
            pose_minimum_jacobian=0.80 if command is CommandName.POSEONLY else None,
            pose_retention=0.93 if command is CommandName.POSEONLY else None,
            measured_device=False,
        )
        for command in COMMANDS
        for level in LEVELS
    )


def sheet(observations: tuple[LockObservation, ...]) -> str:
    packet = build_tuesday_lock_packet(observations, run_id="tuesday-sheet", renderer_build="r10h")
    return render_tuesday_lock_sheet(packet.to_json())


def test_complete_matrix_technical_only_no_release() -> None:
    content = sheet(full_rows())
    assert "Observed slots: 205/205" in content
    assert "TECHNICAL REVIEW REQUIRED" in content
    assert "Independent real-face gate: **NOT RUN**" in content
    assert "Production identity qualification: **NOT VERIFIED**" in content
    assert "Release authorized: **NO**" in content
    assert "preview ≤ 100.0 ms" in content
    assert "full render ≤ 2000.0 ms" in content
    for command in COMMANDS:
        assert f"| /{command.value} | 41 | 0 | 0 | 0 | 0 |" in content
        assert f"- `/{command.value}`: missing none; safety failed none; timing failed none." in content
    assert "face_hash" not in content
    assert "image_bytes" not in content
    assert "filename" not in content


def test_empty_matrix_remains_unproven_and_fails_to_claim_device_metrics() -> None:
    content = sheet(())
    assert "INCOMPLETE" in content
    assert "Observed slots: 0/205" in content
    assert "not measured / not measured" in content
    for command in COMMANDS:
        assert f"| /{command.value} | 0 | 41 | 0 | 0 | 0 |" in content
        assert f"- `/{command.value}`: missing 1.0–5.0" in content


def test_actual_failed_slots_are_distinguished() -> None:
    observations = list(full_rows())
    observations.pop(0)
    observations[0] = replace(observations[0], identity_applied=False)
    observations[2] = replace(observations[2], export_ms=2010.0)
    content = sheet(tuple(observations))
    assert "Technical verdict: **BLOCKED**" in content
    assert "missing 1.0" in content
    assert "safety failed 1.1" in content
    assert "timing failed 1.3" in content
    assert "Release authorized: **NO**" in content


@pytest.mark.parametrize("values,expected", (
    ((), "none"),
    ((10,), "1.0"),
    ((10, 11, 12, 13), "1.0–1.3"),
    ((10, 12, 13, 15), "1.0, 1.2–1.3, 1.5"),
    ((15, 10, 11, 10), "1.0–1.1, 1.5"),
    ((50, 49, 48), "4.8–5.0"),
))
def test_missing_and_failed_level_ranges(values: tuple[int, ...], expected: str) -> None:
    assert _ranges(values) == expected


def test_median_and_p95_are_stable_and_bounded() -> None:
    assert _percentile((), 0.95) is None
    assert _percentile((10.0,), 0.95) == 10.0
    assert _percentile((10.0, 20.0, 30.0), 0.5) == 20.0
    assert _percentile((10.0, 20.0, 30.0), 0.95) == pytest.approx(29.0)
    assert _percentile((40.0, 10.0, 20.0, 30.0), 0.5) == 25.0


def test_invalid_packet_must_not_display_a_fabricated_approval() -> None:
    with pytest.raises(CommandValidationError):
        render_tuesday_lock_sheet("not valid JSON")
    content = build_tuesday_lock_packet((), run_id="empty", renderer_build="r10h").to_json()
    with pytest.raises(CommandValidationError):
        render_tuesday_lock_sheet(content.replace("NOT_RUN", "PASSED"))


def test_sheet_is_pure_and_deterministic() -> None:
    observations = full_rows()
    a = sheet(observations)
    b = sheet(tuple(reversed(observations)))
    assert a == b
    assert a.endswith("\n")
    assert len(a.splitlines()) < 100
