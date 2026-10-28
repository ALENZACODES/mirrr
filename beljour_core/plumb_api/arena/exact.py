"""Exact gate maths for the hero filters, and the slice-quota planner for a gate run.

The ship gate (gates.py) is a rule on observed win rates: overall >= 55%, every slice >= 48%,
and every slice needs at least 20 human judgements before the filter can PASS. This module
adds what the rule alone does not say:

* Clopper-Pearson exact 95% intervals for every rate, from the binomial distribution itself
  (no normal approximation), so a report can say whether a rate is clearly above, clearly
  below or not yet separable from its threshold.
* The wins a slice needs: to meet the rule, and for its exact lower bound to clear the
  threshold.
* A planner: given the faces of a gate run, the human judgements per pair that every slice
  needs to reach the minimum. A slice with one face (each adversarial tag in the sealed block)
  needs 20 judgements of that one pair, so 20 different judges.

The rule itself is not changed here; gates.hero_gate stays the only place a PASS comes from.
Author: John Khan.
"""
from __future__ import annotations

import math
from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from . import constants as C
from .results import slices_for

CONFIDENCE = 0.95


def _log_pmf(k: int, n: int, p: float) -> float:
    return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1) + k * math.log(p) + (n - k) * math.log1p(-p)


def binomial_cdf(k: int, n: int, p: float) -> float:
    """P(X <= k) for X ~ Binomial(n, p), summed in log space so large n stays finite."""
    if k < 0:
        return 0.0
    if k >= n or p <= 0.0:
        return 1.0
    if p >= 1.0:
        return 0.0
    logs = [_log_pmf(i, n, p) for i in range(k + 1)]
    top = max(logs)
    return min(1.0, math.exp(top) * sum(math.exp(v - top) for v in logs))


def _solve(f: Any, target: float, increasing: bool) -> float:
    lo, hi = 0.0, 1.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if (f(mid) < target) == increasing:
            lo = mid
        else:
            hi = mid
        if hi - lo < 1e-12:
            break
    return (lo + hi) / 2


def clopper_pearson(wins: int, n: int, confidence: float = CONFIDENCE) -> tuple[float, float]:
    """Exact two-sided interval for a binomial proportion."""
    if n <= 0:
        return 0.0, 1.0
    if not 0 <= wins <= n:
        raise ValueError("wins must be between 0 and n")
    alpha = 1 - confidence
    low = 0.0 if wins == 0 else _solve(lambda p: 1 - binomial_cdf(wins - 1, n, p), alpha / 2, increasing=True)
    high = 1.0 if wins == n else _solve(lambda p: binomial_cdf(wins, n, p), alpha / 2, increasing=False)
    return low, high


def wins_to_meet(n: int, threshold: float) -> int:
    """Fewest wins out of n whose rate is at least `threshold` (the gate's point rule)."""
    return max(0, math.ceil(threshold * n - 1e-9))


def wins_to_clear(n: int, threshold: float, confidence: float = CONFIDENCE) -> int | None:
    """Fewest wins out of n whose exact lower bound is at least `threshold`; None if even n of n can't."""
    if n <= 0 or clopper_pearson(n, n, confidence)[0] < threshold:
        return None
    lo, hi = 0, n
    while lo < hi:
        mid = (lo + hi) // 2
        if clopper_pearson(mid, n, confidence)[0] >= threshold:
            hi = mid
        else:
            lo = mid + 1
    return lo


@dataclass(frozen=True)
class RateCheck:
    key: str
    wins: int
    n: int
    threshold: float
    minimum_n: int

    @property
    def rate(self) -> float | None:
        return self.wins / self.n if self.n else None

    @property
    def interval(self) -> tuple[float, float]:
        return clopper_pearson(self.wins, self.n)

    @property
    def state(self) -> str:
        """thin (too few judgements), below (fails the rule) or meets (passes the rule)."""
        if self.n < self.minimum_n:
            return "thin"
        rate = self.rate
        return "meets" if rate is not None and rate >= self.threshold else "below"

    @property
    def evidence(self) -> str:
        """What the exact interval says about the threshold."""
        if self.n == 0:
            return "no judgements"
        low, high = self.interval
        if low >= self.threshold:
            return "clearly above"
        if high < self.threshold:
            return "clearly below"
        return "not separable"

    def to_json(self) -> dict[str, Any]:
        low, high = self.interval
        return {"key": self.key, "wins": self.wins, "n": self.n, "rate": None if self.rate is None else round(self.rate, 4),
                "exact_low": round(low, 4), "exact_high": round(high, 4), "threshold": self.threshold,
                "state": self.state, "evidence": self.evidence,
                "wins_to_meet": wins_to_meet(self.n, self.threshold),
                "wins_to_clear": wins_to_clear(self.n, self.threshold)}


def gate_maths(matchup: Mapping[str, Mapping[str, Any]], *, minimum_n: int = C.MIN_SLICE_JUDGEMENTS) -> dict[str, Any]:
    """Exact checks for one hero filter's ours-against-baseline matchup (results.json rows by slice)."""
    overall_row = matchup.get("all", {"wins": 0, "n": 0})
    overall = RateCheck("all", int(overall_row["wins"]), int(overall_row["n"]), C.HERO_OVERALL_MIN, 1)
    slices = [RateCheck(k, int(v["wins"]), int(v["n"]), C.HERO_SLICE_MIN, minimum_n)
              for k, v in sorted(matchup.items()) if k != "all"]
    states = Counter(s.state for s in slices)
    if overall.n == 0:
        rule = "UNTESTED"
    elif overall.state == "below" or states["below"]:
        rule = "FAIL"
    elif states["thin"]:
        rule = "UNTESTED"
    else:
        rule = "PASS"
    return {"rule": rule, "overall": overall.to_json(), "coin_flip": RateCheck("all", overall.wins, overall.n, 0.5, 1).evidence,
            "slices": [s.to_json() for s in slices], "slice_states": dict(sorted(states.items()))}


def slice_faces(rows: Iterable[Mapping[str, str]]) -> dict[str, int]:
    """Faces per gate slice (every slice key a face belongs to except 'all')."""
    counts: Counter[str] = Counter()
    for row in rows:
        counts.update(k for k in slices_for(row) if k != "all")
    return dict(sorted(counts.items()))


def plan_quotas(rows: Sequence[Mapping[str, str]], *, filters: Sequence[str] = C.FILTERS,
                minimum_n: int = C.MIN_SLICE_JUDGEMENTS, judgements_per_pair: int | None = None) -> dict[str, Any]:
    """Judgements per ours-against-baseline pair that every slice needs, and what a chosen number gives.

    Gender swap is only run on faces with a male or female label (scripts/arena.py generate), so
    its slices are counted on those faces only."""
    out: dict[str, Any] = {"minimum_per_slice": minimum_n, "filters": {}}
    for filt in filters:
        faces = [r for r in rows if filt != "gender_swap" or r.get("gender", "").lower() in ("male", "female")]
        counts = slice_faces(faces)
        needed = max((math.ceil(minimum_n / c) for c in counts.values()), default=0)
        chosen = judgements_per_pair if judgements_per_pair is not None else needed
        short = {k: c * chosen for k, c in counts.items() if c * chosen < minimum_n}
        out["filters"][filt] = {"faces": len(faces), "slices": counts, "judgements_per_pair_needed": needed,
                                "judgements_per_pair": chosen, "judgements": len(faces) * chosen,
                                "slices_short": dict(sorted(short.items())),
                                "smallest_slice": min(counts.items(), key=lambda kv: (kv[1], kv[0])) if counts else None}
    per_pair = [f["judgements_per_pair"] for f in out["filters"].values()]
    out["judges_needed"] = max(per_pair, default=0)   # no judge may see a pair twice
    out["total_judgements"] = sum(f["judgements"] for f in out["filters"].values())
    return out


def two_sided_p(k: int, n: int, p: float = 0.5) -> float:
    """Exact two-sided binomial test: the chance of an outcome no likelier than k out of n."""
    if n <= 0:
        return 1.0
    logs = [_log_pmf(i, n, p) for i in range(n + 1)]
    cut = logs[k] + 1e-9
    top = max(logs)
    total = sum(math.exp(v - top) for v in logs)
    return min(1.0, sum(math.exp(v - top) for v in logs if v <= cut) / total)
