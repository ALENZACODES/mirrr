"""Quality report format `beljour-quality/1` (CONTRACTS.md §17).

One report per tool. It lists every photo (and stop, when the tool has stops) with
the checks run on it, then a summary. Python and TypeScript write the same shape,
and each language validates reports from the other.

{
  "format": "beljour-quality/1",
  "tool": "tint", "tool_version": "1.0.0", "language": "python",
  "created": "2026-10-22", "synthetic": true,
  "photos": [{"photo": "synthetic-01", "synthetic": true, "stop": "natural",
              "checks": [{"code": "Q1", "name": "...", "passed": true,
                          "measured": {...}, "rule": "...", "thresholds": {...}}]}],
  "summary": {"checks": 7, "passed": 7, "failed": 0, "passed_all": true,
              "by_code": {"Q1": {"passed": 3, "failed": 0}}}
}

Author: John Khan.
"""
from __future__ import annotations

import json
import re
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .metrics import NAMES, Check

FORMAT = "beljour-quality/1"
LANGUAGES = ("python", "typescript")
_NAME = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
_VERSION = re.compile(r"^\d+\.\d+\.\d+$")
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@dataclass
class PhotoResult:
    photo: str
    synthetic: bool
    checks: list[Check] = field(default_factory=list)
    stop: str | None = None

    def to_json(self) -> dict[str, Any]:
        return {"photo": self.photo, "synthetic": self.synthetic, "stop": self.stop,
                "checks": [c.to_json() for c in self.checks]}


def summarise(photos: Iterable[dict[str, Any]]) -> dict[str, Any]:
    by_code: dict[str, dict[str, int]] = {}
    total = passed = 0
    for photo in photos:
        for check in photo["checks"]:
            slot = by_code.setdefault(check["code"], {"passed": 0, "failed": 0})
            slot["passed" if check["passed"] else "failed"] += 1
            total += 1
            passed += bool(check["passed"])
    return {"checks": total, "passed": passed, "failed": total - passed,
            "passed_all": total > 0 and passed == total, "by_code": dict(sorted(by_code.items()))}


def build_report(tool: str, tool_version: str, photos: list[PhotoResult], *,
                 language: str = "python", created: str | None = None) -> dict[str, Any]:
    entries = [p.to_json() for p in photos]
    report = {
        "format": FORMAT,
        "tool": tool,
        "tool_version": tool_version,
        "language": language,
        "created": created or datetime.now(tz=UTC).date().isoformat(),
        "synthetic": all(p.synthetic for p in photos),
        "photos": entries,
        "summary": summarise(entries),
    }
    problems = validate_report(report)
    if problems:
        raise ValueError("; ".join(problems))
    return report


def _check_problems(where: str, check: Any) -> list[str]:
    if not isinstance(check, dict):
        return [f"{where}: a check must be an object"]
    problems = []
    code = check.get("code")
    if code not in NAMES:
        problems.append(f"{where}: unknown check code {code!r}")
    elif check.get("name") != NAMES[code]:
        problems.append(f"{where}: name must be {NAMES[code]!r}")
    if not isinstance(check.get("passed"), bool):
        problems.append(f"{where}: passed must be true or false")
    if not isinstance(check.get("measured"), dict):
        problems.append(f"{where}: measured must be an object")
    if not isinstance(check.get("rule"), str) or not check.get("rule"):
        problems.append(f"{where}: rule must be a non-empty string")
    thresholds = check.get("thresholds")
    if not isinstance(thresholds, dict) or not all(
            isinstance(v, (int, float)) and not isinstance(v, bool) for v in thresholds.values()):
        problems.append(f"{where}: thresholds must map names to numbers")
    return problems


def validate_report(report: Any) -> list[str]:
    """Problems with a report, empty when it follows §17."""
    if not isinstance(report, dict):
        return ["a report must be a JSON object"]
    problems = []
    if report.get("format") != FORMAT:
        problems.append(f"format must be {FORMAT}")
    if not isinstance(report.get("tool"), str) or not _NAME.match(report["tool"]):
        problems.append("tool must be a lowercase identifier")
    if not isinstance(report.get("tool_version"), str) or not _VERSION.match(report["tool_version"]):
        problems.append("tool_version must be major.minor.patch")
    if report.get("language") not in LANGUAGES:
        problems.append("language must be python or typescript")
    if not isinstance(report.get("created"), str) or not _DATE.match(report["created"]):
        problems.append("created must be a YYYY-MM-DD date")
    photos = report.get("photos")
    if not isinstance(photos, list) or not photos:
        return problems + ["photos must be a non-empty list"]
    for i, photo in enumerate(photos):
        where = f"photos[{i}]"
        if not isinstance(photo, dict):
            problems.append(f"{where}: must be an object")
            continue
        if not isinstance(photo.get("photo"), str) or not photo["photo"]:
            problems.append(f"{where}: photo id required")
        if not isinstance(photo.get("synthetic"), bool):
            problems.append(f"{where}: synthetic must be true or false")
        if photo.get("stop") is not None and not isinstance(photo["stop"], str):
            problems.append(f"{where}: stop must be a string or null")
        checks = photo.get("checks")
        if not isinstance(checks, list) or not checks:
            problems.append(f"{where}: checks must be a non-empty list")
            continue
        for j, check in enumerate(checks):
            problems += _check_problems(f"{where}.checks[{j}]", check)
    if not problems:
        if report.get("summary") != summarise(photos):
            problems.append("summary does not match the checks")
        if report.get("synthetic") != all(p["synthetic"] for p in photos):
            problems.append("synthetic must be true exactly when every photo is synthetic")
    return problems


def to_markdown(report: dict[str, Any]) -> str:
    """A short table for HANDOFF notes and PR descriptions."""
    s = report["summary"]
    lines = [f"### {report['tool']} {report['tool_version']} ({report['language']})", "",
             f"{s['passed']} of {s['checks']} checks passed"
             + (" on synthetic photos only." if report["synthetic"] else "."), "",
             "| Photo | Stop | Check | Result | Measured |", "|---|---|---|---|---|"]
    for photo in report["photos"]:
        for check in photo["checks"]:
            measured = ", ".join(f"{k}={v}" for k, v in check["measured"].items()
                                 if not isinstance(v, (list, dict)))
            lines.append(f"| {photo['photo']} | {photo['stop'] or ''} | {check['code']} {check['name']} | "
                         f"{'pass' if check['passed'] else 'FAIL'} | {measured} |")
    return "\n".join(lines) + "\n"


def write(report: dict[str, Any], directory: Path) -> tuple[Path, Path]:
    problems = validate_report(report)
    if problems:
        raise ValueError("; ".join(problems))
    directory.mkdir(parents=True, exist_ok=True)
    stem = f"{report['tool']}-{report['language']}"
    json_path = directory / f"{stem}.json"
    md_path = directory / f"{stem}.md"
    json_path.write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")
    md_path.write_text(to_markdown(report))
    return json_path, md_path
