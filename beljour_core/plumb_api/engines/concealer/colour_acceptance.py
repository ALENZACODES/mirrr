"""Privacy-safe aggregate acceptance for local tinted fibre previews.

Every attempted local result stays in the denominator. Receipts are counted as
``rendered_closer``, ``adverse_shift``, ``unchanged``, ``refused`` or ``preview_only``;
a preview-only frame is never counted as a released colour result. Only the
counts and the released-frame distance range are kept: no photos, masks,
landmarks, hashes or swatch identifiers.

``release_pass`` is always false unless the caller supplies external evidence
(an approved real-photo review) and every attempt was a released frame that
moved closer to its chosen swatch. Synthetic receipts alone never pass. Mirrored
in web/src/commerce/colour-acceptance.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

STATUSES = ("rendered_closer", "adverse_shift", "unchanged", "refused", "preview_only")
MAX_RECEIPTS = 100_000


@dataclass(frozen=True, slots=True)
class ColourAcceptance:
    counts: Mapping[str, int]
    attempted: int
    worst_after_delta_e: float | None
    external_evidence: bool

    @property
    def released(self) -> int:
        return self.attempted - self.counts["preview_only"]

    @property
    def closer_rate(self) -> float:
        return self.counts["rendered_closer"] / self.attempted if self.attempted else 0.0

    @property
    def release_pass(self) -> bool:
        return (self.external_evidence and self.attempted > 0
                and self.counts["rendered_closer"] == self.attempted)

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-colour-acceptance/1", "attempted": self.attempted,
                "released": self.released, "counts": dict(self.counts),
                "closer_rate": round(self.closer_rate, 6),
                "worst_after_delta_e": (None if self.worst_after_delta_e is None
                                        else round(self.worst_after_delta_e, 4)),
                "external_evidence": self.external_evidence, "release_pass": self.release_pass,
                "evidence": "synthetic_local" if not self.external_evidence else "external_review",
                "tested_against_real_products": False}


def _receipt(value: object) -> Mapping[str, Any]:
    public = getattr(value, "public", None)
    data = public() if callable(public) else value
    if not isinstance(data, Mapping):
        raise ValueError("each receipt must be a tinted fibre receipt or its public mapping")
    return data


def summarize_colour_acceptance(receipts: Iterable[object], *,
                                external_evidence: bool = False) -> ColourAcceptance:
    """Count every attempt by outcome; ``release_pass`` needs external evidence."""
    if type(external_evidence) is not bool:
        raise ValueError("external_evidence must be a boolean")
    counts = dict.fromkeys(STATUSES, 0)
    worst: float | None = None
    total = 0
    for item in receipts:
        data = _receipt(item)
        status = data.get("status")
        if status not in counts:
            raise ValueError("unknown receipt status")
        if status == "preview_only" and data.get("phase") != "moving":
            raise ValueError("preview-only receipts must come from moving frames")
        total += 1
        if total > MAX_RECEIPTS:
            raise ValueError("too many receipts")
        counts[str(status)] += 1
        evidence = data.get("evidence")
        after = evidence.get("after_delta_e") if isinstance(evidence, Mapping) else None
        if isinstance(after, (int, float)) and not isinstance(after, bool):
            worst = float(after) if worst is None else max(worst, float(after))
    return ColourAcceptance(counts, total, worst, external_evidence)
