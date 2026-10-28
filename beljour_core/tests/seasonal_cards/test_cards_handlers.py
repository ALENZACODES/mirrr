"""Request handler tests: JSON in, JSON out, stateless make-another, error codes.

Author: John Khan.
"""

from __future__ import annotations

import base64
import json

import pytest

from plumb_api.seasonal.cards import DesignStore
from plumb_api.seasonal.cards.export import check_payload
from plumb_api.seasonal.cards.handlers import (
    ERROR_CODES,
    card_from_state,
    card_state,
    handle_another,
    handle_make,
)
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait

PHOTO = base64.b64encode(encode_with_metadata(synthetic_portrait(300, 375, seed=7)[0])).decode()


def _make(**extra: object) -> dict[str, object]:
    request: dict[str, object] = {"occasion": "halloween", "photo_b64": PHOTO, "to": "Mia",
                                  "from": "Dad", "message": "Boo!", "seed": "123"}
    request.update(extra)
    return request


def test_make_returns_payload_and_small_state() -> None:
    store = DesignStore()
    response = handle_make(_make(include_png=True), store)
    assert response["ok"] is True
    state = response["state"]
    assert isinstance(state, dict)
    assert state["occasion"] == "halloween" and state["generation"] == 0
    assert "photo" not in json.dumps(state) and "face" not in json.dumps(state)
    assert check_payload(response["payload"]) == []
    assert base64.b64decode(response["png_b64"]).startswith(b"\x89PNG")
    json.dumps(response)


def test_another_from_state_gives_a_new_design_each_time() -> None:
    store = DesignStore()
    first = handle_make(_make(), store)
    seen = {first["payload"]["design"]["fingerprint"]}
    state = first["state"]
    for generation in range(1, 6):
        response = handle_another({"state": state, "photo_b64": PHOTO}, store)
        assert response["ok"] is True, response
        fingerprint = response["payload"]["design"]["fingerprint"]
        assert fingerprint not in seen
        seen.add(fingerprint)
        state = response["state"]
        assert state["generation"] == generation
        assert response["payload"]["text"]["to"] == "Mia"


@pytest.mark.parametrize("extra", [{"look": "bat_night", "format": "square"}, {}])
def test_state_round_trip_rebuilds_the_same_design(extra: dict[str, object]) -> None:
    store = DesignStore()
    response = handle_make(_make(**extra), store)
    card = card_from_state(response["state"], base64.b64decode(PHOTO), store)
    assert card_state(card) == response["state"]
    assert card.fingerprint == response["payload"]["design"]["fingerprint"]
    assert card.look_locked is ("look" in extra)


@pytest.mark.parametrize(("change", "code", "field"), [
    ({"occasion": "birthday"}, "unknown_occasion", None),
    ({"look": "rangoli_bright"}, "unknown_look", None),
    ({"message": "x" * 300}, "bad_text", "message"),
    ({"to": 7}, "bad_text", "to"),
    ({"photo_b64": "!!!"}, "bad_photo", None),
    ({"photo_b64": ""}, "bad_photo", None),
    ({"photo_b64": base64.b64encode(b"not an image").decode()}, "bad_photo", None),
    ({"seed": "twelve"}, "bad_option", None),
    ({"seed": -4}, "bad_option", None),
    ({"format": "poster"}, "bad_option", None),
    ({"face": {"x": 1}}, "bad_option", None),
    ({"face": {"x": 1, "y": 1, "w": 0, "h": 5}}, "bad_option", None),
    ({"greeting": 5}, "bad_option", None),
])
def test_bad_requests_become_error_codes(change: dict[str, object], code: str,
                                         field: str | None) -> None:
    response = handle_make(_make(**change), DesignStore())
    assert response["ok"] is False
    assert response["error"]["code"] == code
    assert response["error"]["field"] == field
    json.dumps(response)


@pytest.mark.parametrize("state", [
    None, {}, {"v": 99}, {"v": 1, "occasion": "halloween"},
    {"v": 1, "occasion": "halloween", "look": "bat_night", "seed": "-1", "generation": 0,
     "text": {}, "format": "portrait"},
    {"v": 1, "occasion": "halloween", "look": "bat_night", "seed": "5", "generation": 0,
     "text": {}, "format": "poster"},
])
def test_bad_state_is_refused(state: object) -> None:
    response = handle_another({"state": state, "photo_b64": PHOTO}, DesignStore())
    assert response["ok"] is False
    assert response["error"]["code"] == "bad_option"


def test_every_error_code_is_unique() -> None:
    assert len(set(ERROR_CODES.values())) == len(ERROR_CODES)
