"""Local W4-W18 correctness, invariants, validation and source ownership.

Masks and frames are algebraic synthetic arrays, never real portraits.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.women_styling import (
    FEATURE_SPECS, PreviewRequest, apply_preview, evaluate_frame,
)
from plumb_api.engines.women_styling.specs import ALL_REGIONS


def synthetic_frame(width: int = 37, height: int = 41, *, channels: int = 4) -> np.ndarray:
    yy, xx = np.mgrid[:height, :width]
    image = np.empty((height, width, channels), dtype=np.uint8)
    image[..., 0] = (xx * 9 + yy * 5 + 88) % 256
    image[..., 1] = (xx * 3 + yy * 11 + 61) % 256
    image[..., 2] = (xx * 7 + yy * 13 + 113) % 256
    if channels == 4:
        image[..., 3] = np.where((xx * 3 + yy) % 7 == 0, 91, 255)
    return image


def synthetic_masks(width: int = 37, height: int = 41) -> dict[str, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    nx = (xx + .5) / width
    ny = (yy + .5) / height
    ellipses = {
        "face": ((nx - .5) / .33)**2 + ((ny - .47) / .37)**2,
        "cheek_left": ((nx - .32) / .13)**2 + ((ny - .54) / .11)**2,
        "cheek_right": ((nx - .68) / .13)**2 + ((ny - .54) / .11)**2,
        "under_eye_left": ((nx - .34) / .10)**2 + ((ny - .43) / .06)**2,
        "under_eye_right": ((nx - .66) / .10)**2 + ((ny - .43) / .06)**2,
        "eyelid_left": ((nx - .34) / .10)**2 + ((ny - .35) / .04)**2,
        "eyelid_right": ((nx - .66) / .10)**2 + ((ny - .35) / .04)**2,
        "lips": ((nx - .5) / .12)**2 + ((ny - .69) / .055)**2,
        "jaw": ((nx - .5) / .24)**2 + ((ny - .73) / .11)**2,
        "neck": ((nx - .5) / .17)**2 + ((ny - .93) / .08)**2,
        "hair": ((nx - .50) / .40)**2 + ((ny - .30) / .31)**2,
        "roots": ((nx - .50) / .27)**2 + ((ny - .15) / .09)**2,
        "tips": ((nx - .50) / .36)**2 + ((ny - .54) / .11)**2,
        "crown": ((nx - .50) / .19)**2 + ((ny - .12) / .085)**2,
        "hair_left": ((nx - .19) / .14)**2 + ((ny - .42) / .25)**2,
        "hair_right": ((nx - .81) / .14)**2 + ((ny - .42) / .25)**2,
        "scalp": ((nx - .5) / .15)**2 + ((ny - .19) / .08)**2,
        "hairline": ((nx - .5) / .27)**2 + ((ny - .26) / .045)**2,
        "fringe": ((nx - .51) / .21)**2 + ((ny - .33) / .08)**2,
        "lash_left": ((nx - .35) / .12)**2 + ((ny - .35) / .068)**2,
        "lash_right": ((nx - .65) / .12)**2 + ((ny - .35) / .068)**2,
        "lid_left": ((nx - .35) / .14)**2 + ((ny - .37) / .095)**2,
        "lid_right": ((nx - .65) / .14)**2 + ((ny - .37) / .095)**2,
        "liner_left": ((nx - .35) / .13)**2 + ((ny - .34) / .062)**2,
        "liner_right": ((nx - .65) / .13)**2 + ((ny - .34) / .062)**2,
        "iris_left": ((nx - .35) / .09)**2 + ((ny - .41) / .07)**2,
        "iris_right": ((nx - .65) / .09)**2 + ((ny - .41) / .07)**2,
        "brow_left": ((nx - .35) / .14)**2 + ((ny - .28) / .07)**2,
        "brow_right": ((nx - .65) / .14)**2 + ((ny - .28) / .07)**2,
    }
    result: dict[str, np.ndarray] = {}
    for key, distance in ellipses.items():
        result[key] = np.where(distance < 0.7, 255,
                               np.where(distance < 1.0, 145, 0)).astype(np.uint8)
    assert set(result) == set(ALL_REGIONS)
    return result


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_each_feature_edit_has_region_alpha_and_source_invariants(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    image = synthetic_frame()
    masks = synthetic_masks()
    originals = {name: mask.copy() for name, mask in masks.items()}
    snapshot = image.copy()
    req = PreviewRequest(spec.id, spec.variants[0], strength=85)
    output = apply_preview(image, masks, req)
    rgb_changed = np.any(output.pixels[..., :3] != image[..., :3], axis=2)
    authorized = np.zeros(image.shape[:2], dtype=bool)
    for region in spec.regions:
        authorized |= masks[region] > 0
    assert np.count_nonzero(rgb_changed) > 0, f"{spec.id} must visibly modify approved mask"
    assert np.all(~rgb_changed | authorized), f"{spec.id} modified forbidden pixels"
    assert output.evidence.outside_mask_changed == 0
    assert output.evidence.changed_alpha_pixels == 0
    assert output.evidence.largest_channel_delta <= spec.max_channel_delta
    assert output.evidence.mask_support_pixels == int(np.count_nonzero(authorized))
    assert output.evidence.changed_pixels == int(np.count_nonzero(rgb_changed))
    assert output.evidence.provider_calls == 0
    assert output.evidence.simulated and "simulation" in output.evidence.disclosure.lower()
    assert not np.shares_memory(image, output.pixels)
    assert np.array_equal(image, snapshot)
    assert all(np.array_equal(masks[name], originals[name]) for name in masks)
    audit = evaluate_frame(spec.id, image, output.pixels, masks, output.evidence)
    assert audit.accepted, audit.failures
    assert audit.status == "SYNTHETIC_ONLY"


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_strength_zero_is_exact_identity_for_every_feature(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame()
    req = PreviewRequest(spec.id, spec.variants[0], strength=0)
    result = apply_preview(source, synthetic_masks(), req)
    assert np.array_equal(result.pixels, source)
    assert result.evidence.changed_pixels == 0
    assert result.evidence.mask_support_pixels > 0
    assert result.evidence.provider_calls == 0


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_all_variants_work_and_remain_bounded(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame(channels=3)
    for variant in spec.variants:
        req = PreviewRequest(spec.id, variant, strength=90)
        result = apply_preview(source, synthetic_masks(), req)
        delta = np.abs(result.pixels.astype(np.int16) - source.astype(np.int16))
        assert int(np.max(delta)) <= spec.max_channel_delta
        assert result.evidence.outside_mask_changed == 0
        assert result.evidence.provider_calls == 0


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_no_mask_means_fail_closed_not_whole_image_fallback(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame()
    req = PreviewRequest(spec.id, spec.variants[0], strength=75)
    with pytest.raises(ValueError, match="nonempty approved mask"):
        apply_preview(source, {}, req)
    with pytest.raises(ValueError, match="nonempty approved mask"):
        apply_preview(source, {"face": np.zeros(source.shape[:2], dtype=np.uint8)}, req)


@pytest.mark.parametrize("spec", FEATURE_SPECS, ids=lambda s: s.id)
def test_one_authorized_region_is_enough_and_unrelated_masks_do_not_leak(spec: object) -> None:
    from plumb_api.engines.women_styling.specs import FeatureSpec
    assert isinstance(spec, FeatureSpec)
    source = synthetic_frame(channels=3)
    masks = synthetic_masks()
    only = spec.regions[0]
    available = {only: masks[only]}
    if only != "face":
        available["face"] = masks["face"]
    output = apply_preview(source, available, PreviewRequest(spec.id, spec.variants[0], strength=90))
    assert output.evidence.outside_mask_changed == 0
    assert np.any(output.pixels[..., :3] != source[..., :3])
    authorized = masks[only] > 0
    assert np.array_equal(output.pixels[~authorized], source[~authorized])


def test_invalid_boundary_inputs_reject_without_mutating_source() -> None:
    frame = synthetic_frame()
    masks = synthetic_masks()
    original = frame.copy()
    correct = PreviewRequest("W4", "cool")
    for bad in (
        replace(correct, feature_id="W3"),
        replace(correct, feature_id="W14"),
        replace(correct, feature_id="W999"),
        replace(correct, variant="guessed"),
        replace(correct, strength=-1),
        replace(correct, strength=101),
        replace(correct, strength=True),
        replace(correct, mix_percent=101),
        replace(correct, hours=13),
        replace(correct, undertone="diagnosed"),
        replace(correct, depth="unknown"),
        replace(correct, reference_rgb=(999, 100, 100)),
        replace(correct, primary_rgb=(-1, 10, 10)),
    ):
        with pytest.raises(ValueError):
            apply_preview(frame, masks, bad)
        assert np.array_equal(frame, original)
    with pytest.raises(ValueError, match="Unknown region mask"):
        apply_preview(frame, {"entire_body": np.ones(frame.shape[:2], dtype=np.uint8)}, correct)
    with pytest.raises(ValueError, match="exact image size"):
        apply_preview(frame, {"cheek_left": np.ones((3, 3), dtype=np.uint8)}, correct)
    with pytest.raises(ValueError, match="exact image size"):
        apply_preview(frame, {"cheek_left": np.ones(frame.shape[:2], dtype=np.float64)}, correct)
    with pytest.raises(ValueError, match="H x W"):
        apply_preview(frame[..., :1], masks, correct)
    with pytest.raises(ValueError, match="uint8"):
        apply_preview(frame.astype(np.float32), masks, correct)


def test_partially_transparent_masks_scale_effect_and_zero_stays_exact() -> None:
    frame = synthetic_frame(width=25, height=24)
    masks = synthetic_masks(width=25, height=24)
    name = "cheek_left"
    full = {name: np.where(masks[name] > 0, 255, 0).astype(np.uint8)}
    partial = {name: np.where(masks[name] > 0, 67, 0).astype(np.uint8)}
    req = PreviewRequest("W11", "lifted", 89)
    a = apply_preview(frame, full, req)
    b = apply_preview(frame, partial, req)
    support = partial[name] > 0
    difference_a = np.abs(a.pixels[..., :3].astype(np.int16) - frame[..., :3].astype(np.int16))
    difference_b = np.abs(b.pixels[..., :3].astype(np.int16) - frame[..., :3].astype(np.int16))
    assert difference_b.sum() < difference_a.sum()
    assert np.array_equal(b.pixels[~support], frame[~support])
    assert np.array_equal(a.pixels[..., 3], frame[..., 3])
    assert np.array_equal(b.pixels[..., 3], frame[..., 3])


def test_named_feature_controls_are_not_cosmetic_aliases() -> None:
    source = synthetic_frame()
    masks = synthetic_masks()
    pairs = [
        ("W5", "complement", "analogous"), ("W7", "brighten", "warm"),
        ("W8", "peach", "green"), ("W9", "cream", "powder"),
        ("W10", "dewy", "matte"), ("W11", "lifted", "rounded"),
        ("W12", "bronze", "contour"), ("W13", "reference", "muted"),
        ("W15", "day", "evening"), ("W16", "minimal", "balanced"),
        ("W17", "warm_shift", "neutral_shift"), ("W18", "spring", "winter"),
    ]
    for feature, left, right in pairs:
        a = apply_preview(source, masks, PreviewRequest(feature, left, 90)).pixels
        b = apply_preview(source, masks, PreviewRequest(feature, right, 90)).pixels
        assert np.any(a != b), f"{feature} controls must be behaviourally distinct"
    a = apply_preview(source, masks, PreviewRequest("W4", "warm", 90)).pixels
    b = apply_preview(source, masks, PreviewRequest("W4", "cool", 90)).pixels
    assert np.any(a != b)


def test_colour_shift_timeline_is_monotone_under_fixed_mask() -> None:
    source = synthetic_frame(channels=3)
    masks = {"face": synthetic_masks()["face"]}
    baseline = apply_preview(source, masks, PreviewRequest("W17", "warm_shift", 100, hours=0))
    middle = apply_preview(source, masks, PreviewRequest("W17", "warm_shift", 100, hours=6))
    later = apply_preview(source, masks, PreviewRequest("W17", "warm_shift", 100, hours=12))
    for result in (baseline, middle, later):
        assert result.evidence.provider_calls == 0
        assert result.evidence.outside_mask_changed == 0
    assert np.array_equal(baseline.pixels, source)
    d6 = np.abs(middle.pixels[..., :3].astype(np.int16) - source)
    d12 = np.abs(later.pixels[..., :3].astype(np.int16) - source)
    assert np.all(d12 >= d6)
    assert d12.sum() > d6.sum() > 0


def test_128_step_strength_range_has_no_nonfinite_values_or_alpha_leak() -> None:
    source = synthetic_frame(width=18, height=21)
    masks = synthetic_masks(width=18, height=21)
    for strength in range(0, 101):
        result = apply_preview(source, masks, PreviewRequest("W10", "matte", strength))
        assert np.array_equal(result.pixels[..., 3], source[..., 3])
        assert result.pixels.dtype == np.uint8
        assert result.evidence.largest_channel_delta <= 30
        assert result.evidence.outside_mask_changed == 0
