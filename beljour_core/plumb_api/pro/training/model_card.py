"""Immutable model cards for masked-patch reference checkpoints.

A card records what was trained, on which audited corpus digest and with which
plans, and the heldout scores measured at save time. It states plainly what was
not done: commercial clearance is NOT_VERIFIED, and human, real-face and release
assessments are NOT_RUN. Verification refuses any card that claims otherwise.
The integrity digest detects later edits; it is not a signature. No subject,
image hash or path appears in a card. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import math
import re
from pathlib import Path
from typing import Any

from .atomic import encode_private_json, write_private_json
from .audit import CorpusAudit
from .patches import PatchPlan
from .pipeline import TrainingPlan

CARD_SCHEMA = "beljour-model-card/1"
MODEL_NAME = "BELJOUR masked-patch reconstruction reference"
INTENDED_USE = (
    "Offline research reference for the audited training pipeline only. "
    "Not a foundation model, not for release, not evidence of photo or face quality."
)
NOT_DONE = {
    "commercial_clearance": "NOT_VERIFIED",
    "human_assessment": "NOT_RUN",
    "real_face_assessment": "NOT_RUN",
    "release_status": "NOT_RELEASED",
}
CARD_KEYS = frozenset({
    "schema", "model", "intended_use", "step", "architecture", "training",
    "evaluation", "checkpoint_sha256", *NOT_DONE, "integrity_sha256",
})
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_SCORE_KEYS = frozenset({
    "images", "masked_values", "masked_mse", "masked_psnr", "baseline_mse",
    "baseline_psnr", "beats_baseline",
})


def _integrity(core: dict[str, Any]) -> str:
    return hashlib.sha256(encode_private_json(core)).hexdigest()


def card_scores(evaluation: dict[str, Any]) -> dict[str, Any]:
    """The overall heldout numbers a card keeps; per-source rows stay in reports."""
    return {key: evaluation[key] for key in sorted(_SCORE_KEYS)}


def build_model_card(
    *, step: int, patch_plan: PatchPlan, training_plan: TrainingPlan,
    audit: CorpusAudit, evaluation: dict[str, Any], checkpoint_sha256: str,
    parameters: int,
) -> dict[str, Any]:
    core: dict[str, Any] = {
        "schema": CARD_SCHEMA,
        "model": MODEL_NAME,
        "intended_use": INTENDED_USE,
        "step": step,
        "architecture": {
            "kind": "one_hidden_layer_tanh_patch_autoencoder",
            "image_size": patch_plan.image_size,
            "patch_edge": patch_plan.patch_edge,
            "hidden_dim": patch_plan.hidden_dim,
            "masked_fraction": patch_plan.masked_fraction,
            "parameters": parameters,
        },
        "training": {
            "training_plan_sha256": training_plan.digest(),
            "patch_plan_sha256": patch_plan.sha256(),
            "manifest_sha256": audit.manifest_sha256,
            "revocations_sha256": audit.revocations_sha256,
            "train_images": audit.train_count,
            "eval_images": audit.eval_count,
            "steps": step,
        },
        "evaluation": card_scores(evaluation),
        "checkpoint_sha256": checkpoint_sha256,
        **NOT_DONE,
    }
    return verify_model_card({**core, "integrity_sha256": _integrity(core)})


def _finite_number(value: object) -> bool:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    return math.isfinite(value)


def verify_model_card(document: object) -> dict[str, Any]:
    """Reject unknown fields, upgraded claims, impossible scores or edits."""
    if not isinstance(document, dict) or set(document) != CARD_KEYS:
        raise ValueError("Unsupported model card")
    if document["schema"] != CARD_SCHEMA or document["model"] != MODEL_NAME:
        raise ValueError("Unsupported model card")
    if document["intended_use"] != INTENDED_USE:
        raise ValueError("Model card intended use was changed")
    if any(document[key] != value for key, value in NOT_DONE.items()):
        raise ValueError("Model card claims an assessment that was not performed")
    step = document["step"]
    if type(step) is not int or not 1 <= step <= 10_000_000:
        raise ValueError("Invalid model card step")
    if not isinstance(document["checkpoint_sha256"], str) or not _SHA.match(
        document["checkpoint_sha256"]
    ):
        raise ValueError("Invalid model card checkpoint digest")
    training = document["training"]
    if not isinstance(training, dict) or training.get("steps") != step:
        raise ValueError("Model card training record is inconsistent")
    scores = document["evaluation"]
    if not isinstance(scores, dict) or set(scores) != _SCORE_KEYS:
        raise ValueError("Invalid model card evaluation")
    for key in ("masked_mse", "baseline_mse"):
        if not _finite_number(scores[key]) or scores[key] < 0:
            raise ValueError("Invalid model card evaluation")
    if scores["beats_baseline"] is not (scores["masked_mse"] < scores["baseline_mse"]):
        raise ValueError("Model card baseline comparison is inconsistent")
    digest = document["integrity_sha256"]
    body = {key: value for key, value in document.items() if key != "integrity_sha256"}
    if not isinstance(digest, str) or _integrity(body) != digest:
        raise ValueError("Model card was changed")
    return dict(document)


def write_model_card(path: Path, card: dict[str, Any]) -> str:
    """Publish once (0600); an existing card is never overwritten."""
    return write_private_json(path, verify_model_card(card), replace=False)
