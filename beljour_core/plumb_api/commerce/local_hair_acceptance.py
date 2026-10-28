"""Bounded acceptance scorecard for local hair journeys.

Rendered, unchanged and refused journeys share one denominator, per kind and in
total, so a refusal can never raise a rate. Only counts and refusal codes are kept,
never images, masks or landmarks. Real-face quality is always ``not_tested``: the
journeys run on caller-supplied local photos with no independent review, and a
synthetic scorecard is not a release result. Author: John Khan.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Any

from .local_hair_journey import JourneyResult

MAX_JOURNEYS = 10_000
STATUSES = ("rendered", "unchanged", "refused")
KINDS = ("fibre", "palette", "short-sides")


@dataclass(frozen=True, slots=True)
class HairAcceptance:
    totals: Mapping[str, int]
    by_kind: Mapping[str, Mapping[str, int]]
    refusal_codes: Mapping[str, int]

    @property
    def attempted(self) -> int:
        return sum(self.totals.values())

    @property
    def rendered_rate(self) -> float:
        return self.totals["rendered"] / self.attempted if self.attempted else 0.0

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-local-hair-acceptance/1", "attempted": self.attempted,
                "totals": dict(self.totals), "by_kind": {k: dict(v) for k, v in self.by_kind.items()},
                "refusal_codes": dict(sorted(self.refusal_codes.items())),
                "rendered_rate": round(self.rendered_rate, 6), "real_face_quality": "not_tested",
                "release_pass": False}


def summarize_local_hair(journeys: Iterable[JourneyResult | Mapping[str, Any]]) -> HairAcceptance:
    """Count every journey by kind and status; summaries and results are both accepted."""
    totals = dict.fromkeys(STATUSES, 0)
    by_kind = {kind: dict.fromkeys(STATUSES, 0) for kind in KINDS}
    codes: Counter[str] = Counter()
    seen = 0
    for item in journeys:
        data = item.summary() if isinstance(item, JourneyResult) else item
        if not isinstance(data, Mapping):
            raise ValueError("each journey must be a result or its summary")
        status, kind = data.get("status"), data.get("kind")
        if status not in totals or kind not in by_kind:
            raise ValueError("unknown journey kind or status")
        seen += 1
        if seen > MAX_JOURNEYS:
            raise ValueError("too many journeys for one scorecard")
        totals[str(status)] += 1
        by_kind[str(kind)][str(status)] += 1
        if status == "refused":
            codes[str(data.get("code") or "unspecified")] += 1
    return HairAcceptance(totals, by_kind, dict(codes))
