"""Load-relative timing evidence with immutable absolute budget references.

Warm-up and paired calibration distinguish process contention from code slowdown.
A relative observation never authorizes an unmeasured cold-start claim.
Author: John Khan.
"""
from __future__ import annotations

import math
import statistics
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Literal

Status = Literal["PASS", "FAIL", "UNPROVEN"]
MIN_MEASUREMENTS = 5
MAX_MEASUREMENTS = 15
MIN_WARMUPS = 1
MAX_WARMUPS = 4
GENDER_BUDGET_MS = 1000.0
WEB_GENDER_BUDGET_MS = 1500.0
CALIBRATION_DRIFT_LIMIT = 0.25  # ASSUMED maximum drift for comparable paired trials.


@dataclass(frozen=True)
class TimedSample:
    work_ms: float
    reference_before_ms: float
    reference_after_ms: float
    normalized_ms: float
    reference_scale: float


@dataclass(frozen=True)
class TimingEvidence:
    label: str
    budget_ms: float
    warmup_count: int
    samples: tuple[TimedSample, ...]
    raw_median_ms: float
    normalized_median_ms: float
    reference_median_ms: float
    reference_baseline_ms: float | None
    status: Status
    reason: str

    def counts_only(self) -> dict[str, int | float | str | bool]:
        return {
            "label": self.label,
            "samples": len(self.samples),
            "warmups": self.warmup_count,
            "budget_ms": self.budget_ms,
            "raw_median_ms": self.raw_median_ms,
            "normalized_median_ms": self.normalized_median_ms,
            "reference_median_ms": self.reference_median_ms,
            "status": self.status,
            "reason": self.reason,
            "raw_over_budget": self.raw_median_ms >= self.budget_ms,
        }


def _finite_positive(value: float, label: str) -> float:
    if isinstance(value, bool) or not math.isfinite(value) or value <= 0:
        raise ValueError(f"{label} must be finite and positive")
    return value


def _timed(task: Callable[[], object]) -> float:
    started = time.perf_counter_ns()
    task()
    elapsed = (time.perf_counter_ns() - started) / 1_000_000.0
    return max(elapsed, 0.000001)


def from_samples(
    label: str,
    pairs: Sequence[tuple[float, float, float]],
    *,
    budget_ms: float,
    warmups: int,
    reference_baseline_ms: float | None,
    drift_limit: float = CALIBRATION_DRIFT_LIMIT,
) -> TimingEvidence:
    """Use the median of paired, load-normalized trials, never a raised budget."""
    _finite_positive(budget_ms, "budget")
    if not MIN_MEASUREMENTS <= len(pairs) <= MAX_MEASUREMENTS:
        raise ValueError("requires five to fifteen measured trials")
    if not MIN_WARMUPS <= warmups <= MAX_WARMUPS:
        raise ValueError("requires one to four separate warm-up calls")
    if not 0 <= drift_limit < 1:
        raise ValueError("drift limit must be below one")
    if reference_baseline_ms is not None:
        _finite_positive(reference_baseline_ms, "reference baseline")
    rows: list[TimedSample] = []
    reference_values: list[float] = []
    drifted = False
    for work, before, after in pairs:
        _finite_positive(work, "work")
        _finite_positive(before, "reference before")
        _finite_positive(after, "reference after")
        drift = abs(before - after) / max(before, after)
        drifted |= drift > drift_limit
        paired_reference = (before + after) / 2.0
        reference_values.append(paired_reference)
        scale = (
            paired_reference / reference_baseline_ms
            if reference_baseline_ms is not None else 1.0
        )
        normalized = work / scale
        rows.append(TimedSample(work, before, after, normalized, scale))
    raw = statistics.median(row.work_ms for row in rows)
    normalized = statistics.median(row.normalized_ms for row in rows)
    reference_median = statistics.median(reference_values)
    if drifted:
        status: Status = "UNPROVEN"
        reason = "paired_calibration_unstable"
    elif reference_baseline_ms is None:
        status = "UNPROVEN"
        reason = "approved_reference_baseline_missing"
    elif normalized >= budget_ms:
        status = "FAIL"
        reason = "normalized_budget_exceeded"
    else:
        status = "PASS"
        reason = "load_normalized_budget_met"
    return TimingEvidence(label, budget_ms, warmups, tuple(rows), raw, normalized,
                          reference_median, reference_baseline_ms, status, reason)


def sample_callable(
    label: str,
    work: Callable[[], object],
    reference: Callable[[], object],
    *,
    budget_ms: float,
    reference_baseline_ms: float | None,
    count: int = 5,
    warmups: int = 2,
    validate: Callable[[], bool] | None = None,
) -> TimingEvidence:
    """Warm both paths, then pair before/after reference around each render."""
    if not MIN_MEASUREMENTS <= count <= MAX_MEASUREMENTS:
        raise ValueError("requires five to fifteen repetitions")
    if not MIN_WARMUPS <= warmups <= MAX_WARMUPS:
        raise ValueError("requires one to four warm-up passes")
    for _ in range(warmups):
        reference()
        work()
        if validate is not None and not validate():
            raise AssertionError("warm-up violated an engine correctness contract")
    pairs: list[tuple[float, float, float]] = []
    for _ in range(count):
        before = _timed(reference)
        work_ms = _timed(work)
        if validate is not None and not validate():
            raise AssertionError("timed render violated an engine correctness contract")
        after = _timed(reference)
        pairs.append((work_ms, before, after))
    return from_samples(label, pairs, budget_ms=budget_ms, warmups=warmups,
                        reference_baseline_ms=reference_baseline_ms)


def compare_with_approved_reference(
    current: TimingEvidence,
    approved: TimingEvidence,
    *,
    maximum_regression: float = 0.0,
) -> tuple[Status, str]:
    """A CPU-load adjustment cannot excuse a regression against a green revision."""
    if maximum_regression != 0.0:
        raise ValueError("published no-regression tolerance is zero")
    if approved.status != "PASS" or current.status != "PASS":
        return ("UNPROVEN", "comparable_passing_measurements_required")
    if current.label != approved.label or current.budget_ms != approved.budget_ms:
        return ("UNPROVEN", "benchmark_identity_or_budget_differ")
    if current.reference_baseline_ms != approved.reference_baseline_ms:
        return ("UNPROVEN", "reference_calibration_revision_differs")
    if current.normalized_median_ms > approved.normalized_median_ms:
        return ("FAIL", "positive_regression_with_zero_tolerance")
    return ("PASS", "no_relative_performance_regression")


def report_cases(evidence: Sequence[TimingEvidence]) -> dict[str, object]:
    """Numbers only; no image arrays, source paths or machine identifiers."""
    if not evidence:
        return {"status": "UNPROVEN", "measured": 0, "unproven": 0}
    labels = [row.label for row in evidence]
    if len(labels) != len(set(labels)):
        raise ValueError("duplicate timing profiles")
    failed = sum(row.status == "FAIL" for row in evidence)
    incomplete = sum(row.status == "UNPROVEN" for row in evidence)
    return {
        "status": "FAIL" if failed else "UNPROVEN",
        "measured": len(evidence),
        "failed": failed,
        "unproven": incomplete,
        "profiles": [row.counts_only() for row in evidence],
        "real_device_evidence": "NOT_MEASURED",
    }
