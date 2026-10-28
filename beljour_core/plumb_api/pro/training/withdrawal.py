"""Propagate revoked model-training consent through approved dataset manifests.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import stat
import tempfile
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from pathlib import Path

from .atomic import read_private_json, write_private_json
from .audit import _iter_rows, validate_corpus
from .pipeline import TrainingPlan, manifest_digest_files
from .policy import ImageGrant
from .revocations import REVOCATION_SCHEMA_V2, parse_revocations

_SHA = re.compile(r"[0-9a-f]{64}\Z")
LINEAGE_SCHEMA = "beljour-checkpoint-consent-lineage/1"
MAX_WITHDRAWALS = 3_200_000
_ALLOWED_MANIFESTS = frozenset({
    "train.jsonl", "eval.jsonl", "rejected.jsonl", "withdrawn.jsonl",
})


class WithdrawalError(ValueError):
    """No error message includes private subjects, images or receipt IDs."""


@dataclass(frozen=True)
class WithdrawalResult:
    removed: int
    remaining: int
    checkpoint_status: str

    def public(self) -> dict[str, object]:
        return {
            "schema": "beljour-consent-withdrawal-result/1",
            "withdrawn": self.removed,
            "remaining": self.remaining,
            "checkpoint_status": self.checkpoint_status,
        }


def _checked_identifiers(values: Sequence[str]) -> frozenset[str]:
    if not 1 <= len(values) <= min(MAX_WITHDRAWALS, 20000):
        raise WithdrawalError("invalid_withdrawal_request")
    if any(not isinstance(value, str) or _SHA.fullmatch(value) is None for value in values):
        raise WithdrawalError("invalid_withdrawal_request")
    if len(set(values)) != len(values):
        raise WithdrawalError("duplicate_withdrawal_request")
    return frozenset(values)


def _checked_directory(approved: Path) -> None:
    if approved.is_symlink() or not approved.is_dir():
        raise WithdrawalError("invalid_approved_directory")
    if approved.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise WithdrawalError("untrusted_approved_directory")
    for file in approved.rglob("*.jsonl"):
        if file.parent != approved or file.name not in _ALLOWED_MANIFESTS:
            raise WithdrawalError("untracked_dataset_manifest")
    for suffix in ("*.sqlite", "*.sqlite3", "*.db"):
        if any(approved.rglob(suffix)):
            raise WithdrawalError("untracked_derived_dataset_index")


def _serialize_grant(grant: ImageGrant) -> bytes:
    return json.dumps(asdict(grant), sort_keys=True, separators=(",", ":")).encode() + b"\n"


def _check_lineage(path: Path, current: str) -> list[str]:
    if not path.exists():
        return []
    record = read_private_json(path)
    if set(record) != {
        "schema", "old_manifests", "current_manifest", "status",
    } or record["schema"] != LINEAGE_SCHEMA:
        raise WithdrawalError("invalid_checkpoint_lineage")
    if record["current_manifest"] != current or record["status"] != "RETRAIN_REQUIRED":
        raise WithdrawalError("invalid_checkpoint_lineage")
    old = record["old_manifests"]
    if not isinstance(old, list) or any(
        not isinstance(item, str) or _SHA.fullmatch(item) is None for item in old
    ):
        raise WithdrawalError("invalid_checkpoint_lineage")
    return list(old)


def withdraw_approved_consent(
    approved: Path, images: Path, plan: TrainingPlan,
    revocation_register: Path, receipts: Sequence[str],
) -> WithdrawalResult:
    """Remove withdrawn receipts from both approved splits and invalidate old weights.

    The revocation register is updated before new manifests are published. A
    crash leaves an explicit hold, which blocks training until reconciliation.
    Downstream copies must be inventoried and retired by the local operator.
    """
    _checked_directory(approved)
    requested = _checked_identifiers(receipts)
    previous_register = parse_revocations(revocation_register)
    old_audit = validate_corpus(
        approved, images, plan, revocations=revocation_register,
        check_image_bytes=False,
    )
    old_summary = read_private_json(approved / "summary.json")
    old_withdrawn = old_summary.get("withdrawn", 0)
    if type(old_withdrawn) is not int or old_withdrawn < 0:
        raise WithdrawalError("invalid_withdrawal_summary")
    history = _check_lineage(approved / "checkpoint-provenance.json", old_audit.manifest_sha256)
    found: dict[str, str] = {}
    for split in ("train", "eval"):
        for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan):
            if grant.source == "consented" and grant.consent_receipt_id in requested:
                found[grant.consent_receipt_id] = grant.subject_key
    if not requested.issubset(found):
        raise WithdrawalError("unknown_consent_withdrawal")
    affected_subjects = {found[receipt] for receipt in requested}
    # Preflight both populations so a withdrawal never manufactures a missing split.
    remaining: dict[str, int] = {"train": 0, "eval": 0}
    for split in ("train", "eval"):
        for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan):
            if not (grant.source == "consented" and grant.subject_key in affected_subjects):
                remaining[split] += 1
    if not remaining["train"] or not remaining["eval"]:
        raise WithdrawalError("rebuild_required_after_withdrawal")
    hold = approved / "consent-hold.json"
    write_private_json(hold, {
        "schema": "beljour-consent-hold/1", "status": "WITHDRAWAL_IN_PROGRESS",
    }, replace=False)
    temporary: dict[str, Path] = {}
    try:
        selected: set[str] = set()
        removed_proofs: set[str] = set()
        removed_images: set[str] = set()
        for split in ("train", "eval"):
            fd, name = tempfile.mkstemp(prefix=".withdrawing-", dir=approved)
            temporary[split] = Path(name)
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, "wb") as output:
                for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan):
                    if grant.source == "consented" and grant.subject_key in affected_subjects:
                        if grant.consent_receipt_id in selected:
                            raise WithdrawalError("duplicate_consent_receipt")
                        selected.add(grant.consent_receipt_id)
                        removed_images.add(grant.sha256)
                        removed_proofs.add(grant.consent_receipt_sha256)
                    else:
                        output.write(_serialize_grant(grant))
                output.flush()
                os.fsync(output.fileno())
        fd, name = tempfile.mkstemp(prefix=".withdrawing-", dir=approved)
        temporary["withdrawn"] = Path(name)
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb") as output:
            previous = approved / "withdrawn.jsonl"
            if old_withdrawn:
                with previous.open("rb") as prior:
                    for chunk in iter(lambda: prior.read(1024 * 1024), b""):
                        output.write(chunk)
            for receipt_id in sorted(selected):
                output.write(json.dumps({
                    "receipt_id": receipt_id, "reason": "consent_withdrawn",
                }, sort_keys=True).encode() + b"\n")
            output.flush()
            os.fsync(output.fileno())
        if len(previous_register.receipts | selected) > MAX_WITHDRAWALS:
            raise WithdrawalError("revocation_limit")
        version_two = {
            "schema": REVOCATION_SCHEMA_V2,
            "subjects": sorted(previous_register.subjects | affected_subjects),
            "images": sorted(previous_register.images | removed_images),
            "receipts": sorted(previous_register.receipts | selected),
        }
        write_private_json(revocation_register, version_two)
        updated_revocations = parse_revocations(revocation_register)
        for name in ("train", "eval", "withdrawn"):
            os.replace(temporary[name], approved / f"{name}.jsonl")
        new_manifest = manifest_digest_files(
            approved / "train.jsonl", approved / "eval.jsonl",
        )
        old_summary["accepted"] -= len(selected)
        old_summary["withdrawn"] = old_withdrawn + len(selected)
        old_summary["withdrawal_sha256"] = hashlib.sha256(
            (approved / "withdrawn.jsonl").read_bytes(),
        ).hexdigest()
        old_summary["manifest_sha256"] = new_manifest
        old_summary["revocations_sha256"] = updated_revocations.sha256
        write_private_json(approved / "summary.json", old_summary)
        write_private_json(approved / "checkpoint-provenance.json", {
            "schema": LINEAGE_SCHEMA,
            "old_manifests": sorted(set([*history, old_audit.manifest_sha256])),
            "current_manifest": new_manifest,
            "status": "RETRAIN_REQUIRED",
        })
        for digest in removed_proofs:
            (approved / "consent_receipts" / f"{digest}.consent.json").unlink(missing_ok=True)
        hold.unlink()
        checked = validate_corpus(
            approved, images, plan, revocations=revocation_register,
            check_image_bytes=False,
        )
        return WithdrawalResult(
            len(selected), checked.train_count + checked.eval_count, "RETRAIN_REQUIRED",
        )
    finally:
        for path in temporary.values():
            path.unlink(missing_ok=True)
