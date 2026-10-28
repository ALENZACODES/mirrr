"""Measured checkpoint scores reach the arena gate as UNTESTED, never PASS.

Author: John Khan.
"""

from __future__ import annotations

import copy
import hashlib
import math
from pathlib import Path
from typing import Any

import pytest

from .atomic import encode_private_json, read_private_json, write_private_json
from .audit import CorpusAudit, validate_corpus
from .gate_metrics import check_measurement, proxy_gate, score_checkpoint_for_gate
from .masked_train import model_card_path, train_masked
from .patches import PatchPlan
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def trained(tmp_path: Path) -> tuple[DrawnCorpus, Path, dict[str, Any]]:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    folder = tmp_path / "checkpoints"
    report = train_masked(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan(),
                          steps_this_run=2)
    return corpus, folder, report


def _gate(corpus: DrawnCorpus, folder: Path) -> dict[str, Any]:
    return score_checkpoint_for_gate(corpus.approved, corpus.photos, folder, corpus.plan, PatchPlan())


def _audit(corpus: DrawnCorpus) -> CorpusAudit:
    return validate_corpus(corpus.approved, corpus.photos, corpus.plan)


def test_real_scores_map_to_an_untested_gate(trained: tuple[DrawnCorpus, Path, dict[str, Any]]) -> None:
    corpus, folder, report = trained
    result = _gate(corpus, folder)
    assert result["step"] == 2
    assert result["measured"] == report["after"]
    assert result["gate"]["status"] == "UNTESTED"
    assert result["gate"]["judged_by"] == "model"
    assert result["gate"]["feature_id"] == 94
    assert result["human_evidence"] == result["release_gate"] == "NOT_RUN"


def test_proxy_gate_never_passes() -> None:
    assert proxy_gate()["status"] == "UNTESTED"
    assert "people" in proxy_gate()["reasons"][0]


def test_rewritten_card_scores_are_detected(trained: tuple[DrawnCorpus, Path, dict[str, Any]]) -> None:
    """Even a card re-sealed with a valid digest cannot carry invented numbers."""
    corpus, folder, _ = trained
    path = model_card_path(folder, 2)
    card = read_private_json(path)
    body = {key: value for key, value in card.items() if key != "integrity_sha256"}
    body["evaluation"] = {**body["evaluation"], "masked_mse": 0.000001,
                          "masked_psnr": 60.0, "beats_baseline": True}
    forged = {**body, "integrity_sha256": hashlib.sha256(encode_private_json(body)).hexdigest()}
    write_private_json(path, forged)
    with pytest.raises(ValueError, match="re-evaluated"):
        _gate(corpus, folder)


def test_missing_checkpoint_bytes_fail(trained: tuple[DrawnCorpus, Path, dict[str, Any]]) -> None:
    corpus, folder, _ = trained
    (folder / "patch-checkpoint-00000002.npz").unlink()
    with pytest.raises(ValueError):
        _gate(corpus, folder)


def test_missing_model_card_fails(trained: tuple[DrawnCorpus, Path, dict[str, Any]]) -> None:
    corpus, folder, _ = trained
    model_card_path(folder, 2).unlink()
    with pytest.raises(ValueError):
        _gate(corpus, folder)


def test_no_checkpoint_at_all_fails(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    with pytest.raises(ValueError, match="No masked checkpoint"):
        _gate(corpus, tmp_path / "empty")


def _edited(report: dict[str, Any], change: str) -> dict[str, Any]:
    result = copy.deepcopy(report)
    source = next(iter(result["by_source"]))
    if change == "psnr":
        result["masked_psnr"] = result["masked_psnr"] + 1
    elif change == "source_total":
        result["by_source"][source]["images"] += 1
    elif change == "missing_source":
        del result["by_source"][source]
    elif change == "pooled":
        result["masked_mse"] = round(result["masked_mse"] * 0.5, 9)
        result["masked_psnr"] = round(10 * math.log10(1 / result["masked_mse"]), 6)
        result["beats_baseline"] = result["masked_mse"] < result["baseline_mse"]
    elif change == "values":
        result["masked_values"] += 3
    elif change == "beats":
        result["beats_baseline"] = not result["beats_baseline"]
    elif change == "human":
        result["human_quality"] = "PASS"
    elif change == "negative":
        result["by_source"][source]["masked_mse"] = -0.1
    return result


@pytest.mark.parametrize("change", [
    "psnr", "source_total", "missing_source", "pooled", "values", "beats", "human", "negative",
])
def test_inconsistent_measurements_are_refused(
    trained: tuple[DrawnCorpus, Path, dict[str, Any]], change: str,
) -> None:
    corpus, _, report = trained
    audit = _audit(corpus)
    assert check_measurement(report["after"], audit) == report["after"]
    with pytest.raises(ValueError):
        check_measurement(_edited(report["after"], change), audit)
