"""Critic ensembles and the drop-one-feature ablation report.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.ml.critic import FEATURE_NAMES, Featurised, featurise, make_dataset
from lab.ml.critic.ablation import (
    AblationReport,
    AblationRow,
    Ensemble,
    drop_one_ablation,
    held_out_auc,
    train_ensemble,
)


@pytest.fixture(scope="module")
def split() -> tuple[Featurised, Featurised]:
    train = featurise(make_dataset(200, seed=41, size=72))
    test = featurise(make_dataset(120, seed=42, size=72, strength_range=(0.05, 0.4)))
    return train, test


def test_ensemble_averages_members(split: tuple[Featurised, Featurised]) -> None:
    train, test = split
    ensemble = train_ensemble(train.features, train.labels, bags=2, seed=3)
    assert len(ensemble.members) == 4
    probs = ensemble.artifact_probability(test.features)
    by_member = np.vstack([m.artifact_probability(test.features) for m in ensemble.members])
    assert np.allclose(probs, by_member.mean(axis=0))
    assert np.allclose(ensemble.realism(test.features), 1.0 - probs)
    assert float(np.min(ensemble.spread(test.features))) >= 0.0


def test_ensemble_separates_held_out_pairs(split: tuple[Featurised, Featurised]) -> None:
    train, test = split
    ensemble = train_ensemble(train.features, train.labels, bags=2, seed=4)
    probs = ensemble.artifact_probability(test.features)
    flawed = probs[test.labels > 0.5]
    clean = probs[test.labels < 0.5]
    assert float(np.mean(flawed)) > float(np.mean(clean)) + 0.5


def test_single_member_ensemble_has_no_spread(split: tuple[Featurised, Featurised]) -> None:
    train, test = split
    ensemble = train_ensemble(train.features, train.labels, kinds=("logistic",), bags=1)
    assert isinstance(ensemble, Ensemble)
    assert float(np.max(ensemble.spread(test.features))) == 0.0


def test_ensemble_rejects_empty_configuration(split: tuple[Featurised, Featurised]) -> None:
    train, _ = split
    with pytest.raises(ValueError, match="at least one"):
        train_ensemble(train.features, train.labels, bags=0)
    with pytest.raises(ValueError, match="at least one"):
        train_ensemble(train.features, train.labels, kinds=())


def test_ablation_covers_every_feature(split: tuple[Featurised, Featurised]) -> None:
    train, test = split
    report = drop_one_ablation(train, test)
    assert {row.feature for row in report.rows} == set(FEATURE_NAMES)
    drops = [row.auc_drop for row in report.rows]
    assert drops == sorted(drops, reverse=True)
    assert 0.9 <= report.full_auc <= 1.0
    for row in report.rows:
        assert row.auc_drop == pytest.approx(report.full_auc - row.auc_without)


def test_dropping_the_only_signal_hurts(split: tuple[Featurised, Featurised]) -> None:
    train, test = split
    colour = FEATURE_NAMES.index("colour_shift_untouched")
    seam = FEATURE_NAMES.index("seam_strength")
    both = held_out_auc(train, test, [colour, seam], "logistic", 0)
    alone = held_out_auc(train, test, [seam], "logistic", 0)
    assert both >= alone


def test_ablation_markdown() -> None:
    report = AblationReport("logistic", 0.99, (AblationRow("halo", 0.97, 0.02),))
    text = report.to_markdown()
    assert "| halo | 0.9700 | +0.0200 |" in text
    assert "real faces" in text
