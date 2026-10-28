"""R24c explicit level scale and per-effect local strength selection.

This is synthetic contract testing; no real face is scored. Author: John Khan.
"""
from __future__ import annotations

import math

import pytest

from plumb_api.engines.women_styling.strength import DEFAULT_LEVEL
from plumb_api.engines.women_styling.strength import PRESET_LEVELS
from plumb_api.engines.women_styling.strength import StrengthMemory
from plumb_api.engines.women_styling.strength import checked_level
from plumb_api.engines.women_styling.strength import from_legacy_strength
from plumb_api.engines.women_styling.strength import opacity_for_level
from plumb_api.engines.women_styling.strength import preset_level


@pytest.mark.parametrize("tick", range(10, 51))
def test_every_one_tenth_on_closed_scale_is_accepted(tick: int) -> None:
    expected = tick / 10
    assert checked_level(expected) == expected
    assert 0 <= opacity_for_level(expected) <= 1


@pytest.mark.parametrize("bad", [0.95, 5.1, 2.25, 4.99, -3.0, float("inf"), float("nan"), True, None, "2.0"])
def test_invalid_scale_is_rejected(bad: object) -> None:
    with pytest.raises(ValueError):
        checked_level(bad)


def test_strength_preset_mapping_is_stable() -> None:
    assert PRESET_LEVELS == {
        "subtle": 2.0, "light": 2.0, "normal": 3.0, "medium": 3.0,
        "extra": 4.0, "strong": 4.0, "full": 4.0, "hyper": 5.0,
    }
    assert [preset_level(name) for name in ("subtle", "normal", "extra", "hyper")] == [2, 3, 4, 5]
    with pytest.raises(ValueError):
        preset_level("somebody-elses-preset")


def test_legacy_mapping_is_explicit_and_reviewable() -> None:
    assert [from_legacy_strength(n) for n in (0, 25, 50, 75, 100)] == [1, 2, 3, 4, 5]
    assert all(math.isfinite(from_legacy_strength(n)) for n in range(101))
    for bad in (2.5, -1, 101, True):
        with pytest.raises(ValueError):
            from_legacy_strength(bad)


def test_last_level_is_remembered_separately_for_each_effect() -> None:
    memory = StrengthMemory()
    assert memory.current("W28") == DEFAULT_LEVEL
    assert memory.select("W28", 4.4).level == 4.4
    assert memory.select("W39", 1.2).level == 1.2
    assert memory.select("W28").level == 4.4
    assert memory.current("W39") == 1.2
    assert memory.select("W6").opacity == 0.5
    memory.clear()
    assert memory.current("W28") == 3.0
    for bad in ("", "A" * 65, "☃"):
        with pytest.raises(ValueError):
            memory.select(bad, 2.0)
