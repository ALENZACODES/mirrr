"""Hair tint + cosmetic topical fibres parity, mask invariants, malformed inputs.

Every colour here is a fictional user-selected display swatch; no photos or
clinical outcomes, no external hair classification. Author: John Khan.
"""
from __future__ import annotations

import base64
import json
import sys
from typing import Any

import numpy as np
import pytest

from plumb_api.engines.menshair.palette import (
    SWATCHES, ColourOptions, colour_region, rank_swatches, render_colour,
    render_palette_fibres, sample_reference, swatch,
)
from plumb_api.engines.menshair.render import HairAnchors


def anchors() -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": [0.27, .35], "right_temple": [.73, .35], "crown": [.51, .10],
        "left_ear": [.24, .60], "right_ear": [.76, .60], "nape": [.51, .86],
    })


def fixture(w: int = 43, h: int = 49) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:h, :w]
    image = np.empty((h, w, 4), dtype=np.uint8)
    image[..., 0] = (45 + xx * 3 + yy * 7) % 256
    image[..., 1] = (68 + xx * 7 + yy * 5) % 256
    image[..., 2] = (80 + xx * 11 + yy * 2) % 256
    image[..., 3] = np.where((xx + yy) % 5 == 0, 127, 255)
    disk = ((xx + .5 - w * .5) / (w * .36)) ** 2 + ((yy + .5 - h * .29) / (h * .28)) ** 2
    hair = np.where(disk < .85, 255, 0).astype(np.uint8)
    scalp = np.where((disk < 1.10) & (disk > .32), 150, 0).astype(np.uint8)
    density = np.where((xx + yy) % 3 == 0, .32, .18).astype(np.float64)
    return image, hair, scalp, density


def test_palette_has_original_ids_not_supplier_names() -> None:
    assert len(SWATCHES) >= 20
    assert len({p.id for p in SWATCHES}) == len(SWATCHES)
    assert {p.family for p in SWATCHES} == {"natural", "grey", "creative"}
    for item in SWATCHES:
        item.validate()
        assert swatch(item.id) is item
        assert "fictional" in item.note.lower()
    for family in ("natural", "grey", "creative"):
        ranked = rank_swatches((71, 67, 62), family=family)
        assert ranked and all(item.family == family for item, _ in ranked)
        assert all(a[1] <= b[1] for a, b in zip(ranked, ranked[1:]))
    with pytest.raises(ValueError):
        swatch("real-brand-brown")


@pytest.mark.parametrize("colour", SWATCHES, ids=lambda s: s.id)
@pytest.mark.parametrize("region", ["all", "crown", "roots", "sides"])
def test_per_swatch_per_region_preserves_alpha_outside_and_input(colour: Any, region: str) -> None:
    image, hair, _, _ = fixture()
    source = image.copy()
    options = ColourOptions(colour.id, 82, 45, region, 38, 101)
    result = render_colour(image, hair, anchors(), options)
    assert result.metrics.provider_calls == 0 and result.metrics.simulated
    assert result.metrics.candidate_swatch == colour.id
    assert result.metrics.sample_count > 8
    assert result.metrics.edited_pixels <= result.metrics.mask_support_pixels
    assert np.array_equal(image, source)
    assert np.array_equal(result.after[hair == 0], image[hair == 0])
    assert np.array_equal(result.after[..., 3], image[..., 3])
    assert "simulation" in result.notice.lower()
    assert np.all(np.isfinite(colour_region(image.shape[1], image.shape[0], anchors(), region, 38)))


@pytest.mark.parametrize("strength", [0, 1, 25, 50, 100])
def test_tint_strength_is_bounded_and_zero_is_byte_identical(strength: int) -> None:
    image, hair, _, _ = fixture()
    options = ColourOptions("local-chestnut", strength, 62, "all", 45, 61)
    after = render_colour(image, hair, anchors(), options)
    if strength == 0:
        assert np.array_equal(after.after, image)
        assert after.metrics.edited_pixels == 0
    if strength == 100:
        assert after.metrics.edited_pixels > 0
    assert np.array_equal(after.after[..., 3], image[..., 3])


def test_rank_is_deterministic_and_matches_own_colour() -> None:
    for chosen in SWATCHES:
        ranked = rank_swatches(chosen.rgb, limit=len(SWATCHES))
        assert ranked[0][0] == chosen
        assert ranked[0][1] == pytest.approx(0)
        assert [p.id for p, _ in ranked] == [p.id for p, _ in rank_swatches(chosen.rgb, limit=len(SWATCHES))]
    for invalid in ((999, 23, 12), (2, -1, 1), (True, 0, 0), (1.3, 3, 4)):
        with pytest.raises(ValueError):
            rank_swatches(invalid)  # type: ignore[arg-type]


def test_reference_sampling_is_bounded_and_handles_unapproved_masks() -> None:
    img, hair, _, _ = fixture()
    colour, count = sample_reference(img, hair, (71, 58, 49))
    assert all(0 <= n <= 255 for n in colour)
    assert 8 <= count <= 2048
    assert sample_reference(img, np.zeros_like(hair), (71, 58, 49)) == ((71, 58, 49), 0)
    with pytest.raises(ValueError):
        sample_reference(img, np.full(hair.shape, np.nan), (71, 58, 49))
    with pytest.raises(ValueError):
        sample_reference(img, np.ones((4, 4)), (71, 58, 49))


@pytest.mark.parametrize("invalid", [
    {"strength": True}, {"strength": 101}, {"preserve_highlights": -1},
    {"region": "whole-person"}, {"feather": 1.5}, {"seed": float("inf")},
    {"swatch_id": "vendor-mauve"},
])
def test_palette_invalid_input_is_rejected_before_edit(invalid: dict[str, object]) -> None:
    image, hair, _, _ = fixture()
    options = {"swatch_id": "local-cocoa", **invalid}
    with pytest.raises(ValueError):
        render_colour(image, hair, anchors(), ColourOptions(**options))  # type: ignore[arg-type]


@pytest.mark.parametrize("name", [p.id for p in SWATCHES])
def test_fibre_colour_uses_same_palette_and_reduces_synthetic_scalp_ratio(name: str) -> None:
    image, hair, scalp, density = fixture()
    comparison = render_palette_fibres(image, hair, scalp, density, anchors(), swatch_id=name,
                                       region="both", strength=93, density_gain=88)
    assert comparison.metrics.provider_calls == 0
    assert comparison.metrics.simulated
    assert comparison.metrics.colour_delta_e76 <= 3
    assert comparison.metrics.scalp_show_after < comparison.metrics.scalp_show_before
    assert np.array_equal(comparison.after[(scalp == 0) | (hair == 255)], image[(scalp == 0) | (hair == 255)])
    assert np.array_equal(comparison.after[..., 3], image[..., 3])


def build_vectors() -> dict[str, Any]:
    img, hair, scalp, density = fixture(37, 44)
    entries: list[dict[str, Any]] = []
    for sample in SWATCHES:
        for region in ("all", "crown", "roots", "sides"):
            options = ColourOptions(sample.id, 82, 45, region, 38, 101)
            result = render_colour(img, hair, anchors(), options)
            entries.append({"swatch": sample.id, "region": region,
                            "pixels": base64.b64encode(result.after.tobytes()).decode(),
                            "reference": result.metrics.sampled_reference,
                            "sample_count": result.metrics.sample_count,
                            "edited": result.metrics.edited_pixels,
                            "support": result.metrics.mask_support_pixels,
                            "delta_e76": result.metrics.undertone_delta_e76})
    fibre: list[dict[str, Any]] = []
    for sample in SWATCHES:
        result = render_palette_fibres(img, hair, scalp, density, anchors(), swatch_id=sample.id,
                                       strength=93, density_gain=88)
        fibre.append({"swatch": sample.id, "pixels": base64.b64encode(result.after.tobytes()).decode(),
                      "show_before": result.metrics.scalp_show_before,
                      "show_after": result.metrics.scalp_show_after})
    return {"format": "beljour-hair-colour-r19c/1", "width": 37, "height": 44,
            "image": base64.b64encode(img.tobytes()).decode(),
            "hair": base64.b64encode(hair.tobytes()).decode(),
            "scalp": base64.b64encode(scalp.tobytes()).decode(),
            "density": density.reshape(-1).tolist(), "anchors": anchors().to_json(),
            "swatches": [{"id": s.id, "rgb": s.rgb, "family": s.family, "name": s.name} for s in SWATCHES],
            "renders": entries, "fibres": fibre, "provider_calls": 0,
            "synthetic_only": True}


if __name__ == "__main__" and "--emit-vectors" in sys.argv:
    print(json.dumps(build_vectors(), separators=(",", ":")))
