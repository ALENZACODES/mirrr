"""Every drawn artifact moves the feature built for it, and reasons point at the cause.

Cross-checks the generator against the features: for each artifact kind the
target feature must rise clearly above its value on the same scene edited
cleanly, across several seeds.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import (
    ARTIFACT_NAMES,
    FEATURE_NAMES,
    Critic,
    extract_dict,
    make_pair,
    make_sample,
    train_default,
)
from lab.ml.critic.pipeline import reason_hit_rates, reason_markdown
from lab.ml.critic.synth import TARGET_FEATURE

SEEDS = range(4)


def feature_value(artifact: str | None, feature: str, seed: int) -> float:
    sample = make_sample(np.random.default_rng(seed), artifact, 0.7, 96)
    return extract_dict(make_pair(sample.before, sample.after, sample.mask, sample.face))[feature]


def test_every_artifact_has_a_target_feature() -> None:
    assert set(TARGET_FEATURE) == set(ARTIFACT_NAMES)
    assert set(TARGET_FEATURE.values()) <= set(FEATURE_NAMES)
    assert len(set(TARGET_FEATURE.values())) == len(TARGET_FEATURE)


@pytest.mark.parametrize("artifact", ARTIFACT_NAMES)
def test_artifact_raises_its_target_feature(artifact: str) -> None:
    feature = TARGET_FEATURE[artifact]
    flawed = [feature_value(artifact, feature, seed) for seed in SEEDS]
    clean = [feature_value(None, feature, seed) for seed in SEEDS]
    assert min(flawed) > max(clean), (feature, flawed, clean)
    assert float(np.mean(flawed)) > 3.0 * float(np.mean(clean)) + 0.05


@pytest.fixture(scope="module")
def critic() -> Critic:
    trained, _ = train_default(count=360, seed=13, size=96)
    return trained


def test_reasons_usually_name_the_applied_artifact(critic: Critic) -> None:
    rates = reason_hit_rates(critic, range(3))
    assert set(rates) == set(ARTIFACT_NAMES)
    overall = sum(rates.values()) / len(rates)
    assert overall >= 0.6, rates
    assert sum(rate >= 0.5 for rate in rates.values()) >= 9, rates


def test_reason_markdown_lists_each_kind() -> None:
    text = reason_markdown({"seam": 1.0, "halo": 0.5})
    assert "| seam | seam_strength | 100% |" in text
    assert "Overall: 75%" in text


def test_reason_rates_skip_features_the_critic_lacks(critic: Critic) -> None:
    trimmed = Critic(critic.kind, ("seam_strength",), critic.scaler, critic.model,
                     critic.platt, critic.reference)
    assert set(reason_hit_rates(trimmed, [])) == {"seam"}
