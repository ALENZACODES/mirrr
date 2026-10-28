"""R25c level anchors, guarded pixels and quantitative invariants. Author: John Khan."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest
from numpy.typing import NDArray

from plumb_api.engines.gender_look.engine import render as legacy_render
from plumb_api.engines.gender_look.levels import (
    GenderLevelEngine,
    GuardDecision,
    checked_level,
    named_level,
    signal_at,
)

ByteImage = NDArray[np.uint8]


def scene(tone: int) -> ByteImage:
    yy, xx = np.mgrid[:32, :32]
    pixels = np.zeros((32, 32, 4), dtype=np.uint8)
    pixels[..., 0] = np.uint8((tone + 2 * xx + 3 * yy) % 256)
    pixels[..., 1] = np.uint8((tone + xx + 4 * yy) % 256)
    pixels[..., 2] = np.uint8((tone + 3 * xx + 2 * yy) % 256)
    pixels[..., 3] = np.uint8((xx + yy + 167) % 256)
    return pixels


def marks(image: ByteImage) -> dict[str, NDArray[np.float64]]:
    yy, xx = np.mgrid[:image.shape[0], :image.shape[1]]
    return {
        "brow": ((yy >= 5) & (yy <= 9) & (xx >= 5) & (xx <= 26)).astype(np.float64),
        "skin": ((yy >= 8) & (yy <= 27) & (xx >= 6) & (xx <= 25)).astype(np.float64),
        "stubble": ((yy >= 21) & (yy <= 26) & (xx >= 8) & (xx <= 23)).astype(np.float64),
    }


class CountingSource:
    def __init__(self) -> None:
        self.calls = 0

    def masks(self, photo_hash: str, photo: ByteImage) -> dict[str, NDArray[np.float64]]:
        assert len(photo_hash) == 64
        self.calls += 1
        return marks(photo)


class PassThrough:
    def __init__(self) -> None:
        self.calls = 0

    def guard(self, before: ByteImage, after: ByteImage, lock_level: float) -> GuardDecision:
        self.calls += 1
        assert 1 <= lock_level <= 5
        return GuardDecision(after.copy(), 1.0, False)


@pytest.mark.parametrize("bad", [0, 0.95, 2.25, 5.1, float("nan"), float("inf"), True, "2.0"])
def test_off_step_or_outside_range_refused(bad: object) -> None:
    with pytest.raises(ValueError):
        checked_level(bad)


@pytest.mark.parametrize("tick", range(10, 51))
def test_every_tenth_is_accepted(tick: int) -> None:
    assert checked_level(tick / 10) == tick / 10


@pytest.mark.parametrize("direction", ["feminine", "masculine"])
@pytest.mark.parametrize("tone", [20, 100, 205])
def test_anchor_levels_match_legacy_pixel_engine(direction: str, tone: int) -> None:
    image = scene(tone)
    source = CountingSource()
    guard = PassThrough()
    engine = GenderLevelEngine(source, guard)
    for name in ("normal", "extra", "hyper"):
        level = named_level(name)
        measured = engine.render(image, direction, level, primary_box=(0, 0, 1, 1))
        legacy = legacy_render(image, marks(image), {"direction": direction, "level": name, "amount": 1})[0]
        assert np.array_equal(measured.image, legacy)
        assert measured.guard_called
        assert measured.status == "rendered"
        assert measured.simulation
        assert measured.blended_back is False
        assert np.array_equal(measured.image[..., 3], image[..., 3])
    assert source.calls == 1
    assert guard.calls == 3


@pytest.mark.parametrize("direction", ["feminine", "masculine"])
@pytest.mark.parametrize("tone", [22, 110, 212])
def test_neutral_level_and_geometry_invariants(direction: str, tone: int) -> None:
    image = scene(tone)
    engine = GenderLevelEngine(CountingSource(), PassThrough())
    result = engine.render(image, direction, 1.0, primary_box=(0, 0, 1, 1))
    assert np.array_equal(result.image, image)
    assert result.changed_share == 0
    for tick in range(10, 51):
        level = tick / 10
        signals = signal_at(level)
        assert np.isfinite(signals.brow_tint)
        assert signals.geometry_change == 0
        assert signals.stubble_signal >= 0
    previous = signal_at(1.0)
    for tick in range(11, 51):
        current = signal_at(tick / 10)
        for field in ("brow_tint", "brow_density", "skin_texture", "stubble_signal"):
            assert getattr(current, field) >= getattr(previous, field) - 1e-12
        previous = current


def test_one_mask_computation_across_five_level_changes() -> None:
    original = scene(91)
    source = CountingSource()
    engine = GenderLevelEngine(source, PassThrough())
    for level in (1.0, 1.7, 2.0, 3.5, 5.0):
        _ = engine.render(original, "feminine", level, primary_box=(0, 0, 1, 1))
    assert engine.mask_computations == 1
    assert source.calls == 1
    engine.invalidate()
    _ = engine.render(original, "feminine", 2, primary_box=(0, 0, 1, 1))
    assert source.calls == 2


def test_declared_primary_box_isolation_and_no_mesh_refusal() -> None:
    image = scene(100)
    engine = GenderLevelEngine(CountingSource(), PassThrough())
    refused = engine.render(image, "masculine", 5, primary_box=None)
    assert refused.status == "no_mesh"
    assert refused.guard_called is False
    assert np.array_equal(refused.image, image)
    selected = engine.render(image, "masculine", 5, primary_box=(0, 0, 0.5, 1))
    assert np.array_equal(selected.image[:, 16:], image[:, 16:])
    assert selected.changed_share > 0
    assert np.array_equal(image, scene(100))


def test_preview_path_never_recomputes_observed_mask() -> None:
    image = scene(140)
    source = CountingSource()
    engine = GenderLevelEngine(source, PassThrough())
    preview = engine.render(image, "feminine", 3.5, primary_box=(0, 0, 1, 1), preview_edge=16)
    released = engine.render(image, "feminine", 3.5, primary_box=(0, 0, 1, 1))
    assert preview.image.shape == (16, 16, 4)
    assert released.image.shape == image.shape
    assert source.calls == 1
    assert preview.changed_share == released.changed_share


def test_all_signal_fields_match_serialized_cross_runtime_reference() -> None:
    fixture = Path(__file__).resolve().parents[2] / "parity/gender-signals-r25c.json"
    data = json.loads(fixture.read_text(encoding="utf-8"))
    assert len(data["cases"]) == 41
    for row in data["cases"]:
        value = signal_at(row["level"])
        actual = (
            value.brow_tint,
            value.brow_density,
            value.skin_texture,
            value.stubble_signal,
            value.geometry_change,
        )
        assert all(abs(a - b) < 1e-12 for a, b in zip(actual, row["signals"], strict=True))


def test_rendering_at_every_tenth_remains_inside_given_regions() -> None:
    photo = scene(80)
    mask = marks(photo)
    provider = CountingSource()
    engine = GenderLevelEngine(provider, PassThrough())
    for tick in range(10, 51):
        result = engine.render(photo, "masculine", tick / 10, primary_box=(0, 0, .5, 1))
        assert np.array_equal(result.image[:, 16:, :], photo[:, 16:, :])
        assert np.array_equal(result.image[..., 3], photo[..., 3])
        assert result.simulation
    assert provider.calls == 1
    assert mask["skin"].sum() > 0
