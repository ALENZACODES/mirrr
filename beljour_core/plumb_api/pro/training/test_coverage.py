"""Per-group train and heldout coverage counts on audited corpora.

Author: John Khan.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import pytest

from .audit import CorpusInvalid, validate_corpus
from .coverage import UNLABELLED, group_coverage
from .pipeline import partition
from .test_support import FIXTURE_PLAN, make_corpus, synthetic_grant, write_manifests


def test_counts_match_manifest_groups_per_split(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path)
    report = group_coverage(corpus.approved, corpus.photos, corpus.plan, minimum=1)
    expected: dict[str, Counter[str]] = {"train": Counter(), "eval": Counter()}
    for row in corpus.records:
        split = partition(row["subject_key"], corpus.plan.seed, corpus.plan.holdout_fraction)
        expected[split][row["group"]] += 1
    assert report.train == dict(expected["train"]) and report.heldout == dict(expected["eval"])
    public = report.public()
    assert public["status"] == "COVERAGE_MET"
    assert sum(item["train"] + item["eval"] for item in public["groups"].values()) == 48
    text = json.dumps(public)
    assert not any(row["subject_key"] in text or row["image"] in text for row in corpus.records)


def test_small_heldout_slice_is_a_gap_even_with_large_training_count(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path)
    report = group_coverage(corpus.approved, corpus.photos, corpus.plan, minimum=8)
    public = report.public()
    assert public["status"] == "COVERAGE_GAPS"
    statuses = {name: item["status"] for name, item in public["groups"].items()}
    assert "HELDOUT_BELOW_MINIMUM" in statuses.values()
    assert public["groups_below_minimum"] == sum(value != "SUFFICIENT" for value in statuses.values())


def test_unlabelled_records_never_satisfy_coverage(tmp_path: Path) -> None:
    approved = tmp_path / "approved"
    grants = [synthetic_grant(index, group=UNLABELLED) for index in range(400)]
    write_manifests(approved, grants, FIXTURE_PLAN)
    public = group_coverage(approved, tmp_path, FIXTURE_PLAN, minimum=1).public()
    assert public["groups"][UNLABELLED]["status"] == "UNLABELLED"
    assert public["status"] == "COVERAGE_GAPS"


def test_status_distinguishes_which_split_is_short(tmp_path: Path) -> None:
    approved = tmp_path / "approved"
    grants = [synthetic_grant(index, group="slice_a") for index in range(400)]
    write_manifests(approved, grants, FIXTURE_PLAN)
    report = group_coverage(approved, tmp_path, FIXTURE_PLAN, minimum=200)
    assert report.train["slice_a"] >= 200 > report.heldout["slice_a"]
    assert report.status("slice_a") == "HELDOUT_BELOW_MINIMUM"
    assert report.status("slice_z") == "BELOW_MINIMUM"


def test_stale_audit_cannot_describe_a_changed_manifest(tmp_path: Path) -> None:
    corpus = make_corpus(tmp_path, size=18)
    stale = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    heldout = corpus.approved / "eval.jsonl"
    heldout.write_text(heldout.read_text().replace('"slice_a"', '"slice_b"', 1))
    with pytest.raises(CorpusInvalid, match="changed_filtered_manifest"):
        group_coverage(corpus.approved, corpus.photos, corpus.plan, checked=stale)


@pytest.mark.parametrize("minimum", [0, -3, 1_000_001, True, 2.5])
def test_minimum_is_bounded(tmp_path: Path, minimum: object) -> None:
    with pytest.raises(ValueError, match="minimum"):
        group_coverage(tmp_path, tmp_path, FIXTURE_PLAN, minimum=minimum)  # type: ignore[arg-type]
