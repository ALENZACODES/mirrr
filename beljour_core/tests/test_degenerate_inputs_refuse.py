"""Degenerate turn and proportions receive typed refusals, never quality passes."""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.proportions.ratios import measure_checked
from plumb_api.engines.shape import turn, turn_pyramid



def test_non_finite_weight_plane_fails_closed() -> None:
    weights = np.ones((8, 12), dtype=np.float32)
    assert turn_pyramid.valid_weights(weights, weights.shape)
    weights[1, 2] = np.nan
    assert not turn_pyramid.valid_weights(weights, weights.shape)


@pytest.mark.parametrize("value", [-0.01, 1.01, math.inf, -math.inf, math.nan])
def test_invalid_weight_values_are_refused(value: float) -> None:
    weights = np.ones((10, 12), dtype=np.float32)
    weights[3, 5] = value
    assert not turn_pyramid.valid_weights(weights, (10, 12))


def test_wrong_weight_shape_does_not_allocate() -> None:
    assert not turn_pyramid.valid_weights(np.zeros((4, 4)), (10, 10))
    assert not turn_pyramid.valid_weights(object(), (10, 10))


def test_zero_length_mesh_is_typed_refusal() -> None:
    mesh = np.tile(np.array([[50.0, 50.0]]), (478, 1))
    result = measure_checked(mesh)
    assert isinstance(result, Refusal)
    assert result.refused and result.code in {"no_face_length", "no_face_width", "invalid_geometry"}
    assert result.module == "proportions"


def test_non_finite_mesh_is_typed_refusal() -> None:
    mesh = np.full((478, 2), np.nan)
    result = measure_checked(mesh)
    assert isinstance(result, Refusal)
    assert result.code == "invalid_geometry"


def test_invalid_turn_returns_coded_record_without_mutating_original() -> None:
    photo = np.zeros((40, 40, 3), dtype=np.uint8)
    original = photo.copy()
    refused = turn.render_turn_checked(photo, np.full((478, 3), np.nan), yaw=2)
    assert isinstance(refused, Refusal)
    assert refused.module == "warp_turn"
    assert refused.code == "invalid_geometry"
    assert np.array_equal(photo, original)


def test_invalid_protected_weights_never_return_a_pass() -> None:
    photo = np.zeros((40, 40, 3), dtype=np.uint8)
    refused = turn.render_turn_checked(photo, np.zeros((478, 3)), protected_mask=np.full((40, 40), math.nan))
    assert isinstance(refused, Refusal)
    assert refused.refused


def test_refusals_are_not_successful_measurements() -> None:
    wrong = measure_checked(np.zeros((40, 3)))
    assert isinstance(wrong, Refusal)
    observation = {"module": wrong.module, "check": "refused", "pass": False,
                   "reason_code": wrong.code}
    assert observation["pass"] is False
    assert observation["check"] == "refused"
