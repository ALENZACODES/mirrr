"""R14 face-tone pass definitions, written before running these synthetic cases.

An explicit finite mask meters linear luminance, independently of the background.
Every positive-weight pixel in returned bytes must rise by at most 2.5 CIE L*;
mean-change/clipping guards also remain satisfied. Missing masks make no skin
claim, invalid/empty masks refuse, normal/zero-strength pixels stay unchanged,
alpha/source bytes stay intact and measured meshes alone create masks.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.engines.core.colour import rgb_to_lab
from plumb_api.engines.core.composite import decode
from plumb_api.engines.repair import analyse, restore, safety, synthetic
from plumb_api.engines.repair.face_tone import (
    MAX_SKIN_LIGHTNESS_RISE,
    FaceToneMeter,
    face_weights,
    mask_from_face,
    metered_luminance,
)
from plumb_api.engines.shape.synthetic_heads import drawn_head

GOLDEN = Path(__file__).with_name("goldens") / "enhance-face-tone.json"


def independent_rise(source: np.ndarray, output: np.ndarray, mask: np.ndarray) -> float:
    rows, cols = np.nonzero(mask > 0)
    return max([0.0, *[rgb_to_lab(output[y, x, :3])[0] - rgb_to_lab(source[y, x, :3])[0]
                       for y, x in zip(rows, cols, strict=True)]])


def patch_scene(background: int = 0) -> tuple[np.ndarray, np.ndarray]:
    image = np.full((16, 16, 3), background, dtype=np.uint8)
    mask = np.zeros((16, 16), dtype=np.float64)
    image[4:12, 4:12] = [90, 72, 55]
    mask[4:12, 4:12] = 1
    mask[4, 4:12] = 0.25
    return image, mask


@pytest.mark.parametrize("bad", [None, [], [[1]], np.zeros((16, 16)),
                                np.full((16, 16), -0.01), np.full((16, 16), 1.01),
                                np.full((16, 16), np.nan), np.full((16, 16), np.inf)])
def test_explicit_invalid_mask_cannot_be_used_as_skin_evidence(bad: object) -> None:
    with pytest.raises(ValueError, match="face mask"):
        face_weights(bad, (16, 16))


def test_weights_are_copied_and_meter_owns_only_the_current_invocation() -> None:
    source, mask = patch_scene()
    weights = face_weights(mask, source.shape[:2])
    meter = FaceToneMeter(source, weights)
    before = meter.measure(source)
    source[:] = 255
    mask[:] = 0
    assert weights[6, 6] == 1
    assert not weights.flags.writeable
    assert meter.measure(source).before_lstar == before.before_lstar
    assert meter.measure(source).max_rise > 2.5


def test_face_metering_is_independent_of_an_uncovered_background() -> None:
    dark, mask = patch_scene(0)
    bright, _ = patch_scene(255)
    a = safety.bounded_exposure(dark, target=0.18, weight=0.9, face_mask=mask)
    b = safety.bounded_exposure(bright, target=0.18, weight=0.9, face_mask=mask)
    assert a.requested_gain == b.requested_gain
    assert a.applied_gain == b.applied_gain
    np.testing.assert_array_equal(a.image[mask > 0], b.image[mask > 0])
    assert safety.bounded_exposure(dark).requested_gain != safety.bounded_exposure(bright).requested_gain


def test_fractional_weights_meter_without_turning_the_mask_into_a_threshold() -> None:
    source = np.array([[[15, 35, 55], [210, 180, 140]]], dtype=np.uint8)
    mask = face_weights([[1, 0.1]], (1, 2))
    lin = decode(source)
    luminance = lin @ np.array([0.2126, 0.7152, 0.0722])
    expected = float((luminance[0, 0] + luminance[0, 1] * 0.1) / 1.1)
    assert metered_luminance(lin, mask) == pytest.approx(expected, abs=1e-15)
    assert metered_luminance(lin, mask) != pytest.approx(float(luminance.mean()))


@pytest.mark.parametrize("colour", [(0, 0, 0), (10, 10, 10), (11, 11, 11), (20, 12, 8),
                                    (60, 40, 30), (128, 95, 65), (210, 170, 135), (255, 255, 255)])
def test_lightness_measurement_matches_the_independent_cie_primitive(colour: tuple[int, int, int]) -> None:
    source = np.full((2, 3, 3), colour, dtype=np.uint8)
    report = FaceToneMeter(source, np.ones((2, 3))).measure(source)
    assert report.before_lstar == pytest.approx(rgb_to_lab(colour)[0], abs=1e-12)
    assert report.after_lstar == report.before_lstar
    assert report.max_rise == 0


@pytest.mark.parametrize("colour", [(15, 10, 8), (40, 30, 22), (80, 55, 38),
                                    (128, 95, 65), (180, 145, 115), (225, 200, 170)])
def test_tone_returns_actual_rounded_pixels_within_the_skin_cap(colour: tuple[int, int, int]) -> None:
    source = np.full((16, 16, 3), colour, dtype=np.uint8)
    original = source.copy()
    mask = np.ones((16, 16))
    output = restore.tone(source, analyse.analyse(source), wb_weight=0, white_balance=False,
                          exposure_target=1, exposure_weight=1, face_mask=mask)
    assert independent_rise(source, output, mask) <= MAX_SKIN_LIGHTNESS_RISE
    assert safety.measure_safety(source, output).within_limits
    np.testing.assert_array_equal(source, original)


def test_antialiased_low_weight_pixel_still_has_the_full_lightness_guard() -> None:
    source = np.full((8, 8, 3), 50, dtype=np.uint8)
    proposed = source.copy()
    proposed[0, 0] = 90
    mask = np.ones((8, 8))
    mask[0, 0] = 1e-8
    result = safety.guard_output(source, proposed, face_mask=mask)
    assert result.reduced
    assert result.face_tone is not None and result.face_tone.within_limit
    assert independent_rise(source, result.image, mask) <= 2.5
    assert np.any(result.image != source), "the guard should preserve a measured-safe edit"


@pytest.mark.parametrize("mode", tuple(restore.MODES))
def test_enhance_checks_all_stages_against_original_skin_bytes(mode: str) -> None:
    source = synthetic.low_light(synthetic.scene(48, 40), 0.22)
    mask = np.zeros(source.shape[:2])
    mask[8:32, 8:40] = 1
    result = restore.enhance(source, mode, face_mask=mask)
    assert result.condition is not None and result.condition.low_light
    assert result.steps["face_metering"] == "supplied_face_mask"
    assert result.safety["face_tone"]["evidence"] == "supplied_face_mask"
    assert independent_rise(source, result.image, mask) <= 2.5
    assert safety.measure_safety(source, result.image).within_limits
    assert result.safety["face_tone"]["max_rise"] <= 2.5


def test_no_mask_never_claims_measured_skin_and_explicit_none_keeps_old_bytes() -> None:
    source = synthetic.low_light(synthetic.scene(32, 32), 0.3)
    plain = restore.enhance(source, "low_light")
    explicit = restore.enhance(source, "low_light", face_mask=None)
    np.testing.assert_array_equal(plain.image, explicit.image)
    assert plain.steps == explicit.steps and plain.safety == explicit.safety
    assert "face_metering" not in plain.steps and "face_tone" not in plain.safety


def test_normal_and_zero_strength_preserve_pixels_alpha_and_inputs() -> None:
    source = synthetic.scene(48, 40)
    rgba = np.dstack([source, np.arange(48 * 40, dtype=np.uint8).reshape(40, 48)])
    mask = np.ones(source.shape[:2])
    for image, strength in [(rgba, 1), (synthetic.low_light(source, 0.3), 0)]:
        original = image.copy()
        result = restore.enhance(image, "low_light", strength=strength, face_mask=mask)
        np.testing.assert_array_equal(result.image, image)
        np.testing.assert_array_equal(image, original)
        assert result.safety["face_tone"]["max_rise"] == 0


def test_geometry_mask_is_only_built_for_a_usable_recorded_mesh() -> None:
    xyz, image = drawn_head(2, width=128, height=128)
    mask = mask_from_face(xyz[:, :2], 128, 128)
    assert mask is not None and mask.shape == image.shape[:2] and mask.sum() > 0
    for bad in (None, xyz[:468, :2], np.zeros((478, 2)), xyz[:, :2] + 1000):
        assert mask_from_face(bad, 128, 128) is None


def test_arena_presets_and_feature_runners_pass_the_same_measured_mask() -> None:
    from plumb_api.arena import feature_bench, presets
    xyz, image = drawn_head(2, width=128, height=128)
    with patch.object(restore, "enhance", wraps=restore.enhance) as wrapped:
        presets.apply_step(image, xyz[:, :2], {"engine": "enhance", "mode": "natural", "strength": 30})
        feature_bench._enhance("natural")(image, xyz[:, :2])
    assert wrapped.call_count == 2
    for call in wrapped.call_args_list:
        assert call.kwargs["face_mask"].sum() > 0


def test_bench_reports_mask_evidence_only_when_geometry_is_usable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
    import realface_lib
    bench = realface_lib.Bench.__new__(realface_lib.Bench)
    bench.m = {"restore": restore}
    xyz, image = drawn_head(2, width=128, height=128)
    for points, expected in [(xyz[:, :2], "supplied_face_mask"), (np.zeros((478, 2)), "unmeasured")]:
        rows: list[dict] = []
        bench._enhance(image, xyz, points, 40, lambda *args, **extra: rows.append(extra))
        assert len(rows) == len(realface_lib.ENHANCE_MODES)
        for row in rows:
            assert row["face_metering"] == expected
            assert ("face_tone" in row["safety"]) == (expected == "supplied_face_mask")


def vector_rows() -> list[dict]:
    rows = []
    for background in (0, 80, 255):
        image, mask = patch_scene(background)
        output = restore.tone(image, analyse.analyse(image), wb_weight=0, white_balance=False,
                              exposure_target=0.18, exposure_weight=0.9, face_mask=mask)
        report = FaceToneMeter(image, mask).measure(output).to_json()
        rows.append({"background": background,
                     "sha256": hashlib.sha256(output.tobytes()).hexdigest(), "face_tone": report})
    return rows


def test_python_and_browser_face_tone_vectors_are_current() -> None:
    data = json.loads(GOLDEN.read_text())
    assert data["format"] == "beljour-enhance-face-tone/1"
    assert data["author"] == "John Khan"
    assert data["cases"] == vector_rows()
