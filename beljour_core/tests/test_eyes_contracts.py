"""Boundary validation and exact no-op contracts. Author: John Khan."""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.eyes import FEATURES, EyeRequest, parse_request, render_eyes
from plumb_api.engines.eyes.contracts import MAX_LASHES, trace, validate_photo, validate_points
from plumb_api.engines.eyes.specimens import specimen


@pytest.mark.parametrize("field,value", [
    ("amount", -0.1), ("amount", 1.01), ("amount", float("nan")), ("amount", True),
    ("amount", "0.5"), ("curl", float("inf")), ("curl", -.1), ("length", 0),
    ("length", .41), ("thickness", .051), ("blend", -1), ("angle", 91),
    ("angle", -91), ("transparency", 2), ("smudge", -1), ("seed", -1),
    ("seed", 1.1), ("seed", 2**32), ("skin_depth", 1.01),
    ("natural_density", -1), ("glasses_clearance", 2), ("lower", 1),
    ("colour", [0, 0]), ("colour", [0, 0, 256]), ("colour", [.1, 2, 3]),
    ("secondary_colour", "red"), ("style", 123), ("style", "x" * 41),
    ("anatomy", {"right": "hooded"}), ("anatomy", {"right": "wrong", "left": "open"}),
    ("observed_lashes", [{}]), ("observed_lashes", [None] * (MAX_LASHES + 1)),
])
def test_request_rejects_invalid_values(field: str, value: object) -> None:
    with pytest.raises(ValueError):
        parse_request({"feature": "W59", field: value})


def test_unknown_fields_and_eye_colour_are_rejected() -> None:
    with pytest.raises(ValueError, match="unsupported"):
        parse_request({"feature": "W68"})
    with pytest.raises(ValueError, match="unknown"):
        parse_request({"feature": "W59", "send_photo": True})
    with pytest.raises(ValueError):
        parse_request(None)  # type: ignore[arg-type]


def test_dataclass_inputs_receive_the_same_runtime_validation() -> None:
    assert parse_request(EyeRequest("W59")).feature == "W59"
    with pytest.raises(ValueError):
        parse_request(replace(EyeRequest("W59"), amount=float("nan")))
    request = parse_request({"feature": "W64", "anatomy": {"right": "hooded", "left": "monolid"}})
    assert request.anatomy == {"right": "hooded", "left": "monolid"}


@pytest.mark.parametrize("bad", [
    {"side": "up", "points": [[.1, .1], [.2, .2]]},
    {"side": "right", "points": [[.1, .1]]},
    {"side": "right", "points": [[.1, .1], [.1, .1]]},
    {"side": "right", "points": [[.1, .1], [float("nan"), .2]]},
    {"side": "left", "points": [[-.1, .1], [.2, .2]]},
    {"side": "left", "points": [[.1, .1], [.2, .2]], "lower": 1},
    {"side": "left", "points": [[.1, .1], [.2, .2]], "secret": "x"},
])
def test_invalid_observed_traces_fail(bad: dict) -> None:
    with pytest.raises(ValueError):
        trace(bad)


def test_input_array_boundaries() -> None:
    with pytest.raises(ValueError, match="uint8"):
        validate_photo(np.zeros((16, 16, 3), dtype=np.float64))
    for shape in ((7, 8, 3), (8, 8, 2), (16, 16)):
        with pytest.raises(ValueError):
            validate_photo(np.zeros(shape, dtype=np.uint8))
    with pytest.raises(ValueError, match="4 MP"):
        validate_photo(np.zeros((2049, 2048, 3), dtype=np.uint8))
    for mesh in (np.zeros((5, 2)), np.zeros((478, 3)), np.full((478, 2), np.nan), np.full((478, 2), 2)):
        with pytest.raises(ValueError):
            validate_points(mesh)


@pytest.mark.parametrize("feature", FEATURES)
def test_zero_amount_is_byte_exact_with_fresh_buffers(feature: str) -> None:
    photo, mesh, traces = specimen(alpha=True)
    before, points = photo.copy(), mesh.copy()
    result = render_eyes(photo, mesh, {"feature": feature, "amount": 0, "observed_lashes": traces})
    assert result.report["status"] == "identity"
    assert np.array_equal(result.image, before)
    assert np.array_equal(photo, before) and np.array_equal(mesh, points)
    assert not np.shares_memory(result.image, photo)
    assert np.count_nonzero(result.coverage) == 0


def test_degenerate_eyes_are_rejected_even_at_zero_strength() -> None:
    photo, mesh, _ = specimen()
    mesh[33] = mesh[133]
    with pytest.raises(ValueError, match="degenerate"):
        render_eyes(photo, mesh, {"feature": "W59", "amount": 0})
