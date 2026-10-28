"""Paired identity-regression evidence on a fixed private comparison set.

A new result may improve aggregate accuracy while losing specific identities.
This gate counts those losses without publishing source keys or comparisons.
It is a diagnostic pending the independent frozen real-face release gate.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError
from .identity_pairs import IdentityPair, IdentityPolicy

RegressionStatus = Literal["blocked", "unproven", "ready_for_independent_review"]


def _refuse(message: str) -> None:
    raise CommandValidationError("invalid_identity_regression", message)


@dataclass(frozen=True, slots=True)
class FlipCounts:
    genuine_gains: int
    genuine_losses: int
    impostor_fixes: int
    impostor_new_accepts: int
    unchanged_correct: int
    unchanged_wrong: int
    compared: int

    def public_metadata(self) -> dict[str, int]:
        return {
            "genuine_gains": self.genuine_gains,
            "genuine_losses": self.genuine_losses,
            "impostor_fixes": self.impostor_fixes,
            "impostor_new_accepts": self.impostor_new_accepts,
            "unchanged_correct": self.unchanged_correct,
            "unchanged_wrong": self.unchanged_wrong,
            "compared": self.compared,
        }


@dataclass(frozen=True, slots=True)
class PairedSlice:
    dimension: str
    label: str
    counts: FlipCounts
    sufficiently_sampled: bool

    def public_metadata(self) -> dict[str, object]:
        return {
            "dimension": self.dimension,
            "label": self.label,
            "counts": self.counts.public_metadata(),
            "sufficiently_sampled": self.sufficiently_sampled,
        }


@dataclass(frozen=True, slots=True)
class IdentityPairRegression:
    status: RegressionStatus
    policy_sha256: str
    baseline_model_sha256: str
    candidate_model_sha256: str
    reasons: tuple[str, ...]
    overall: FlipCounts
    slices: tuple[PairedSlice, ...]
    release_qualified: Literal[False] = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-identity-pair-regression/1",
            "status": self.status,
            "policy_sha256": self.policy_sha256,
            "baseline_model_sha256": self.baseline_model_sha256,
            "candidate_model_sha256": self.candidate_model_sha256,
            "reasons": list(self.reasons),
            "overall": self.overall.public_metadata(),
            "slices": [row.public_metadata() for row in self.slices],
            "release_qualified": False,
        }


def _same_subject_and_source(a: IdentityPair, b: IdentityPair) -> bool:
    return (
        a.pair_key == b.pair_key
        and a.genuine == b.genuine
        and a.split == b.split
        and a.consent_and_rights_checked == b.consent_and_rights_checked
        and a.reference_labels_checked == b.reference_labels_checked
        and set(a.slices) == set(b.slices)
        and (
            (a.subject_a == b.subject_a and a.subject_b == b.subject_b)
            or (a.subject_a == b.subject_b and a.subject_b == b.subject_a)
        )
    )


def _indexed(pairs: Sequence[IdentityPair]) -> Mapping[str, IdentityPair]:
    if len(pairs) > 1_000_000:
        _refuse("Paired comparison set exceeds memory cap.")
    indexed: dict[str, IdentityPair] = {}
    by_sources: set[tuple[str, str]] = set()
    for item in pairs:
        if not isinstance(item, IdentityPair):
            _refuse("Paired comparison input must be validated.")
        if item.pair_id in indexed or item.pair_key in by_sources:
            _refuse("Paired comparison rows must be unique.")
        indexed[item.pair_id] = item
        by_sources.add(item.pair_key)
    return indexed


def _flips(
    baseline: Sequence[IdentityPair], candidate: Mapping[str, IdentityPair],
    threshold: float,
) -> FlipCounts:
    genuine_gains = 0
    genuine_losses = 0
    impostor_fixes = 0
    impostor_new_accepts = 0
    unchanged_correct = 0
    unchanged_wrong = 0
    for previous in baseline:
        proposed = candidate[previous.pair_id]
        old_accepted = previous.cosine >= threshold
        new_accepted = proposed.cosine >= threshold
        was_correct = old_accepted == previous.genuine
        now_correct = new_accepted == previous.genuine
        if was_correct and now_correct:
            unchanged_correct += 1
        elif not was_correct and not now_correct:
            unchanged_wrong += 1
        elif previous.genuine and now_correct:
            genuine_gains += 1
        elif previous.genuine and not now_correct:
            genuine_losses += 1
        elif now_correct:
            impostor_fixes += 1
        else:
            impostor_new_accepts += 1
    return FlipCounts(
        genuine_gains=genuine_gains,
        genuine_losses=genuine_losses,
        impostor_fixes=impostor_fixes,
        impostor_new_accepts=impostor_new_accepts,
        unchanged_correct=unchanged_correct,
        unchanged_wrong=unchanged_wrong,
        compared=len(baseline),
    )


def compare_identity_pairs(
    baseline: Sequence[IdentityPair],
    candidate: Sequence[IdentityPair],
    policy: IdentityPolicy,
    *,
    baseline_model_sha256: str,
    candidate_model_sha256: str,
    externally_labelled: bool = False,
) -> IdentityPairRegression:
    """No-drop paired comparison; never selects or tunes a holdout threshold."""
    for digest in (baseline_model_sha256, candidate_model_sha256):
        if type(digest) is not str or len(digest) != 64 or any(
            ch not in "0123456789abcdef" for ch in digest
        ):
            _refuse("Both model artifacts need verified SHA-256 identifiers.")
    if type(externally_labelled) is not bool:
        _refuse("External-label evidence flag must be boolean.")
    former = _indexed(baseline)
    newer = _indexed(candidate)
    if not former or set(former) != set(newer):
        _refuse("Both revisions must evaluate exactly the same pair keys.")
    for identifier, older in former.items():
        if not _same_subject_and_source(older, newer[identifier]):
            _refuse("Paired comparison identity, split, labels or consent changed.")
    frozen = tuple(older for older in former.values() if older.split == "frozen")
    if len(frozen) < policy.minimum_genuine + policy.minimum_impostor:
        _refuse("Insufficient matching frozen comparisons for paired regression.")
    overall = _flips(frozen, newer, policy.threshold)
    slices: list[PairedSlice] = []
    reasons: list[str] = []
    any_loss = overall.genuine_losses > 0 or overall.impostor_new_accepts > 0
    for required in sorted(policy.required_slices, key=lambda tag: (tag.dimension, tag.label)):
        rows = tuple(item for item in frozen if required in item.slices)
        actual_genuine = sum(item.genuine for item in rows)
        actual_impostor = len(rows) - actual_genuine
        sufficient = (
            actual_genuine >= policy.minimum_genuine_per_slice
            and actual_impostor >= policy.minimum_impostor_per_slice
        )
        counts = _flips(rows, newer, policy.threshold)
        if counts.genuine_losses or counts.impostor_new_accepts:
            any_loss = True
        if not sufficient:
            reasons.append("comparison_slice_underpowered")
        slices.append(PairedSlice(required.dimension, required.label, counts, sufficient))
    if any_loss:
        reasons.append("identity_regression_detected")
    if not externally_labelled:
        reasons.append("independent_pair_labels_not_confirmed")
    if not policy.independent_threshold_commit:
        reasons.append("threshold_not_independently_preregistered")
    if any_loss:
        status: RegressionStatus = "blocked"
    elif reasons:
        status = "unproven"
    else:
        status = "ready_for_independent_review"
    return IdentityPairRegression(
        status=status,
        policy_sha256=policy.fingerprint(),
        baseline_model_sha256=baseline_model_sha256,
        candidate_model_sha256=candidate_model_sha256,
        reasons=tuple(sorted(set(reasons))),
        overall=overall,
        slices=tuple(slices),
    )
