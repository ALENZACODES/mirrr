"""Subject-isolated shard accounting and strict shard completion receipts.

Every subject maps to exactly one shard through `shard_stream.subject_shard`,
the same function the resumable `ShardReader` uses, so all images of one person
are processed by one worker and plan counts agree with streamed batches. The
plan binds the training plan, approved manifests and revocation register; a
completion receipt must match a shard's exact item count and ordered image
digest under that binding. Public output contains counts only.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import re
from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .audit import CorpusAudit
from .coverage import audited_population, audited_rows
from .pipeline import TrainingPlan
from .policy import ImageGrant
from .shard_stream import subject_shard

PLAN_SCHEMA = "beljour-shard-plan/1"
RECEIPT_SCHEMA = "beljour-shard-receipt/1"
MAX_SHARDS = 4096
SPLITS = ("train", "eval")
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_RECEIPT_FIELDS = frozenset({
    "schema", "shard", "shard_count", "split", "count", "items_sha256",
    "plan_sha256", "manifest_sha256", "revocations_sha256",
})


class ShardInvalid(ValueError):
    """A rejected shard plan or receipt, with a constant code only."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def _checked_count(shard_count: object) -> int:
    if type(shard_count) is not int or not 1 <= shard_count <= MAX_SHARDS:
        raise ShardInvalid("invalid_shard_count")
    return shard_count


def _items_hasher(split: str, shard: int) -> hashlib._Hash:
    return hashlib.sha256(f"beljour-shard-items/1\0{split}\0{shard}\0".encode())


def items_digest(split: str, shard: int, image_hashes: Sequence[str]) -> str:
    """Domain-separated digest of the ordered image hashes a shard contains."""
    digest = _items_hasher(split, shard)
    for value in image_hashes:
        if _SHA.fullmatch(value) is None:
            raise ShardInvalid("invalid_item_hash")
        digest.update(bytes.fromhex(value))
    return digest.hexdigest()


@dataclass(frozen=True)
class ShardPlan:
    shard_count: int
    plan_sha256: str
    manifest_sha256: str
    revocations_sha256: str | None
    counts: Mapping[str, tuple[int, ...]]
    digests: Mapping[str, tuple[str, ...]]

    def expected_receipt(self, shard: int, split: str) -> dict[str, Any]:
        if split not in SPLITS or type(shard) is not int or not 0 <= shard < self.shard_count:
            raise ShardInvalid("unknown_shard")
        return {
            "schema": RECEIPT_SCHEMA,
            "shard": shard,
            "shard_count": self.shard_count,
            "split": split,
            "count": self.counts[split][shard],
            "items_sha256": self.digests[split][shard],
            "plan_sha256": self.plan_sha256,
            "manifest_sha256": self.manifest_sha256,
            "revocations_sha256": self.revocations_sha256,
        }

    def public(self) -> dict[str, Any]:
        train, heldout = self.counts["train"], self.counts["eval"]
        return {
            "schema": PLAN_SCHEMA,
            "shard_count": self.shard_count,
            "train_counts": list(train),
            "eval_counts": list(heldout),
            "empty_train_shards": sum(1 for value in train if value == 0),
            "largest_train_shard": max(train),
            "subject_isolated": True,
            "status": "PLANNED_NOT_RUN",
        }


def plan_shards(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    shard_count: int,
    checked: CorpusAudit | None = None,
    revocations: Path | None = None,
) -> ShardPlan:
    """Count and digest every audited record into its subject's shard."""
    count = _checked_count(shard_count)
    audit = audited_population(approved, images, plan, checked=checked, revocations=revocations)
    counts = {split: [0] * count for split in SPLITS}
    hashers = {split: [_items_hasher(split, index) for index in range(count)] for split in SPLITS}
    for split, grant in audited_rows(approved, plan, audit):
        index = subject_shard(grant.subject_key, plan.seed, count)
        counts[split][index] += 1
        hashers[split][index].update(bytes.fromhex(grant.sha256))
    return ShardPlan(
        count, plan.digest(), audit.manifest_sha256, audit.revocations_sha256,
        {split: tuple(values) for split, values in counts.items()},
        {split: tuple(item.hexdigest() for item in hashers[split]) for split in SPLITS},
    )


def shard_items(
    approved: Path, plan: TrainingPlan, audit: CorpusAudit, *, shard: int, shard_count: int, split: str,
) -> Iterator[ImageGrant]:
    """Yield one shard's grants in manifest order, from manifests matching ``audit``."""
    count = _checked_count(shard_count)
    if split not in SPLITS or type(shard) is not int or not 0 <= shard < count:
        raise ShardInvalid("unknown_shard")
    for found, grant in audited_rows(approved, plan, audit):
        if found == split and subject_shard(grant.subject_key, plan.seed, count) == shard:
            yield grant


def completion_receipt(
    shard_plan: ShardPlan, *, shard: int, split: str, processed: Sequence[str],
) -> dict[str, Any]:
    """Receipt for the image hashes a worker actually processed, in order."""
    receipt = shard_plan.expected_receipt(shard, split)
    receipt["count"] = len(processed)
    receipt["items_sha256"] = items_digest(split, shard, processed)
    return receipt


def verify_completion(shard_plan: ShardPlan, receipts: Sequence[object]) -> dict[str, Any]:
    """Accept only exact, unique receipts; report how many nonempty shards remain."""
    if not isinstance(receipts, Sequence) or len(receipts) > 2 * shard_plan.shard_count:
        raise ShardInvalid("invalid_shard_receipts")
    done: set[tuple[str, int]] = set()
    for receipt in receipts:
        if not isinstance(receipt, Mapping) or set(receipt) != _RECEIPT_FIELDS:
            raise ShardInvalid("invalid_shard_receipt")
        key = (receipt["split"], receipt["shard"])
        if key in done:
            raise ShardInvalid("duplicate_shard_receipt")
        expected = shard_plan.expected_receipt(receipt["shard"], receipt["split"])
        for field in ("schema", "shard_count", "plan_sha256", "manifest_sha256", "revocations_sha256"):
            if receipt[field] != expected[field]:
                raise ShardInvalid("shard_receipt_binding_mismatch")
        if receipt["count"] != expected["count"] or receipt["items_sha256"] != expected["items_sha256"]:
            raise ShardInvalid("incomplete_shard_receipt")
        done.add(key)
    required = {
        (split, index)
        for split in SPLITS
        for index, value in enumerate(shard_plan.counts[split]) if value
    }
    return {
        "schema": "beljour-shard-completion/1",
        "shard_count": shard_plan.shard_count,
        "required": len(required),
        "completed": len(required & done),
        "status": "ALL_SHARDS_COMPLETE" if required <= done else "INCOMPLETE",
    }
