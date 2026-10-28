"""Model cards state what was measured and refuse upgraded claims. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import stat
from pathlib import Path
from typing import Any

import pytest

from .atomic import encode_private_json
from .audit import CorpusAudit, validate_corpus
from .model_card import NOT_DONE, build_model_card, verify_model_card, write_model_card
from .patches import PatchPlan
from .pipeline import TrainingPlan
from .test_support import make_corpus

SCORES = {
    "schema": "beljour-masked-eval/1", "images": 6, "masked_values": 9216,
    "masked_mse": 0.0031, "masked_psnr": 25.08638, "baseline_mse": 0.003,
    "baseline_psnr": 25.228787, "beats_baseline": False, "by_source": {},
    "human_quality": "NOT_RUN",
}
Audited = tuple[TrainingPlan, CorpusAudit]


@pytest.fixture(scope="module")
def audited(tmp_path_factory: pytest.TempPathFactory) -> Audited:
    corpus = make_corpus(tmp_path_factory.mktemp("card-corpus"), size=18)
    return corpus.plan, validate_corpus(corpus.approved, corpus.photos, corpus.plan)


def _card(audited: Audited, **changes: Any) -> dict[str, Any]:
    plan, audit = audited
    return build_model_card(
        step=4, patch_plan=PatchPlan(), training_plan=plan, audit=audit,
        evaluation={**SCORES, **changes}, checkpoint_sha256="c" * 64, parameters=3216,
    )


def _resealed(card: dict[str, Any], **changes: Any) -> dict[str, Any]:
    """An edited card with a recomputed digest: the claims check must still refuse it."""
    body = {key: value for key, value in card.items() if key != "integrity_sha256"}
    body.update(changes)
    return {**body, "integrity_sha256": hashlib.sha256(encode_private_json(body)).hexdigest()}


def test_card_records_audit_and_states_what_was_not_done(audited: Audited) -> None:
    card = _card(audited)
    for key, value in NOT_DONE.items():
        assert card[key] == value
    assert card["training"]["train_images"] + card["training"]["eval_images"] == 18
    assert card["evaluation"]["masked_mse"] == 0.0031
    assert "by_source" not in card["evaluation"]
    text = json.dumps(card)
    assert "subject" not in text and "drawn-" not in text
    assert verify_model_card(json.loads(text)) == card


@pytest.mark.parametrize(("field", "value"), [
    ("commercial_clearance", "VERIFIED"), ("human_assessment", "PASS"),
    ("real_face_assessment", "PASS"), ("release_status", "RELEASED"),
])
def test_upgraded_claims_are_refused_even_with_a_valid_digest(
    audited: Audited, field: str, value: str,
) -> None:
    with pytest.raises(ValueError, match="not performed"):
        verify_model_card(_resealed(_card(audited), **{field: value}))


def test_edited_scores_break_the_digest(audited: Audited) -> None:
    card = _card(audited)
    card["evaluation"] = {**card["evaluation"], "masked_mse": 0.0001, "beats_baseline": True}
    with pytest.raises(ValueError, match="changed"):
        verify_model_card(card)


def test_inconsistent_baseline_claim_is_refused(audited: Audited) -> None:
    with pytest.raises(ValueError, match="baseline"):
        _card(audited, beats_baseline=True)


@pytest.mark.parametrize("damage", ["extra", "missing", "step", "digest", "use", "score"])
def test_malformed_cards(audited: Audited, damage: str) -> None:
    card = _card(audited)
    if damage == "extra":
        card = _resealed(card, note="better than the reference app")
    elif damage == "missing":
        card = {key: value for key, value in card.items() if key != "architecture"}
    elif damage == "step":
        card = _resealed(card, step=5)
    elif damage == "digest":
        card = _resealed(card, checkpoint_sha256="not-a-digest")
    elif damage == "use":
        card = _resealed(card, intended_use="Production portrait model")
    else:
        card = _resealed(card, evaluation={**card["evaluation"], "masked_mse": -0.5})
    with pytest.raises(ValueError):
        verify_model_card(card)


def test_cards_are_written_once_and_owner_only(tmp_path: Path, audited: Audited) -> None:
    card = _card(audited)
    target = tmp_path / "card.json"
    digest = write_model_card(target, card)
    assert len(digest) == 64
    assert stat.S_IMODE(target.stat().st_mode) == 0o600
    with pytest.raises(FileExistsError):
        write_model_card(target, card)
