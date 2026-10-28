"""Measured checkpoint scores mapped onto the arena feature gate, honestly.

`score_checkpoint_for_gate` re-audits the corpus (image bytes included), opens
the masked-patch checkpoint bound to that audit, and re-evaluates the stored
weights on the heldout split. It never trusts a stored number: the fresh
evaluation is checked for internal consistency and must equal the scores in the
checkpoint's model card, so edited or invented scores fail.

MSE and PSNR are automated proxies. The arena feature gate passes a feature only
on people's scores across all six dimensions, so this hook always reports the
gate verdict for proxy-only evidence, which is UNTESTED. Human, real-face and
release evidence stay NOT_RUN until they exist. Author: John Khan.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

from ...arena import constants as arena_constants
from ...arena.gates import FeatureScores, feature_gate
from .atomic import read_private_json
from .audit import CorpusAudit
from .masked_train import _rows, evaluate, load_masked_checkpoint, model_card_path, psnr
from .model_card import card_scores, verify_model_card
from .patches import PatchPlan
from .pipeline import TrainingPlan

GATE_SCHEMA = "beljour-training-gate-score/1"
FEATURE_ID = 94
_SCORE_KEYS = frozenset({
    "images", "masked_values", "masked_mse", "masked_psnr", "baseline_mse",
    "baseline_psnr", "beats_baseline",
})
_EVAL_KEYS = frozenset({"schema", *_SCORE_KEYS, "by_source", "human_quality"})
# Scores are rounded to 9 decimals (MSE) and 6 decimals (PSNR) when reported.
_MSE_TOLERANCE = 2e-9
_PSNR_TOLERANCE = 2e-6


def _check_score(row: object) -> dict[str, Any]:
    if not isinstance(row, dict) or set(row) != _SCORE_KEYS:
        raise ValueError("Invalid measured score row")
    for key in ("images", "masked_values"):
        if type(row[key]) is not int or row[key] < 1:
            raise ValueError("Invalid measured counts")
    for kind in ("masked", "baseline"):
        mse = row[f"{kind}_mse"]
        if isinstance(mse, bool) or not isinstance(mse, (int, float)) or not (
            math.isfinite(mse) and 0 <= mse <= 1
        ):
            raise ValueError("Invalid measured MSE")
        expected, stated = psnr(float(mse)), row[f"{kind}_psnr"]
        if (expected is None) != (stated is None) or (
            expected is not None and (not isinstance(stated, float)
                                      or abs(stated - expected) > _PSNR_TOLERANCE)
        ):
            raise ValueError("PSNR does not follow from the measured MSE")
    if row["beats_baseline"] is not (row["masked_mse"] < row["baseline_mse"]):
        raise ValueError("Baseline comparison does not follow from the scores")
    return row


def check_measurement(evaluation: object, audit: CorpusAudit) -> dict[str, Any]:
    """Refuse scores whose totals, sources or derived values do not reconcile."""
    if not isinstance(evaluation, dict) or set(evaluation) != _EVAL_KEYS:
        raise ValueError("Invalid heldout evaluation")
    if evaluation["schema"] != "beljour-masked-eval/1" or evaluation["human_quality"] != "NOT_RUN":
        raise ValueError("Invalid heldout evaluation")
    overall = _check_score({key: evaluation[key] for key in _SCORE_KEYS})
    sources = evaluation["by_source"]
    if not isinstance(sources, dict):
        raise ValueError("Invalid source scores")
    rows = {name: _check_score(row) for name, row in sources.items()}
    if {name: row["images"] for name, row in rows.items()} != audit.eval_sources:
        raise ValueError("Source totals differ from the audited heldout population")
    if overall["images"] != audit.eval_count or sum(r["images"] for r in rows.values()) != overall["images"]:
        raise ValueError("Source totals differ from the overall total")
    values = sum(row["masked_values"] for row in rows.values())
    if values != overall["masked_values"]:
        raise ValueError("Scored value counts do not reconcile")
    for kind in ("masked_mse", "baseline_mse"):
        pooled = sum(row[kind] * row["masked_values"] for row in rows.values()) / values
        if abs(pooled - overall[kind]) > _MSE_TOLERANCE * max(1, len(rows)):
            raise ValueError("Overall score is not the pooled source score")
    return evaluation


def proxy_gate() -> dict[str, Any]:
    """The arena verdict for automated proxies only: never a PASS."""
    verdict = feature_gate(FeatureScores(
        overall={dimension: None for dimension in arena_constants.DIMENSIONS},
        slices={}, source="proxy",
    ))
    return {
        "feature_id": FEATURE_ID,
        "status": verdict.status,
        "label": verdict.label,
        "reasons": list(verdict.reasons),
        "judged_by": verdict.judged_by,
    }


def score_checkpoint_for_gate(
    approved: Path,
    images: Path,
    checkpoint_dir: Path,
    plan: TrainingPlan,
    patch_plan: PatchPlan,
    *,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Re-evaluate real checkpoint weights and report them with an UNTESTED gate."""
    loaded = load_masked_checkpoint(
        approved, images, checkpoint_dir, plan, patch_plan, revocations=revocations,
    )
    card = verify_model_card(read_private_json(model_card_path(checkpoint_dir, loaded.step)))
    if (card["step"], card["checkpoint_sha256"]) != (loaded.step, loaded.archive_sha256):
        raise ValueError("Model card does not describe this checkpoint")
    if card["training"].get("manifest_sha256") != loaded.audit.manifest_sha256:
        raise ValueError("Model card was trained on a different corpus")
    evaluation = check_measurement(
        evaluate(_rows(approved, images, plan, "eval"), patch_plan, loaded.weights, loaded.audit),
        loaded.audit,
    )
    if card_scores(evaluation) != card["evaluation"]:
        raise ValueError("Recorded scores differ from the re-evaluated checkpoint")
    return {
        "schema": GATE_SCHEMA,
        "step": loaded.step,
        "measured": evaluation,
        "gate": proxy_gate(),
        "human_evidence": "NOT_RUN",
        "real_face_evaluation": "NOT_RUN",
        "release_gate": "NOT_RUN",
    }
