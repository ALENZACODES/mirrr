"""Statistics rule tests: Wilson intervals and status decisions of the shared contract.

Pass definition: Wilson bounds match known values; n < 20 is UNPROVEN; an
interval straddling the threshold is UNPROVEN; FAIL needs the upper bound below
a minimum (or lower bound above a maximum); zero tolerance fails on one
violation. Author: John Khan.
"""
from __future__ import annotations

import pytest

from lab.bqa_shade import stats


def test_wilson_known_values() -> None:
    low, high = stats.wilson(8, 10)
    assert low == pytest.approx(0.4902, abs=1e-4)
    assert high == pytest.approx(0.9433, abs=1e-4)
    assert stats.wilson(0, 0) == (0.0, 1.0)
    low, high = stats.wilson(0, 50)
    assert low == 0.0 and 0.05 < high < 0.08


def test_wilson_rejects_bad_counts() -> None:
    with pytest.raises(ValueError):
        stats.wilson(5, 4)
    with pytest.raises(ValueError):
        stats.wilson(-1, 4)


def test_small_n_is_always_unproven() -> None:
    assert stats.rate_status(19, 19, minimum=0.5) == stats.UNPROVEN
    assert stats.rate_status(0, 19, minimum=0.5) == stats.UNPROVEN


def test_minimum_threshold_pass_fail_unproven() -> None:
    assert stats.rate_status(198, 200, minimum=0.95) == stats.PASS
    assert stats.rate_status(150, 200, minimum=0.95) == stats.FAIL
    assert stats.rate_status(190, 200, minimum=0.95) == stats.UNPROVEN


def test_maximum_threshold() -> None:
    assert stats.rate_status(1, 400, maximum=0.05) == stats.PASS
    assert stats.rate_status(100, 400, maximum=0.05) == stats.FAIL
    with pytest.raises(ValueError):
        stats.rate_status(1, 40, minimum=0.1, maximum=0.2)


def test_zero_tolerance() -> None:
    assert stats.zero_tolerance_status(1, 500) == stats.FAIL
    assert stats.zero_tolerance_status(0, 19) == stats.UNPROVEN
    assert stats.zero_tolerance_status(0, 20) == stats.PASS
    assert stats.zero_tolerance_status(0, 1, min_n=1) == stats.PASS


def test_combine() -> None:
    assert stats.combine([stats.PASS, stats.PASS]) == stats.PASS
    assert stats.combine([stats.PASS, stats.UNPROVEN]) == stats.UNPROVEN
    assert stats.combine([stats.UNPROVEN, stats.FAIL]) == stats.FAIL
    assert stats.combine([stats.FAIL, stats.ERROR]) == stats.ERROR
    assert stats.combine([]) == stats.UNPROVEN


def test_axis_tally_groups_in_order() -> None:
    tally = stats.AxisTally(("mst_band", "light"))
    for i in range(30):
        tally.add(i % 3 != 0, mst_band="9-10" if i < 10 else "1-2", light="daylight")
    assert tally.n == 30 and tally.passed == 20
    rows = [g.to_row() for g in tally.groups({"mst_band": ("1-2", "9-10")}, minimum=0.5)]
    assert [r["value"] for r in rows] == ["1-2", "9-10", "daylight"]
    assert rows[0]["n"] == 20 and rows[1]["status"] == stats.UNPROVEN
    with pytest.raises(ValueError):
        tally.add(True, mst_band="1-2")


def test_percentile() -> None:
    assert stats.percentile([1, 2, 3, 4], 0.5) == pytest.approx(2.5)
    assert stats.percentile([5], 0.9) == 5
    with pytest.raises(ValueError):
        stats.percentile([], 0.5)
