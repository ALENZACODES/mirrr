"""Tampering with an approved drawn corpus is caught before any training use.

Author: John Khan.
"""

from __future__ import annotations

import json
import os
from dataclasses import replace
from pathlib import Path

import pytest

from .audit import CorpusInvalid, validate_corpus
from .policy import Rejected
from .test_support import DrawnCorpus, make_corpus


@pytest.fixture
def corpus(tmp_path: Path) -> DrawnCorpus:
    return make_corpus(tmp_path, size=18)


def _edit_summary(corpus: DrawnCorpus, **changes: object) -> None:
    path = corpus.approved / "summary.json"
    summary = json.loads(path.read_text())
    summary.update(changes)
    path.write_text(json.dumps(summary))


def test_fresh_corpus_audits_and_reports_aggregates_only(corpus: DrawnCorpus) -> None:
    checked = validate_corpus(corpus.approved, corpus.photos, corpus.plan)
    assert checked.train_count + checked.eval_count == 18
    public = json.dumps(checked.public())
    for record in corpus.records:
        for private in (record["sha256"], record["subject_key"], record["image"]):
            assert private not in public
    assert checked.public()["model_quality"] == "NOT_RUN"


def test_any_manifest_byte_change_is_detected(corpus: DrawnCorpus) -> None:
    train = corpus.approved / "train.jsonl"
    original = train.read_bytes()
    edited = original.replace(b'"group": "slice_a"', b'"group": "slice_b"', 1)
    assert edited != original
    train.write_bytes(edited)
    with pytest.raises(CorpusInvalid, match="changed_filtered_manifest"):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)


def test_moving_a_record_between_splits_is_detected(corpus: DrawnCorpus) -> None:
    train, heldout = corpus.approved / "train.jsonl", corpus.approved / "eval.jsonl"
    lines = train.read_text().splitlines(keepends=True)
    train.write_text("".join(lines[1:]))
    heldout.write_text(heldout.read_text() + lines[0])
    with pytest.raises(CorpusInvalid, match="changed_filtered_manifest"):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)


def test_changed_source_image_fails_full_audit_only(corpus: DrawnCorpus) -> None:
    target = corpus.photos / corpus.records[0]["image"]
    target.write_bytes(target.read_bytes() + b"\0")
    validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    with pytest.raises(Rejected, match="image_hash_mismatch"):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan)


@pytest.mark.parametrize(("changes", "code"), [
    ({"scanned": 999}, "wrong_ingest_counts"),
    ({"accepted": 17}, "wrong_ingest_counts"),
    ({"rejected": 1, "scanned": 19}, "wrong_rejection_counts"),
    ({"digest_version": 1}, "obsolete_manifest_digest"),
    ({"schema": "beljour-ingest/0"}, "unmatched_ingest_plan"),
    ({"revocations_sha256": "a" * 64}, "changed_revocation_register"),
    ({"withdrawn": -1}, "invalid_withdrawal_counts"),
])
def test_altered_ingest_attestation_is_refused(
    corpus: DrawnCorpus, changes: dict[str, object], code: str,
) -> None:
    _edit_summary(corpus, **changes)
    with pytest.raises(CorpusInvalid, match=code):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)


def test_rejection_log_with_private_fields_is_refused(corpus: DrawnCorpus) -> None:
    (corpus.approved / "rejected.jsonl").write_text(
        json.dumps({"row": 1, "reason": "missing_image", "image": "drawn-00001.png"}) + "\n",
    )
    _edit_summary(corpus, rejected=1, scanned=19)
    with pytest.raises(CorpusInvalid, match="private_rejection_record"):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)


def test_different_training_plan_cannot_reuse_the_corpus(corpus: DrawnCorpus) -> None:
    for plan in (replace(corpus.plan, seed=7), replace(corpus.plan, holdout_fraction=0.2)):
        with pytest.raises(CorpusInvalid, match="unmatched_ingest_plan"):
            validate_corpus(corpus.approved, corpus.photos, plan, check_image_bytes=False)


@pytest.mark.skipif(os.name == "nt", reason="symlinks need privileges on Windows")
def test_symlinked_approved_directory_is_untrusted(corpus: DrawnCorpus, tmp_path: Path) -> None:
    link = tmp_path / "linked"
    link.symlink_to(corpus.approved, target_is_directory=True)
    with pytest.raises(CorpusInvalid, match="untrusted_directory"):
        validate_corpus(link, corpus.photos, corpus.plan, check_image_bytes=False)


def test_missing_split_file_is_refused(corpus: DrawnCorpus) -> None:
    (corpus.approved / "eval.jsonl").unlink()
    with pytest.raises((CorpusInvalid, OSError)):
        validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
