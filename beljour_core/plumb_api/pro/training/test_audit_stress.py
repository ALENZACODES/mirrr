"""Streaming corpus audit at scale with disk-backed membership checks.

Manifests here are synthetic records without image files, audited with
image-byte checks disabled. Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from . import audit as audit_module
from .audit import CorpusInvalid, validate_corpus
from .pipeline import manifest_digest_files, partition
from .revocations import REVOCATION_SCHEMA, parse_revocations
from .test_support import FIXTURE_PLAN, synthetic_grant, write_manifests

LARGE = 20_000


def _resummarise(approved: Path) -> None:
    """Re-attest digests after a deliberate edit, so later checks are reached."""
    summary = json.loads((approved / "summary.json").read_text())
    summary["manifest_sha256"] = manifest_digest_files(approved / "train.jsonl", approved / "eval.jsonl")
    (approved / "summary.json").write_text(json.dumps(summary))


def _append(approved: Path, split: str, line: str, *, counted: bool = True) -> None:
    with (approved / f"{split}.jsonl").open("a", encoding="utf-8") as stream:
        stream.write(line)
    if counted:
        summary = json.loads((approved / "summary.json").read_text())
        summary["accepted"] += 1
        summary["scanned"] += 1
        (approved / "summary.json").write_text(json.dumps(summary))
    _resummarise(approved)


@pytest.fixture(scope="module")
def large(tmp_path_factory: pytest.TempPathFactory) -> Path:
    approved = tmp_path_factory.mktemp("stress") / "approved"
    write_manifests(approved, [synthetic_grant(index) for index in range(LARGE)], FIXTURE_PLAN)
    return approved


def _copy(large: Path, tmp_path: Path) -> Path:
    target = tmp_path / "approved"
    target.mkdir()
    for item in large.iterdir():
        (target / item.name).write_bytes(item.read_bytes())
    return target


def test_large_population_audits_with_exact_counts(large: Path, tmp_path: Path) -> None:
    checked = validate_corpus(large, tmp_path, FIXTURE_PLAN, check_image_bytes=False)
    assert checked.train_count + checked.eval_count == LARGE
    assert sum(checked.source_counts.values()) == LARGE
    expected_eval = sum(
        partition(synthetic_grant(index).subject_key, FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction) == "eval"
        for index in range(LARGE)
    )
    assert checked.eval_count == expected_eval
    assert not [item for item in large.parent.iterdir() if item.name.startswith(".filtered-audit-")]


def test_duplicate_image_deep_in_other_split_is_found(large: Path, tmp_path: Path) -> None:
    approved = _copy(large, tmp_path)
    first = json.loads((approved / "train.jsonl").read_text().splitlines()[0])
    clone = replace(synthetic_grant(LARGE + 1), sha256=first["sha256"])
    split = partition(clone.subject_key, FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction)
    _append(approved, split, json.dumps(clone.private_row(), sort_keys=True) + "\n")
    with pytest.raises(CorpusInvalid, match="duplicate_approved_image"):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


def test_record_in_the_wrong_split_is_refused(large: Path, tmp_path: Path) -> None:
    approved = _copy(large, tmp_path)
    grant = synthetic_grant(LARGE + 2)
    split = partition(grant.subject_key, FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction)
    wrong = "train" if split == "eval" else "eval"
    _append(approved, wrong, json.dumps(grant.private_row(), sort_keys=True) + "\n")
    with pytest.raises(CorpusInvalid, match="cross_split_subject"):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


def test_unattested_extra_row_fails_counts(large: Path, tmp_path: Path) -> None:
    approved = _copy(large, tmp_path)
    grant = synthetic_grant(LARGE + 3)
    split = partition(grant.subject_key, FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction)
    _append(approved, split, json.dumps(grant.private_row(), sort_keys=True) + "\n", counted=False)
    with pytest.raises(CorpusInvalid, match="wrong_ingest_counts"):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


@pytest.mark.parametrize(("line", "code"), [
    ('{"path": "x.png"', "incomplete_filtered_manifest"),
    ("{" + " " * 5000 + "}\n", "filtered_manifest_size"),
    ('{"path": "x.png"}\n', "invalid_filtered_record"),
    ("[]\n", "invalid_filtered_record"),
])
def test_malformed_tail_row_is_refused(large: Path, tmp_path: Path, line: str, code: str) -> None:
    approved = _copy(large, tmp_path)
    _append(approved, "eval", line)
    with pytest.raises(CorpusInvalid, match=code):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


def test_uncleared_licence_inside_approved_manifest_is_refused(large: Path, tmp_path: Path) -> None:
    approved = _copy(large, tmp_path)
    grant = replace(synthetic_grant(LARGE + 4), source="cc0_stock", licence="CC-BY-4.0")
    split = partition(grant.subject_key, FIXTURE_PLAN.seed, FIXTURE_PLAN.holdout_fraction)
    _append(approved, split, json.dumps(grant.private_row(), sort_keys=True) + "\n")
    with pytest.raises(CorpusInvalid, match="filtered_licence_violation"):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


def test_row_cap_applies_while_streaming(
    large: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(audit_module, "MAX_MANIFEST_ROWS", 1000)
    with pytest.raises(CorpusInvalid, match="filtered_manifest_size"):
        validate_corpus(large, tmp_path, FIXTURE_PLAN, check_image_bytes=False)


def test_late_revocation_of_one_subject_in_a_large_corpus(large: Path, tmp_path: Path) -> None:
    approved = _copy(large, tmp_path)
    victim = synthetic_grant(LARGE - 7)
    register = tmp_path / "revocations.json"
    register.write_text(json.dumps({
        "schema": REVOCATION_SCHEMA, "subjects": [victim.subject_key], "images": [],
    }))
    summary = json.loads((approved / "summary.json").read_text())
    summary["revocations_sha256"] = parse_revocations(register).sha256
    (approved / "summary.json").write_text(json.dumps(summary))
    with pytest.raises(CorpusInvalid, match="revoked_training_item"):
        validate_corpus(approved, tmp_path, FIXTURE_PLAN, revocations=register, check_image_bytes=False)
