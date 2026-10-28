"""Browser-safe projection of a body scorecard: counts only, in the studio's exact format.

The operator report keeps hashed shard receipts and per-row pass rates; the browser's
strict reader (web/src/body/posture-proof.ts) accepts neither. `browser_report` emits
format `beljour-posture-body-evidence/1`: run and definitions fingerprints, set, numeric,
release and human-review status, completion counts and the 308 registered rows with
counts and status. It is validated before it can be written: every registered row exactly
once, statuses that follow from the counts, and no per-subject value of any kind.
Release and human review are always NOT_RUN. Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

from .body_acceptance import thresholds
from .body_scorecard import REGISTERED_ROWS, SCORECARD_FORMAT, SliceRow, numeric_status, row_status

EVIDENCE_FORMAT = "beljour-posture-body-evidence/1"
# ASSUMED: 308 rows of small integers fit far below this; larger output means a fault.
MAX_BROWSER_BYTES = 256 * 1024
ROW_FIELDS = ("fix", "view", "slice", "group", "bodies", "expected_jobs", "measured_jobs",
              "refused_jobs", "passed_jobs", "status")
COMPLETION_FIELDS = ("expected_jobs", "recorded_jobs", "missing_jobs", "refused_jobs", "passed_jobs", "failed_jobs")


class PublicReportError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def _row(raw: Mapping[str, Any], rate: float) -> dict[str, Any]:
    row = {field: raw[field] for field in ROW_FIELDS}
    for field in ROW_FIELDS[4:9]:
        if type(row[field]) is not int or row[field] < 0:
            raise PublicReportError("invalid_row_count")
    if row["expected_jobs"] != row["bodies"] or row["measured_jobs"] > row["expected_jobs"] or (
        row["passed_jobs"] + row["refused_jobs"] > row["measured_jobs"]
    ):
        raise PublicReportError("impossible_row_counts")
    if row["status"] != row_status(row["bodies"], row["expected_jobs"], row["measured_jobs"], row["passed_jobs"], rate):
        raise PublicReportError("inconsistent_row_status")
    return row


def browser_report(scorecard: Mapping[str, Any], *, rate: float | None = None) -> dict[str, Any]:
    """Project and validate; raises PublicReportError rather than emit an unsafe report."""
    if rate is None:
        rate = float(thresholds()["minimum_group_pass_rate"])
    if scorecard.get("format") != SCORECARD_FORMAT or scorecard.get("release_status") != "NOT_RUN":
        raise PublicReportError("invalid_scorecard")
    raw_rows = scorecard.get("rows")
    if not isinstance(raw_rows, list) or len(raw_rows) != REGISTERED_ROWS:
        raise PublicReportError("missing_group_rows")
    rows = [_row(item, rate) for item in raw_rows]
    keys = {(row["fix"], row["slice"], row["group"]) for row in rows}
    if len(keys) != REGISTERED_ROWS:
        raise PublicReportError("duplicate_group_row")
    typed = [SliceRow(**row) for row in rows]
    set_status = scorecard.get("set_status")
    if set_status not in ("NOT_RUN", "UNPROVEN") or scorecard.get("numeric_status") != numeric_status(typed, set_status):
        raise PublicReportError("inconsistent_numeric_status")
    completion = {field: scorecard["completion"][field] for field in COMPLETION_FIELDS}
    report = {
        "format": EVIDENCE_FORMAT,
        "run": scorecard["run"],
        "definitions_sha256": scorecard["definitions_sha256"],
        "set_status": set_status,
        "numeric_status": scorecard["numeric_status"],
        "release_status": "NOT_RUN",
        "human_review": "NOT_RUN",
        "completion": completion,
        "rows": rows,
    }
    if len(json.dumps(report, sort_keys=True, separators=(",", ":"))) > MAX_BROWSER_BYTES:
        raise PublicReportError("browser_report_too_large")
    return report
