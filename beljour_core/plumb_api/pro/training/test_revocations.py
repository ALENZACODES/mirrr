"""Hash-bound revocation register: parsing, ingest filtering and audit binding.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import pytest

from .audit import CorpusInvalid, validate_corpus
from .pipeline import ingest
from .revocations import (
    REVOCATION_SCHEMA,
    REVOCATION_SCHEMA_V2,
    RevocationInvalid,
    parse_revocations,
)
from .test_support import FIXTURE_PLAN, make_corpus

SUBJECT = "a" * 64
IMAGE = "b" * 64
RECEIPT = "c" * 64


def _register(path: Path, **document: object) -> Path:
    path.write_text(json.dumps(document))
    return path


def test_no_register_is_reported_as_none_not_as_empty() -> None:
    absent = parse_revocations(None)
    assert absent.sha256 is None
    assert absent.public()["status"] == "NO_REGISTER"


def test_version_one_and_two_registers(tmp_path: Path) -> None:
    first = parse_revocations(_register(
        tmp_path / "v1.json", schema=REVOCATION_SCHEMA, subjects=[SUBJECT], images=[IMAGE],
    ))
    assert first.rejects(SUBJECT, "0" * 64) and first.rejects("0" * 64, IMAGE)
    assert not first.rejects("0" * 64, "1" * 64, RECEIPT)
    second = parse_revocations(_register(
        tmp_path / "v2.json", schema=REVOCATION_SCHEMA_V2, subjects=[], images=[], receipts=[RECEIPT],
    ))
    assert second.rejects("0" * 64, "1" * 64, RECEIPT)
    assert not second.rejects("0" * 64, "1" * 64, "")
    assert second.public() == {
        "subject_revocations": 0, "image_revocations": 0,
        "consent_revocations": 1, "status": "REGISTER_CHECKED",
    }
    assert second.sha256 == hashlib.sha256((tmp_path / "v2.json").read_bytes()).hexdigest()


@pytest.mark.parametrize(("document", "code"), [
    ({"schema": REVOCATION_SCHEMA, "subjects": ["A" * 64], "images": []}, "invalid_revocation_entry"),
    ({"schema": REVOCATION_SCHEMA, "subjects": ["a" * 63], "images": []}, "invalid_revocation_entry"),
    ({"schema": REVOCATION_SCHEMA, "subjects": [SUBJECT, SUBJECT], "images": []}, "duplicate_revocation"),
    ({"schema": REVOCATION_SCHEMA, "subjects": [], "images": [], "receipts": []}, "invalid_revocation_schema"),
    ({"schema": REVOCATION_SCHEMA_V2, "subjects": [], "images": []}, "invalid_revocation_schema"),
    ({"schema": "other", "subjects": [], "images": []}, "invalid_revocation_schema"),
    ({"schema": REVOCATION_SCHEMA, "subjects": SUBJECT, "images": []}, "invalid_revocation_schema"),
])
def test_malformed_registers_fail_closed(tmp_path: Path, document: dict[str, object], code: str) -> None:
    path = _register(tmp_path / "register.json", **document)
    with pytest.raises(RevocationInvalid, match=code):
        parse_revocations(path)


def test_unreadable_registers_fail_closed(tmp_path: Path) -> None:
    with pytest.raises(RevocationInvalid, match="missing_revocation_file"):
        parse_revocations(tmp_path / "absent.json")
    empty = tmp_path / "empty.json"
    empty.write_bytes(b"")
    with pytest.raises(RevocationInvalid, match="revocation_size_limit"):
        parse_revocations(empty)
    broken = tmp_path / "broken.json"
    broken.write_bytes(b"{")
    with pytest.raises(RevocationInvalid, match="invalid_revocation_json"):
        parse_revocations(broken)
    with pytest.raises(RevocationInvalid, match="invalid_revocation_file"):
        parse_revocations(tmp_path)


@pytest.mark.skipif(os.name == "nt", reason="symlinks need privileges on Windows")
def test_symlinked_register_is_refused(tmp_path: Path) -> None:
    real = _register(tmp_path / "real.json", schema=REVOCATION_SCHEMA, subjects=[], images=[])
    link = tmp_path / "link.json"
    link.symlink_to(real)
    with pytest.raises(RevocationInvalid, match="invalid_revocation_file"):
        parse_revocations(link)


def test_revoked_subject_and_image_are_rejected_at_ingest(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "base", size=18)
    register = _register(
        tmp_path / "register.json", schema=REVOCATION_SCHEMA,
        subjects=[corpus.records[0]["subject_key"]], images=[corpus.records[1]["sha256"]],
    )
    report = ingest(
        corpus.source_file(), corpus.photos, corpus.rights, tmp_path / "filtered",
        plan=FIXTURE_PLAN, revocations=register,
    )
    assert report.accepted == 16
    assert report.reason_counts == {"revoked_training_item": 2}
    checked = validate_corpus(tmp_path / "filtered", corpus.photos, FIXTURE_PLAN, revocations=register)
    assert checked.revocations_sha256 == parse_revocations(register).sha256


def test_register_snapshot_cannot_be_swapped_or_dropped(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "base", size=18)
    register = _register(tmp_path / "register.json", schema=REVOCATION_SCHEMA, subjects=[], images=[])
    filtered = tmp_path / "filtered"
    ingest(corpus.source_file(), corpus.photos, corpus.rights, filtered, plan=FIXTURE_PLAN, revocations=register)
    validate_corpus(filtered, corpus.photos, FIXTURE_PLAN, revocations=register)
    with pytest.raises(CorpusInvalid, match="changed_revocation_register"):
        validate_corpus(filtered, corpus.photos, FIXTURE_PLAN)
    _register(register, schema=REVOCATION_SCHEMA, subjects=[SUBJECT], images=[])
    with pytest.raises(CorpusInvalid, match="changed_revocation_register"):
        validate_corpus(filtered, corpus.photos, FIXTURE_PLAN, revocations=register)


def test_audit_refuses_a_corpus_that_contains_a_revoked_subject(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "base", size=18)
    register = _register(
        tmp_path / "register.json", schema=REVOCATION_SCHEMA,
        subjects=[corpus.records[3]["subject_key"]], images=[],
    )
    summary_path = corpus.approved / "summary.json"
    summary = json.loads(summary_path.read_text())
    summary["revocations_sha256"] = parse_revocations(register).sha256
    summary_path.write_text(json.dumps(summary))
    with pytest.raises(CorpusInvalid, match="revoked_training_item"):
        validate_corpus(corpus.approved, corpus.photos, FIXTURE_PLAN, revocations=register,
                        check_image_bytes=False)
