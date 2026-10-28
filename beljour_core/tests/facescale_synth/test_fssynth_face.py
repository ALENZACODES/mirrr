"""Tests for the code-drawn stress face: exact labels, tone range and speed.

All faces are drawn in code from seeds; no photos are read.
Author: John Khan.
"""

from __future__ import annotations

import os
import time

import numpy as np
import pytest

from lab.facescale_synth.fairness.traits import TraitTags
from lab.facescale_synth.seeds import item_rng
from lab.facescale_synth.stress.face import draw_face, texture_tile
from lab.facescale_synth.stress.geometry import (
    KEYPOINT_NAMES,
    LANDMARK_NAMES,
    FaceSpec,
    face_geometry,
    sample_spec,
)
from lab.facescale_synth.stress.tone import band_of, band_range, lip_rgb, sample_tone, tone_rgb

timing = pytest.mark.skipif(
    os.environ.get("FSSYNTH_SKIP_TIMING") == "1",
    reason="timing test switched off by FSSYNTH_SKIP_TIMING=1",
)
PLAIN = TraitTags(fitzpatrick="III", age_band="30-39")


def _luma(rgb: tuple[int, int, int]) -> float:
    return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]


def test_tone_runs_from_very_light_to_very_deep() -> None:
    values = [_luma(tone_rgb(t)) for t in np.linspace(0.0, 1.0, 41)]
    assert all(a > b for a, b in zip(values, values[1:], strict=False))
    assert values[0] > 220 and values[-1] < 50
    assert tone_rgb(-1.0) == tone_rgb(0.0) and tone_rgb(2.0) == tone_rgb(1.0)


def test_bands_cover_tone_and_samples_stay_inside() -> None:
    rng = np.random.default_rng(0)
    for band in ("I", "II", "III", "IV", "V", "VI"):
        low, high = band_range(band)
        for _ in range(50):
            t = sample_tone(rng, band)
            assert low <= t < high
            assert band_of(t) == band
    assert band_of(1.0) == "VI"


def test_lips_keep_contrast_at_every_tone() -> None:
    for t in np.linspace(0.0, 1.0, 11):
        skin, lips = np.array(tone_rgb(t)), np.array(lip_rgb(t))
        assert np.abs(skin - lips).sum() >= 30


def test_spec_validation() -> None:
    with pytest.raises(ValueError):
        FaceSpec(size=4, tone=0.5, tags=PLAIN)
    with pytest.raises(ValueError):
        FaceSpec(size=64, tone=1.5, tags=PLAIN)
    with pytest.raises(ValueError):
        FaceSpec(size=64, tone=0.5, tags=PLAIN, yaw=2.0)
    with pytest.raises(ValueError):
        FaceSpec(size=64, tone=0.5, tags=PLAIN, hair_style="mohawk")


def test_labels_have_expected_shapes_and_order() -> None:
    geo = face_geometry(FaceSpec(size=128, tone=0.5, tags=PLAIN))
    assert len(geo.landmarks()) == len(LANDMARK_NAMES) == 33
    assert len(geo.keypoints) == len(KEYPOINT_NAMES) == 5
    eye_l, eye_r, nose, mouth_l, mouth_r = geo.keypoints
    assert eye_l[0] < nose[0] < eye_r[0]
    assert mouth_l[0] < mouth_r[0]
    assert eye_l[1] < nose[1] < mouth_l[1]
    x0, y0, x1, y1 = geo.box
    for x, y in geo.landmarks():
        assert x0 - 1e-6 <= x <= x1 + 1e-6 and y0 - 1e-6 <= y <= y1 + 1e-6


@pytest.mark.parametrize("index", range(12))
def test_drawn_pixels_agree_with_labels(index: int) -> None:
    spec = sample_spec(item_rng(3, index), 160, max_yaw=0.3, max_pitch=0.3)
    render = draw_face(spec)
    geo = render.geometry
    alpha = render.alpha
    for x, y in geo.keypoints:
        assert alpha[int(y), int(x)] == 255
    for eye in (geo.eye_l, geo.eye_r):
        assert render.other[int(eye[1]), int(eye[0])] == 255
    cx, cy = geo.centre
    assert render.skin[int(cy), int(cx)] == 255 or spec.tags.vitiligo != "none"
    assert alpha[0, 0] == 0 and alpha[0, -1] == 0
    overlap = (render.skin > 0) & (render.hair > 0)
    assert not overlap.any()


def test_yaw_shifts_features_and_hides_far_ear() -> None:
    straight = face_geometry(FaceSpec(size=128, tone=0.3, tags=PLAIN))
    turned = face_geometry(FaceSpec(size=128, tone=0.3, tags=PLAIN, yaw=0.8))
    assert turned.nose_tip[0] > straight.nose_tip[0]
    assert turned.ear_r is None and turned.ear_l is not None
    assert turned.eye_axes_r[0] < turned.eye_axes_l[0]
    assert turned.box == straight.box


def test_draw_is_deterministic_and_seed_sensitive() -> None:
    a = draw_face(sample_spec(item_rng(9, 1), 96))
    b = draw_face(sample_spec(item_rng(9, 1), 96))
    c = draw_face(sample_spec(item_rng(9, 2), 96))
    assert np.array_equal(a.image, b.image)
    assert not np.array_equal(a.image, c.image)


def test_skin_has_texture_contrast() -> None:
    render = draw_face(FaceSpec(size=200, tone=0.9, tags=PLAIN))
    skin = render.skin > 0
    values = render.image[skin].astype(np.float32).mean(axis=1)
    assert values.std() > 2.0
    assert abs(float(texture_tile().mean())) < 0.1


@timing
@pytest.mark.parametrize(("size", "target"), [(128, 500.0), (256, 150.0)])
def test_face_speed_per_core(size: int, target: float) -> None:
    specs = [sample_spec(item_rng(1, i), size, max_yaw=0.5) for i in range(300)]
    draw_face(specs[0])
    started = time.perf_counter()
    for spec in specs:
        draw_face(spec)
    rate = len(specs) / (time.perf_counter() - started)
    assert rate >= target, f"{rate:.0f} faces/s at {size} px"
