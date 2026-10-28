"""Strength curve tests at levels 1.0, 2.5 and 5.0 for every look.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import StrengthCurve, apply_look, list_packs, strength_amount
from plumb_api.seasonal.packs.model import AMOUNT_FLOOR
from plumb_api.seasonal.packs.synthetic import single

ALL_LOOKS = [(pack.occasion, look.id) for pack in list_packs() for look in pack.looks]
LEVELS = (1.0, 2.5, 5.0)


@pytest.mark.parametrize("curve", list(StrengthCurve))
def test_curve_end_points_and_order(curve: StrengthCurve) -> None:
    low, mid, high = (strength_amount(level, curve) for level in LEVELS)
    assert low == pytest.approx(AMOUNT_FLOOR)
    assert high == pytest.approx(1.0)
    assert low < mid < high


@pytest.mark.parametrize("curve", list(StrengthCurve))
def test_curves_rise_across_every_step(curve: StrengthCurve) -> None:
    values = [strength_amount(round(1.0 + 0.1 * step, 1), curve) for step in range(41)]
    assert all(b > a for a, b in zip(values, values[1:], strict=False))


def test_linear_midpoint() -> None:
    assert strength_amount(3.0) == pytest.approx(AMOUNT_FLOOR + (1 - AMOUNT_FLOOR) * 0.5)
    assert strength_amount(2.5, StrengthCurve.EASE_IN) < strength_amount(2.5)
    assert strength_amount(2.5, StrengthCurve.EASE_OUT) > strength_amount(2.5)


def change_energy(before: np.ndarray, after: np.ndarray) -> float:
    return float(np.abs(before.astype(np.int32) - after.astype(np.int32)).sum())


@pytest.mark.parametrize(("occasion", "look_id"), ALL_LOOKS)
def test_every_look_grows_with_strength(occasion: str, look_id: str) -> None:
    image, target = single(192)
    energies = [
        change_energy(image, apply_look(image, occasion, look_id, target, strength=level, seed=1))
        for level in LEVELS
    ]
    assert energies[0] > 0
    assert energies[0] <= energies[1] <= energies[2]
    assert energies[2] > energies[0]


@pytest.mark.parametrize(("occasion", "look_id"), ALL_LOOKS)
def test_default_strength_matches_the_explicit_level(occasion: str, look_id: str) -> None:
    image, target = single(128)
    look = next(p for p in list_packs() if p.occasion == occasion).look(look_id)
    default = apply_look(image, occasion, look_id, target, seed=4)
    explicit = apply_look(image, occasion, look_id, target, strength=look.default_strength, seed=4)
    assert np.array_equal(default, explicit)
