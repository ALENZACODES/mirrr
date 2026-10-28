"""Photo-free latency profile from real guarded command execution results.

Cold and warmed runs share an immutable plan and current photo. The summary
separates first-run work from cached work and does not claim that a synthetic
CPU benchmark meets mobile-device budgets. Author: John Khan.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass

from .errors import CommandValidationError
from .performance import RenderQuality
from .pro_plan import ProPlan
from .r2h_session import R2HSession


@dataclass(frozen=True, slots=True)
class LatencyProfile:
    quality: RenderQuality
    plan_fingerprint: str
    cold_ms: float
    warm_median_ms: float
    warm_p95_ms: float
    warm_cache_hits: int
    warm_runs: int
    cold_cache_hit: bool
    speedup_ratio: float | None
    target_ms: float
    budget_exceeded: bool
    measured_device: bool = False
    realface_approved: bool = False

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": "beljour-command-latency/1",
            "quality": self.quality,
            "plan_fingerprint": self.plan_fingerprint,
            "cold_ms": round(self.cold_ms, 4),
            "warm_median_ms": round(self.warm_median_ms, 4),
            "warm_p95_ms": round(self.warm_p95_ms, 4),
            "warm_cache_hits": self.warm_cache_hits,
            "warm_runs": self.warm_runs,
            "cold_cache_hit": self.cold_cache_hit,
            "speedup_ratio": self.speedup_ratio,
            "target_ms": self.target_ms,
            "budget_exceeded": self.budget_exceeded,
            "measured_device": False,
            "realface_approved": False,
        }


def _p95(values: list[float]) -> float:
    ordered = sorted(values)
    return ordered[max(0, math.ceil(0.95 * len(ordered)) - 1)]


def profile_command_latency(
    session: R2HSession,
    plan: ProPlan,
    *,
    quality: RenderQuality = "preview",
    warm_runs: int = 7,
) -> LatencyProfile:
    """Profile guarded first run and cached reuse without fabricating timings.

    A fresh or explicitly reset photo-scoped session is required: a first-run
    cache hit is retained as evidence instead of relabelled as a cold render.
    The routine never bypasses identity checks, even on cached frames.
    """
    if not isinstance(session, R2HSession) or not isinstance(plan, ProPlan):
        raise CommandValidationError("invalid_latency", "Checked session and plan are required.")
    if quality not in ("preview", "export"):
        raise CommandValidationError("invalid_latency", "Unknown render quality.")
    if type(warm_runs) is not int or not 2 <= warm_runs <= 40:
        raise CommandValidationError("invalid_latency", "Two to forty warm runs are required.")
    if not session.summary.photo_open:
        raise CommandValidationError("invalid_latency", "Open a photo before timing commands.")
    first = session.run(plan, quality=quality)
    fp = plan.fingerprint()
    if first.plan.fingerprint() != fp:
        raise CommandValidationError("invalid_latency", "Rendered plan changed during timing.")
    elapsed: list[float] = []
    cache_hits = 0
    for _ in range(warm_runs):
        result = session.run(plan, quality=quality)
        if result.plan.fingerprint() != fp:
            raise CommandValidationError("invalid_latency", "Cached run changed its plan.")
        elapsed.append(result.timing.elapsed_ms)
        cache_hits += int(result.timing.cache_hit)
    median = float(statistics.median(elapsed))
    cold = first.timing.elapsed_ms
    ratio = cold / median if median > 0.0 else None
    budget = first.timing.target_ms
    return LatencyProfile(
        quality=quality,
        plan_fingerprint=fp,
        cold_ms=cold,
        warm_median_ms=median,
        warm_p95_ms=_p95(elapsed),
        warm_cache_hits=cache_hits,
        warm_runs=warm_runs,
        cold_cache_hit=first.timing.cache_hit,
        speedup_ratio=ratio,
        target_ms=budget,
        budget_exceeded=cold > budget or _p95(elapsed) > budget,
    )
