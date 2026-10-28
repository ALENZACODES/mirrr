"""Group-complete numerical scorecard for the seven J10-J16 body fixes.

Every registered slice row is always reported: for each fix, its view, three body sizes,
ten independently supplied Monk tones and the thirty size x tone intersections, 44 rows
per fix and 308 in total. A row is NOT_RUN (nothing measured), UNDERPOWERED (fewer than
20 bodies), INCOMPLETE (some jobs missing), NUMERIC_FAIL (pass rate below the committed
rate, refusals counting as non-passes) or CHECKS_OK. Missing and underpowered groups stay
distinct from failure, and no whole-set status is inferred from a subset. Release remains
NOT_RUN: numeric checks are not a human, identity or real-body quality pass.

Rows contain counts only: no photo hash, source, path or per-person measurement.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterator, Mapping
from dataclasses import dataclass
from typing import Any

from .body_acceptance import thresholds
from .body_evidence import BODY_SIZES, MIN_PER_GROUP, VIEWS
from .body_freeze import FIX_IDS_BY_VIEW, TONES, FrozenBody
from .body_ledger import BodyLedger

SCORECARD_FORMAT = "beljour-posture-body-scorecard/1"
SLICES = ("view", "body_size", "monk", "body_size_monk")
ROWS_PER_FIX = 1 + len(BODY_SIZES) + len(TONES) + len(BODY_SIZES) * len(TONES)
REGISTERED_ROWS = ROWS_PER_FIX * sum(len(ids) for ids in FIX_IDS_BY_VIEW.values())


@dataclass(frozen=True)
class SliceRow:
    fix: str
    view: str
    slice: str
    group: str
    bodies: int
    expected_jobs: int
    measured_jobs: int
    refused_jobs: int
    passed_jobs: int
    status: str

    @property
    def pass_rate(self) -> float | None:
        return self.passed_jobs / self.expected_jobs if self.measured_jobs and self.expected_jobs else None

    def to_json(self) -> dict[str, Any]:
        rate = self.pass_rate
        return {
            "fix": self.fix, "view": self.view, "slice": self.slice, "group": self.group,
            "bodies": self.bodies, "expected_jobs": self.expected_jobs, "measured_jobs": self.measured_jobs,
            "refused_jobs": self.refused_jobs, "passed_jobs": self.passed_jobs,
            "pass_rate": None if rate is None else round(rate, 6), "status": self.status,
        }


def slice_groups(view: str) -> Iterator[tuple[str, str, Any]]:
    """(slice, group label, membership test) for every registered group of one view."""
    yield "view", view, lambda body: True
    for size in BODY_SIZES:
        yield "body_size", size, lambda body, size=size: body.body_size == size
    for tone in TONES:
        yield "monk", tone, lambda body, tone=tone: body.monk == tone
    for size in BODY_SIZES:
        for tone in TONES:
            yield "body_size_monk", f"{size}/{tone}", (
                lambda body, size=size, tone=tone: body.body_size == size and body.monk == tone
            )


def row_status(bodies: int, expected: int, measured: int, passed: int, rate: float) -> str:
    """The status a slice row must carry, from its counts alone."""
    if measured == 0:
        return "NOT_RUN"
    if bodies < MIN_PER_GROUP:
        return "UNDERPOWERED"
    if measured < expected:
        return "INCOMPLETE"
    return "CHECKS_OK" if passed / expected >= rate else "NUMERIC_FAIL"


def scorecard_rows(ledger: BodyLedger, limits: Mapping[str, Any] | None = None) -> list[SliceRow]:
    rate = (thresholds() if limits is None else limits)["minimum_group_pass_rate"]
    rows: list[SliceRow] = []
    for view in VIEWS:
        members: list[FrozenBody] = [body for body in ledger.run.bodies if body.view == view]
        for fix in FIX_IDS_BY_VIEW[view]:
            for slice_name, group, test in slice_groups(view):
                chosen = [body for body in members if test(body)]
                outcomes = [ledger.outcome(f"{body.photo_sha256}:{fix}") for body in chosen]
                measured = [item for item in outcomes if item is not None]
                passed = sum(1 for item in measured if item.passed)
                refused = sum(1 for item in measured if item.refused)
                rows.append(SliceRow(fix, view, slice_name, group, len(chosen), len(chosen), len(measured),
                                     refused, passed, row_status(len(chosen), len(chosen), len(measured), passed, rate)))
    if len(rows) != REGISTERED_ROWS:
        raise AssertionError("registered slice rows are incomplete")
    return rows


def numeric_status(rows: list[SliceRow], set_status: str) -> str:
    """Whole-set status: NUMERIC_FAIL on any failing powered group, CHECKS_OK only if every
    one of the 308 rows is CHECKS_OK on a complete set, otherwise NOT_RUN or UNPROVEN."""
    if any(row.status == "NUMERIC_FAIL" for row in rows):
        return "NUMERIC_FAIL"
    if all(row.status == "NOT_RUN" for row in rows):
        return "NOT_RUN"
    if set_status == "NOT_RUN" and all(row.status == "CHECKS_OK" for row in rows):
        return "CHECKS_OK"
    return "UNPROVEN"


def build_scorecard(ledger: BodyLedger, limits: Mapping[str, Any] | None = None) -> dict[str, Any]:
    rows = scorecard_rows(ledger, limits)
    counts: dict[str, int] = {}
    for row in rows:
        counts[row.status] = counts.get(row.status, 0) + 1
    set_status = ledger.run.set_status()
    return {
        "format": SCORECARD_FORMAT,
        "run": ledger.run.fingerprint,
        "definitions_sha256": ledger.run.definitions_sha256,
        "fixes": [fix for view in VIEWS for fix in FIX_IDS_BY_VIEW[view]],
        "registered_rows": REGISTERED_ROWS,
        "set_status": set_status,
        "numeric_status": numeric_status(rows, set_status),
        "release_status": "NOT_RUN",
        "row_status_counts": dict(sorted(counts.items())),
        "completion": ledger.completion(),
        "rows": [row.to_json() for row in rows],
        "notes": [
            "Numeric checks of externally supplied measurements; not a human, identity or real-body quality pass.",
            "Missing or underpowered groups are not failures and never count as passes.",
        ],
    }
