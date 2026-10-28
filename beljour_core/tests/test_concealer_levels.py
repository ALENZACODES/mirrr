"""Hair fibre cover on invented blocks of pixels, never on photographs."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import (
    CoverDecision,
    CoverRefusal,
    CoverResult,
    CoverSession,
)
from plumb_api.engines.menshair import HairAnchors

LOCAL_HEAD = HairAnchors.parse({
    "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
    "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
})


@dataclass
class GuardSpy:
    calls: int = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        assert lock_level == 5.0
        self.calls += 1
        return CoverDecision(after.copy(), 1.0, False)


def block_case(hair: tuple[int, int, int], scalp: tuple[int, int, int], *,
               other: tuple[int, int, int] = (205, 177, 145)) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    height, width = 96, 96
    image = np.empty((height, width, 4), dtype=np.uint8)
    image[..., :3] = other
    image[..., 3] = 211
    mask = np.zeros((height, width), dtype=np.uint8)
    mask[12:62, 22:74] = 255
    image[12:62, 22:74, :3] = hair
    yy, xx = np.mgrid[0:height, 0:width]
    # A few measured hair strands, entirely synthetic, provide real pixel energy.
    image[12:62, 22:74, 1] += ((xx[12:62, 22:74] // 2) % 4).astype(np.uint8)
    show = np.zeros_like(mask)
    show[39:59, 28:69] = 255
    image[39:59, 28:69, :3] = scalp
    return image, mask, show


@pytest.mark.parametrize("hair,scalp", [
    ((29, 22, 20), (188, 146, 112)),
    ((95, 70, 53), (68, 46, 39)),
    ((202, 176, 129), (52, 43, 39)),
])
def test_coverage_monotone_for_deep_and_light_skin_and_all_hair_depths(hair, scalp):
    image, region, visible = block_case(hair, scalp)
    session = CoverSession()
    old = image.copy()
    original_mask = region.copy()
    results = [session.render(image, region, visible, zone="crown", level=value, landmarks=LOCAL_HEAD)
               for value in (1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)]
    assert all(isinstance(result, CoverResult) for result in results)
    checked = [result for result in results if isinstance(result, CoverResult)]
    assert np.max(np.abs(checked[0].image.astype(int) - image.astype(int))) <= 1
    assert all(checked[i].after_share >= checked[i + 1].after_share for i in range(len(checked) - 1))
    assert checked[-1].after_share < checked[0].after_share
    assert checked[-1].changed_pixels > 0
    assert all(result.provider_calls == 0 and result.simulated for result in checked)
    assert all(result.identity_similarity >= 0 and result.identity_similarity <= 1 for result in checked)
    assert "not a diagnosis" in checked[1].label
    # Outside the hair region and inside the alpha channel nothing changes, at every strength.
    for result in checked:
        assert np.array_equal(result.image[region == 0], image[region == 0])
        assert np.array_equal(result.image[..., 3], image[..., 3])
    assert np.array_equal(image, old)
    assert np.array_equal(region, original_mask)


@pytest.mark.parametrize("bad", [.95, 5.1, 2.25, float("nan"), float("inf"), True, "3"])
def test_strength_rejects_invalid_boundaries(bad):
    image, region, visible = block_case((49, 33, 29), (120, 92, 78))
    with pytest.raises(ValueError):
        CoverSession().render(image, region, visible, level=bad, landmarks=LOCAL_HEAD)


def test_empty_degenerate_and_missing_mesh_return_refusals_not_exceptions():
    image, region, visible = block_case((30, 24, 22), (145, 119, 91))
    empty = np.zeros_like(region)
    session = CoverSession()
    assert session.render(image, region, visible, landmarks=None) == CoverRefusal(
        "no_mesh", "Primary-face landmarks are required")
    cases = [
        (empty, visible, "empty_region"),
        (np.pad(np.ones((2, 2), dtype=np.uint8) * 255, ((12, 82), (22, 72))), visible, "degenerate_mask"),
        (region, empty, "no_scalp"),
        (region, region, "no_hair_reference"),
    ]
    for hair, scalp, expected in cases:
        result = session.render(image, hair, scalp, landmarks=LOCAL_HEAD)
        assert isinstance(result, CoverRefusal), expected
        assert result.code == expected


def test_five_level_changes_compute_zone_split_energy_once_and_invoke_guard_every_time():
    image, region, visible = block_case((64, 41, 39), (178, 144, 105))
    session = CoverSession()
    guard = GuardSpy()
    for level in (1.0, 2.0, 3.0, 4.0, 5.0):
        result = session.render(image, region, visible, zone="crown", level=level,
                                guard=guard, landmarks=LOCAL_HEAD)
        assert isinstance(result, CoverResult)
    assert session.zone_grid_calls == session.split_calls == session.energy_calls == 1
    assert guard.calls == 5
    second_mask = visible.copy()
    second_mask[40, 35] = 0
    session.render(image, region, second_mask, zone="crown", level=2.0, landmarks=LOCAL_HEAD)
    assert session.zone_grid_calls == 2
    session.clear()
    session.render(image, region, visible, zone="crown", level=2.0, landmarks=LOCAL_HEAD)
    assert session.zone_grid_calls == 3


def test_mask_and_zone_specific_refusal_and_palette_override():
    image, region, visible = block_case((150, 140, 112), (75, 54, 46))
    session = CoverSession()
    assert isinstance(session.render(image, region, visible, zone="hairline", landmarks=LOCAL_HEAD), CoverRefusal)
    result = session.render(image, region, visible, zone="crown", level=4,
                            palette_rgb=(11, 22, 33), landmarks=LOCAL_HEAD)
    assert isinstance(result, CoverResult)
    assert result.measured_hair_rgb == (11, 22, 33)
    with pytest.raises(ValueError, match="zone"):
        session.render(image, region, visible, zone="invalid", landmarks=LOCAL_HEAD)
