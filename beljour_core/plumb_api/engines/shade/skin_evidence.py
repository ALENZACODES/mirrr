"""Checked acceptance accounting for W6 skin-reference readings.

A successful reading and a *correct reference identity* are different things: a
reading can be accepted and still name the wrong swatch. This summary keeps them
apart. Every record stays in the denominator, including refusals and records with
no label, so a refusal or a missing label can never raise a rate.

Synthetic records can only ever produce synthetic evidence. ``real_face_pass`` is
possible only when every record is a labelled released-person case and a target
is supplied and met; ``product_validation`` is always false, because the reference
swatches are in-house estimates, not physical products. Records hold reference
identifiers only, never photos, masks or landmarks. Mirrored in
web/src/engines/shade/skin-evidence.ts. Author: John Khan.
"""
from __future__ import annotations

import math
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

KINDS = ("synthetic", "released_person")
MAX_RECORDS = 1_000_000
MAX_ID_LENGTH = 64


def _identifier(value: object, field: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not value or len(value) > MAX_ID_LENGTH:
        raise ValueError(f"{field} must be null or a short non-empty string")
    return value


@dataclass(frozen=True)
class AccuracySummary:
    total: int
    labelled: int
    missing_labels: int
    accepted: int
    refused: int
    exact: int
    wrong_accepted: int
    accepted_unlabelled: int
    kinds: Mapping[str, int]
    target: float | None

    @property
    def exact_rate(self) -> float:
        """Exact reference identity over every record, refusals and unlabelled included."""
        return self.exact / self.total if self.total else 0.0

    @property
    def acceptance_rate(self) -> float:
        return self.accepted / self.total if self.total else 0.0

    @property
    def synthetic_only(self) -> bool:
        return self.kinds.get("released_person", 0) == 0

    @property
    def meets_target(self) -> bool:
        """The rate meets the target, counted over a fully labelled, non-empty set."""
        return (self.target is not None and self.total > 0 and self.missing_labels == 0
                and self.exact_rate >= self.target)

    @property
    def real_face_pass(self) -> bool:
        return self.meets_target and self.kinds.get("synthetic", 0) == 0

    def public(self) -> dict[str, Any]:
        return {
            "format": "beljour-skin-accuracy-summary/1",
            "total": self.total,
            "labelled": self.labelled,
            "missing_labels": self.missing_labels,
            "accepted": self.accepted,
            "refused": self.refused,
            "exact": self.exact,
            "wrong_accepted": self.wrong_accepted,
            "accepted_unlabelled": self.accepted_unlabelled,
            "exact_rate": round(self.exact_rate, 6),
            "acceptance_rate": round(self.acceptance_rate, 6),
            "kinds": dict(self.kinds),
            "target": self.target,
            "meets_target": self.meets_target,
            "evidence": "synthetic" if self.synthetic_only else "released_person",
            "real_face_pass": self.real_face_pass,
            "product_validation": False,
        }


def summarize_accuracy(records: Iterable[Mapping[str, object]], *,
                       target: float | None = None) -> AccuracySummary:
    """Count reference identity outcomes.

    Each record has ``expected_id`` (the independent label, or None when missing),
    ``predicted_id`` (the suggested reference, or None for a refusal) and ``kind``
    (``synthetic`` by default, or ``released_person``). ``target`` is a share in
    (0, 1], such as 0.95 for SKN-03.
    """
    if target is not None and (isinstance(target, bool) or not isinstance(target, (int, float))
                               or not math.isfinite(target) or not 0 < target <= 1):
        raise ValueError("target must be a share in (0, 1]")
    kinds = dict.fromkeys(KINDS, 0)
    total = labelled = accepted = exact = wrong = accepted_unlabelled = 0
    for record in records:
        if not isinstance(record, Mapping):
            raise ValueError("each accuracy record must be a mapping")
        kind = record.get("kind", "synthetic")
        if kind not in KINDS:
            raise ValueError("record kind must be synthetic or released_person")
        expected = _identifier(record.get("expected_id"), "expected_id")
        predicted = _identifier(record.get("predicted_id"), "predicted_id")
        total += 1
        if total > MAX_RECORDS:
            raise ValueError("too many accuracy records")
        kinds[str(kind)] += 1
        labelled += expected is not None
        if predicted is None:
            continue
        accepted += 1
        if expected is None:
            accepted_unlabelled += 1
        elif predicted == expected:
            exact += 1
        else:
            wrong += 1
    return AccuracySummary(total, labelled, total - labelled, accepted, total - accepted, exact,
                           wrong, accepted_unlabelled, kinds,
                           None if target is None else float(target))
