"""Local fibre-colour reading and planning on drawn hair under coloured light.

Drawn rectangles only: a grey card and a textured hair patch under a linear-light
colour cast. No photographs, product data or supplier names. Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import numpy as np
import pytest

from plumb_api.engines.concealer.shade_support import (
    LABEL,
    FibreReading,
    plan_fibre_colour,
    read_fibre_colour,
)
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.distance import delta_e

HAIR_RGB = (92, 66, 48)
WARM, COOL, DAY = (1.18, 1.0, 0.72), (0.8, 0.97, 1.25), (1.0, 1.0, 1.0)


def drawn_hair(cast: tuple[float, float, float], hair_rgb: tuple[int, int, int] = HAIR_RGB,
               size: tuple[int, int] = (20, 30), seed: int = 0) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """(photo, hair mask, neutral card mask): grey card on the left third, hair elsewhere."""
    height, width = size
    rng = np.random.default_rng(seed)
    base = np.empty((height, width, 3), dtype=np.float64)
    base[:] = hair_rgb
    base += rng.normal(0.0, 5.0, base.shape)
    card = np.zeros((height, width), dtype=bool)
    card[:, : width // 3] = True
    base[card] = (150.0, 150.0, 150.0)
    linear = cs.decode(np.clip(base, 0, 255)) * np.asarray(cast)
    return cs.to_bytes(cs.encode(linear)), ~card, card


def test_neutral_card_correction_removes_most_of_a_colour_cast() -> None:
    readings = {}
    for name, cast in (("day", DAY), ("warm", WARM), ("cool", COOL)):
        photo, hair, card = drawn_hair(cast)
        readings[name] = read_fibre_colour(photo, hair, neutral_mask=card)
        raw = read_fibre_colour(photo, hair)
        assert readings[name].white_mode == "neutral" and raw.white_mode == "none"
        assert readings[name].pixels == int(hair.sum())
    for name in ("warm", "cool"):
        photo, hair, _ = drawn_hair(WARM if name == "warm" else COOL)
        uncorrected = read_fibre_colour(photo, hair).lab
        assert delta_e(readings[name].lab, readings["day"].lab) < 1.0
        assert delta_e(uncorrected, readings["day"].lab) > 3.0


def test_background_estimate_is_labelled_grey_world() -> None:
    photo, hair, card = drawn_hair(WARM)
    reading = read_fibre_colour(photo, hair, background_mask=card)
    assert reading.white_mode == "grey_world"
    assert read_fibre_colour(photo, hair, neutral_mask=card, background_mask=card).white_mode == "neutral"


def test_reading_refuses_bad_inputs() -> None:
    photo, hair, card = drawn_hair(DAY)
    few = np.zeros_like(hair)
    few[0, -1] = True
    for image, mask in ((photo, few), (photo.astype(np.float32), hair), (photo, hair[:, :-1]), (photo[..., 0], hair)):
        with pytest.raises(ValueError):
            read_fibre_colour(image, mask, neutral_mask=card)


def test_plan_never_goes_above_the_measured_level_without_approval() -> None:
    reading = FibreReading((25.4, 7.23, 3.96), "neutral")
    held = plan_fibre_colour(reading)
    assert not held.refused and held.best is not None and len(held.matches) == 3
    assert all(m.record.level <= m.measured_level for m in held.matches)  # type: ignore[operator]
    assert held.lighter_option is not None
    assert held.lighter_option.record.level > held.lighter_option.measured_level  # type: ignore[operator]
    assert held.lighter_option.delta_e < held.best.delta_e
    approved = plan_fibre_colour(reading, approve_lighter=True)
    assert approved.best is not None and approved.best.record.id == held.lighter_option.record.id
    assert approved.lighter_option is None and approved.approved_lighter
    body = held.public()
    assert body["lighter_needs_approval"] is True and body["label"] == LABEL
    assert body["tested_against_real_products"] is False


def test_plan_on_drawn_photo_names_a_natural_brown() -> None:
    photo, hair, card = drawn_hair(WARM)
    plan = plan_fibre_colour(read_fibre_colour(photo, hair, neutral_mask=card), count=5)
    assert not plan.refused and len(plan.matches) == 5
    assert plan.best is not None and plan.best.record.surface == "hair" and plan.best.delta_e < 6.0


def test_coded_refusals_name_no_swatch() -> None:
    uncorrected = plan_fibre_colour(FibreReading((30, 8, 12), "none"))
    assert uncorrected.code == "uncorrected_lighting" and uncorrected.matches == ()
    far = plan_fibre_colour(FibreReading((50, -60, 60), "neutral"))
    assert far.code == "too_far" and far.best is None and far.lighter_option is None
    assert far.public()["refused"] is True


@pytest.mark.parametrize("kwargs", [{"approve_lighter": 1}, {"count": 0}, {"count": 11}, {"count": 2.0}])
def test_plan_options_are_checked(kwargs: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        plan_fibre_colour(FibreReading((30, 8, 12), "neutral"), **kwargs)  # type: ignore[arg-type]


def test_reading_validation_and_immutability() -> None:
    for args in (((30, 8), "neutral"), ((30, 8, 12), "daylight"), ((30, 8, 12), "neutral", 1), ((30, 8, 12),
                 "neutral", False, -1)):
        with pytest.raises(ValueError):
            FibreReading(*args)  # type: ignore[arg-type]
    reading = FibreReading([30, 8, 12], "neutral")  # type: ignore[arg-type]
    assert reading.lab == (30.0, 8.0, 12.0)
    with pytest.raises(dataclasses.FrozenInstanceError):
        reading.white_mode = "none"  # type: ignore[misc]
    with pytest.raises(ValueError):
        plan_fibre_colour({"lab": (30, 8, 12)})  # type: ignore[arg-type]
