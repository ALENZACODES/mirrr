"""R16 Lane C: exact short-sides mask safety, fade geometry and provenance.

Only deterministic invented pixel arrays; no photos, datasets or model weights.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from plumb_api.engines.menshair import (
    HairAnchors, HairRecipe, available_presets, effect_field, fade_coverage,
    render_style, require_preset,
)
from plumb_api.styling.catalogue import catalogue, filtered, summary


def landmarks() -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": [0.28, 0.34], "right_temple": [0.72, 0.34], "crown": [0.5, 0.11],
        "left_ear": [0.24, 0.59], "right_ear": [0.76, 0.59], "nape": [0.5, 0.83],
    })


def drawn_pixels(*, width: int = 64, height: int = 64, channels: int = 4):
    """Synthetic upright oval, not a face dataset or human photo."""
    yy, xx = np.mgrid[0:height, 0:width]
    image = np.zeros((height, width, channels), dtype=np.uint8)
    image[..., 0] = (65 + (xx * 5 + yy * 3) % 111).astype(np.uint8)
    image[..., 1] = (23 + (xx * 3 + yy * 7) % 119).astype(np.uint8)
    image[..., 2] = (17 + (xx * 11 + yy * 2) % 91).astype(np.uint8)
    if channels == 4:
        image[..., 3] = np.where((xx + yy) % 3 == 0, 128, 255).astype(np.uint8)
    hair = (np.square((xx + .5 - width * .5) / (width * .26)) +
            np.square((yy + .5 - height * .33) / (height * .29)) <= 1.0).astype(np.uint8) * 255
    # Border pixels show the renderer does not accidentally touch the background or face.
    scalp = np.zeros((height, width), dtype=np.uint8)
    scalp[height // 3:height // 2, width // 3:2 * width // 3] = 100
    return image, hair, scalp


def test_all_18_original_presets_are_separate_and_catalogued_as_ideas():
    presets = available_presets()
    assert len(presets) >= 18 and len({p.id for p in presets}) == len(presets)
    rows = catalogue()
    assert len(rows) >= 311
    assert summary(rows)["live_verified"] == 0
    assert len(filtered(rows, group="short-sides")) >= 18
    for item in presets[:18]:
        assert require_preset(item.id) == item
        assert item.id.startswith("local-")
        entry = next((r for r in rows if r.id == f"idea-{item.id}"), None)
        assert entry is not None and entry.is_idea and entry.template_id is None
        assert not entry.can_render_demo and not entry.verified_for_live
        assert "simulation" in entry.tags
        assert "local" in entry.description.lower()
    assert {p.family for p in presets[:18]} == {"fade", "taper", "undercut", "crew", "side-part", "crop", "buzz"}


@pytest.mark.parametrize("size", [(16, 16), (64, 96), (101, 71)])
def test_geometric_fade_height_monotone_over_every_synthetic_pixel(size):
    width, height = size
    a = landmarks()
    lo = fade_coverage(width, height, a, "low")
    mid = fade_coverage(width, height, a, "mid")
    hi = fade_coverage(width, height, a, "high")
    assert lo.shape == (height, width)
    assert np.all((lo >= 0) & (lo <= 1))
    assert np.all(lo <= mid + 1e-13) and np.all(mid <= hi + 1e-13)
    assert lo.sum() < mid.sum() < hi.sum()
    fade = require_preset("local-low-fade")
    same_strength_mid = replace(require_preset("local-mid-fade"), strength=fade.strength)
    same_strength_high = replace(require_preset("local-high-fade"), strength=fade.strength)
    assert np.all(effect_field(width, height, a, fade) <= effect_field(width, height, a, same_strength_mid) + 1e-13)
    assert np.all(effect_field(width, height, a, same_strength_mid) <= effect_field(width, height, a, same_strength_high) + 1e-13)


@pytest.mark.parametrize("style_id", [
    "local-low-fade", "local-mid-fade", "local-high-fade", "local-low-taper",
    "local-undercut", "local-crew-high", "local-side-part-left", "local-crop-high", "local-buzz-1",
])
def test_mask_only_changes_alpha_preserved_and_no_provider_calls(style_id):
    img, hair, scalp = drawn_pixels()
    original = img.copy()
    mask_original = hair.copy()
    result, evidence = render_style(img, hair, landmarks(), require_preset(style_id), scalp_mask=scalp)
    assert evidence["version"] == "menshair-r16c/1"
    assert evidence["simulation"] and "simulation" in evidence["label"].lower()
    assert evidence["provider_calls"] == 0 and evidence["source"] == "local"
    assert result.dtype == np.uint8 and result.shape == img.shape
    assert np.array_equal(img, original) and np.array_equal(hair, mask_original)
    assert np.array_equal(result[..., 3], img[..., 3])
    outside = (hair == 0) & (scalp == 0)
    assert np.array_equal(result[outside], img[outside])
    assert np.count_nonzero(result[..., :3] != img[..., :3]) > 0
    assert 0 < evidence["affected_pixels"] <= evidence["mask_support_pixels"] < img.shape[0] * img.shape[1]


def test_zero_mask_neutral_strength_and_repeated_renders_are_identical():
    img, hair, _ = drawn_pixels(channels=3)
    clear = np.zeros_like(hair)
    preset = require_preset("local-buzz-4")
    assert np.array_equal(render_style(img, clear, landmarks(), preset)[0], img)
    assert np.array_equal(render_style(img, hair, landmarks(), replace(preset, strength=0))[0], img)
    first, report = render_style(img, hair, landmarks(), preset)
    second, report2 = render_style(img, hair, landmarks(), preset)
    assert np.array_equal(first, second) and report == report2


@pytest.mark.parametrize("invalid", [
    {"crown": [float("nan"), .10]}, {"left_temple": [.8, .34]},
    {"nape": [.50, .1]}, {"left_ear": [0.1, .1]},
])
def test_bad_landmark_geometry_fails_closed(invalid):
    points = landmarks().to_json()
    points.update(invalid)
    with pytest.raises(ValueError):
        HairAnchors.parse(points)


def test_untrusted_recipes_masks_dimensions_and_rgb_rejected():
    img, hair, _ = drawn_pixels()
    recipe = require_preset("local-buzz-1").to_json()
    for key, value in [("buzz_grade", -1), ("buzz_grade", 1.5), ("strength", -2),
                       ("part", "third-party style"), ("family", "unknown")]:
        broken = dict(recipe, **{key: value})
        with pytest.raises(ValueError):
            HairRecipe.parse(broken)
    with pytest.raises(ValueError):
        require_preset("provider-hair-007")
    with pytest.raises(ValueError):
        render_style(img.astype(np.float32), hair, landmarks(), require_preset("local-low-fade"))
    with pytest.raises(ValueError):
        render_style(img, hair[:-1], landmarks(), require_preset("local-low-fade"))
    with pytest.raises(ValueError):
        render_style(img, np.full(hair.shape, float("nan")), landmarks(), require_preset("local-low-fade"))
    with pytest.raises(ValueError):
        render_style(img, hair, landmarks(), require_preset("local-low-fade"), scalp_rgb=(300, 90, 70))
    with pytest.raises(ValueError):
        effect_field(8000, 4000, landmarks(), require_preset("local-low-fade"))


def test_tonal_recipes_are_distinct_and_do_not_pretend_hair_is_reconstructed():
    img, hair, _ = drawn_pixels()
    seen: set[bytes] = set()
    for recipe in available_presets():
        result, meta = render_style(img, hair, landmarks(), recipe)
        assert meta["note"].startswith("Tonal guide only")
        seen.add(result.tobytes())
    assert len(seen) >= 13
