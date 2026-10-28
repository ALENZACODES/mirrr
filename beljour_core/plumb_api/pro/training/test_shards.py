"""Subject-isolated shard accounting and strict completion receipts.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from .audit import CorpusInvalid, validate_corpus
from .pipeline import ingest
from .shard_stream import subject_shard
from .shards import (
    ShardInvalid,
    ShardPlan,
    completion_receipt,
    plan_shards,
    shard_items,
    verify_completion,
)
from .test_support import DrawnCorpus, draw_record, make_corpus

SHARDS = 5


@pytest.fixture
def corpus(tmp_path: Path) -> DrawnCorpus:
    return make_corpus(tmp_path)


def _all_receipts(corpus: DrawnCorpus, plan: ShardPlan) -> list[dict[str, object]]:
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    receipts: list[dict[str, object]] = []
    for split in ("train", "eval"):
        for shard in range(plan.shard_count):
            processed = [
                grant.sha256 for grant in shard_items(
                    corpus.approved, corpus.plan, audit,
                    shard=shard, shard_count=plan.shard_count, split=split,
                )
            ]
            receipts.append(completion_receipt(plan, shard=shard, split=split, processed=processed))
    return receipts


def test_every_audited_record_lands_in_exactly_one_shard(corpus: DrawnCorpus) -> None:
    plan = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    assert sum(plan.counts["train"]) == audit.train_count
    assert sum(plan.counts["eval"]) == audit.eval_count
    public = plan.public()
    assert public["status"] == "PLANNED_NOT_RUN" and public["subject_isolated"] is True
    assert public["largest_train_shard"] == max(plan.counts["train"])
    text = json.dumps(public)
    assert not any(row["subject_key"] in text or row["sha256"] in text for row in corpus.records)


def test_one_subjects_images_share_a_shard(tmp_path: Path) -> None:
    base = make_corpus(tmp_path / "base", size=18)
    subject = hashlib.sha256(b"drawn-subject-with-many-images").hexdigest()
    extra = [draw_record(base.photos, base.rights, 500 + index, subject_key=subject) for index in range(6)]
    base.write_source([*base.records, *extra])
    approved = tmp_path / "approved"
    ingest(base.source_file(), base.photos, base.rights, approved, plan=base.plan)
    plan = plan_shards(approved, base.photos, base.plan, shard_count=SHARDS)
    audit = validate_corpus(approved, base.photos, base.plan, check_image_bytes=False)
    owner = subject_shard(subject, base.plan.seed, SHARDS)
    holders = {
        shard
        for split in ("train", "eval")
        for shard in range(SHARDS)
        if any(
            grant.subject_key == subject
            for grant in shard_items(approved, base.plan, audit, shard=shard, shard_count=SHARDS, split=split)
        )
    }
    assert holders == {owner}
    assert plan.counts["train"][owner] + plan.counts["eval"][owner] >= 6


def test_plan_is_deterministic_and_bound_to_inputs(corpus: DrawnCorpus) -> None:
    first = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    again = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    assert first == again
    assert first.manifest_sha256 == validate_corpus(
        corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False,
    ).manifest_sha256
    assert plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS + 1).digests != first.digests


def test_all_exact_receipts_complete_the_plan(corpus: DrawnCorpus) -> None:
    plan = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    receipts = _all_receipts(corpus, plan)
    result = verify_completion(plan, receipts)
    assert result["status"] == "ALL_SHARDS_COMPLETE"
    assert result["completed"] == result["required"]
    nonempty = [item for item in receipts if item["count"]]
    assert verify_completion(plan, nonempty[1:])["status"] == "INCOMPLETE"


def test_skipped_or_extra_items_cannot_claim_completion(corpus: DrawnCorpus) -> None:
    plan = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    audit = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    shard = max(range(SHARDS), key=lambda index: plan.counts["train"][index])
    processed = [
        grant.sha256
        for grant in shard_items(corpus.approved, corpus.plan, audit, shard=shard, shard_count=SHARDS, split="train")
    ]
    for altered in (processed[1:], [*processed, "0" * 64], list(reversed(processed))):
        receipt = completion_receipt(plan, shard=shard, split="train", processed=altered)
        with pytest.raises(ShardInvalid, match="incomplete_shard_receipt"):
            verify_completion(plan, [receipt])


@pytest.mark.parametrize(("field", "value", "code"), [
    ("manifest_sha256", "0" * 64, "shard_receipt_binding_mismatch"),
    ("plan_sha256", "0" * 64, "shard_receipt_binding_mismatch"),
    ("revocations_sha256", "0" * 64, "shard_receipt_binding_mismatch"),
    ("shard_count", SHARDS + 1, "shard_receipt_binding_mismatch"),
    ("shard", SHARDS, "unknown_shard"),
    ("split", "test", "unknown_shard"),
])
def test_receipt_for_another_plan_is_refused(
    corpus: DrawnCorpus, field: str, value: object, code: str,
) -> None:
    plan = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    receipt = _all_receipts(corpus, plan)[0]
    receipt[field] = value
    with pytest.raises(ShardInvalid, match=code):
        verify_completion(plan, [receipt])


def test_duplicate_or_extended_receipts_are_refused(corpus: DrawnCorpus) -> None:
    plan = plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS)
    receipt = _all_receipts(corpus, plan)[0]
    with pytest.raises(ShardInvalid, match="duplicate_shard_receipt"):
        verify_completion(plan, [receipt, dict(receipt)])
    with pytest.raises(ShardInvalid, match="invalid_shard_receipt"):
        verify_completion(plan, [{**receipt, "worker": "host-1"}])


def test_stale_audit_cannot_plan_a_changed_manifest(corpus: DrawnCorpus) -> None:
    stale = validate_corpus(corpus.approved, corpus.photos, corpus.plan, check_image_bytes=False)
    train = corpus.approved / "train.jsonl"
    train.write_text("".join(train.read_text().splitlines(keepends=True)[1:]))
    with pytest.raises(CorpusInvalid, match="changed_filtered_manifest"):
        plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=SHARDS, checked=stale)


@pytest.mark.parametrize("count", [0, 4097, -1, True, 2.0])
def test_shard_count_is_bounded(corpus: DrawnCorpus, count: object) -> None:
    with pytest.raises(ShardInvalid, match="invalid_shard_count"):
        plan_shards(corpus.approved, corpus.photos, corpus.plan, shard_count=count)  # type: ignore[arg-type]
