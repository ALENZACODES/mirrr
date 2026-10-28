"""Decimal-first plans, strict boundaries, and default identity opt-in.

Entirely synthetic, with no inference downloads or user photographs.
Author: John Khan.
"""

from __future__ import annotations

import json
from decimal import Decimal

import pytest

from plumb_api.commands.errors import CommandParseError, CommandValidationError
from plumb_api.commands.levels import DecimalLevel, level_ticks, validate_slider
from plumb_api.commands.pro_plan import (
    IdentityPolicy,
    ProPlan,
    ProStep,
    parse_pro_commands,
    pro_plan_from_dict,
    pro_plan_from_json,
)
from plumb_api.commands.types import CommandName, LockMode, LockStrength, Strength


@pytest.mark.parametrize("tenths", range(10, 51))
def test_all_forty_one_decimal_levels_roundtrip(tenths: int) -> None:
    level = DecimalLevel(tenths)
    assert DecimalLevel.parse(level.label) == level
    assert DecimalLevel.parse(level.value) == level
    assert DecimalLevel.parse(Decimal(level.label)) == level
    assert level.label.count(".") == 1
    assert 0.0 <= level.fractional_strength <= 1.0
    assert DecimalLevel.parse(level.as_dict()["level"]) == level


@pytest.mark.parametrize(
    "value",
    ["", "0", "0.9", "5.1", "6.0", "-1.0", "1.01", "2.22", "4e0", "1.00", "nan", "inf"],
)
def test_invalid_strength_strings_rejected(value: str) -> None:
    with pytest.raises(CommandValidationError) as error:
        DecimalLevel.parse(value)
    assert error.value.code == "invalid_level"


@pytest.mark.parametrize("value", [False, True, -1, 0, 6, 2.21, float("nan"), float("inf")])
def test_invalid_strength_numbers_rejected(value: object) -> None:
    with pytest.raises(CommandValidationError):
        DecimalLevel.parse(value)


def test_decimal_step_boundaries_clamp_only_explicitly() -> None:
    minimum = DecimalLevel.parse("1.0")
    maximum = DecimalLevel.parse("5.0")
    assert minimum.adjust(1).label == "1.1"
    assert maximum.adjust(-1).label == "4.9"
    assert minimum.clamp_adjust(-3) == minimum
    assert maximum.clamp_adjust(7) == maximum
    with pytest.raises(CommandValidationError):
        minimum.adjust(-1)
    with pytest.raises(CommandValidationError):
        maximum.adjust(1)
    with pytest.raises(CommandValidationError):
        minimum.adjust(0.5)


def test_ticks_exact_count_and_slider_shape() -> None:
    ticks = level_ticks()
    assert len(ticks) == 41
    assert ticks[0] == "1.0"
    assert ticks[-1] == "5.0"
    assert len(set(ticks)) == len(ticks)
    assert validate_slider(1.0, 5.0, 0.1)
    assert not validate_slider(0, 100, 1)
    assert not validate_slider(1, 5, 0.5)
    assert not validate_slider("garbage", 5, 0.1)


def test_legacy_strengths_have_only_one_compatibility_mapping() -> None:
    assert DecimalLevel.from_legacy(Strength.SUBTLE).label == "2.0"
    assert DecimalLevel.from_legacy(Strength.NORMAL).label == "3.0"
    assert DecimalLevel.from_legacy(Strength.STRONG).label == "5.0"
    assert DecimalLevel.parse("1.0").fractional_strength == 0.2
    assert DecimalLevel.parse("5.0").fractional_strength == 1.0
    assert DecimalLevel.parse("1.0").legacy_percent == 0
    assert DecimalLevel.parse("5.0").legacy_percent == 100


def test_default_identity_is_enabled_in_every_chain() -> None:
    for text in (
        "/cleanup 3.4",
        "/upscale 4x",
        "/studioquality 1.8",
        "/poseonly 5.0",
        "/identitylock 2.2 /cleanup 4.3 /poseonly 3.7",
    ):
        plan = parse_pro_commands(text)
        assert plan.identity.enabled
        assert not plan.identity.explicit_user_override
        assert plan.identity.mode is LockMode.SOFTEN
        assert plan.identity.strength is LockStrength.NORMAL


def test_sequential_chain_and_per_command_levels() -> None:
    plan = parse_pro_commands(
        "/cleanup level=2.7 /upscale 2x level=3.3 "
        "/identitylock level=5.0 /studioquality 4.6 /poseonly 1.1",
    )
    assert [step.name for step in plan.steps] == [
        CommandName.CLEANUP, CommandName.UPSCALE, CommandName.IDENTITYLOCK,
        CommandName.STUDIOQUALITY, CommandName.POSEONLY,
    ]
    assert [step.level.label for step in plan.steps] == ["2.7", "3.3", "5.0", "4.6", "1.1"]
    assert [step.index for step in plan.steps] == [0, 1, 2, 3, 4]
    assert plan.steps[1].scale == 2
    assert plan.steps[-1].scale == 2
    assert plan.edit_level(4, DecimalLevel.parse("3.1")).steps[-1].level.label == "3.1"
    assert plan.steps[-1].level.label == "1.1"


def test_plan_immutable_json_fingerprint_and_canonical_keys() -> None:
    plan = parse_pro_commands("/CLEANUP 3.2 /POSEONLY 2.5 /UPSCALE 4x")
    encoded = plan.canonical_json()
    assert encoded == pro_plan_from_json(encoded).canonical_json()
    assert pro_plan_from_dict(json.loads(encoded)) == plan
    assert len(plan.fingerprint()) == 64
    assert plan.fingerprint() == pro_plan_from_json(encoded).fingerprint()
    assert plan.edit_level(0, DecimalLevel.parse("3.3")).fingerprint() != plan.fingerprint()
    assert "pixels" not in encoded
    assert "photo_id" not in encoded


@pytest.mark.parametrize(
    "text",
    [
        "", "cleanup", "/madeup", "/upscale 3x", "/upscale 2x scale=4x",
        "/cleanup 2.22", "/cleanup level=0.0", "/cleanup level=5.5",
        "/poseonly 2.0 scale=2x", "/cleanup 3.0 4.0", "/cleanup level=bad",
        "/studioquality key=4.0", "/cleanup /upscale /poseonly invalid",
    ],
)
def test_pro_parser_invalid_cases(text: str) -> None:
    with pytest.raises((CommandValidationError, CommandParseError)):
        parse_pro_commands(text)


def test_explicit_override_is_the_only_way_to_weaken_lock() -> None:
    with pytest.raises(CommandValidationError) as error:
        IdentityPolicy(enabled=False)
    assert error.value.code == "identity_override_required"
    with pytest.raises(CommandValidationError):
        IdentityPolicy(mode=LockMode.WARN)
    overridden = IdentityPolicy().with_user_override(enabled=False)
    assert not overridden.enabled
    assert overridden.explicit_user_override
    warning = IdentityPolicy().with_user_override(mode=LockMode.WARN)
    assert warning.mode is LockMode.WARN
    assert warning.explicit_user_override
    normal = IdentityPolicy()
    assert normal.enabled


def test_override_appears_in_canonical_plan_provenance() -> None:
    plan = parse_pro_commands("/poseonly 4.3")
    edited = plan.with_identity(plan.identity.with_user_override(mode=LockMode.WARN))
    assert edited.fingerprint() != plan.fingerprint()
    assert edited.identity.explicit_user_override
    assert pro_plan_from_json(edited.canonical_json()) == edited


def test_malformed_imported_plan_fails_closed() -> None:
    original = parse_pro_commands("/cleanup 4.0").as_dict()
    broken = dict(original)
    broken["version"] = "unsupported-plan"
    with pytest.raises(CommandValidationError):
        pro_plan_from_dict(broken)
    broken = dict(original)
    broken["steps"] = [{"name": "poseonly", "index": 0, "scale": 2, "level": "4.14"}]
    with pytest.raises(CommandValidationError):
        pro_plan_from_dict(broken)
    broken = dict(original)
    broken["identity"] = {
        "enabled": False, "mode": "soften",
        "strength": "normal", "explicit_user_override": False,
    }
    with pytest.raises(CommandValidationError):
        pro_plan_from_dict(broken)
    with pytest.raises(CommandValidationError):
        pro_plan_from_json("not json")


def test_step_type_and_count_guards() -> None:
    with pytest.raises(CommandValidationError):
        ProStep(CommandName.CLEANUP, DecimalLevel(), 4)
    with pytest.raises(CommandValidationError):
        ProStep(CommandName.CLEANUP, DecimalLevel(), 2, -1)
    with pytest.raises(CommandValidationError):
        ProPlan(())
    with pytest.raises(CommandValidationError):
        ProPlan(tuple(ProStep(CommandName.CLEANUP, index=index) for index in range(12)) + (
            ProStep(CommandName.CLEANUP),
        ))


def test_identity_model_policy_rejects_invalid_types() -> None:
    with pytest.raises(CommandValidationError):
        IdentityPolicy(enabled=1)
    with pytest.raises(CommandValidationError):
        IdentityPolicy(strength="very-strict")
    with pytest.raises(CommandValidationError):
        IdentityPolicy(mode="missing")
