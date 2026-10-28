"""Legacy recipe migration never bypasses the new default identity guard.
Author: John Khan.
"""

from __future__ import annotations

import json

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.legacy_recipe_upgrade import (
    approve_legacy_upgrade,
    preview_legacy_upgrade,
)
from plumb_api.commands.types import (
    CleanupArgs,
    CommandName,
    CommandPlan,
    CommandStep,
    IdentityLockArgs,
    LockMode,
    LockStrength,
    PoseOnlyArgs,
    Strength,
    StudioQualityArgs,
    UpscaleArgs,
)


def legacy_plan() -> CommandPlan:
    return CommandPlan((
        CommandStep(CommandName.CLEANUP, CleanupArgs(Strength.SUBTLE), 0),
        CommandStep(CommandName.UPSCALE, UpscaleArgs(4), 1),
        CommandStep(CommandName.STUDIOQUALITY, StudioQualityArgs(Strength.STRONG), 2),
        CommandStep(CommandName.POSEONLY, PoseOnlyArgs(Strength.NORMAL), 3),
        CommandStep(CommandName.IDENTITYLOCK,
                    IdentityLockArgs(LockMode.WARN, LockStrength.STRICT), 4),
    ))


def test_default_wrap_protects_all_five_legacy_commands() -> None:
    preview = preview_legacy_upgrade(legacy_plan())
    assert preview.plan.identity.enabled
    assert preview.plan.identity.mode is LockMode.SOFTEN
    assert preview.plan.identity.strength is LockStrength.STRICT
    assert not preview.plan.identity.explicit_user_override
    assert len(preview.plan.steps) == 5
    assert [item.name for item in preview.plan.steps] == [
        item.name for item in legacy_plan().steps
    ]
    assert "warning_mode_strengthened" in preview.warnings
    assert preview.review_required
    assert preview.public_metadata()["release_qualified"] is False


def test_named_levels_follow_existing_legacy_mapping() -> None:
    result = preview_legacy_upgrade(legacy_plan())
    assert [step.level.label for step in result.plan.steps] == [
        "2.0", "1.0", "5.0", "3.0", "1.0",
    ]
    assert result.plan.steps[1].scale == 4
    assert "named_strength_approximate" in result.warnings
    assert "legacy_upscale_keeps_scale" in result.warnings


def test_migration_requires_fresh_visual_review() -> None:
    preview = preview_legacy_upgrade(legacy_plan())
    with pytest.raises(CommandValidationError) as caught:
        approve_legacy_upgrade(preview)
    assert caught.value.code == "legacy_review_required"
    plan = approve_legacy_upgrade(preview, user_reviewed=True)
    assert plan.fingerprint() == preview.plan.fingerprint()
    assert plan.identity.enabled


def test_importing_saved_legacy_json_uses_the_same_rule() -> None:
    encoded = json.dumps(legacy_plan().as_dict())
    from_json = preview_legacy_upgrade(encoded)
    from_plan = preview_legacy_upgrade(legacy_plan())
    assert from_json.plan == from_plan.plan
    assert from_json.warnings == from_plan.warnings


def test_block_protection_outweighs_warning_mode() -> None:
    legacy = CommandPlan((
        CommandStep(CommandName.IDENTITYLOCK, IdentityLockArgs(LockMode.BLOCK), 0),
        CommandStep(CommandName.IDENTITYLOCK, IdentityLockArgs(LockMode.WARN), 1),
    ))
    result = preview_legacy_upgrade(legacy)
    assert result.plan.identity.mode is LockMode.BLOCK
    assert result.plan.identity.enabled


def test_empty_or_bad_old_format_is_refused() -> None:
    for payload in (
        "{}", "[]", '"not a plan"', '{"version":"fake","steps":[]}',
    ):
        with pytest.raises(CommandValidationError):
            preview_legacy_upgrade(payload)


def test_migration_has_no_photo_or_person_information() -> None:
    metadata = json.dumps(preview_legacy_upgrade(legacy_plan()).public_metadata())
    for sensitive in ("photo", "pixels", "embedding", "landmark", "face_id", "filename"):
        assert sensitive not in metadata


def test_repeat_migration_is_deterministic() -> None:
    first = preview_legacy_upgrade(legacy_plan())
    second = preview_legacy_upgrade(legacy_plan())
    assert first == second
    assert first.plan.fingerprint() == second.plan.fingerprint()


@pytest.mark.parametrize("strength", list(Strength))
def test_each_named_strength_maps_to_one_supported_decimal(strength: Strength) -> None:
    item = CommandPlan((
        CommandStep(CommandName.CLEANUP, CleanupArgs(strength), 0),
    ))
    converted = preview_legacy_upgrade(item)
    assert converted.plan.steps[0].level.label in ("2.0", "3.0", "5.0")
    assert converted.plan.identity.enabled
