"""Critic fairness across the six drawn skin tones.

Trains a small critic once, then compares matched drawn scenes rendered in
every tone. Bound: FAIRNESS_BOUND (0.05 mean realism, ASSUMED).
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import SKIN_TONES, Critic, featurise, make_dataset, train_critic
from lab.ml.critic.fairness import (
    FAIRNESS_BOUND,
    FairnessReport,
    ToneRow,
    fairness_check,
    tone_realism,
)


@pytest.fixture(scope="module")
def critic() -> Critic:
    data = featurise(make_dataset(240, seed=31, size=80))
    return train_critic(data.features, data.labels, seed=2)


def test_score_gaps_between_tones_stay_within_bound(critic: Critic) -> None:
    report = fairness_check(critic, per_tone=6, size=80)
    assert len(report.rows) == len(SKIN_TONES)
    assert report.clean_gap <= FAIRNESS_BOUND
    assert report.flawed_gap <= FAIRNESS_BOUND
    assert report.passed


def test_every_tone_keeps_clean_high_and_flawed_low(critic: Critic) -> None:
    report = fairness_check(critic, per_tone=6, size=80)
    for row in report.rows:
        assert row.clean_mean > 0.8
        assert row.flawed_mean < 0.3
        assert row.false_fail_rate <= 0.2


def test_matched_scenes_differ_only_in_tone(critic: Critic) -> None:
    light = tone_realism(critic, 0, [7], None, 0.0, 80)
    deep = tone_realism(critic, 5, [7], None, 0.0, 80)
    assert light.shape == deep.shape == (1,)
    assert abs(float(light[0]) - float(deep[0])) < 0.1


def test_report_fails_when_a_gap_exceeds_the_bound() -> None:
    rows = (ToneRow(0, 0.95, 0.05, 0.0, 0.0), ToneRow(5, 0.80, 0.05, 0.2, 0.0))
    report = FairnessReport(rows, clean_gap=0.15, flawed_gap=0.0, bound=0.05)
    assert not report.passed
    text = report.to_markdown()
    assert "Verdict: FAIL" in text
    assert "not a measurement on people" in text


def test_report_markdown_lists_every_tone(critic: Critic) -> None:
    text = fairness_check(critic, per_tone=2, size=80).to_markdown()
    for tone in range(len(SKIN_TONES)):
        assert f"| {tone} |" in text


def test_fairness_check_needs_scenes(critic: Critic) -> None:
    with pytest.raises(ValueError, match="per_tone"):
        fairness_check(critic, per_tone=0)


def test_tone_realism_is_deterministic(critic: Critic) -> None:
    first = tone_realism(critic, 3, [1, 2], "halo", 0.5, 80)
    second = tone_realism(critic, 3, [1, 2], "halo", 0.5, 80)
    assert np.array_equal(first, second)
