"""Five actual strength stops through the production hair engines on drawn blocks.

All pixels are invented rectangles; no photographs. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pytest

from plumb_api.commerce.hair_comparison import (
    BOARD_LABEL,
    BoardRefusal,
    HairComparison,
    compare_levels,
)
from plumb_api.commerce.level_evidence import FIVE_LEVELS
from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.menshair import HairAnchors

HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})


def scene(hair: tuple[int, int, int] = (29, 22, 20), scalp: tuple[int, int, int] = (188, 146, 112),
          size: int = 96) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Drawn RGBA block: background, a striped hair rectangle and a visible-scalp patch."""
    image = np.empty((size, size, 4), dtype=np.uint8)
    image[..., :3] = (205, 177, 145)
    image[..., 3] = 211
    mask = np.zeros((size, size), dtype=np.uint8)
    mask[12:62, 22:74] = 255
    image[12:62, 22:74, :3] = hair
    xx = np.mgrid[0:size, 0:size][1]
    image[12:62, 22:74, 1] += ((xx[12:62, 22:74] // 2) % 4).astype(np.uint8)
    show = np.zeros_like(mask)
    show[39:59, 28:69] = 255
    image[39:59, 28:69, :3] = scalp
    return image, mask, show


def board(kind: str = "palette", **options: object) -> HairComparison:
    image, mask, show = scene()
    presets: dict[str, dict[str, object]] = {
        "fibre": {"scalp_mask": show}, "palette": {"shade_id": "natural-03-n", "allow_lightening": True},
        "short-sides": {"style_id": "local-low-fade"}}
    defaults = presets[kind]
    return compare_levels(image, mask, HEAD, kind, **{**defaults, **options})  # type: ignore[arg-type]


@dataclass
class Spy:
    calls: int = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        self.calls += 1
        return CoverDecision(after.copy(), 1.0, False)


@pytest.mark.parametrize("kind", ["fibre", "palette", "short-sides"])
def test_five_stops_in_order_with_level_one_unchanged(kind: str) -> None:
    result = board(kind)
    assert tuple(tile.level for tile in result.tiles) == FIVE_LEVELS
    statuses = [tile.evidence.status for tile in result.tiles]
    assert statuses == ["unchanged", "rendered", "rendered", "rendered", "rendered"]
    assert result.totals.cases == 5 and result.totals.unchanged == 1


@pytest.mark.parametrize("kind", ["fibre", "palette", "short-sides"])
def test_every_stop_invokes_the_identity_guard(kind: str) -> None:
    spy = Spy()
    result = board(kind, guard=spy)
    assert spy.calls == 5
    assert all(tile.evidence.guard_applied for tile in result.tiles)


def test_evidence_matches_the_returned_pixels() -> None:
    image, mask, _ = scene()
    result = board("palette")
    for tile in result.tiles:
        moved = np.any(tile.image[..., :3] != image[..., :3], axis=-1)
        assert int(moved.sum()) == tile.evidence.changed_pixels
        assert np.array_equal(tile.image[..., 3], image[..., 3])
        assert not np.any(moved & (mask < 128))


def test_short_sides_change_grows_with_strength() -> None:
    changed = [tile.evidence.changed_pixels for tile in board("short-sides").tiles]
    assert changed == sorted(changed) and changed[0] == 0 and changed[-1] > 0


def test_fibre_board_keeps_refusals_in_the_denominator_without_a_mesh() -> None:
    image, mask, show = scene()
    result = compare_levels(image, mask, None, "fibre", scalp_mask=show)
    assert [tile.evidence.refusal_code for tile in result.tiles] == ["no_mesh"] * 5
    assert result.totals.refused == 5 and result.totals.cases == 5
    assert all(np.array_equal(tile.image, image) for tile in result.tiles)


def test_lighter_colour_needs_explicit_permission() -> None:
    held = board("palette", shade_id="natural-09-n", allow_lightening=False)
    assert {tile.evidence.refusal_code for tile in held.tiles} == {"lightening_not_automatic"}
    allowed = board("palette", shade_id="natural-09-n", allow_lightening=True)
    assert allowed.totals.rendered == 4


def test_public_report_is_photo_free() -> None:
    report = board("fibre").public()
    assert report["real_face_status"] == "not_tested" and report["label"] == BOARD_LABEL
    assert report["provider_calls"] == 0 and report["simulated"] is True

    def walk(value: object) -> None:
        assert not isinstance(value, (np.ndarray, bytes, bytearray))
        if isinstance(value, dict):
            assert not {"image", "pixels", "mask", "photo_hash", "landmarks"} & set(value)
            for item in value.values():
                walk(item)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(report)


def test_a_new_photo_never_reuses_an_earlier_board() -> None:
    first = board("fibre")
    image, mask, show = scene(hair=(95, 70, 53))
    second = compare_levels(image, mask, HEAD, "fibre", scalp_mask=show)
    assert not np.array_equal(first.tiles[3].image, second.tiles[3].image)
    again = board("fibre")
    assert all(np.array_equal(a.image, b.image) for a, b in zip(first.tiles, again.tiles, strict=True))


def test_board_is_capped_at_one_megapixel() -> None:
    big = np.zeros((1025, 1024, 3), dtype=np.uint8)
    with pytest.raises(BoardRefusal) as caught:
        compare_levels(big, np.zeros((1025, 1024), np.uint8), HEAD, "palette", shade_id="natural-03-n")
    assert caught.value.code == "too_large"
