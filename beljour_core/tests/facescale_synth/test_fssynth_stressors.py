"""Tests for occluders, lighting, blur, JPEG, rescale and the clutter decoys.

All inputs are drawn in code; no photos are read.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import numpy.typing as npt
import pytest

from lab.facescale_synth.fairness.traits import TraitTags
from lab.facescale_synth.stress import clutter, lighting
from lab.facescale_synth.stress.face import draw_face
from lab.facescale_synth.stress.geometry import FaceSpec
from lab.facescale_synth.stress.occluders import OCCLUDERS, add_occluder

PLAIN = TraitTags(fitzpatrick="II", age_band="20-29")


def _face(size: int = 160) -> FaceSpec:
    return FaceSpec(size=size, tone=0.2, tags=PLAIN, hair_style="short")


@pytest.mark.parametrize(
    ("kind", "hidden"),
    [("sunglasses", {0, 1}), ("mask", {2, 3, 4}), ("scarf", {3, 4})],
)
def test_occluders_hide_the_right_keypoints(kind: str, hidden: set[int]) -> None:
    render = draw_face(_face())
    record = add_occluder(render, kind, 1.0, np.random.default_rng(0))
    assert hidden <= set(record.hidden_keypoints)
    assert record.kind == kind and record.strength == 1.0


def test_clear_glasses_hide_no_keypoints() -> None:
    render = draw_face(_face())
    record = add_occluder(render, "glasses", 0.5, np.random.default_rng(0))
    assert record.hidden_keypoints == []


@pytest.mark.parametrize("kind", OCCLUDERS)
def test_every_occluder_covers_some_face(kind: str) -> None:
    render = draw_face(_face())
    before = render.image.copy()
    add_occluder(render, kind, 0.8, np.random.default_rng(3))
    changed = np.abs(render.image.astype(int) - before.astype(int)).sum(axis=2) > 0
    assert changed.sum() > 30


def test_stronger_hat_sits_lower() -> None:
    def lowest_row(strength: float) -> int:
        render = draw_face(_face())
        before = render.other.copy()
        add_occluder(render, "hat", strength, np.random.default_rng(1))
        rows = np.nonzero(((render.other > 0) & (before == 0)).any(axis=1))[0]
        return int(rows.max())

    assert lowest_row(1.0) > lowest_row(0.1)


def test_unknown_occluder_is_refused() -> None:
    with pytest.raises(ValueError):
        add_occluder(draw_face(_face(64)), "helmet", 0.5, np.random.default_rng(0))


def _grey(level: int = 128) -> npt.NDArray[np.uint8]:
    return np.full((64, 64, 3), level, dtype=np.uint8)


def test_lighting_moves_brightness_the_expected_way() -> None:
    rng = np.random.default_rng(0)
    dark, _ = lighting.light(_grey(), "low_light", 1.0, rng)
    bright, _ = lighting.light(_grey(), "over_exposure", 1.0, rng)
    assert dark.mean() < 60 and bright.mean() > 200
    subject = np.zeros((64, 64), np.uint8)
    subject[16:48, 16:48] = 255
    back, record = lighting.light(_grey(), "back_light", 1.0, rng, subject)
    assert back[32, 32].mean() < 128 < back[2, 2].mean()
    assert record["type"] == "back_light"


def test_shadow_and_cast_records() -> None:
    rng = np.random.default_rng(2)
    shadowed, record = lighting.light(_grey(), "hard_shadow", 1.0, rng)
    assert int(np.min(shadowed)) < 64 and "angle_deg" in record
    cast, record = lighting.light(_grey(), "colour_cast", 1.0, rng)
    gains = record["gains"]
    assert isinstance(gains, list) and len(gains) == 3
    assert np.ptp(cast.reshape(-1, 3).mean(axis=0)) > 5
    with pytest.raises(ValueError):
        lighting.light(_grey(), "strobe", 0.5, rng)


@pytest.mark.parametrize("kind", lighting.BLURS)
def test_blur_softens_edges(kind: str) -> None:
    image = clutter.background(np.random.default_rng(1), 128, 128, "checker")
    soft, record = lighting.blur(image, kind, 1.0, np.random.default_rng(2))

    def edges(a: npt.NDArray[np.uint8]) -> float:
        values = a.astype(int)
        return float((np.diff(values, axis=0) ** 2).mean() + (np.diff(values, axis=1) ** 2).mean())

    assert edges(soft) < edges(image)
    assert int(str(record["kernel_px"])) % 2 == 1


def test_jpeg_quality_bounds_and_loss() -> None:
    image = clutter.background(np.random.default_rng(1), 64, 64, "noise")
    low = lighting.jpeg(image, 10)
    high = lighting.jpeg(image, 95)
    assert low.shape == image.shape
    error_low = np.abs(low.astype(int) - image.astype(int)).mean()
    error_high = np.abs(high.astype(int) - image.astype(int)).mean()
    assert error_low > error_high
    with pytest.raises(ValueError):
        lighting.jpeg(image, 5)


def test_rescale_size() -> None:
    out = lighting.rescale(_grey(), 0.5, 1.5)
    assert out.shape == (96, 32, 3)


@pytest.mark.parametrize("kind", clutter.BACKGROUNDS)
def test_backgrounds_fill_the_frame(kind: str) -> None:
    image = clutter.background(np.random.default_rng(4), 96, 80, kind)
    assert image.shape == (80, 96, 3) and image.dtype == np.uint8
    with pytest.raises(ValueError):
        clutter.background(np.random.default_rng(4), 96, 80, "sky")


@pytest.mark.parametrize("kind", clutter.DECOYS)
def test_decoys_draw_inside_their_box(kind: str) -> None:
    image = np.zeros((128, 128, 3), np.uint8)
    box = (30.0, 30.0, 90.0, 100.0)
    clutter.draw_decoy(image, np.random.default_rng(5), kind, box)
    painted = image.sum(axis=2) > 0
    ys, xs = np.nonzero(painted)
    assert painted.sum() > 100
    assert int(np.min(xs)) >= 28 and int(np.max(xs)) <= 92
    assert int(np.min(ys)) >= 28 and int(np.max(ys)) <= 102


def test_decoy_list_matches_drawn_count() -> None:
    image = clutter.background(np.random.default_rng(6), 128, 128, "flat")
    found = clutter.decoys(np.random.default_rng(7), image, 3)
    assert len(found) == 3
    for decoy in found:
        x0, y0, x1, y1 = decoy.box
        assert 0 <= x0 < x1 <= 128 + 1 and 0 <= y0 < y1
