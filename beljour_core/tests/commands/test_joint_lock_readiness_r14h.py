"""Joint evidence validation never turns a synthetic sweep into approval.

All fixtures are numeric and synthetic. Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.lock_matrix import COMMANDS, LEVELS, LockObservation
from plumb_api.commands.lock_readiness import assess_tuesday_readiness
from plumb_api.commands.quality_tier_matrix import (
    TierLockObservation,
    build_tier_matrix,
)
from plumb_api.commands.tuesday_lock import build_tuesday_lock_packet
from plumb_api.commands.types import CommandName

RUN = "tuesday-frozen-preflight"
BUILD = "renderer-frozen"


def command_row(command: CommandName, level: int) -> LockObservation:
    return LockObservation(
        command=command,
        level_tenths=level,
        preview_ms=12.0,
        export_ms=75.0,
        identity_applied=True,
        alpha_unchanged=True,
        protected_unchanged=True,
        neutral_correct=True,
        skin_lift_l=0.5 if command is CommandName.STUDIOQUALITY else None,
        pose_minimum_jacobian=0.9 if command is CommandName.POSEONLY else None,
        pose_retention=0.9 if command is CommandName.POSEONLY else None,
        measured_device=False,
    )


def tier_row(tier: str, level: int) -> TierLockObservation:
    factor = 2 if tier == "1080" else 4
    return TierLockObservation(
        tier="1080" if tier == "1080" else "4k",
        level_tenths=level,
        source_width=960,
        source_height=540,
        output_width=960 * factor,
        output_height=540 * factor,
        factor=factor,
        preview_ms=23.0,
        export_ms=109.0,
        cleanup_first=True,
        identity_lock_on=True,
        guarded_preview_steps=2,
        guarded_export_steps=2,
        neutral_reference_exact=True,
        measured_device=False,
    )


def packets(
    commands: tuple[LockObservation, ...] = (),
    tiers: tuple[TierLockObservation, ...] = (),
) -> tuple[str, str]:
    command_json = build_tuesday_lock_packet(
        commands, run_id=RUN, renderer_build=BUILD,
    ).to_json()
    tier_json = build_tier_matrix(
        tiers, original_tuesday_json=command_json,
        run_id=RUN, renderer_build=BUILD,
    )
    return command_json, tier_json


def all_commands() -> tuple[LockObservation, ...]:
    return tuple(command_row(command, level) for command in COMMANDS for level in LEVELS)


def all_tiers() -> tuple[TierLockObservation, ...]:
    return tuple(tier_row(tier, level) for tier in ("1080", "4k") for level in LEVELS)


def test_empty_readiness_counts_all_287_including_pose_and_studio() -> None:
    command_json, tier_json = packets()
    report = assess_tuesday_readiness(command_json, tier_json)
    assert report.status == "incomplete"
    assert report.observed == 0
    assert report.device_measured == 0
    assert len(report.gaps) == 287
    assert len(report.scopes) == 7
    assert [scope.scope for scope in report.scopes] == [
        *(f"/{item.value}" for item in COMMANDS), "/upscale:1080", "/upscale:4k",
    ]
    assert all(scope.slots == 41 and scope.missing == 41 for scope in report.scopes)
    metadata = report.public_metadata()
    assert metadata["release_qualified"] is False
    assert metadata["production_identity_qualified"] is False
    assert metadata["independent_realface_qualified"] is False
    assert metadata["total_slots"] == 287
    assert len(metadata["gaps"]) == 287
    assert "filename" not in json.dumps(metadata)
    assert "embedding" not in json.dumps(metadata)


def test_full_synthetic_dossier_is_not_a_device_or_release_pass() -> None:
    command_json, tier_json = packets(all_commands(), all_tiers())
    result = assess_tuesday_readiness(command_json, tier_json)
    assert result.status == "awaiting_device"
    assert result.observed == 287
    assert result.device_measured == 0
    assert len(result.gaps) == 287
    assert all(item.reason == "device_unmeasured" for item in result.gaps)
    assert all(scope.status == "awaiting_device" for scope in result.scopes)
    assert result.public_metadata()["release_qualified"] is False


def test_full_device_labeled_data_still_requires_independent_review() -> None:
    commands = tuple(replace(row, measured_device=True) for row in all_commands())
    tiers = tuple(replace(row, measured_device=True) for row in all_tiers())
    command_json, tier_json = packets(commands, tiers)
    result = assess_tuesday_readiness(command_json, tier_json)
    assert result.status == "awaiting_review"
    assert result.device_measured == 287
    assert result.gaps == ()
    assert result.public_metadata()["independent_realface_qualified"] is False


@pytest.mark.parametrize("command", COMMANDS)
@pytest.mark.parametrize("level", (10, 20, 30, 40, 50))
def test_each_command_failure_is_held_open(
    command: CommandName, level: int,
) -> None:
    candidate = replace(command_row(command, level), identity_applied=False)
    command_json, tier_json = packets((candidate,), ())
    result = assess_tuesday_readiness(command_json, tier_json)
    assert result.status == "blocked"
    scope = next(item for item in result.scopes if item.scope == f"/{command.value}")
    assert scope.failed_safety == 1
    assert scope.missing == 40
    assert any(
        gap.scope == scope.scope and gap.level_tenths == level and gap.reason == "safety_failed"
        for gap in result.gaps
    )


@pytest.mark.parametrize("tier", ("1080", "4k"))
@pytest.mark.parametrize("level", (10, 25, 40, 50))
def test_tier_latencies_are_distinct_and_slow_rows_block(
    tier: str, level: int,
) -> None:
    candidate = replace(tier_row(tier, level), preview_ms=101.0)
    command_json, tier_json = packets((), (candidate,))
    result = assess_tuesday_readiness(command_json, tier_json)
    assert result.status == "blocked"
    group = next(scope for scope in result.scopes if scope.scope == f"/upscale:{tier}")
    assert group.over_budget == 1
    assert any(
        gap.scope == group.scope and gap.level_tenths == level and gap.reason == "over_budget"
        for gap in result.gaps
    )


def test_studio_requires_measured_final_pixel_lightness() -> None:
    candidate = replace(command_row(CommandName.STUDIOQUALITY, 22), skin_lift_l=2.6)
    command_json, tier_json = packets((candidate,), ())
    report = assess_tuesday_readiness(command_json, tier_json)
    studio = next(scope for scope in report.scopes if scope.scope == "/studioquality")
    assert studio.failed_safety == 1
    assert studio.status == "blocked"


def test_pose_requires_warp_fold_and_retention_proof() -> None:
    candidate = replace(
        command_row(CommandName.POSEONLY, 44), pose_minimum_jacobian=0.20,
    )
    command_json, tier_json = packets((candidate,), ())
    report = assess_tuesday_readiness(command_json, tier_json)
    pose = next(scope for scope in report.scopes if scope.scope == "/poseonly")
    assert pose.failed_safety == 1
    assert pose.status == "blocked"


def test_tier_packet_must_bind_exact_command_run() -> None:
    command_json, tier_json = packets()
    other = build_tuesday_lock_packet((), run_id="different", renderer_build=BUILD).to_json()
    with pytest.raises(CommandValidationError):
        assess_tuesday_readiness(other, tier_json)
    with pytest.raises(CommandValidationError):
        assess_tuesday_readiness(command_json, tier_json + " ")


def test_tampered_command_packet_is_rejected_even_if_tier_is_unchanged() -> None:
    command_json, tier_json = packets()
    with pytest.raises(CommandValidationError):
        assess_tuesday_readiness(
            command_json.replace('"total_slots":205', '"total_slots":204'), tier_json,
        )
