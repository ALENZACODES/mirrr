"""R12 condition/rescue contracts on drawn pixels, never real portraits.

Pass definition before execution: five known degradations must route to their named
condition; normal inputs are byte-identical under every mode; low-light output gain
is <=1.65, mean change <=25 levels and clipping increase <=0.02; existing Q11 noise
and detail checks remain in test_repair_r7.py. Slice set: ten labelled synthetic Monk
swatches (labels describe fixture colours, not an inferred demographic), five image
conditions, five requested modes, zero/full strength, RGB/RGBA and odd image sizes.
Each parameterized case reports its own fixture and count through pytest.
Author: John Khan.
"""
from __future__ import annotations

import json
import math

import numpy as np
import pytest

from plumb_api.engines.core.composite import decode
from plumb_api.engines.repair import analyse, condition, restore, safety, synthetic

MONK = (
    (246, 237, 228), (243, 231, 219), (247, 234, 208), (234, 218, 186), (215, 189, 150),
    (160, 126, 86), (130, 92, 67), (96, 65, 52), (58, 49, 42), (41, 36, 32),
)


def faded(image: np.ndarray) -> np.ndarray:
    """Raise black levels, reduce contrast and desaturate a drawn scene."""
    rgb = image.astype(np.float64)
    y = (rgb @ np.array([0.299, 0.587, 0.114]))[..., None]
    return np.clip(np.rint(125 + 0.4 * (y - 80) + 0.12 * (rgb - y)), 0, 255).astype(np.uint8)


def specimens(width: int = 96, height: int = 80) -> dict[str, np.ndarray]:
    clean = synthetic.scene(width, height)
    return {"normal": clean, "low_light": synthetic.low_light(clean, 0.4),
            "blurry": synthetic.blur(clean, 2), "noisy": synthetic.add_noise(clean, 16, 3),
            "old": faded(clean)}


def portrait_swatch(tone: int, width: int = 96, height: int = 80) -> np.ndarray:
    """Abstract oval on a lit backdrop, with geometric hair, eyes and identity marks."""
    img = np.full((height, width, 3), (170, 190, 210), dtype=np.uint8)
    yy, xx = np.mgrid[:height, :width]
    oval = ((xx - width * 0.5) / (width * 0.34)) ** 2 + ((yy - height * 0.52) / (height * 0.46)) ** 2 < 1
    img[oval] = MONK[tone - 1]
    img[oval & (yy < height * 0.25)] = (24, 20, 18)
    for cx in (width * 0.37, width * 0.63):
        eye = (xx - cx) ** 2 + (yy - height * 0.48) ** 2 < (height * 0.035) ** 2
        img[eye] = (14, 15, 16)
    marks = oval & (((xx * 13 + yy * 7) % 149) == 0) & (yy > height * 0.48)
    img[marks] = np.maximum(np.array(MONK[tone - 1]) - 15, 0)
    return img


@pytest.mark.parametrize("name", condition.CLASSES)
def test_five_classes_match_known_drawn_degradations(name):
    result = condition.classify_photo(specimens()[name])
    assert result.primary == name
    assert result.needs_rescue == (name != "normal")
    assert result.version == condition.VERSION
    assert result.reasons
    assert all(math.isfinite(float(v)) for v in result.evidence.to_json().values())


@pytest.mark.parametrize("mode", tuple(restore.MODES))
def test_normal_pixels_never_receive_a_low_light_or_other_unneeded_pass(mode):
    source = specimens()["normal"]
    result = restore.enhance(source, mode)
    assert np.array_equal(result.image, source)
    assert result.condition.primary == "normal"
    assert result.steps["normal_preserved"] is True
    assert result.steps["tone_applied"] is False
    assert result.steps["exposure_applied"] is False
    assert result.steps["effective_mode"] == "preserve"
    assert "denoise" not in result.steps and "deblur" not in result.steps


@pytest.mark.parametrize("tone", range(1, 11))
def test_monk_swatch_scene_not_mistaken_for_low_illumination(tone):
    source = portrait_swatch(tone)
    result = restore.enhance(source, "low_light")
    assert result.condition.primary == "normal", result.condition.to_json()
    assert result.condition.low_light is False
    assert result.condition.evidence.bright_tile_count > 0
    assert np.array_equal(result.image, source), "ordinary lighting must not lighten the subject"


@pytest.mark.parametrize("tone", range(1, 11))
def test_low_illumination_is_scene_wide_for_every_labelled_swatch(tone):
    source = synthetic.low_light(portrait_swatch(tone), 0.12)
    result = restore.enhance(source, "low_light")
    assert result.condition.low_light, result.condition.to_json()
    assert result.steps["exposure_applied"] is True
    assert 1 < result.steps["exposure_gain"] <= safety.MAX_EXPOSURE_GAIN
    measured = safety.measure_safety(source, result.image)
    assert measured.within_limits
    assert result.after.mean_luminance > result.before.mean_luminance


@pytest.mark.parametrize("name", condition.CLASSES)
def test_zero_strength_is_exact_for_every_condition(name):
    source = specimens()[name]
    result = restore.enhance(source, "low_light", strength=0)
    assert np.array_equal(result.image, source)
    assert result.steps["unchanged"] is True
    assert not result.steps["tone_applied"]


@pytest.mark.parametrize("name", condition.CLASSES)
def test_all_explicit_step_switches_off_preserve_every_condition(name):
    source = specimens()[name]
    result = restore.enhance(source, "portrait", steps=dict.fromkeys(restore.STEPS, False))
    assert np.array_equal(result.image, source)
    assert result.safety["plan"]["exposure"] is False
    assert result.safety["plan"]["denoise"] is False
    assert result.safety["plan"]["deblur"] is False
    assert result.safety["plan"]["fade"] is False


@pytest.mark.parametrize("name", ("blurry", "noisy", "old"))
def test_wrong_low_light_mode_only_rescues_the_observed_condition(name):
    source = specimens()[name]
    result = restore.enhance(source, "low_light")
    assert result.steps["exposure_applied"] is False
    assert result.steps["effective_mode"] == "natural"
    assert not np.array_equal(result.image, source)
    expected = {"blurry": "deblur", "noisy": "denoise", "old": "fade_contrast"}[name]
    assert expected in result.steps
    assert result.condition.primary == name


def test_old_is_explicitly_a_scan_proxy_not_age_estimation():
    result = condition.classify_photo(specimens()["old"])
    assert result.old is True
    assert "not photo dating or subject age" in result.old_note
    assert "not calibrated probability" in result.method
    payload = json.dumps(result.to_json(), allow_nan=False)
    assert "image" not in result.to_json()
    assert "faded" in payload


def test_faded_contrast_keeps_channel_differences_and_marks():
    source = specimens()["old"]
    result = restore.enhance(source)
    before = source.astype(int)
    after = result.image.astype(int)
    for channel in (1, 2):
        assert np.max(np.abs((before[..., 0] - before[..., channel]) - (after[..., 0] - after[..., channel]))) <= 1
    assert result.after.laplacian_variance >= result.before.laplacian_variance
    assert result.safety["metrics"]["mean_abs_change"] < 5


@pytest.mark.parametrize("level", (0, 18, 128, 220, 255))
def test_flat_images_do_not_invent_a_blur_or_old_scan(level):
    result = condition.classify_photo(np.full((16, 16, 3), level, dtype=np.uint8))
    assert result.blurry is False and result.old is False
    assert result.evidence.edge_energy_255 == 0
    assert result.primary == ("low_light" if level < 30 else "normal")


def test_small_bright_detail_does_not_hide_scene_wide_low_light():
    source = synthetic.low_light(synthetic.scene(96, 80), 0.18)
    source[3:5, 3:5] = 255
    result = restore.enhance(source, "low_light")
    assert result.condition.low_light
    assert result.steps["highlight_pixels_protected"] >= 4
    assert np.array_equal(result.image[3:5, 3:5], source[3:5, 3:5])


def test_bright_background_blocks_automatic_face_lightening():
    source = np.full((80, 96, 3), (20, 15, 12), dtype=np.uint8)
    source[:, :18] = (210, 215, 220)
    source[:, -18:] = (210, 215, 220)
    result = restore.enhance(source, "low_light")
    assert not result.condition.low_light
    assert not result.steps["exposure_applied"]
    assert np.array_equal(result.image, source)


@pytest.mark.parametrize("name", condition.CLASSES)
def test_rgba_alpha_is_preserved_and_transparent_bytes_are_not_dropped(name):
    rgb = specimens()[name]
    alpha = np.arange(rgb.shape[0] * rgb.shape[1], dtype=np.uint16).reshape(rgb.shape[:2]).astype(np.uint8)
    source = np.dstack((rgb, alpha))
    result = restore.enhance(source)
    assert result.image.shape == source.shape and result.image.dtype == np.uint8
    assert np.array_equal(result.image[..., 3], alpha)
    if name == "normal":
        assert np.array_equal(result.image, source)


@pytest.mark.parametrize("size", ((17, 19), (95, 81), (192, 160)))
def test_odd_sizes_have_complete_finite_tile_evidence(size):
    width, height = size
    source = synthetic.scene(width, height)
    evidence = condition.measure_condition(source)
    assert evidence.tile_count == condition.GRID ** 2
    assert 0 <= evidence.dark_tile_share <= 1
    assert evidence.p05_linear <= evidence.median_linear <= evidence.p95_linear


def test_classifier_and_rescue_never_mutate_input():
    source = specimens()["low_light"]
    pristine = source.copy()
    source.flags.writeable = False
    condition.classify_photo(source)
    result = restore.enhance(source)
    assert np.array_equal(source, pristine)
    result.image[0, 0] = 200
    assert np.array_equal(source, pristine)


@pytest.mark.parametrize("bad", (-0.1, 1.1, float("nan"), float("inf"), True))
def test_invalid_strength_is_rejected(bad):
    with pytest.raises(ValueError, match="strength"):
        restore.enhance(specimens()["normal"], strength=bad)


@pytest.mark.parametrize("steps", ({"glow": True}, {"exposure": 1}, {"denoise": None}))
def test_invalid_switches_do_not_silently_enable_a_stage(steps):
    with pytest.raises(ValueError):
        restore.enhance(specimens()["normal"], steps=steps)


@pytest.mark.parametrize("source", (np.zeros((3, 3, 3), np.uint8), np.zeros((8, 8)), np.zeros((8, 8, 2), np.uint8)))
def test_invalid_classifier_images_refuse_with_message(source):
    with pytest.raises(ValueError) as exc:
        condition.classify_photo(source)
    assert str(exc.value)


@pytest.mark.parametrize("factor", (0.01, 0.1, 0.4, 1.0))
def test_exposure_gain_cap_in_linear_light_is_measured(factor):
    source = synthetic.low_light(synthetic.scene(48, 40), factor)
    result = safety.bounded_exposure(source, target=1, weight=1)
    assert 1 <= result.applied_gain <= 1.65
    assert result.max_pixel_gain <= 1.65
    before, after = decode(source), decode(result.image)
    # Byte quantisation costs at most one output byte; measure the exact factor too.
    expected = np.minimum(before * 1.65, 1)
    assert np.max(after - expected) < 0.006
    assert safety.measure_safety(source, result.image).channel_clip_increase <= 0


def test_exposure_shoulder_keeps_saturated_colour_and_near_white():
    source = np.full((30, 30, 3), (32, 25, 20), np.uint8)
    source[:2, :] = (251, 246, 240)
    source[2:4, :] = (255, 30, 20)
    source[4:6, :] = (255, 255, 255)
    result = safety.bounded_exposure(source, target=1, weight=1)
    assert result.rolled_off_pixels >= 180
    assert np.array_equal(result.image[2:6], source[2:6])
    assert result.image[:2].max() <= 251
    assert safety.measure_safety(source, result.image).within_limits


def test_unsafe_candidate_is_reduced_against_actual_bytes():
    source = np.full((24, 24, 3), 100, dtype=np.uint8)
    candidate = np.full_like(source, 255)
    result = safety.guard_output(source, candidate)
    assert result.reduced and 0 < result.applied_mix < 1
    assert result.proposals_checked == safety.GUARD_STEPS + 1
    assert result.metrics.mean_abs_change <= 25
    assert result.metrics.channel_clip_increase <= 0.02
    assert np.array_equal(result.image, np.full_like(source, 125))


def test_clip_guard_catches_channel_clipping_hidden_by_luma():
    source = np.full((24, 24, 3), (245, 15, 15), np.uint8)
    proposed = source.copy()
    proposed[:12, :, 0] = 255
    metrics = safety.measure_safety(source, proposed)
    assert metrics.luma_clip_increase == 0
    assert metrics.channel_clip_increase == 0.5
    assert metrics.within_limits is False
    result = safety.guard_output(source, proposed)
    assert result.reduced and result.metrics.channel_clip_increase <= 0.02


def test_dark_clip_guard_catches_crushed_shadows():
    source = np.full((12, 12, 3), 10, np.uint8)
    proposed = np.zeros_like(source)
    result = safety.guard_output(source, proposed)
    assert result.reduced
    assert result.metrics.dark_clip_increase <= 0.02
    assert result.image.min() > 2


@pytest.mark.parametrize("name", condition.CLASSES)
def test_safety_reports_are_finite_private_and_reproducible(name):
    source = specimens()[name]
    one, two = restore.enhance(source), restore.enhance(source)
    assert np.array_equal(one.image, two.image)
    assert one.safety == two.safety
    json.dumps(one.safety, allow_nan=False)
    assert set(one.safety["limits"]) == {"mean_abs_change", "clip_increase", "exposure_gain"}
    assert "image" not in one.safety and "pixels" not in one.safety
    assert safety.measure_safety(source, one.image).within_limits


def test_mixed_dark_noise_retains_both_defects_and_no_incidental_sharpening():
    source = synthetic.add_noise(synthetic.low_light(synthetic.scene(96, 80), 0.2), 9, 11)
    result = restore.enhance(source, "low_light")
    assert result.condition.low_light and result.condition.noisy
    assert "denoise" in result.steps and result.steps["exposure_applied"]
    assert "sharpen" not in result.steps
    assert result.after.noise_sigma < result.before.noise_sigma


def test_low_light_strength_is_monotone_and_does_not_change_chromaticity():
    source = specimens()["low_light"]
    means = [restore.enhance(source, "low_light", strength=s).after.mean_luminance for s in (0, 0.25, 0.5, 0.75, 1)]
    assert means == sorted(means) and means[-1] > means[0]
    out = restore.enhance(source, "low_light")
    a, b = decode(source), decode(out.image)
    a_ratio = a / np.maximum(a.sum(axis=2, keepdims=True), 1e-8)
    b_ratio = b / np.maximum(b.sum(axis=2, keepdims=True), 1e-8)
    assert np.max(np.abs(a_ratio - b_ratio)) < 0.015


def test_low_level_tone_also_cannot_bypass_mean_and_clipping_limits():
    source = specimens()["low_light"]
    result = restore.tone(source, analyse.analyse(source), wb_weight=1, exposure_target=1, exposure_weight=1,
                          saturation=2)
    assert safety.measure_safety(source, result).within_limits


def test_no_rescue_stages_for_normal_even_if_all_switches_are_true():
    source = specimens()["normal"]
    result = restore.enhance(source, steps=dict.fromkeys(restore.STEPS, True), method="nlm")
    assert result.steps["unchanged"]
    assert np.array_equal(result.image, source)
