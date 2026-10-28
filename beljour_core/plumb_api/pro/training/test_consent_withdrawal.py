"""Withdraw consent in private corpora and flag earlier checkpoints.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path

import pytest

from .audit import CorpusInvalid, validate_corpus
from .certificate import build_certificate, verify_certificate
from .operator import OperatorFailure, execute
from .pipeline import ingest
from .revocations import REVOCATION_SCHEMA_V2, parse_revocations
from .test_consent_admission import corpus_with_users
from .train import train
from .withdrawal import WithdrawalError, withdraw_approved_consent


def test_withdrawal_removes_subject_from_both_manifests(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    first_subject = rows[0]["subject_key"]
    receipt = str(rows[0]["consent_receipt_id"])
    original = validate_corpus(approved, images, plan, revocations=revoked)
    result = withdraw_approved_consent(approved, images, plan, revoked, (receipt,))
    assert result.removed == 2
    assert result.remaining == original.train_count + original.eval_count - 2
    assert result.checkpoint_status == "RETRAIN_REQUIRED"
    after = validate_corpus(approved, images, plan, revocations=revoked)
    assert after.manifest_sha256 != original.manifest_sha256
    for name in ("train.jsonl", "eval.jsonl"):
        for line in (approved / name).read_text().splitlines():
            assert json.loads(line)["subject_key"] != first_subject
    for row in rows[:2]:
        assert not (
            approved / "consent_receipts" / f"{row['consent_sha256']}.consent.json"
        ).exists()
    register = parse_revocations(revoked)
    assert register.rejects(str(first_subject), str(rows[0]["sha256"]), receipt)
    assert register.receipts.issuperset({str(row["consent_receipt_id"]) for row in rows[:2]})


def test_withdrawal_marks_preexisting_checkpoint_invalid(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    saved = tmp_path / "checkpoint"
    first = train(approved, images, saved, plan, revocations=revoked, steps_this_run=2)
    assert first["steps"] == 2
    withdraw_approved_consent(
        approved, images, plan, revoked, (str(rows[0]["consent_receipt_id"]),),
    )
    with pytest.raises(ValueError, match="digest|revocation|manifest|mismatch|Input or configuration changed"):
        train(approved, images, saved, plan, revocations=revoked, resume=True)
    certificate = build_certificate(approved, images, plan, revocations=revoked)
    assert certificate["checkpoint_consent_status"] == (
        "PRE_WITHDRAWAL_CHECKPOINTS_RETRAIN_REQUIRED"
    )
    assert certificate["withdrawn_consent_records"] == 2
    assert certificate["active_consented_records"] == 6
    assert verify_certificate(certificate) == certificate
    public = json.dumps(certificate)
    for row in rows:
        assert row["subject_key"] not in public
        assert row["consent_receipt_id"] not in public


def test_revoked_consent_cannot_reenter_on_next_ingest(tmp_path: Path) -> None:
    source, images, rights, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    withdraw_approved_consent(
        approved, images, plan, revoked, [str(rows[0]["consent_receipt_id"])],
    )
    second = tmp_path / "retrained"
    report = ingest(source, images, rights, second, plan=plan, revocations=revoked)
    assert report.rejected == 2
    assert report.reason_counts == {"revoked_training_item": 2}
    audit = validate_corpus(second, images, plan, revocations=revoked)
    assert audit.train_count + audit.eval_count == len(rows) + 48 - 2


def test_withdrawal_requires_known_grant(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, _ = corpus_with_users(tmp_path)
    digest = (approved / "summary.json").read_bytes()
    with pytest.raises(WithdrawalError, match="unknown_consent_withdrawal"):
        withdraw_approved_consent(approved, images, plan, revoked, ["a" * 64])
    assert (approved / "summary.json").read_bytes() == digest
    assert not (approved / "consent-hold.json").exists()


def test_unknown_shard_manifest_blocks_withdrawal(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    folder = approved / "shard"
    folder.mkdir()
    (folder / "copy.jsonl").write_text("{}")
    with pytest.raises(WithdrawalError, match="untracked_dataset_manifest"):
        withdraw_approved_consent(
            approved, images, plan, revoked, [str(rows[0]["consent_receipt_id"])],
        )
    assert not (approved / "consent-hold.json").exists()


def test_hold_while_withdrawal_is_in_progress_is_fail_closed(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, _ = corpus_with_users(tmp_path)
    (approved / "consent-hold.json").write_text('{"status":"WITHDRAWAL_IN_PROGRESS"}')
    with pytest.raises(CorpusInvalid, match="consent_withdrawal_in_progress"):
        validate_corpus(approved, images, plan, revocations=revoked)


def test_revoke_receipt_v2_is_backward_compatible(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    withdraw_approved_consent(
        approved, images, plan, revoked, [str(rows[4]["consent_receipt_id"])],
    )
    data = json.loads(revoked.read_text())
    assert data["schema"] == REVOCATION_SCHEMA_V2
    assert data["receipts"] == [rows[4]["consent_receipt_id"]]
    audit = validate_corpus(approved, images, plan, revocations=revoked)
    assert audit.status == "AUDITED_NOT_RELEASED"


def test_second_withdrawal_retains_all_lineage_and_tombstones(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    result_one = withdraw_approved_consent(
        approved, images, plan, revoked, [str(rows[0]["consent_receipt_id"])],
    )
    result_two = withdraw_approved_consent(
        approved, images, plan, revoked, [str(rows[3]["consent_receipt_id"])],
    )
    assert result_one.removed == 2 and result_two.removed == 1
    assert len((approved / "withdrawn.jsonl").read_text().splitlines()) == 3
    lineage = json.loads((approved / "checkpoint-provenance.json").read_text())
    assert len(lineage["old_manifests"]) == 2
    doc = build_certificate(approved, images, plan, revocations=revoked)
    assert doc["withdrawn_consent_records"] == 3
    assert doc["active_consented_records"] == len(rows) - 3


def test_withdrawal_cannot_be_described_as_model_quality(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    withdraw_approved_consent(
        approved, images, plan, revoked, [str(rows[1]["consent_receipt_id"])],
    )
    doc = build_certificate(approved, images, plan, revocations=revoked)
    assert doc["model_quality"] == "NOT_EVALUATED"
    assert doc["release_quality"] == "NOT_RUN"
    doc["checkpoint_consent_status"] = "CURRENT"
    with pytest.raises(ValueError, match="consent|changed"):
        verify_certificate(doc)


def test_operator_withdraws_using_private_receipt_list(tmp_path: Path) -> None:
    _, images, _, approved, revoked, plan, rows = corpus_with_users(tmp_path)
    plan_file = tmp_path / "training-plan.json"
    plan_file.write_text(json.dumps(asdict(plan)))
    ids = tmp_path / "receipt-selection.json"
    ids.write_text(json.dumps([rows[2]["consent_receipt_id"]]))
    response = execute([
        "withdraw-consent", "--approved", str(approved),
        "--images", str(images), "--plan", str(plan_file),
        "--revocations", str(revoked), "--receipts", str(ids),
    ])
    assert response["withdrawn"] == 1
    assert response["checkpoint_status"] == "RETRAIN_REQUIRED"
    assert str(rows[2]["consent_receipt_id"]) not in json.dumps(response)


def test_operator_rejects_withdrawal_without_register(tmp_path: Path) -> None:
    _, images, _, approved, _revoked, plan, rows = corpus_with_users(tmp_path)
    plan_file = tmp_path / "training-plan.json"
    plan_file.write_text(json.dumps(asdict(plan)))
    ids = tmp_path / "receipt-selection.json"
    ids.write_text(json.dumps([rows[2]["consent_receipt_id"]]))
    with pytest.raises(OperatorFailure, match="revocation_register_required"):
        execute([
            "withdraw-consent", "--approved", str(approved),
            "--images", str(images), "--plan", str(plan_file),
            "--receipts", str(ids),
        ])
