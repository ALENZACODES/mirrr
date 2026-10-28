"""SKN-03 repeat-capture accounting and the skin-reference inventory audit.

Counts are hypothetical aggregates; W6 readings come from flat synthetic pixels.
The 939/1000 fixture is test arithmetic only, not the real SKN-03 denominator.
Author: John Khan.
"""
from __future__ import annotations

import dataclasses

import numpy as np
import pytest

from plumb_api.engines import shade
from plumb_api.engines.shade import finder
from plumb_api.engines.shade.readiness import (
    SKN03_TARGET,
    SkinCheckCase,
    case_from_shade,
    check_reference_coverage,
    measure_skn03,
)

STEADY = ((4, "warm"), (4, "warm"), (4, "warm"))


def cases(stable: int, unstable: int, refused: int = 0, group: str = "unknown") -> list[SkinCheckCase]:
    rows = [SkinCheckCase(f"{group[:2]}-s{i}", STEADY, group) for i in range(stable)]
    rows += [SkinCheckCase(f"{group[:2]}-u{i}", ((4, "warm"), (4, "neutral")), group) for i in range(unstable)]
    rows += [SkinCheckCase(f"{group[:2]}-r{i}", ((4, "warm"), None), group) for i in range(refused)]
    return rows


def flat_reading(rgb: tuple[int, int, int]) -> finder.ShadeResult:
    zones = {name: np.tile(np.asarray([rgb], dtype=np.float64), (300, 1)) for name in finder.ZONES}
    return finder.find_from_pixels(zones, finder.WhiteBalance((1.0, 1.0, 1.0), "neutral", False))


def test_reproduced_939_of_1000_is_below_target() -> None:
    report = measure_skn03(cases(939, 0, refused=61))
    body = report.public()
    assert (body["total"], body["stable"], body["unmeasured"]) == (1000, 939, 61)
    assert (body["minimum_stable"], body["additional_required"]) == (950, 11)
    assert body["status"] == "BELOW_TARGET" and body["release_pass"] is False
    assert body["rate"] == 0.939 and body["target"] == SKN03_TARGET == 0.95


def test_exactly_95_percent_stays_unproven_without_evidence() -> None:
    rows = cases(950, 50)
    assert measure_skn03(rows).status == "UNPROVEN"
    assert measure_skn03(rows, independent_labels=True, compatible_baseline=True).status == "UNPROVEN"
    full = measure_skn03(rows, independent_labels=True, compatible_baseline=True, human_review=True)
    assert full.status == "BOX_REVIEW_REQUIRED" and full.public()["release_pass"] is False
    assert measure_skn03(cases(949, 51), independent_labels=True, compatible_baseline=True,
                         human_review=True).status == "BELOW_TARGET"


@pytest.mark.parametrize(("total", "minimum"), [(1, 1), (19, 19), (20, 19), (21, 20), (33, 32), (983, 934)])
def test_target_is_the_exact_integer_ceiling(total: int, minimum: int) -> None:
    assert measure_skn03(cases(total, 0)).minimum_stable == minimum


def test_refused_repeats_stay_in_the_denominator() -> None:
    report = measure_skn03(cases(31, 1, refused=1))
    assert (report.total, report.stable, report.unstable, report.unmeasured) == (33, 31, 2, 1)
    assert report.rate == pytest.approx(31 / 33)
    assert report.status == "BELOW_TARGET"


def test_groups_come_only_from_the_caller() -> None:
    rows = cases(3, 1, group="band 1-2") + cases(5, 0)
    groups = measure_skn03(rows).public()["groups"]
    assert groups == {"band 1-2": {"total": 4, "stable": 3}, "unknown": {"total": 5, "stable": 5}}
    # A deep reading is not turned into a band label.
    deep = case_from_shade("deep-1", [flat_reading((70, 48, 38))] * 2)
    assert deep.group == "unknown"


def test_case_from_w6_results_and_their_json() -> None:
    result = flat_reading((190, 150, 125))
    assert not result.refused and result.depth_band is not None
    case = case_from_shade("cell-7", [result, result.to_json(), result], group="drawn")
    assert case.stable and case.measured
    assert case.readings[0] == (result.depth_band, result.undertone["undertone"])  # type: ignore[index]
    refused = finder.find_from_pixels({}, finder.NO_WHITE)
    assert refused.refused
    mixed = case_from_shade("cell-8", [result, refused])
    assert not mixed.measured and not mixed.stable and mixed.readings[1] is None
    assert mixed.public() == {"case": "cell-8", "group": "unknown", "repeats": 2, "measured": False,
                              "stable": False}


def test_a_changed_undertone_or_band_is_unstable() -> None:
    assert not SkinCheckCase("a", ((4, "warm"), (5, "warm"))).stable
    assert not SkinCheckCase("b", ((4, "warm"), (4, "olive"))).stable
    assert SkinCheckCase("c", ((4, "warm"), [4, "warm"])).stable  # type: ignore[arg-type]


@pytest.mark.parametrize("kwargs", [
    {"case_id": "x", "readings": ((4, "warm"),)},
    {"case_id": "x", "readings": ((4, "warm"),) * 51},
    {"case_id": "", "readings": STEADY},
    {"case_id": "name with space", "readings": STEADY},
    {"case_id": "x", "readings": ((0, "warm"), (4, "warm"))},
    {"case_id": "x", "readings": ((4, "pink"), (4, "warm"))},
    {"case_id": "x", "readings": ((4.0, "warm"), (4, "warm"))},
    {"case_id": "x", "readings": [(4, "warm"), (4, "warm")]},
    {"case_id": "x", "readings": STEADY, "group": ""},
    {"case_id": "x", "readings": STEADY, "group": "x" * 33},
])
def test_case_validation(kwargs: dict[str, object]) -> None:
    with pytest.raises(ValueError):
        SkinCheckCase(**kwargs)  # type: ignore[arg-type]


def test_measure_validation() -> None:
    for bad in ([], "abc", [STEADY], cases(1, 0) * 2):
        with pytest.raises(ValueError):
            measure_skn03(bad)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        measure_skn03(cases(1, 0), human_review=1)  # type: ignore[arg-type]
    with pytest.raises(dataclasses.FrozenInstanceError):
        cases(1, 0)[0].group = "other"  # type: ignore[misc]


def test_reference_inventory_coverage() -> None:
    full = check_reference_coverage()
    assert full.total == 96 and full.missing == ()
    assert len(full.cells) == 40 and sum(count for _, _, count in full.cells) == 96
    assert full.min_separation > 1.0 and full.close_pairs == ()
    assert full.cross_undertone_neighbours == 0
    base = check_reference_coverage("base")
    assert base.total == 80
    assert dict(((b, u), n) for b, u, n in base.cells)[(10, "olive")] < dict(
        ((b, u), n) for b, u, n in full.cells)[(10, "olive")]
    body = full.public()
    assert body["format"] == "beljour-reference-inventory/1" and body["missing"] == []
    with pytest.raises(ValueError):
        check_reference_coverage("hair")
    assert shade.check_reference_coverage is check_reference_coverage
    assert shade.measure_skn03 is measure_skn03 and shade.case_from_shade is case_from_shade
