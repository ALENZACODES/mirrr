"""R13: the "skin" consent scope is valid, and only for the skin-match action.

Pass definition: a skin attestation clears skin-match and nothing else; makeup and
hair attestations never clear skin-match; out-of-scope values are still refused by
the attestation shape. Pure rule tests, no HTTP and no provider. Author: John Khan.
"""
from __future__ import annotations

import time

import pytest
from pydantic import ValidationError

from plumb_api.consent import SKIN_ACTIONS, ConsentIn, attestation, require_consent, scope_for
from plumb_api.errors import PlumbError

PHOTO = "photo0001"


def test_skin_scope_is_only_the_skin_match_action() -> None:
    assert SKIN_ACTIONS == frozenset({"skin-match"})
    assert scope_for("skin-match") == "skin"
    for action in ("makeup", "hair-color"):
        assert scope_for(action) != "skin"


def test_skin_attestation_clears_skin_match() -> None:
    now = int(time.time() * 1000)
    skin = ConsentIn(**attestation(PHOTO, "skin-match", now))
    assert skin.scope == "skin"
    assert require_consent(skin, PHOTO, "skin-match", now) == "skin"


@pytest.mark.parametrize("action", ("makeup", "hair-color"))
def test_skin_attestation_never_clears_makeup_or_hair(action: str) -> None:
    now = int(time.time() * 1000)
    skin = ConsentIn(**attestation(PHOTO, "skin-match", now))
    with pytest.raises(PlumbError) as err:
        require_consent(skin, PHOTO, action, now)
    assert (err.value.status, err.value.code) == (428, "consent_scope")
    assert "Nothing was sent" in err.value.message


@pytest.mark.parametrize("action", ("makeup", "hair-color"))
def test_makeup_or_hair_attestation_never_clears_skin_match(action: str) -> None:
    now = int(time.time() * 1000)
    other = ConsentIn(**attestation(PHOTO, action, now))
    with pytest.raises(PlumbError) as err:
        require_consent(other, PHOTO, "skin-match", now)
    assert (err.value.status, err.value.code) == (428, "consent_scope")


@pytest.mark.parametrize("scope", ("body", "face", "SKIN", ""))
def test_other_scopes_are_still_refused_by_the_shape(scope: str) -> None:
    good = attestation(PHOTO, "skin-match")
    with pytest.raises(ValidationError):
        ConsentIn(**{**good, "scope": scope})
