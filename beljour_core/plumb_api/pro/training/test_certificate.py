"""Counts-only provenance certificate reconciled against the audited corpus.

Author: John Khan.
"""

from __future__ import annotations

import json
import stat
from pathlib import Path
from typing import Any

import pytest

from .atomic import read_private_json, write_private_json
from .certificate import build_certificate, export_certificate, verify_certificate
from .pipeline import ingest
from .test_support import FIXTURE_PLAN, SOURCE_CYCLE, DrawnCorpus, draw_record, make_corpus


def _mixed_corpus(root: Path) -> DrawnCorpus:
    """Twenty admissible drawn records plus three that ingest must reject."""
    photos, rights = root / "photos", root / "rights"
    rows: list[dict[str, Any]] = []
    for index in range(20):
        source, licence = SOURCE_CYCLE[index % len(SOURCE_CYCLE)]
        rows.append(draw_record(photos, rights, index, source=source, licence=licence))
    unlicensed = draw_record(photos, rights, 20, source="cc0_stock", licence="CC0-1.0")
    rows.append({**unlicensed, "licence": "CC-BY-NC-4.0"})
    minor = draw_record(photos, rights, 21)
    rows.append({**minor, "adult_confirmed": False})
    rows.append(dict(rows[0]))  # duplicate image
    corpus = DrawnCorpus(root, photos, rights, root / "approved", FIXTURE_PLAN, rows)
    report = ingest(corpus.write_source(rows), photos, rights, corpus.approved, plan=FIXTURE_PLAN)
    assert (report.accepted, report.rejected) == (20, 3)
    return corpus


@pytest.fixture(scope="module")
def mixed(tmp_path_factory: pytest.TempPathFactory) -> DrawnCorpus:
    return _mixed_corpus(tmp_path_factory.mktemp("certificate"))


def test_certificate_reconciles_sources_licences_and_rejections(mixed: DrawnCorpus) -> None:
    document = build_certificate(mixed.approved, mixed.photos, mixed.plan)
    assert document["approved_train"] + document["approved_eval"] == 20
    accepted = document["accepted_by_source_and_licence"]
    assert sum(sum(licences.values()) for licences in accepted.values()) == 20
    assert accepted["cc0_stock"] == {"CC0-1.0": 4}
    assert document["rejected_count"] == 3
    assert sum(document["rejected_by_reason"].values()) == 3
    assert "duplicate_image" in document["rejected_by_reason"]
    assert document["independent_legal_certification"] == "NOT_PERFORMED"
    assert document["release_quality"] == "NOT_RUN"
    assert document["checkpoint_consent_status"] == "NO_WITHDRAWAL_RECORDED"
    assert verify_certificate(json.loads(json.dumps(document))) == document


def test_certificate_contains_no_file_level_data(mixed: DrawnCorpus) -> None:
    text = json.dumps(build_certificate(mixed.approved, mixed.photos, mixed.plan))
    for row in mixed.records:
        assert row["sha256"] not in text and row["subject_key"] not in text
        assert row["image"] not in text and row["evidence_sha256"] not in text


@pytest.mark.parametrize(("field", "value", "message"), [
    ("release_quality", "PASS", "approval"),
    ("model_quality", "EVALUATED", "approval"),
    ("independent_legal_certification", "PERFORMED", "clearance"),
    ("approved_train", 10_000, "changed"),
    ("checkpoint_consent_status", "PRE_WITHDRAWAL_CHECKPOINTS_RETRAIN_REQUIRED", "consent"),
    ("withdrawn_consent_records", -1, "consent counts"),
])
def test_edited_certificates_are_refused(
    mixed: DrawnCorpus, field: str, value: object, message: str,
) -> None:
    document = build_certificate(mixed.approved, mixed.photos, mixed.plan)
    document[field] = value
    with pytest.raises(ValueError, match=message):
        verify_certificate(document)


def test_unknown_fields_are_refused(mixed: DrawnCorpus) -> None:
    document = build_certificate(mixed.approved, mixed.photos, mixed.plan)
    with pytest.raises(ValueError, match="Unsupported"):
        verify_certificate({**document, "subjects": []})


def test_export_writes_once_and_owner_only(mixed: DrawnCorpus, tmp_path: Path) -> None:
    target = tmp_path / "certificate.json"
    first = export_certificate(target, mixed.approved, mixed.photos, mixed.plan)
    assert read_private_json(target) == first
    assert stat.S_IMODE(target.stat().st_mode) == 0o600
    with pytest.raises(FileExistsError):
        export_certificate(target, mixed.approved, mixed.photos, mixed.plan)


def test_rejection_ledger_that_disagrees_with_the_summary_fails(tmp_path: Path) -> None:
    corpus = _mixed_corpus(tmp_path / "corpus")
    summary = read_private_json(corpus.approved / "summary.json")
    # Same total rejected, but one reason renamed: the per-reason ledger must match.
    counts = dict(summary["reason_counts"])
    moved = sorted(counts)[0]
    counts[moved] -= 1
    counts = {key: value for key, value in counts.items() if value} | {"invented_reason": 1}
    write_private_json(corpus.approved / "summary.json", {**summary, "reason_counts": counts})
    with pytest.raises(ValueError, match="Rejection reason counts"):
        build_certificate(corpus.approved, corpus.photos, corpus.plan)


def test_changed_image_bytes_block_the_certificate(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path / "corpus", size=18)
    (corpus.photos / corpus.records[3]["image"]).write_bytes(b"changed")
    with pytest.raises(ValueError):
        build_certificate(corpus.approved, corpus.photos, corpus.plan)
