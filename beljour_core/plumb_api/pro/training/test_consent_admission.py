"""Drawn-only consent admissions and archived-proof tampering tests.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

import pytest

from .audit import CorpusInvalid, validate_corpus
from .consent import RECEIPT_SCHEMA, TRAINING_SCOPE
from .pipeline import TrainingPlan, ingest
from .policy import Rejected, approve
from .revocations import REVOCATION_SCHEMA
from .test_support import draw_record, make_corpus

FIXED_TIMESTAMP = "2026-01-25T10:00:00Z"


def register(path: Path) -> None:
    path.write_text(json.dumps({
        "schema": REVOCATION_SCHEMA, "subjects": [], "images": [],
    }, sort_keys=True))


def opted_record(
    photos: Path, rights: Path, index: int, *, shared_subject: str | None = None,
) -> dict[str, Any]:
    row = draw_record(
        photos, rights, index, source="consented", licence="CONSENTED-COMMERCIAL",
        subject_key=shared_subject,
    )
    receipt_id = hashlib.sha256(f"receipt-{index}".encode()).hexdigest()
    receipt = {
        "schema": RECEIPT_SCHEMA,
        "receipt_id": receipt_id,
        "timestamp": FIXED_TIMESTAMP,
        "scope": TRAINING_SCOPE,
        "cooperative_opt_in": True,
        "capture_verified": True,
        "image_sha256": row["sha256"],
        "subject_key": row["subject_key"],
        "withdrawn": False,
    }
    raw = json.dumps(receipt, sort_keys=True).encode()
    digest = hashlib.sha256(raw).hexdigest()
    (rights / f"{digest}.consent.json").write_bytes(raw)
    row.update({
        "training_opt_in": True,
        "consent_receipt_id": receipt_id,
        "consent_timestamp": FIXED_TIMESTAMP,
        "consent_scope": TRAINING_SCOPE,
        "consent_sha256": digest,
    })
    return row


def corpus_with_users(root: Path) -> tuple[Path, Path, Path, Path, Path, TrainingPlan, list[dict[str, Any]]]:
    corpus = make_corpus(root)
    shared = hashlib.sha256(b"same-cooperative-subject").hexdigest()
    user_rows = [
        opted_record(
            corpus.photos, corpus.rights, number,
            shared_subject=shared if number in (100, 101) else None,
        )
        for number in range(100, 108)
    ]
    candidates = [*corpus.records, *user_rows]
    corpus.source_file().write_text(
        "".join(json.dumps(row) + "\n" for row in candidates), encoding="utf-8",
    )
    revoked = root / "revocations.json"
    register(revoked)
    report = ingest(
        corpus.source_file(), corpus.photos, corpus.rights, corpus.approved,
        plan=corpus.plan, revocations=revoked,
    )
    assert report.accepted == len(candidates)
    return (
        corpus.source_file(), corpus.photos, corpus.rights, corpus.approved,
        revoked, corpus.plan, user_rows,
    )


def test_recorded_consent_required_beside_licence(tmp_path: Path) -> None:
    photos, rights = tmp_path / "photos", tmp_path / "rights"
    row = opted_record(photos, rights, 3)
    approved = approve(row, rights)
    assert approved.consent_receipt_id == row["consent_receipt_id"]
    assert approved.consent_scope == TRAINING_SCOPE
    assert approved.consent_timestamp == FIXED_TIMESTAMP
    assert approved.consent_receipt_sha256 == row["consent_sha256"]


@pytest.mark.parametrize("missing", [
    "training_opt_in", "consent_sha256", "consent_receipt_id",
    "consent_scope", "consent_timestamp",
])
def test_no_field_is_a_training_approval(tmp_path: Path, missing: str) -> None:
    row = opted_record(tmp_path / "images", tmp_path / "rights", 4)
    row.pop(missing)
    with pytest.raises(Rejected):
        approve(row, tmp_path / "rights")


@pytest.mark.parametrize("change", [
    {"training_opt_in": False},
    {"training_opt_in": "true"},
    {"consent_scope": "visit_consent"},
    {"consent_timestamp": "2026-10-25T99:00:00Z"},
    {"consent_timestamp": "2040-01-01T12:00:00Z"},
    {"consent_receipt_id": "f" * 64},
    {"consent_sha256": "f" * 64},
    {"sha256": "a" * 64},
])
def test_false_or_mismatched_optin_rejected(tmp_path: Path, change: dict[str, object]) -> None:
    row = opted_record(tmp_path / "images", tmp_path / "rights", 5)
    row.update(change)
    with pytest.raises(Rejected):
        approve(row, tmp_path / "rights")


def test_generic_terms_agreement_never_substitutes_for_optin(tmp_path: Path) -> None:
    row = opted_record(tmp_path / "images", tmp_path / "rights", 6)
    row["accepted_terms"] = True
    row.pop("training_opt_in")
    with pytest.raises(Rejected):
        approve(row, tmp_path / "rights")


def test_change_to_saved_proof_blocks_training_audit(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    archive = approved / "consent_receipts"
    target = archive / f"{rows[0]['consent_sha256']}.consent.json"
    assert target.is_file()
    assert target.stat().st_mode & 0o077 == 0
    target.write_bytes(target.read_bytes() + b" ")
    with pytest.raises(CorpusInvalid, match="unverified_consent_provenance"):
        validate_corpus(approved, images, plan, revocations=revoked, check_image_bytes=False)


def test_missing_consent_archive_cannot_be_explained_by_matching_digest(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    (approved / "consent_receipts" / f"{rows[1]['consent_sha256']}.consent.json").unlink()
    with pytest.raises(CorpusInvalid, match="unverified_consent_provenance"):
        validate_corpus(approved, images, plan, revocations=revoked, check_image_bytes=False)


def test_opted_image_requires_revocation_register_at_ingest(tmp_path: Path) -> None:
    images, rights = tmp_path / "images", tmp_path / "rights"
    rows = [opted_record(images, rights, number) for number in range(2)]
    src = tmp_path / "source.jsonl"
    src.write_text("".join(json.dumps(row) + "\n" for row in rows))
    result = ingest(src, images, rights, tmp_path / "approved", plan=TrainingPlan())
    assert result.accepted == 0
    assert result.reason_counts == {"missing_consent_revocation_register": 2}
    record = (tmp_path / "approved" / "rejected.jsonl").read_text()
    assert "receipt" not in record
    assert rows[0]["sha256"] not in record


def test_ingest_logs_unconsented_image_without_queuing(tmp_path: Path) -> None:
    images, rights = tmp_path / "images", tmp_path / "rights"
    row = opted_record(images, rights, 7)
    row.pop("training_opt_in")
    src = tmp_path / "source.jsonl"
    src.write_text(json.dumps(row) + "\n")
    register(tmp_path / "revoke.json")
    result = ingest(
        src, images, rights, tmp_path / "filtered",
        plan=TrainingPlan(), revocations=tmp_path / "revoke.json",
    )
    assert result.accepted == 0
    assert result.rejected == 1
    assert result.reason_counts == {"missing_training_opt_in": 1}
    assert not (tmp_path / "filtered" / "train.jsonl").read_bytes()
    assert not (tmp_path / "filtered" / "eval.jsonl").read_bytes()
    rejection = (tmp_path / "filtered" / "rejected.jsonl").read_text()
    for field in ("consent_receipt_id", "image", "subject_key"):
        assert field not in rejection


def test_nonuser_source_cannot_smuggle_optin_metadata(tmp_path: Path) -> None:
    row = opted_record(tmp_path / "images", tmp_path / "rights", 8)
    row["source"] = "cc0_stock"
    row["licence"] = "CC0-1.0"
    with pytest.raises(Rejected, match="unexpected_consent_fields"):
        approve(row, tmp_path / "rights")


def test_missing_subject_bind_in_receipt_rejected(tmp_path: Path) -> None:
    row = opted_record(tmp_path / "images", tmp_path / "rights", 9)
    row["subject_key"] = hashlib.sha256(b"different-subject").hexdigest()
    with pytest.raises(Rejected, match="consent_binding_mismatch"):
        approve(row, tmp_path / "rights")


def test_consent_after_reingest_has_only_current_receipts(tmp_path: Path) -> None:
    source, images, rights, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    assert len(list((approved / "consent_receipts").glob("*.consent.json"))) == len(rows)
    base_rows = [json.loads(line) for line in source.read_text().splitlines()]
    source.write_text("".join(json.dumps(row) + "\n" for row in base_rows[:-1]))
    ingest(source, images, rights, approved, plan=plan, revocations=revoked)
    assert len(list((approved / "consent_receipts").glob("*.consent.json"))) == len(rows) - 1
    validate_corpus(approved, images, plan, revocations=revoked)
