"""Tests for Wilson intervals, Newcombe rate-gap intervals and Holm adjustment.

Reference values are from the published worked examples of each method.
Author: John Khan.
"""

from __future__ import annotations

import math

import numpy as np
import pytest

from lab.facescale_synth.fairness.stats import gap_interval, holm, one_sided_p, wilson


def test_wilson_reference_values() -> None:
    low, high = wilson(81, 263)
    assert low == pytest.approx(0.2553, abs=1e-3)
    assert high == pytest.approx(0.3662, abs=1e-3)
    assert wilson(0, 10)[0] == 0.0
    assert wilson(0, 10)[1] == pytest.approx(0.2775, abs=1e-3)
    assert wilson(10, 10)[1] == 1.0
    assert wilson(0, 0) == (0.0, 1.0)
    with pytest.raises(ValueError):
        wilson(5, 4)


def test_wilson_covers_the_true_rate_about_95_percent() -> None:
    rng = np.random.default_rng(0)
    true, n, trials = 0.83, 60, 4000
    passed = rng.binomial(n, true, trials)
    covered = sum(1 for k in passed if wilson(int(k), n)[0] <= true <= wilson(int(k), n)[1])
    assert 0.93 <= covered / trials <= 0.975


def test_newcombe_reference_example() -> None:
    gap, low, high = gap_interval(56, 70, 48, 80)
    assert gap == pytest.approx(0.2)
    assert low == pytest.approx(0.0524, abs=1e-3)
    assert high == pytest.approx(0.3339, abs=1e-3)
    with pytest.raises(ValueError):
        gap_interval(1, 0, 1, 1)


def test_one_sided_p_direction() -> None:
    assert one_sided_p(70, 100, 0.9) < 1e-6
    assert one_sided_p(95, 100, 0.9) > 0.9
    assert one_sided_p(0, 0, 0.9) == 1.0
    assert one_sided_p(9, 10, 1.0) == 0.0
    assert math.isclose(one_sided_p(90, 100, 0.9), 0.5)


def test_holm_reference_example() -> None:
    adjusted = holm([0.01, 0.04, 0.03, 0.005])
    assert adjusted == pytest.approx([0.03, 0.06, 0.06, 0.02])
    assert holm([]) == []
    assert holm([0.9, 0.8]) == [1.0, 1.0]
