"""Boundary refusals for the five-strength board: mesh, scalp, masks, box and guards.

Invented arrays only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commerce.hair_comparison import BoardRefusal, compare_levels
from plumb_api.engines.concealer.cover import CoverDecision
from tests.test_r29f_hair_comparison import HEAD, scene


class LeakyGuard:
    """A test double that edits the background and transparency; it must be contained."""

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        changed = after.copy()
        changed[0, 0, :3] = 0
        if changed.shape[2] == 4:
            changed[..., 3] = 9
        return CoverDecision(changed, 1.0, False)


def codes(result: object) -> list[str | None]:
    return [tile.evidence.refusal_code for tile in result.tiles]  # type: ignore[attr-defined]


def test_fibre_without_scalp_marks_is_refused_at_every_stop() -> None:
    image, mask, _ = scene()
    assert codes(compare_levels(image, mask, HEAD, "fibre")) == ["no_scalp"] * 5


def test_empty_scalp_inside_zone_is_refused() -> None:
    image, mask, _ = scene()
    empty = np.zeros_like(mask)
    assert set(codes(compare_levels(image, mask, HEAD, "fibre", scalp_mask=empty))) == {"no_scalp"}


@pytest.mark.parametrize("kind,extra", [("palette", {"shade_id": "natural-03-n"}),
                                         ("short-sides", {"style_id": "local-low-fade"})])
def test_invalid_mask_values_are_refused(kind: str, extra: dict[str, object]) -> None:
    image, mask, _ = scene()
    bad = mask.astype(np.float64) / 255 * 2
    result = compare_levels(image, bad, HEAD, kind, **extra)  # type: ignore[arg-type]
    assert set(codes(result)) == {"invalid_mask"}


def test_primary_box_clips_the_editable_region() -> None:
    image, mask, _ = scene()
    result = compare_levels(image, mask, HEAD, "palette", shade_id="natural-03-n",
                            allow_lightening=True, primary_box=(22, 12, 48, 62))
    for tile in result.tiles:
        assert np.array_equal(tile.image[:, 48:], image[:, 48:])
    assert result.tiles[-1].evidence.region_pixels == 26 * 50


def test_invalid_primary_box_is_refused() -> None:
    image, mask, _ = scene()
    result = compare_levels(image, mask, HEAD, "short-sides", style_id="local-low-fade",
                            primary_box=(50, 10, 20, 40))
    assert set(codes(result)) == {"invalid_primary_face"}


def test_engine_spatial_boundary_contains_a_leaky_guard() -> None:
    image, mask, _ = scene()
    result = compare_levels(image, mask, HEAD, "palette", shade_id="natural-03-n",
                            allow_lightening=True, guard=LeakyGuard())
    for tile in result.tiles:
        assert np.array_equal(tile.image[0, 0], image[0, 0])
        assert np.array_equal(tile.image[..., 3], image[..., 3])


def test_rgb_photos_are_supported() -> None:
    image, mask, _ = scene()
    result = compare_levels(image[..., :3].copy(), mask, HEAD, "palette", shade_id="natural-03-n",
                            allow_lightening=True)
    assert result.totals.rendered == 4


@pytest.mark.parametrize("image", [np.zeros((20, 20), np.uint8), np.zeros((20, 20, 3), np.float32),
                                   np.zeros((20, 20, 2), np.uint8)])
def test_unusable_photos_refuse_the_whole_board(image: np.ndarray) -> None:
    with pytest.raises(BoardRefusal) as caught:
        compare_levels(image, np.zeros((20, 20), np.uint8), HEAD, "palette", shade_id="natural-03-n")
    assert caught.value.code == "invalid_image"


def test_board_inputs_are_validated() -> None:
    image, mask, show = scene()
    with pytest.raises(ValueError):
        compare_levels(image, mask, HEAD, "lipstick")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        compare_levels(image, mask, HEAD, "palette")
    with pytest.raises(ValueError):
        compare_levels(image, mask, HEAD, "short-sides")
    with pytest.raises(ValueError):
        compare_levels(image, mask, HEAD, "fibre", scalp_mask=show, zone="beard")  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        compare_levels(image, mask, HEAD, "palette", shade_id="natural-03-n",
                       allow_lightening="yes")  # type: ignore[arg-type]


def test_source_is_not_modified() -> None:
    image, mask, show = scene()
    kept = image.copy()
    compare_levels(image, mask, HEAD, "fibre", scalp_mask=show)
    assert np.array_equal(image, kept)
