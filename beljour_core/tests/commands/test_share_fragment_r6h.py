"""Cross-language settings-only fragment and consent tests. Author: John Khan."""

from __future__ import annotations

import base64
import json
from urllib.parse import quote, unquote

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.levels import DecimalLevel
from plumb_api.commands.portable_recipe import export_portable_recipe
from plumb_api.commands.pro_plan import IdentityPolicy, ProPlan, ProStep
from plumb_api.commands.share_fragment import export_recipe_fragment, import_recipe_fragment
from plumb_api.commands.types import CommandName, LockMode


def plan() -> ProPlan:
    return ProPlan((
        ProStep(CommandName.IDENTITYLOCK, DecimalLevel(10), 2, 0),
        ProStep(CommandName.CLEANUP, DecimalLevel(30), 2, 1),
        ProStep(CommandName.UPSCALE, DecimalLevel(42), 2, 2),
        ProStep(CommandName.STUDIOQUALITY, DecimalLevel(36), 2, 3),
        ProStep(CommandName.POSEONLY, DecimalLevel(10), 2, 4),
    ))


def expect_error(code: str, raw: str, *, confirm: bool = False) -> None:
    with pytest.raises(CommandValidationError) as caught:
        import_recipe_fragment(raw, confirm_weakened_identity=confirm)
    assert caught.value.code == code


def test_link_is_a_fragment_with_no_pixel_or_person_fields() -> None:
    fragment = export_recipe_fragment(plan())
    assert fragment.startswith("#pro=")
    assert "/" not in fragment
    assert "=" not in fragment[5:]
    assert len(fragment) < 4000
    imported = import_recipe_fragment(fragment)
    assert imported.plan == plan()
    assert imported.sha256 == plan().fingerprint()
    assert not imported.identity_reconfirmation_required


def test_roundtrip_exact_canonical_base64url() -> None:
    original = export_portable_recipe(plan()).encode("utf-8")
    canonical = base64.urlsafe_b64encode(original).decode().rstrip("=")
    assert export_recipe_fragment(plan()) == "#pro=" + canonical
    assert import_recipe_fragment("#pro=" + canonical).plan == plan()


def test_any_corrupt_byte_is_detected() -> None:
    original = export_recipe_fragment(plan())
    for delta in (10, 20, 90, len(original) - 1):
        changed = original[:delta] + ("A" if original[delta] != "A" else "B") + original[delta + 1:]
        with pytest.raises(CommandValidationError):
            import_recipe_fragment(changed)


def test_trailing_or_duplicated_parameters_are_rejected() -> None:
    original = export_recipe_fragment(plan())
    for suffix in ("&tracking=1", "&pro=again", "#second", "=", "%20", "-/-"):
        expect_error("invalid_share_encoding", original + suffix)


def test_full_url_and_nonfragment_are_refused() -> None:
    original = export_recipe_fragment(plan())
    expect_error("invalid_share_prefix", "https://example.org/studio" + original)
    expect_error("invalid_share_prefix", "pro=" + original[5:])
    expect_error("invalid_share_prefix", "#other=abc")
    expect_error("invalid_share_fragment", "")
    expect_error("invalid_share_fragment", "#pro=" + "A" * 11001)


def test_unicode_url_surroundings_dont_change_fragment() -> None:
    original = export_recipe_fragment(plan())
    assert unquote(quote(original, safe="#=-_")) == original
    assert import_recipe_fragment(original).plan == plan()


def test_importing_weaker_lock_requires_another_choice() -> None:
    for mode, enabled in ((LockMode.SOFTEN, False), (LockMode.WARN, True)):
        weaker = plan().with_identity(IdentityPolicy(enabled, mode, explicit_user_override=True))
        link = export_recipe_fragment(weaker)
        expect_error("identity_reconfirmation_required", link)
        result = import_recipe_fragment(link, confirm_weakened_identity=True)
        assert result.identity_reconfirmation_required
        assert result.plan == weaker


def test_fragment_from_unsigned_json_does_not_pass() -> None:
    payload = json.loads(export_portable_recipe(plan()))
    payload["sha256"] = "0" * 64
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    expect_error("recipe_integrity_failed", "#pro=" + encoded)


@pytest.mark.parametrize("value", range(10, 51))
def test_decimal_levels_roundtrip_in_fragment(value: int) -> None:
    candidate = ProPlan((ProStep(CommandName.CLEANUP, DecimalLevel(value), 2, 0),))
    restored = import_recipe_fragment(export_recipe_fragment(candidate))
    assert restored.plan.steps[0].level.tenths == value
