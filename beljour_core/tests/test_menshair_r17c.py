"""R17 Lane C: original haircut concept profiles and full synthetic parity.

No real portraits, pretrained model artifacts, provider keys or tests of identity.
Concept families are tonal mask-limited simulations, not haircut predictions.
The generated binary observations are frozen separately as data-only fixtures.
Author: John Khan.
"""
from __future__ import annotations

import base64
import hashlib
import json
import sys
from collections import Counter
from dataclasses import replace
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from plumb_api.engines.menshair.advanced import EXTENDED_FAMILIES, PATTERNS, PRESENTATIONS
from plumb_api.engines.menshair.render import (
    HairAnchors,
    HairRecipe,
    STYLES_PATH,
    available_presets,
    effect_field,
    fade_coverage,
    render_style,
    require_preset,
)

SAMPLE_SIZES = ((27, 33, 3), (45, 36, 4), (48, 52, 4))


def anchors(offset: float = 0.0) -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": [0.28 + offset, 0.34],
        "right_temple": [0.72 + offset, 0.34],
        "crown": [0.50 + offset, 0.11],
        "left_ear": [0.24 + offset, 0.59],
        "right_ear": [0.76 + offset, 0.59],
        "nape": [0.50 + offset, 0.83],
    })


def synthetic_scene(width: int, height: int, channels: int, sample: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Tiny geometric colour grid, not a drawn photograph or dataset face."""
    yy, xx = np.mgrid[0:height, 0:width]
    image = np.empty((height, width, channels), dtype=np.uint8)
    image[..., 0] = ((xx * (7 + sample) + yy * 3 + 19) % 255).astype(np.uint8)
    image[..., 1] = ((xx * 5 + yy * (9 + sample) + 37) % 255).astype(np.uint8)
    image[..., 2] = ((xx * 13 + yy * 11 + 53) % 255).astype(np.uint8)
    if channels == 4:
        image[..., 3] = np.where((xx * 2 + yy + sample) % 5 == 0, 64, 255).astype(np.uint8)
    x = (xx + 0.5 - width * 0.5) / (width * (0.33 - sample * 0.01))
    y = (yy + 0.5 - height * 0.35) / (height * 0.29)
    hair = np.where(x * x + y * y < 1, 255, 0).astype(np.uint8)
    hair[(xx + yy) % (sample + 5) == 0] = hair[(xx + yy) % (sample + 5) == 0] // 2
    scalp = np.zeros((height, width), dtype=np.uint8)
    scalp[height // 3:height * 2 // 3, width // 3:width * 2 // 3] = 120 + sample * 30
    return image, hair, scalp


def build_vectors() -> dict[str, Any]:
    out: list[dict[str, Any]] = []
    for sample, (width, height, channels) in enumerate(SAMPLE_SIZES):
        image, hair, scalp = synthetic_scene(width, height, channels, sample)
        landmarks = anchors(sample * 0.013)
        scenarios: list[dict[str, Any]] = []
        for preset in available_presets():
            processed, evidence = render_style(image, hair, landmarks, preset, scalp_mask=scalp)
            scenarios.append({
                "style_id": preset.id, "pixels": base64.b64encode(processed.tobytes()).decode("ascii"),
                "affected_pixels": evidence["affected_pixels"],
                "mask_support_pixels": evidence["mask_support_pixels"],
                "result_sha256": hashlib.sha256(processed.tobytes()).hexdigest(),
            })
        out.append({
            "width": width, "height": height, "channels": channels, "landmarks": landmarks.to_json(),
            "image": base64.b64encode(image.tobytes()).decode("ascii"),
            "hair_mask": base64.b64encode(hair.tobytes()).decode("ascii"),
            "scalp_mask": base64.b64encode(scalp.tobytes()).decode("ascii"),
            "scenarios": scenarios,
        })
    return {
        "format": "beljour-menshair-parity/2", "author": "John Khan",
        "catalogue_sha256": hashlib.sha256(STYLES_PATH.read_bytes()).hexdigest(),
        "maximum_channel_difference": 1, "fixture_kind": "deterministic geometric colour grid, not a face",
        "no_network_calls": True, "examples": out,
    }


def test_126_renderer_configs_are_unique_and_have_clear_provenance() -> None:
    presets = available_presets()
    assert len(presets) >= 346
    assert len({p.id for p in presets}) == len(presets)
    assert all(p.id.startswith("local-") for p in presets)
    assert len({p.name for p in presets}) == len(presets)
    assert len(EXTENDED_FAMILIES) == 29
    assert set(EXTENDED_FAMILIES) <= {p.family for p in presets}
    assert set(PATTERNS) == {"plain", "soft", "wave", "curl", "grain", "braid", "strand"}
    assert Counter(p.presentation for p in presets)["feminine"] >= 50
    assert Counter(p.presentation for p in presets)["masculine"] >= 25
    assert all(p.pattern in PATTERNS and p.presentation in PRESENTATIONS for p in presets)
    for preset in presets:
        assert require_preset(preset.id) == preset
        assert HairRecipe.parse(preset.to_json()) == preset
        assert preset.top_bias in range(101) and preset.side_bias in range(101)
        assert preset.strength in range(101)
        assert not any(label in preset.id.lower() for label in ("provider", "youcam", "brand"))
    assert len(json.loads(STYLES_PATH.read_text())["styles"]) == len(presets)


@pytest.mark.parametrize("field,bad", [
    ("top_bias", -1), ("top_bias", 101), ("top_bias", 35.1),
    ("side_bias", float("nan")), ("fringe", True), ("flow", -101), ("flow", 101),
    ("flow", False), ("length", "long"), ("definition", -0.1),
    ("pattern", "provider"), ("presentation", "inferred-gender"),
])
def test_each_extended_parameter_rejects_out_of_range_values(field: str, bad: object) -> None:
    record = require_preset("local-pixie-close").to_json()
    record[field] = bad
    with pytest.raises((ValueError, TypeError)):
        HairRecipe.parse(record)


@pytest.mark.parametrize("style_id", [
    "local-high-undercut-crop", "local-pixie-undercut", "local-bob-fringe", "local-braid-double",
    "local-coils-swept", "local-pomp-high", "local-afro-rounded", "local-locs-shoulder",
    "local-waves-defined", "local-ponytail-low", "local-shoulder-curly",
])
def test_new_families_render_mask_only_and_never_change_alpha(style_id: str) -> None:
    img, hair, scalp = synthetic_scene(71, 83, 4, 1)
    original = img.copy()
    untouched_hair = hair.copy()
    untouched_scalp = scalp.copy()
    result, evidence = render_style(img, hair, anchors(), require_preset(style_id), scalp_mask=scalp)
    assert evidence["source"] == "local" and evidence["provider_calls"] == 0
    assert evidence["simulation"] is True and "simulation" in evidence["label"].lower()
    assert evidence["total_pixels"] == img.shape[0] * img.shape[1]
    assert evidence["affected_pixels"] > 0
    assert np.array_equal(img, original) and np.array_equal(hair, untouched_hair)
    assert np.array_equal(scalp, untouched_scalp)
    assert np.array_equal(img[..., 3], result[..., 3])
    outside = (hair == 0) & (scalp == 0)
    assert np.array_equal(img[outside], result[outside])
    assert np.any(result[..., :3] != img[..., :3])


def test_full_catalogue_produces_distinct_original_outputs() -> None:
    img, hair, scalp = synthetic_scene(68, 72, 3, 2)
    outputs = {}
    for recipe in available_presets():
        result, meta = render_style(img, hair, anchors(), recipe, scalp_mask=scalp)
        outputs[recipe.id] = hashlib.sha256(result.tobytes()).hexdigest()
        assert meta["affected_pixels"] <= meta["mask_support_pixels"]
    assert len(set(outputs.values())) >= 110, "renderer configs must produce distinctive outputs"


def test_fade_height_geometry_still_monotone_with_r17_controls() -> None:
    example = require_preset("local-shadow-fade")
    low = replace(example, fade="low")
    mid = replace(example, fade="mid")
    high = replace(example, fade="high")
    for w, h in ((18, 19), (53, 71)):
        fields = [effect_field(w, h, anchors(), recipe) for recipe in (low, mid, high)]
        assert np.all(fields[0] <= fields[1] + 1e-13)
        assert np.all(fields[1] <= fields[2] + 1e-13)
        assert np.all(fade_coverage(w, h, anchors(), "low") <= fade_coverage(w, h, anchors(), "high"))


def test_zero_mask_and_strength_are_exactly_neutral_for_every_new_concept() -> None:
    img, hair, scalp = synthetic_scene(25, 29, 4, 2)
    zeros = np.zeros_like(hair)
    for recipe in available_presets()[18:]:
        assert np.array_equal(render_style(img, zeros, anchors(), recipe)[0], img)
        assert np.array_equal(render_style(img, hair, anchors(), replace(recipe, strength=0), scalp_mask=scalp)[0], img)


def test_authored_python_vectors_are_generated_at_test_time() -> None:
    vectors = build_vectors()
    assert len(vectors["examples"]) == 3
    assert sum(len(case["scenarios"]) for case in vectors["examples"]) == 3 * len(available_presets())
    assert vectors["maximum_channel_difference"] == 1
    assert vectors["fixture_kind"].endswith("not a face")
    assert vectors["catalogue_sha256"] == hashlib.sha256(STYLES_PATH.read_bytes()).hexdigest()



def test_small_mask_with_nonzero_scalp_alpha_changes_only_support() -> None:
    img, hair, _ = synthetic_scene(31, 39, 4, 1)
    scalp = np.zeros_like(hair)
    scalp[25:30, 8:18] = 37
    result, evidence = render_style(img, hair, anchors(), require_preset("local-pixie-fringe"), scalp_mask=scalp)
    assert evidence["mask_support_pixels"] == int(np.count_nonzero(np.maximum(hair, scalp)))
    assert np.array_equal(result[(hair == 0) & (scalp == 0)], img[(hair == 0) & (scalp == 0)])


def test_unsupported_array_shapes_and_nonfinite_masks_fail_closed() -> None:
    img, hair, _ = synthetic_scene(29, 34, 3, 0)
    recipe = require_preset("local-bob-waves")
    for bad in (hair.astype(np.int16), np.full_like(hair, 2.0, dtype=np.float32),
                np.full_like(hair, float("nan"), dtype=np.float64),
                np.full((34, 28), 1, dtype=np.uint8)):
        with pytest.raises(ValueError):
            render_style(img, bad, anchors(), recipe)
    with pytest.raises(ValueError):
        render_style(np.zeros((34, 29, 2), dtype=np.uint8), hair, anchors(), recipe)
    with pytest.raises(ValueError):
        render_style(img, hair, anchors(), recipe, scalp_rgb=(40, -1, 20))


if __name__ == "__main__":
    # Used exclusively by the Node test runner. No parity dump on disk or in ZIP.
    if sys.argv[1:] != ["--emit-vectors"]:
        raise SystemExit("Usage: test_menshair_r17c.py --emit-vectors")
    sys.stdout.write(json.dumps(build_vectors(), separators=(",", ":")))
