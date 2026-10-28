"""Image-free, cross-language recipe and fresh-consent regression tests.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any, cast

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.portable_recipe import (
    MAX_RECIPE_BYTES,
    RECIPE_VERSION,
    export_portable_recipe,
    import_portable_recipe,
    inspect_portable_recipe,
)
from plumb_api.commands.pro_plan import IdentityPolicy, ProPlan, ProStep
from plumb_api.commands.types import CommandName, LockMode, LockStrength


def sample_plan(
    *,
    enabled: bool = True,
    mode: LockMode = LockMode.SOFTEN,
    strict: bool = False,
) -> ProPlan:
    return ProPlan(
        (
            ProStep(CommandName.CLEANUP, DecimalLevel(24), 2, 0),
            ProStep(CommandName.STUDIOQUALITY, DecimalLevel(39), 2, 1),
            ProStep(CommandName.POSEONLY, DecimalLevel(10), 2, 2),
            ProStep(CommandName.UPSCALE, DecimalLevel(50), 4, 3),
            ProStep(CommandName.IDENTITYLOCK, DecimalLevel(10), 2, 4),
        ),
        IdentityPolicy(enabled, mode, LockStrength.STRICT if strict else LockStrength.NORMAL,
                       not enabled or mode is LockMode.WARN),
    )


def expect_error(code: str, payload: str | bytes, *, confirm: bool = False) -> None:
    with pytest.raises(CommandValidationError) as caught:
        import_portable_recipe(payload, confirm_weakened_identity=confirm)
    assert caught.value.code == code


def test_deterministic_roundtrip_all_five() -> None:
    plan = sample_plan(strict=True)
    serialized = export_portable_recipe(plan)
    second = export_portable_recipe(plan)
    assert serialized == second
    result = import_portable_recipe(serialized)
    assert result.plan == plan
    assert result.sha256 == plan.fingerprint()
    assert result.format == RECIPE_VERSION
    assert result.identity_reconfirmation_required is False
    assert len(serialized.encode()) < MAX_RECIPE_BYTES


def test_document_is_image_free() -> None:
    payload = json.loads(export_portable_recipe(sample_plan()))
    assert set(payload) == {"format", "plan", "sha256"}
    assert set(payload["plan"]) == {"version", "identity", "steps"}
    for forbidden in ("image", "photo", "pixel", "embedding", "landmark", "path", "filename"):
        assert forbidden not in export_portable_recipe(sample_plan())


def test_digest_is_canonical_plan_sha256() -> None:
    plan = sample_plan()
    actual = json.loads(export_portable_recipe(plan))
    digest = hashlib.sha256(plan.canonical_json().encode()).hexdigest()
    assert actual["sha256"] == digest


def test_editing_any_numeric_field_fails_integrity() -> None:
    original = json.loads(export_portable_recipe(sample_plan()))
    for index in range(5):
        changed = json.loads(json.dumps(original))
        changed["plan"]["steps"][index]["level"] = "1.1"
        expect_error("recipe_integrity_failed", json.dumps(changed))
    modified = json.loads(json.dumps(original))
    modified["plan"]["steps"][3]["scale"] = 2
    expect_error("recipe_integrity_failed", json.dumps(modified))


def test_identity_is_part_of_digest() -> None:
    original = json.loads(export_portable_recipe(sample_plan()))
    for field, value in (("mode", "block"), ("strength", "strict"),
                         ("explicit_user_override", True)):
        changed = json.loads(json.dumps(original))
        changed["plan"]["identity"][field] = value
        expect_error("recipe_integrity_failed", json.dumps(changed))


def test_default_rejects_imported_identity_optout() -> None:
    for plan in (sample_plan(enabled=False), sample_plan(mode=LockMode.WARN)):
        payload = export_portable_recipe(plan)
        expect_error("identity_reconfirmation_required", payload)
        admitted = import_portable_recipe(payload, confirm_weakened_identity=True)
        assert admitted.plan == plan
        assert admitted.identity_reconfirmation_required is True
        preview = inspect_portable_recipe(payload)
        assert preview.identity_reconfirmation_required is True
    assert not inspect_portable_recipe(export_portable_recipe(sample_plan())).identity_reconfirmation_required


def test_boolean_confirmation_cannot_be_forged_with_integer() -> None:
    payload = export_portable_recipe(sample_plan(enabled=False))
    with pytest.raises(CommandValidationError) as caught:
        import_portable_recipe(payload, confirm_weakened_identity=cast(bool, 1))
    assert caught.value.code == "invalid_identity_confirmation"


def test_unknown_and_duplicate_fields_refused() -> None:
    original = export_portable_recipe(sample_plan())
    malformed: list[str] = [
        original[:-1] + ',"__proto__":{}}',
        original.replace('"sha256":', '"digest":"x","sha256":'),
        original.replace('"format":', '"format":"duplicate","format":', 1),
        original.replace('"enabled":', '"enabled":true,"enabled":', 1),
        original.replace('"level":', '"level":"2.7","level":', 1),
    ]
    for item in malformed:
        with pytest.raises(CommandValidationError):
            import_portable_recipe(item)


def test_digests_reject_malformed_values() -> None:
    data = json.loads(export_portable_recipe(sample_plan()))
    for digest in ("Z" * 64, "a" * 63, "a" * 65, 123, None):
        replaced: dict[str, Any] = dict(data)
        replaced["sha256"] = digest
        expect_error("invalid_recipe_digest", json.dumps(replaced))


def test_malformed_input_and_size_limits() -> None:
    for item in ("", "no json", "[]", "42", "null", "{", "{}", '"hello"'):
        with pytest.raises(CommandValidationError):
            import_portable_recipe(item)
    for item in (b"\xff", b"\xef\xbb\xbf{}", "{" + " " * MAX_RECIPE_BYTES + "}"):
        with pytest.raises(CommandValidationError):
            import_portable_recipe(item)
    expect_error("invalid_recipe_number", export_portable_recipe(sample_plan()).replace(
        '"scale":2', '"scale":NaN', 1,
    ))


def test_json_whitespace_is_allowed_with_same_digest() -> None:
    original = json.loads(export_portable_recipe(sample_plan()))
    spaced = json.dumps(original, indent=2, sort_keys=False)
    assert import_portable_recipe(spaced).sha256 == original["sha256"]


@pytest.mark.parametrize("level", range(10, 51))
def test_every_decimal_level_preserved(level: int) -> None:
    plan = ProPlan((ProStep(CommandName.CLEANUP, DecimalLevel(level), 2, 0),))
    restored = import_portable_recipe(export_portable_recipe(plan))
    assert restored.plan.steps[0].level.tenths == level


def test_newer_version_fails_instead_of_downgrade() -> None:
    original = json.loads(export_portable_recipe(sample_plan()))
    original["format"] = "beljour-pro-recipe/2"
    expect_error("invalid_recipe_version", json.dumps(original))


def test_invalid_plan_schema_refuses_injection() -> None:
    original = json.loads(export_portable_recipe(sample_plan()))
    original["plan"]["source_file"] = "sensitive.jpg"
    expect_error("invalid_pro_plan", json.dumps(original))
