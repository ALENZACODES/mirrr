"""Run reports in JSON and Markdown.

The report lists every stage with counts in and out, reject reasons and
timings, the quality score spread and declared-attribute counts of the final
set, the slice shortfall, the holdout result and the manifest and lock
hashes. Only file names appear, never absolute paths.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import statistics
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from .manifest import TOOL_VERSION
from .pipeline import RunResult
from .records import DECLARED_ATTRIBUTES
from .slices import slice_counts
from .stages import WorkItem

REPORT_SCHEMA = "beljour-data-report/1"


def score_spread(items: Sequence[WorkItem]) -> dict[str, float] | None:
    """Min, 10th percentile, median, mean and max quality score."""
    scores = sorted(item.score for item in items if item.quality is not None)
    if not scores:
        return None
    tenth = scores[max(0, int(len(scores) * 0.1) - 1)] if len(scores) >= 10 else scores[0]
    return {"min": round(scores[0], 4), "p10": round(tenth, 4),
            "median": round(statistics.median(scores), 4),
            "mean": round(statistics.fmean(scores), 4), "max": round(scores[-1], 4)}


def build_report(result: RunResult) -> dict[str, Any]:
    """Plain dict report of a finished or stopped run."""
    stages = [stage.to_dict() for stage in result.stages]
    records = [item.record for item in result.items]
    report: dict[str, Any] = {
        "schema": REPORT_SCHEMA,
        "set_name": result.set_name,
        "tool_version": TOOL_VERSION,
        "filter_config_sha256": result.filter_config_sha256,
        "complete": result.lock_sha256 is not None,
        "intake_rows": stages[0]["count_in"] if stages else 0,
        "final_count": len(result.items),
        "stages": stages,
        "quality": score_spread(result.items),
        "declared": {dim: slice_counts(records, dim) for dim in DECLARED_ATTRIBUTES},
        "licences": _counts(record.licence for record in records),
        "sources": _counts(record.source for record in records),
    }
    by_name = {stage["name"]: stage for stage in stages}
    balance = by_name.get("balance", {}).get("stats", {})
    if balance.get("balanced"):
        report["shortfall"] = [cell for cell in balance.get("cells", []) if cell["shortfall"]]
    holdout = by_name.get("holdout", {}).get("stats")
    if holdout is not None:
        report["holdout"] = holdout
    if result.summary is not None and result.manifest_path is not None:
        report["manifest"] = {"file": result.manifest_path.name, "count": result.summary.count,
                              "rows_sha256": result.summary.rows_sha256,
                              "file_sha256": result.summary.file_sha256,
                              "shards": result.summary.shard_count}
    if result.lock_path is not None:
        report["lock"] = {"file": result.lock_path.name, "lock_sha256": result.lock_sha256,
                          "status": result.lock_status}
    return report


def _counts(values: Any) -> dict[str, int]:
    out: dict[str, int] = {}
    for value in values:
        out[str(value)] = out.get(str(value), 0) + 1
    return dict(sorted(out.items()))


def _table(headers: Sequence[str], rows: Sequence[Sequence[Any]]) -> list[str]:
    lines = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    lines.extend("| " + " | ".join(str(cell) for cell in row) + " |" for row in rows)
    return lines


def _reason_text(reasons: Mapping[str, int]) -> str:
    return ", ".join(f"{name} {count}" for name, count in reasons.items()) or "-"


def render_markdown(report: Mapping[str, Any]) -> str:
    """Readable report; same content as the JSON."""
    lines = [f"# Data set report: {report['set_name']}", "",
             "Author: John Khan.", "",
             f"- Tool version: {report['tool_version']}",
             f"- Filter config hash: `{report['filter_config_sha256']}`",
             f"- Intake rows: {report['intake_rows']}",
             f"- Final records: {report['final_count']}",
             f"- Complete: {'yes' if report['complete'] else 'no (stopped early)'}", "",
             "## Stages", ""]
    lines.extend(_table(("Stage", "Status", "In", "Out", "Rejected", "Reasons", "Seconds"), [
        (s["name"], s["status"], s["count_in"], s["count_out"], s["rejected"],
         _reason_text(s["reject_reasons"]), s["seconds"]) for s in report["stages"]]))
    quality = report.get("quality")
    if quality:
        lines += ["", "## Quality scores of the final set", ""]
        lines.extend(_table(tuple(quality), [tuple(quality.values())]))
    lines += ["", "## Declared attributes of the final set", "",
              "Counts use declared values only; nothing is inferred.", ""]
    for dim, counts in report["declared"].items():
        lines.append(f"- {dim}: " + (", ".join(f"{k} {v}" for k, v in counts.items()) or "-"))
    lines += ["", "## Licences", ""]
    lines.extend(f"- {name}: {count}" for name, count in report["licences"].items())
    if "shortfall" in report:
        lines += ["", "## Slice shortfall", ""]
        if report["shortfall"]:
            lines.extend(_table(("Cell", "Target", "Available", "Selected", "Short"), [
                (c["cell"], c["target"], c["available"], c["selected"], c["shortfall"])
                for c in report["shortfall"]]))
        else:
            lines.append("Every cell met its quota.")
    if "holdout" in report:
        holdout = report["holdout"]
        lines += ["", "## Holdout leak guard", "",
                  f"- Frozen sets checked: {', '.join(holdout.get('frozen_sets', [])) or 'none'}",
                  f"- Leaks found: {holdout.get('leaks', 0)}"]
    if "manifest" in report:
        manifest = report["manifest"]
        lines += ["", "## Manifest and lock", "",
                  f"- Manifest: {manifest['file']} ({manifest['count']} rows, "
                  f"{manifest['shards']} shards)",
                  f"- Rows hash: `{manifest['rows_sha256']}`"]
    if "lock" in report:
        lock = report["lock"]
        lines.append(f"- Lock: {lock['file']} ({lock['status']}), `{lock['lock_sha256']}`")
    return "\n".join(lines) + "\n"


def write_report(report: Mapping[str, Any], folder: Path) -> tuple[Path, Path]:
    """Write <set>.report.json and <set>.report.md into folder."""
    folder.mkdir(parents=True, exist_ok=True)
    name = str(report["set_name"])
    json_path = folder / f"{name}.report.json"
    md_path = folder / f"{name}.report.md"
    for path, text in ((json_path, json.dumps(report, indent=1, sort_keys=True) + "\n"),
                       (md_path, render_markdown(report))):
        tmp = path.with_name(path.name + ".partial")
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)
    return json_path, md_path
