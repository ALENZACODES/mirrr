"""Lane F strict tenths-based levels and legacy preset migration."""
from __future__ import annotations

import math

import pytest

from plumb_api.commerce.preview_levels import preview_resolution
from plumb_api.commerce.strength import LevelHistory, from_legacy, legacy_presets, nudge, to_legacy, validate_level


@pytest.mark.parametrize("level", [1.0, 1.1, 1.2, 2.7, 3.0, 4.9, 5.0])
def test_valid_levels(level: float) -> None:
    assert validate_level(level) == pytest.approx(level)


@pytest.mark.parametrize("invalid", [0.9, 5.1, -2.0, 3.25, 2.01, "3.0", None, False, True,
                                     float("nan"), float("inf"), -float("inf")])
def test_rejects_malformed_levels(invalid: object) -> None:
    with pytest.raises(ValueError):
        validate_level(invalid)


def test_preset_mapping_monotone_and_endpoints() -> None:
    assert legacy_presets() == {"none": 1.0, "subtle": 2.0, "natural": 3.0,
                                "strong": 4.0, "full": 5.0}
    assert to_legacy(1.0) == 0
    assert to_legacy(5.0) == 100
    assert [from_legacy(x) for x in (0, 25, 50, 75, 100)] == [1., 2., 3., 4., 5.]
    assert all(math.isfinite(from_legacy(x)) for x in range(101))
    assert all(0 <= to_legacy(x / 10.0) <= 100 for x in range(10, 51))


def test_remembers_level_per_kind_and_nudges() -> None:
    history = LevelHistory()
    assert history.get("complexion") == 3.0
    assert history.step("complexion", +1) == 3.1
    assert history.step("complexion", -1) == 3.0
    assert history.remember("lip", 5.0) == 5.0
    assert history.step("lip", +1) == 5.0
    assert history.remember("hair", 1.0) == 1.0
    assert history.step("hair", -1) == 1.0
    assert history.get("cheek") == 3.0
    history.clear()
    assert history.get("lip") == 3.0
    with pytest.raises(ValueError):
        nudge(3.0, 0)


def test_draft_render_uses_384_and_release_uses_source_size() -> None:
    assert preview_resolution(1600, 1200, "interactive") == (384, 288)
    assert preview_resolution(1600, 1200, "release") == (1600, 1200)
    assert preview_resolution(200, 300, "interactive") == (200, 300)
    with pytest.raises(ValueError):
        preview_resolution(200, 300, "blurred")
