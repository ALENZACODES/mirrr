"""Group coverage counts for the audited train and heldout splits. Author: John Khan.

Groups are operator-assigned slice labels from the approved manifest (for
example a reviewed skin-tone band). A group meets coverage only when both its
train and heldout counts reach the minimum, so a small heldout slice is never
reported as evaluated. `unlabelled` records are counted but never cover a group.
Only counts are returned; no subject, image hash or path leaves this module.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .audit import CorpusAudit, CorpusInvalid, _iter_rows, validate_corpus
from .pipeline import TrainingPlan, manifest_digest_files
from .policy import ImageGrant

COVERAGE_SCHEMA = "beljour-group-coverage/1"
UNLABELLED = "unlabelled"
MAX_MINIMUM = 1_000_000


def audited_population(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    checked: CorpusAudit | None,
    revocations: Path | None,
) -> CorpusAudit:
    """Reuse a caller's fresh audit, or audit now without re-hashing images."""
    if checked is None:
        return validate_corpus(
            approved, images, plan, revocations=revocations, check_image_bytes=False,
        )
    if checked.image_size != plan.image_size:
        raise CorpusInvalid("unmatched_ingest_plan")
    return checked


def audited_rows(
    approved: Path, plan: TrainingPlan, audit: CorpusAudit,
) -> Iterator[tuple[str, ImageGrant]]:
    """Stream (split, grant) pairs from manifests still matching ``audit``.

    The manifest digest is checked before and after streaming, and the streamed
    populations must equal the audited counts.
    """
    train, heldout = approved / "train.jsonl", approved / "eval.jsonl"
    if manifest_digest_files(train, heldout) != audit.manifest_sha256:
        raise CorpusInvalid("changed_filtered_manifest")
    seen = {"train": 0, "eval": 0}
    for split in ("train", "eval"):
        for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan):
            seen[split] += 1
            yield split, grant
    if (seen["train"], seen["eval"]) != (audit.train_count, audit.eval_count):
        raise CorpusInvalid("wrong_ingest_counts")
    if manifest_digest_files(train, heldout) != audit.manifest_sha256:
        raise CorpusInvalid("changed_filtered_manifest")


@dataclass(frozen=True)
class GroupCoverage:
    minimum: int
    train: dict[str, int]
    heldout: dict[str, int]

    def status(self, group: str) -> str:
        if group == UNLABELLED:
            return "UNLABELLED"
        train_ok = self.train.get(group, 0) >= self.minimum
        heldout_ok = self.heldout.get(group, 0) >= self.minimum
        if train_ok and heldout_ok:
            return "SUFFICIENT"
        if train_ok:
            return "HELDOUT_BELOW_MINIMUM"
        if heldout_ok:
            return "TRAIN_BELOW_MINIMUM"
        return "BELOW_MINIMUM"

    def public(self) -> dict[str, Any]:
        names = sorted(set(self.train) | set(self.heldout))
        labelled = [name for name in names if name != UNLABELLED]
        gaps = [name for name in labelled if self.status(name) != "SUFFICIENT"]
        return {
            "schema": COVERAGE_SCHEMA,
            "minimum": self.minimum,
            "groups": {
                name: {
                    "train": self.train.get(name, 0),
                    "eval": self.heldout.get(name, 0),
                    "status": self.status(name),
                }
                for name in names
            },
            "groups_below_minimum": len(gaps),
            "status": "COVERAGE_MET" if labelled and not gaps else "COVERAGE_GAPS",
        }


def group_coverage(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    minimum: int = 30,
    checked: CorpusAudit | None = None,
    revocations: Path | None = None,
) -> GroupCoverage:
    """Count audited records per group and split against ``minimum``."""
    if type(minimum) is not int or not 1 <= minimum <= MAX_MINIMUM:
        raise ValueError("Invalid coverage minimum")
    audit = audited_population(approved, images, plan, checked=checked, revocations=revocations)
    counts: dict[str, Counter[str]] = {"train": Counter(), "eval": Counter()}
    for split, grant in audited_rows(approved, plan, audit):
        counts[split][grant.group] += 1
    return GroupCoverage(minimum, dict(counts["train"]), dict(counts["eval"]))
