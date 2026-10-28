"""Offline privacy-safe operator commands for filtered training. Author: John Khan."""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from dataclasses import fields
from pathlib import Path
from typing import Any

from .audit import validate_corpus
from .certificate import export_certificate
from .coverage import group_coverage
from .gate_metrics import score_checkpoint_for_gate
from .masked_train import score_masked_checkpoint, train_masked
from .patches import PatchPlan
from .pipeline import TrainingPlan
from .scoring import compare_aggregates, score_aggregates
from .shard_index import build_shard_index
from .shard_stream import ShardReader
from .shards import plan_shards
from .train import train
from .withdrawal import withdraw_approved_consent

MAX_PLAN_BYTES = 8192
MAX_SCORE_BYTES = 262144


class OperatorFailure(ValueError):
    """An operator error with no paths or private source metadata."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


def _json_file(path: Path, *, size_limit: int) -> object:
    try:
        if path.is_symlink() or path.stat().st_size > size_limit:
            raise OperatorFailure("invalid_operator_input")
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise OperatorFailure("invalid_operator_input") from exc


def read_plan(path: Path) -> TrainingPlan:
    obj = _json_file(path, size_limit=MAX_PLAN_BYTES)
    if not isinstance(obj, dict):
        raise OperatorFailure("invalid_training_plan")
    allowed = {item.name for item in fields(TrainingPlan)}
    if set(obj) != allowed:
        raise OperatorFailure("invalid_training_plan")
    for name in ("image_size", "latent_dim", "batch_size", "steps", "seed"):
        if type(obj[name]) is not int:
            raise OperatorFailure("invalid_training_plan")
    for name in ("learning_rate", "holdout_fraction"):
        if isinstance(obj[name], bool) or not isinstance(obj[name], (int, float)):
            raise OperatorFailure("invalid_training_plan")
    plan = TrainingPlan(**obj)
    try:
        plan.validate()
    except ValueError as exc:
        raise OperatorFailure("invalid_training_plan") from exc
    return plan


def read_patch_plan(path: Path) -> PatchPlan:
    obj = _json_file(path, size_limit=MAX_PLAN_BYTES)
    if not isinstance(obj, dict):
        raise OperatorFailure("invalid_patch_plan")
    allowed = {item.name for item in fields(PatchPlan)}
    if set(obj) != allowed:
        raise OperatorFailure("invalid_patch_plan")
    for name in ("image_size", "patch_edge", "hidden_dim", "seed"):
        if type(obj[name]) is not int:
            raise OperatorFailure("invalid_patch_plan")
    amount = obj["masked_fraction"]
    if isinstance(amount, bool) or not isinstance(amount, (int, float)):
        raise OperatorFailure("invalid_patch_plan")
    plan = PatchPlan(**obj)
    try:
        plan.validate()
    except ValueError as exc:
        raise OperatorFailure("invalid_patch_plan") from exc
    return plan


def _arguments(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="beljour-training-operator")
    actions = parser.add_subparsers(dest="action", required=True)
    for action in (
        "audit", "coverage", "shards", "run", "score", "run-patches", "score-patches",
        "certificate", "gate-score", "resume-shard", "index-shards",
        "withdraw-consent",
    ):
        sub = actions.add_parser(action)
        sub.add_argument("--approved", required=True, type=Path)
        sub.add_argument("--images", required=True, type=Path)
        sub.add_argument("--plan", required=True, type=Path)
        sub.add_argument("--revocations", type=Path)
        if action == "withdraw-consent":
            sub.add_argument("--receipts", required=True, type=Path)
        if action == "index-shards":
            sub.add_argument("--index-dir", required=True, type=Path)
            sub.add_argument("--count", type=int, default=64)
        if action == "certificate":
            sub.add_argument("--output", required=True, type=Path)
        if action == "resume-shard":
            sub.add_argument("--cursor", required=True, type=Path)
            sub.add_argument("--shard", required=True, type=int)
            sub.add_argument("--shard-count", required=True, type=int)
            sub.add_argument("--batch", type=int, default=64)
            sub.add_argument("--split", choices=("train", "eval"), default="train")
        if action == "coverage":
            sub.add_argument("--minimum", type=int, default=30)
        if action == "shards":
            sub.add_argument("--count", type=int, default=64)
        if action in ("run-patches", "score-patches", "gate-score"):
            sub.add_argument("--patch-plan", required=True, type=Path)
            sub.add_argument("--checkpoint-dir", required=True, type=Path)
        if action == "run-patches":
            sub.add_argument("--steps", type=int)
            sub.add_argument("--resume", action="store_true")
            sub.add_argument("--memory-mib", type=int, default=2048)
        if action == "run":
            sub.add_argument("--checkpoint-dir", required=True, type=Path)
            sub.add_argument("--steps", type=int)
            sub.add_argument("--resume", action="store_true")
        if action == "score":
            sub.add_argument("--scores", required=True, type=Path)
            sub.add_argument("--baseline", type=Path)
    return parser.parse_args(argv)


def execute(argv: Sequence[str]) -> dict[str, Any]:
    """Execute locally without printing filenames, subjects or private manifests."""
    args = _arguments(argv)
    plan = read_plan(args.plan)
    if args.action == "withdraw-consent":
        if args.revocations is None:
            raise OperatorFailure("revocation_register_required")
        requested: object = _json_file(args.receipts, size_limit=262144)
        if not isinstance(requested, list) or any(
            not isinstance(item, str) for item in requested
        ):
            raise OperatorFailure("invalid_withdrawal_receipt_list")
        return withdraw_approved_consent(
            args.approved, args.images, plan, args.revocations, requested,
        ).public()
    if args.action == "index-shards":
        return build_shard_index(
            args.approved, args.images, plan, args.index_dir,
            shard_count=args.count, revocations=args.revocations,
        )
    if args.action == "certificate":
        return export_certificate(
            args.output, args.approved, args.images, plan, revocations=args.revocations,
        )
    if args.action == "gate-score":
        return score_checkpoint_for_gate(
            args.approved, args.images, args.checkpoint_dir, plan,
            read_patch_plan(args.patch_plan), revocations=args.revocations,
        )
    if args.action == "resume-shard":
        reader = ShardReader(
            args.approved, args.images, plan,
            shard=args.shard, shard_count=args.shard_count,
            split=args.split, revocations=args.revocations,
        )
        if args.cursor.is_file():
            reader.resume(args.cursor)
        reader.next_batch(args.batch)
        reader.checkpoint(args.cursor)
        return reader.public()
    # The four new actions each validate the approved manifests themselves.
    # Avoid another full 3M-item audit before streaming or indexed work begins.
    audit = validate_corpus(
        args.approved, args.images, plan, revocations=args.revocations,
        check_image_bytes=args.action in ("audit", "run"),
    )
    if args.action == "audit":
        return audit.public()
    if args.action == "coverage":
        return group_coverage(
            args.approved, args.images, plan,
            minimum=args.minimum, checked=audit,
        ).public()
    if args.action == "shards":
        return plan_shards(
            args.approved, args.images, plan,
            shard_count=args.count, checked=audit,
        ).public()
    if args.action == "run":
        if args.steps is not None and args.steps < 1:
            raise OperatorFailure("invalid_run_length")
        return train(
            args.approved, args.images, args.checkpoint_dir, plan,
            resume=args.resume, steps_this_run=args.steps,
            revocations=args.revocations,
        )
    if args.action == "run-patches":
        patch_plan = read_patch_plan(args.patch_plan)
        if args.memory_mib < 1 or args.memory_mib > 262144:
            raise OperatorFailure("invalid_memory_budget")
        return train_masked(
            args.approved, args.images, args.checkpoint_dir,
            plan, patch_plan,
            resume=args.resume, steps_this_run=args.steps,
            revocations=args.revocations,
            memory_budget_bytes=args.memory_mib * 1024 * 1024,
        )
    if args.action == "score-patches":
        return score_masked_checkpoint(
            args.approved, args.images, args.checkpoint_dir,
            plan, read_patch_plan(args.patch_plan),
            revocations=args.revocations,
        )
    if args.action == "score":
        score_rows = _json_file(args.scores, size_limit=MAX_SCORE_BYTES)
        card = score_aggregates(audit, score_rows)
        response = card.public()
        if args.baseline is not None:
            previous = _json_file(args.baseline, size_limit=MAX_SCORE_BYTES)
            prior = score_aggregates(audit, previous)
            response["comparison"] = compare_aggregates(prior, card)
        return response
    raise OperatorFailure("invalid_operator_action")


def main(argv: Sequence[str] | None = None) -> int:
    """Report constant error codes and aggregates only, even when input is hostile."""
    try:
        output = execute(sys.argv[1:] if argv is None else argv)
    except (ValueError, OSError, RuntimeError):
        print(json.dumps({"status": "ERROR", "reason": "invalid_local_training_input"}))
        return 2
    print(json.dumps(output, sort_keys=True, allow_nan=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
