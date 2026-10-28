"""Speed of the critic on CPU.

The budget is 50 ms on 512x512 (ASSUMED). Shared test machines vary, so the
test asserts a looser ceiling of three times the budget and checks the report;
the measured median goes in the hand-off note.
Author: John Khan.
"""

from __future__ import annotations

import cv2
import pytest

from lab.ml.critic import Critic, featurise, make_dataset, train_critic
from lab.ml.critic.speed import BUDGET_MS, SpeedReport, time_critic


@pytest.fixture(scope="module")
def critic() -> Critic:
    data = featurise(make_dataset(96, seed=51, size=64))
    return train_critic(data.features, data.labels)


def test_critic_on_512_is_near_budget(critic: Critic) -> None:
    report = time_critic(critic, size=512, repeats=5)
    assert report.median_ms < 3 * BUDGET_MS, report.summary()
    assert report.worst_ms >= report.median_ms


def test_timing_restores_opencv_threads(critic: Critic) -> None:
    before = cv2.getNumThreads()
    time_critic(critic, size=64, repeats=1)
    assert cv2.getNumThreads() == before


def test_smaller_frames_are_faster(critic: Critic) -> None:
    small = time_critic(critic, size=128, repeats=5)
    large = time_critic(critic, size=512, repeats=5)
    assert small.median_ms < large.median_ms


def test_report_wording() -> None:
    fast = SpeedReport(512, 3, 20.0, 25.0, 50.0)
    slow = SpeedReport(512, 3, 80.0, 90.0, 50.0)
    assert fast.within_budget and "within the 50 ms budget" in fast.summary()
    assert not slow.within_budget and "over the 50 ms budget" in slow.summary()


def test_repeats_must_be_positive(critic: Critic) -> None:
    with pytest.raises(ValueError, match="repeats"):
        time_critic(critic, repeats=0)
