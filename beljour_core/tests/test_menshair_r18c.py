"""R18 Lane C graded short-sides and cosmetic fibres, deterministic parity vectors.

Synthetic integer colour grids are generated inside the test, never in the
repository. No portraits, training data, provider calls or external assets.
Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import math
import sys
from dataclasses import replace
from typing import Any

import numpy as np
import pytest

from plumb_api.engines.menshair.concealer_link import (
    FibreOptions,
    colour_delta_e76,
    density_from_concealer,
    region_field,
    render_fibres,
)
from plumb_api.engines.menshair.graded import FADE_SHAPES, fade_grade_map, grade_diagnostics, graded_field
from plumb_api.engines.menshair.render import HairAnchors, available_presets, render_style, require_preset


def anchors() -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": [0.28, 0.34], "right_temple": [0.72, 0.34],
        "crown": [0.5, 0.11], "left_ear": [0.24, 0.59],
        "right_ear": [0.76, 0.59], "nape": [0.5, 0.83],
    })


def scene(width: int = 41, height: int = 51, channels: int = 4) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    image = np.empty((height, width, channels), dtype=np.uint8)
    image[..., 0] = ((xx * 7 + yy * 5 + 24) % 255).astype(np.uint8)
    image[..., 1] = ((xx * 3 + yy * 11 + 35) % 255).astype(np.uint8)
    image[..., 2] = ((xx * 13 + yy * 7 + 53) % 255).astype(np.uint8)
    if channels == 4:
        image[..., 3] = np.where((xx + yy) % 4 == 0, 128, 255).astype(np.uint8)
    hair = np.where(((xx - width / 2) / (width * 0.3)) ** 2 +
                    ((yy - height * .26) / (height * .17)) ** 2 < 1, 255, 0).astype(np.uint8)
    scalp = np.where(((xx - width / 2) / (width * .3)) ** 2 +
                     ((yy - height * .3) / (height * .28)) ** 2 < 1, 220, 0).astype(np.uint8)
    density = np.full((height, width), .24, dtype=np.float64)
    density[(xx + yy) % 5 == 0] = .38
    return image, hair, scalp, density


@pytest.mark.parametrize("shape", sorted(FADE_SHAPES))
@pytest.mark.parametrize("fade", ["low", "mid", "high"])
def test_fade_grade_monotone_with_landmarks_for_every_shape(shape: str, fade: str) -> None:
    a = anchors()
    level = 0 if shape == "skin" else 1
    frame = graded_field(51, 71, a, fade=fade, shape=shape, side_grade=level,
                         top_grade=4, blend_width=43)
    assert np.all(np.isfinite(frame.grade))
    assert np.all((frame.grade >= level) & (frame.grade <= 4))
    assert np.all(np.diff(frame.grade, axis=0) <= 1e-12)
    assert grade_diagnostics(frame)["bottom_is_shorter"] is True
    assert np.array_equal(frame.grade, fade_grade_map(51, 71, a, fade=fade,
                                                       shape=shape, side_grade=level, blend_width=43))
    assert frame.blend.shape == (71, 51)
    assert np.all((frame.blend >= 0) & (frame.blend <= 1))
    assert np.all((frame.transition >= 0) & (frame.transition <= 1))


@pytest.mark.parametrize("name", ["local-low-fade", "local-buzz-zero-low", "local-skin-low-french-crop", "local-burst-mid-twists"])
def test_mask_bounds_and_alpha_unchanged_for_new_styles(name: str) -> None:
    image, hair, scalp, _ = scene()
    original = image.copy()
    recipe = require_preset(name)
    after, evidence = render_style(image, hair, anchors(), recipe, scalp_mask=scalp)
    assert evidence["source"] == "local" and evidence["simulation"] is True
    assert evidence["provider_calls"] == 0
    assert np.array_equal(original, image)
    assert np.array_equal(after[(hair == 0) & (scalp == 0)], original[(hair == 0) & (scalp == 0)])
    assert np.array_equal(after[..., 3], original[..., 3])
    assert evidence["affected_pixels"] <= evidence["mask_support_pixels"]


def test_246_distinct_masculine_styles_and_legacy_remain() -> None:
    source = available_presets()
    masculine = [item for item in source if item.presentation == "masculine"]
    assert len(source) >= 346
    assert len(masculine) >= 150
    assert len({item.id for item in source}) == len(source)
    assert len({item.name for item in masculine}) == len(masculine)
    for expected in ("skin", "drop", "burst", "twists", "locs", "quiff", "caesar"):
        assert any(expected in item.id for item in masculine), expected
    assert any(item.family == "curly-fade" for item in masculine)
    assert len([item for item in masculine if item.family == "buzz" and item.buzz_grade == 0]) > 0


def test_fibres_decrease_scalp_show_without_leaking_outside_mask() -> None:
    image, hair, scalp, density = scene()
    source = image.copy()
    opts = FibreOptions(region="both", strength=90, density_gain=90, hair_rgb=(69, 48, 38), seed=19)
    comparison = render_fibres(image, hair, scalp, density, anchors(), opts)
    assert comparison.metrics.provider_calls == 0 and comparison.metrics.simulated
    assert comparison.metrics.eligible_pixels > 0
    assert comparison.metrics.altered_pixels > 0
    assert comparison.metrics.scalp_show_after < comparison.metrics.scalp_show_before
    assert comparison.metrics.colour_delta_e76 <= 3
    assert np.array_equal(comparison.after[(scalp == 0) | (hair == 255)], image[(scalp == 0) | (hair == 255)])
    assert np.array_equal(comparison.after[..., 3], image[..., 3])
    assert np.array_equal(image, source)
    assert np.array_equal(comparison.before, source)
    assert np.array_equal(comparison.density_before, density)
    assert "simulation" in comparison.label


@pytest.mark.parametrize("region", ["crown", "hairline", "both"])
def test_fibres_zero_strength_and_unsupported_masks_are_fail_closed(region: str) -> None:
    image, hair, scalp, density = scene()
    comparison = render_fibres(image, hair, scalp, density, anchors(), FibreOptions(region=region, strength=0))
    assert np.array_equal(comparison.after, image)
    assert comparison.metrics.coverage_gain == 0
    assert np.all(region_field(41, 51, anchors(), region) >= 0)
    for bad in (np.full_like(density, math.nan), np.ones((51, 41), dtype=np.int16),
                np.ones((51, 42), dtype=np.float32), np.full_like(density, 1.1)):
        with pytest.raises(ValueError):
            render_fibres(image, hair, scalp, bad, anchors(), FibreOptions())


def test_clipper_grade_and_fibre_option_boundaries() -> None:
    a = anchors()
    for kwargs in ({"side_grade": 3, "top_grade": 2}, {"side_grade": True}, {"blend_width": 0},
                   {"fade": "sky"}, {"shape": "skin", "side_grade": 1}, {"top_grade": 5}):
        with pytest.raises(ValueError):
            graded_field(30, 40, a, **{"fade": "low", **kwargs})  # type: ignore[arg-type,call-arg]
    for opts in (replace(FibreOptions(), seed=-1), replace(FibreOptions(), strength=101),
                 replace(FibreOptions(), hair_rgb=(999, 4, 4))):
        with pytest.raises(ValueError):
            opts.validate()
    assert colour_delta_e76((40, 70, 120), (40, 70, 120)) == 0.0


def test_concealer_integration_requires_an_audited_density_contract(monkeypatch: pytest.MonkeyPatch) -> None:
    image, hair, scalp, density = scene()
    with pytest.raises(ValueError):
        density_from_concealer(hair, scalp, module_name="random.third.party")
    import sys as system
    from types import ModuleType
    dummy = ModuleType("plumb_api.engines.concealer")
    monkeypatch.setitem(system.modules, "plumb_api.engines.concealer", dummy)
    with pytest.raises(RuntimeError, match="density_map"):
        density_from_concealer(hair, scalp)
    dummy.density_map = lambda h, s: density.copy()  # type: ignore[attr-defined]
    out = density_from_concealer(hair, scalp)
    assert np.array_equal(out, density)
    after = render_fibres(image, hair, scalp, out, anchors(), FibreOptions())
    assert after.metrics.provider_calls == 0


def _encode(values: np.ndarray) -> str:
    return base64.b64encode(values.tobytes()).decode("ascii")


def build_mirror_vectors() -> dict[str, Any]:
    image, hair, scalp, density = scene(41, 51, 4)
    landmarks = anchors()
    fields: list[dict[str, Any]] = []
    for shape in sorted(FADE_SHAPES):
        for fade in ("low", "mid", "high"):
            level = 0 if shape == "skin" else 1
            result = graded_field(41, 51, landmarks, fade=fade, shape=shape,
                                  side_grade=level, top_grade=4, blend_width=43)
            fields.append({"fade": fade, "fade_shape": shape, "side_grade": level,
                           "top_grade": 4, "blend_width": 43, "grade": result.grade.ravel().tolist(),
                           "blend": result.blend.ravel().tolist()})
    fibre_cases: list[dict[str, Any]] = []
    for region in ("crown", "hairline", "both"):
        opts = FibreOptions(region=region, strength=84, density_gain=77, hair_rgb=(69, 48, 38), seed=23)
        out = render_fibres(image, hair, scalp, density, landmarks, opts)
        fibre_cases.append({"region": region, "options": {"region": region, "strength": 84,
            "density_gain": 77, "hair_rgb": [69, 48, 38], "seed": 23},
            "after": _encode(out.after), "metrics": out.metrics.to_json()})
    return {"width": 41, "height": 51, "anchors": landmarks.to_json(), "image": _encode(image),
            "hair": _encode(hair), "scalp": _encode(scalp), "density": density.ravel().tolist(),
            "graded": fields, "fibres": fibre_cases, "maximum_channel_difference": 1,
            "fixture": "synthetic geometric gradients generated at runtime", "provider_calls": 0}


def test_all_r18_vectors_are_deterministic_and_generated_in_tests() -> None:
    a = build_mirror_vectors()
    b = build_mirror_vectors()
    assert a == b
    assert len(a["graded"]) == 18 and len(a["fibres"]) == 3
    assert a["maximum_channel_difference"] == 1


if __name__ == "__main__":
    if sys.argv[1:] != ["--emit-vectors"]:
        raise SystemExit("Use --emit-vectors to generate transient R18 vectors")
    sys.stdout.write(json.dumps(build_mirror_vectors(), separators=(",", ":")))
