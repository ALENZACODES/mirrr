"""Verify filtered-corpus integrity before any training or evaluation. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import stat
import tempfile
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .consent import ConsentRejected, checked_saved_consent
from .pipeline import TrainingPlan, checked_image, manifest_digest_files, partition
from .policy import ALLOWED, ImageGrant
from .revocations import parse_revocations

CORPUS_SCHEMA = "beljour-ingest/1"
MAX_ROW_BYTES = 4096
MAX_SUMMARY_BYTES = 32768
MAX_MANIFEST_ROWS = 3_200_000
GRANT_FIELDS = frozenset(ImageGrant.__dataclass_fields__)


class CorpusInvalid(ValueError):
    """Privacy-safe code for an untrusted corpus or revocation input."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class CorpusAudit:
    image_size: int
    train_count: int
    eval_count: int
    source_counts: dict[str, int]
    train_sources: dict[str, int]
    eval_sources: dict[str, int]
    manifest_sha256: str
    train_sha256: str
    eval_sha256: str
    revocations_sha256: str | None
    status: str = "AUDITED_NOT_RELEASED"

    def public(self) -> dict[str, Any]:
        """Return aggregates only; no subject keys, hashes or file paths."""
        return {
            "schema": "beljour-corpus-audit/1",
            "image_size": self.image_size,
            "train_count": self.train_count,
            "eval_count": self.eval_count,
            "source_counts": dict(sorted(self.source_counts.items())),
            "train_sources": dict(sorted(self.train_sources.items())),
            "eval_sources": dict(sorted(self.eval_sources.items())),
            "status": self.status,
            "model_quality": "NOT_RUN",
        }


def _plain_file(path: Path, *, max_bytes: int) -> bytes:
    """Reject symlinks, oversized files and nonregular input records."""
    try:
        before = path.lstat()
        if not stat.S_ISREG(before.st_mode) or before.st_size > max_bytes:
            raise CorpusInvalid("untrusted_input_file")
        if before.st_size < 1:
            raise CorpusInvalid("empty_input_file")
        with path.open("rb") as stream:
            data = stream.read(max_bytes + 1)
        after = path.lstat()
        if len(data) > max_bytes or (before.st_dev, before.st_ino) != (
            after.st_dev, after.st_ino
        ):
            raise CorpusInvalid("changed_input_file")
        return data
    except OSError as exc:
        raise CorpusInvalid("missing_input_file") from exc


def _json_dict(data: bytes, code: str) -> dict[str, Any]:
    try:
        value: object = json.loads(data)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise CorpusInvalid(code) from exc
    if not isinstance(value, dict) or any(not isinstance(k, str) for k in value):
        raise CorpusInvalid(code)
    return value


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _valid_grant(record: object) -> ImageGrant:
    if not isinstance(record, dict) or set(record) != GRANT_FIELDS:
        raise CorpusInvalid("invalid_filtered_record")
    if any(not isinstance(value, str) for value in record.values()):
        raise CorpusInvalid("invalid_filtered_record")
    grant = ImageGrant(**record)
    if grant.source not in ALLOWED or grant.licence not in ALLOWED[grant.source]:
        raise CorpusInvalid("filtered_licence_violation")
    for key in (grant.sha256, grant.subject_key):
        if len(key) != 64 or any(letter not in "0123456789abcdef" for letter in key):
            raise CorpusInvalid("invalid_filtered_record")
    if not grant.group or len(grant.group) > 48:
        raise CorpusInvalid("invalid_filtered_record")
    consent_fields = (
        grant.consent_receipt_sha256, grant.consent_receipt_id,
        grant.consent_timestamp, grant.consent_scope,
    )
    if grant.source == "consented":
        if not all(consent_fields):
            raise CorpusInvalid("missing_filtered_consent")
    elif any(consent_fields):
        raise CorpusInvalid("unexpected_filtered_consent")
    return grant


def _iter_rows(path: Path, *, split: str, plan: TrainingPlan) -> Iterator[ImageGrant]:
    try:
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode):
            raise CorpusInvalid("invalid_filtered_file")
        with path.open("rb") as stream:
            for number, line in enumerate(stream, 1):
                if number > MAX_MANIFEST_ROWS or not line or len(line) > MAX_ROW_BYTES:
                    raise CorpusInvalid("filtered_manifest_size")
                if not line.endswith(b"\n"):
                    raise CorpusInvalid("incomplete_filtered_manifest")
                record = _json_dict(line, "invalid_filtered_record")
                grant = _valid_grant(record)
                if partition(grant.subject_key, plan.seed, plan.holdout_fraction) != split:
                    raise CorpusInvalid("cross_split_subject")
                yield grant
    except OSError as exc:
        raise CorpusInvalid("missing_filtered_file") from exc


def _check_rejections(path: Path, expected: int) -> None:
    """Verify that the rejection log contains reason codes, never private records."""
    found = 0
    try:
        with path.open("rb") as stream:
            for line in stream:
                if len(line) > 256 or not line.endswith(b"\n"):
                    raise CorpusInvalid("invalid_rejection_record")
                row = _json_dict(line, "invalid_rejection_record")
                if set(row) != {"row", "reason"}:
                    raise CorpusInvalid("private_rejection_record")
                if type(row["row"]) is not int or row["row"] < 1:
                    raise CorpusInvalid("invalid_rejection_record")
                if not isinstance(row["reason"], str) or not row["reason"].isidentifier():
                    raise CorpusInvalid("invalid_rejection_record")
                found += 1
    except OSError as exc:
        raise CorpusInvalid("missing_rejection_file") from exc
    if found != expected:
        raise CorpusInvalid("wrong_rejection_counts")


def validate_corpus(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    revocations: Path | None = None,
    check_image_bytes: bool = True,
) -> CorpusAudit:
    """Read both manifests independently and verify the ingest attestation.

    Revocations are an additional live input; missing revocations must never
    mean that a known revoked subject is admitted.
    """
    plan.validate()
    if (approved / "consent-hold.json").exists():
        raise CorpusInvalid("consent_withdrawal_in_progress")
    if approved.is_symlink() or images.is_symlink():
        raise CorpusInvalid("untrusted_directory")
    summary = _json_dict(
        _plain_file(approved / "summary.json", max_bytes=MAX_SUMMARY_BYTES),
        "invalid_summary",
    )
    if summary.get("schema") != CORPUS_SCHEMA or summary.get("plan_sha256") != plan.digest():
        raise CorpusInvalid("unmatched_ingest_plan")
    if summary.get("digest_version") != 2:
        raise CorpusInvalid("obsolete_manifest_digest")
    digest = manifest_digest_files(approved / "train.jsonl", approved / "eval.jsonl")
    if summary.get("manifest_sha256") != digest:
        raise CorpusInvalid("changed_filtered_manifest")
    revoked = parse_revocations(revocations)
    if summary.get("revocations_sha256") != revoked.sha256:
        raise CorpusInvalid("changed_revocation_register")
    scanned = summary.get("scanned")
    rejected = summary.get("rejected")
    if type(scanned) is not int or type(rejected) is not int:
        raise CorpusInvalid("wrong_ingest_counts")
    if scanned < 0 or rejected < 0:
        raise CorpusInvalid("wrong_ingest_counts")
    _check_rejections(approved / "rejected.jsonl", rejected)
    withdrawn = summary.get("withdrawn", 0)
    if type(withdrawn) is not int or withdrawn < 0:
        raise CorpusInvalid("invalid_withdrawal_counts")
    if withdrawn:
        audit_file = approved / "withdrawn.jsonl"
        if summary.get("withdrawal_sha256") != _file_hash(audit_file):
            raise CorpusInvalid("changed_withdrawal_ledger")
        checked_withdrawals: set[str] = set()
        with audit_file.open("rb") as stream:
            for line in stream:
                if len(line) > 256 or not line.endswith(b"\n"):
                    raise CorpusInvalid("invalid_withdrawal_record")
                record = _json_dict(line, "invalid_withdrawal_record")
                if set(record) != {"receipt_id", "reason"}:
                    raise CorpusInvalid("invalid_withdrawal_record")
                receipt = record["receipt_id"]
                if (not isinstance(receipt, str) or len(receipt) != 64
                    or any(c not in "0123456789abcdef" for c in receipt)
                    or record["reason"] != "consent_withdrawn"):
                    raise CorpusInvalid("invalid_withdrawal_record")
                if receipt in checked_withdrawals or receipt not in revoked.receipts:
                    raise CorpusInvalid("unverified_withdrawal")
                checked_withdrawals.add(receipt)
        if len(checked_withdrawals) != withdrawn:
            raise CorpusInvalid("invalid_withdrawal_counts")
    counts: Counter[str] = Counter()
    train_counts: Counter[str] = Counter()
    eval_counts: Counter[str] = Counter()
    populations = {"train": 0, "eval": 0}
    with tempfile.TemporaryDirectory(prefix=".filtered-audit-", dir=approved.parent) as folder:
        with sqlite3.connect(str(Path(folder) / "membership.db")) as database:
            database.execute("CREATE TABLE images (image TEXT PRIMARY KEY)")
            database.execute("CREATE TABLE subjects (subject TEXT PRIMARY KEY, split TEXT)")
            for split in ("train", "eval"):
                source_file = approved / f"{split}.jsonl"
                for grant in _iter_rows(source_file, split=split, plan=plan):
                    try:
                        database.execute("INSERT INTO images VALUES (?)", (grant.sha256,))
                    except sqlite3.IntegrityError as exc:
                        raise CorpusInvalid("duplicate_approved_image") from exc
                    subject_row = database.execute(
                        "SELECT split FROM subjects WHERE subject = ?", (grant.subject_key,)
                    ).fetchone()
                    if subject_row is not None and subject_row[0] != split:
                        raise CorpusInvalid("cross_split_subject")
                    if subject_row is None:
                        database.execute(
                            "INSERT INTO subjects VALUES (?, ?)", (grant.subject_key, split)
                        )
                    if revoked.rejects(
                        grant.subject_key, grant.sha256, grant.consent_receipt_id,
                    ):
                        raise CorpusInvalid("revoked_training_item")
                    if grant.source == "consented":
                        try:
                            checked_saved_consent(
                                approved / "consent_receipts",
                                image_sha256=grant.sha256,
                                subject_key=grant.subject_key,
                                receipt_sha256=grant.consent_receipt_sha256,
                                receipt_id=grant.consent_receipt_id,
                                timestamp=grant.consent_timestamp,
                                scope=grant.consent_scope,
                            )
                        except ConsentRejected as exc:
                            raise CorpusInvalid("unverified_consent_provenance") from exc
                    populations[split] += 1
                    counts[grant.source] += 1
                    if split == "train":
                        train_counts[grant.source] += 1
                    else:
                        eval_counts[grant.source] += 1
                    if check_image_bytes:
                        checked_image(images, grant)
    accepted = populations["train"] + populations["eval"]
    if populations["train"] < 1 or populations["eval"] < 1:
        raise CorpusInvalid("missing_split")
    if summary.get("accepted") != accepted or scanned != accepted + rejected + withdrawn:
        raise CorpusInvalid("wrong_ingest_counts")

    return CorpusAudit(
        image_size=plan.image_size,
        train_count=populations["train"],
        eval_count=populations["eval"],
        source_counts=dict(counts),
        train_sources=dict(train_counts),
        eval_sources=dict(eval_counts),
        manifest_sha256=digest,
        train_sha256=_file_hash(approved / "train.jsonl"),
        eval_sha256=_file_hash(approved / "eval.jsonl"),
        revocations_sha256=revoked.sha256,
    )
