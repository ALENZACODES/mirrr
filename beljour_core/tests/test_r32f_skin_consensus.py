"""R32F two-cheek consensus: drawn sRGB patches only, no photos, meshes or models.

Pass definition (synthetic): a forehead is left out only when both cheeks have
enough pixels, agree within the committed zone bound and the forehead disagrees
with both; the recovered reading still obeys the existing W6 limits; an accepted
historical reading is never replaced. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.finder import NO_WHITE, thresholds
from plumb_api.engines.shade.skin_accuracy import assess_skin_zones, recover_consensus

SKIN = (63.0, 13.29, 17.64)  # LG-07N


def patch(lab: tuple[float, float, float], count: int = 300) -> np.ndarray:
    return np.repeat(cs.to_bytes(cs.lab_to_srgb(np.asarray(lab)))[None, :], count, axis=0)


def zones(forehead: tuple[float, float, float] = SKIN, left: tuple[float, float, float] = SKIN,
          cheek_count: int = 300, forehead_count: int = 300) -> dict[str, np.ndarray]:
    return {"cheek_right": patch(SKIN, cheek_count), "cheek_left": patch(left, cheek_count),
            "forehead": patch(forehead, forehead_count)}


def test_forehead_disagreeing_with_both_cheeks_is_left_out() -> None:
    found = recover_consensus(zones(forehead=(75.0, 9.3, 12.35)), NO_WHITE)
    assert found.usable and found.reason is None
    assert found.forehead_excluded
    assert found.zones_used == ("cheek_right", "cheek_left")
    assert found.reading is not None and found.reading.best is not None
    assert found.reading.best["id"] == "LG-07N"
    assert found.cheek_distance == pytest.approx(0.0, abs=1e-9)
    assert found.forehead_distances is not None
    assert min(found.forehead_distances) > thresholds()["confidence"]["zone_delta_e_ok"]


def test_agreeing_forehead_is_kept() -> None:
    found = recover_consensus(zones(), NO_WHITE)
    assert found.usable and not found.forehead_excluded
    assert found.zones_used == ("cheek_right", "cheek_left", "forehead")


def test_forehead_outlier_against_only_one_cheek_is_kept() -> None:
    found = recover_consensus(zones(forehead=(64.5, 13.29, 17.64), left=(62.0, 13.29, 17.64)), NO_WHITE)
    assert found.forehead_distances is not None
    bound = thresholds()["confidence"]["zone_delta_e_ok"]
    assert min(found.forehead_distances) <= bound
    assert not found.forehead_excluded
    assert "forehead" in found.zones_used


def test_disagreeing_cheeks_refuse_before_any_reading() -> None:
    found = recover_consensus(zones(left=(58.0, 13.29, 17.64)), NO_WHITE)
    assert not found.usable
    assert found.reason == "cheeks_disagree"
    assert found.reading is None
    assert found.cheek_distance is not None
    assert found.cheek_distance > thresholds()["confidence"]["zone_delta_e_ok"]


@pytest.mark.parametrize("count", [0, 1, 11])
def test_too_few_cheek_pixels_refuse(count: int) -> None:
    found = recover_consensus(zones(cheek_count=count), NO_WHITE)
    assert found.reason == "insufficient_cheek_samples"
    assert found.zone_sizes["cheek_right"] == count
    assert found.public()["reference_id"] is None


def test_small_forehead_is_neither_measured_nor_called_excluded() -> None:
    found = recover_consensus(zones(forehead=(90.0, 0.0, 0.0), forehead_count=5), NO_WHITE)
    assert found.usable
    assert found.forehead_distances is None and not found.forehead_excluded
    assert found.zones_used == ("cheek_right", "cheek_left")


def test_recovered_reading_still_obeys_never_lighter_and_distance_limits() -> None:
    deep = (12.0, 6.0, 8.0)
    found = recover_consensus({"cheek_right": patch(deep), "cheek_left": patch(deep),
                               "forehead": patch((40.0, 6.0, 8.0))}, NO_WHITE)
    assert found.forehead_excluded
    assert not found.usable
    assert found.reason == "reading_refused"
    assert found.reading is not None and found.reading.refused and found.reading.best is None


def test_public_summary_is_bounded_and_carries_no_pixels() -> None:
    public = recover_consensus(zones(forehead=(75.0, 9.3, 12.35)), NO_WHITE).public()
    assert set(public) == {"usable", "reason", "cheek_distance", "forehead_distances", "forehead_excluded",
                           "zones_used", "zone_sizes", "reference_id", "note"}
    assert public["reference_id"] == "LG-07N"
    assert all(isinstance(v, int) for v in public["zone_sizes"].values())
    assert len(repr(public)) < 600


def _strip(rows: int, lab_by_zone: dict[str, tuple[float, float, float]]) -> tuple[np.ndarray, dict[str, np.ndarray]]:
    image = np.full((rows, 3 * rows, 3), 96, dtype=np.uint8)
    masks = {}
    for index, (name, lab) in enumerate(lab_by_zone.items()):
        mask = np.zeros((rows, 3 * rows), dtype=np.bool_)
        mask[:, index * rows:(index + 1) * rows] = True
        image[mask] = cs.to_bytes(cs.lab_to_srgb(np.asarray(lab)))
        masks[name] = mask
    return image, masks


def test_accepted_historical_reading_is_never_replaced() -> None:
    image, masks = _strip(20, {"cheek_right": SKIN, "cheek_left": SKIN, "forehead": SKIN})
    found = assess_skin_zones(image, masks)
    assert found.accepted and found.source == "baseline"
    assert found.consensus is None
    assert found.reading is found.baseline


def test_consensus_only_runs_after_a_historical_refusal() -> None:
    image, masks = _strip(20, {"cheek_right": SKIN, "cheek_left": SKIN, "forehead": (75.0, 9.3, 12.35)})
    found = assess_skin_zones(image, masks)
    assert found.baseline.refused
    assert found.accepted and found.source == "cheek_consensus"
    assert found.reference_id == "LG-07N"
    assert found.public()["baseline_refused"] is True
    assert found.public()["provider_calls"] == 0
