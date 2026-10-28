"""The trained critic: scores, reasons, contributions, save and load.

Trains once per module on a small drawn synthetic set (a few seconds).
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from lab.ml.critic import (
    FEATURE_NAMES,
    Critic,
    CriticFileError,
    Featurised,
    featurise,
    make_dataset,
    make_pair,
    make_sample,
    train_critic,
)
from lab.ml.critic.linear import Logistic

SIZE = 80


@pytest.fixture(scope="module")
def training() -> Featurised:
    return featurise(make_dataset(240, seed=21, size=SIZE))


@pytest.fixture(scope="module")
def logistic(training: Featurised) -> Critic:
    return train_critic(training.features, training.labels, kind="logistic", seed=1)


@pytest.fixture(scope="module")
def mlp(training: Featurised) -> Critic:
    return train_critic(training.features, training.labels, kind="mlp", seed=1)


def score_sample(critic: Critic, artifact: str | None, strength: float, seed: int) -> float:
    sample = make_sample(np.random.default_rng(seed), artifact, strength, SIZE)
    pair = make_pair(sample.before, sample.after, sample.mask, sample.face)
    return critic.score(pair).realism


@pytest.mark.parametrize("kind", ["logistic", "mlp"])
def test_clean_edits_score_high_and_flawed_edits_low(kind: str, logistic: Critic,
                                                     mlp: Critic) -> None:
    critic = logistic if kind == "logistic" else mlp
    clean = [score_sample(critic, None, 0.0, seed) for seed in range(100, 106)]
    flawed = [score_sample(critic, "seam", 0.9, seed) for seed in range(100, 106)]
    assert min(clean) > 0.6
    assert max(flawed) < 0.4


def test_score_is_a_probability_and_complements(logistic: Critic, training: Featurised) -> None:
    realism = logistic.realism(training.features)
    artifact = logistic.artifact_probability(training.features)
    assert float(np.min(realism)) >= 0.0
    assert float(np.max(realism)) <= 1.0
    assert np.allclose(realism + artifact, 1.0)


def test_reasons_name_the_applied_artifact(logistic: Critic) -> None:
    sample = make_sample(np.random.default_rng(7), "colour_cast", 0.9, SIZE)
    result = logistic.score(make_pair(sample.before, sample.after, sample.mask, sample.face))
    assert not result.passed
    assert result.reasons
    assert result.reasons[0].feature == "colour_shift_untouched"
    assert "colour changed" in result.summary()


def test_clean_edit_gives_no_reasons(logistic: Critic) -> None:
    sample = make_sample(np.random.default_rng(8), None, 0.0, SIZE)
    result = logistic.score(make_pair(sample.before, sample.after, sample.mask, sample.face))
    assert result.passed
    assert result.reasons == ()
    assert "no artifact stands out" in result.summary()


def test_logistic_contributions_add_up_to_the_logit(logistic: Critic,
                                                    training: Featurised) -> None:
    assert isinstance(logistic.model, Logistic)
    row = training.features[3]
    pushes = logistic.contributions(row)
    standard_ref = logistic.reference
    ref_logit = float(logistic.model.weights @ standard_ref + logistic.model.bias)
    ref_logit = logistic.platt.a * ref_logit + logistic.platt.b
    standard = logistic.scaler.transform(row[None, :])
    full = logistic.platt.a * float(logistic.model.logit(standard)[0]) + logistic.platt.b
    assert float(pushes.sum()) == pytest.approx(full - ref_logit, abs=1e-9)


def test_mlp_contributions_are_finite_and_signed(mlp: Critic) -> None:
    sample = make_sample(np.random.default_rng(9), "plastic_skin", 0.9, SIZE)
    result = mlp.score(make_pair(sample.before, sample.after, sample.mask, sample.face))
    values = np.array(list(result.contributions.values()))
    assert np.all(np.isfinite(values))
    assert float(values.max()) > 0.0


def test_result_json_states_scope(logistic: Critic, training: Featurised) -> None:
    payload = logistic.score_features(training.features[0]).to_json()
    assert "not validated on real faces" in payload["scope"]
    assert set(payload["features"]) == set(FEATURE_NAMES)
    json.dumps(payload)


def test_score_features_checks_length(logistic: Critic) -> None:
    with pytest.raises(ValueError, match="expected"):
        logistic.score_features(np.zeros(3))


@pytest.mark.parametrize("kind", ["logistic", "mlp"])
def test_save_and_load_round_trip(kind: str, logistic: Critic, mlp: Critic,
                                  training: Featurised, tmp_path: Path) -> None:
    critic = logistic if kind == "logistic" else mlp
    npz, meta = critic.save(tmp_path / "critic")
    assert npz.suffix == ".npz" and meta.suffix == ".json"
    loaded = Critic.load(tmp_path / "critic")
    assert loaded.kind == kind
    assert loaded.feature_names == FEATURE_NAMES
    assert np.allclose(loaded.realism(training.features), critic.realism(training.features))


def test_load_refuses_tampered_or_missing_files(logistic: Critic, tmp_path: Path) -> None:
    stem = tmp_path / "critic"
    npz, meta = logistic.save(stem)
    npz.write_bytes(npz.read_bytes() + b"x")
    with pytest.raises(CriticFileError, match="checksum"):
        Critic.load(stem)
    npz.unlink()
    with pytest.raises(CriticFileError, match="need both"):
        Critic.load(stem)


def test_load_refuses_foreign_json(logistic: Critic, tmp_path: Path) -> None:
    stem = tmp_path / "critic"
    _, meta = logistic.save(stem)
    meta.write_text("{not json", encoding="utf-8")
    with pytest.raises(CriticFileError, match="not valid JSON"):
        Critic.load(stem)
    meta.write_text(json.dumps({"format": "other"}), encoding="utf-8")
    with pytest.raises(CriticFileError, match="not a version"):
        Critic.load(stem)


def test_load_refuses_unknown_features(logistic: Critic, tmp_path: Path) -> None:
    stem = tmp_path / "critic"
    _, meta = logistic.save(stem)
    data = json.loads(meta.read_text(encoding="utf-8"))
    data["feature_names"] = ["sparkle"]
    meta.write_text(json.dumps(data), encoding="utf-8")
    with pytest.raises(CriticFileError, match="unknown features"):
        Critic.load(stem)


def test_train_rejects_bad_kind_and_shape(training: Featurised) -> None:
    with pytest.raises(ValueError, match="kind"):
        train_critic(training.features, training.labels, kind="forest")
    with pytest.raises(ValueError, match="names"):
        train_critic(training.features[:, :3], training.labels)


def test_subset_of_features_trains_and_scores(training: Featurised) -> None:
    names = ("seam_strength", "plastic_skin")
    columns = [FEATURE_NAMES.index(name) for name in names]
    critic = train_critic(training.features[:, columns], training.labels, names=names)
    sample = make_sample(np.random.default_rng(10), "seam", 0.9, SIZE)
    result = critic.score(make_pair(sample.before, sample.after, sample.mask, sample.face))
    assert set(result.features) == set(names)
    assert result.realism < 0.5
