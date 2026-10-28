"""Data card for a locked set: sources, licences, slice counts, filters and gaps.

Built from the lock and manifest (verified first) and, when given, the run
report. Counts use declared attributes only. Known gaps are stated plainly:
undeclared shares, attribute values with no records, quota shortfalls and
reject reasons. Output is Markdown plus the same facts as JSON.
Author: John Khan.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from .lockfile import assert_lock
from .manifest import ManifestReader
from .records import DECLARED_ATTRIBUTES
from .slices import UNDECLARED

CARD_SCHEMA = "beljour-data-card/1"
AUTHOR = "John Khan"
UNDECLARED_WARN = 0.2


def _bump(table: dict[str, int], key: str) -> None:
    table[key] = table.get(key, 0) + 1


def card_facts(lock_path: Path, report_path: Path | None = None) -> dict[str, Any]:
    """Every fact the card shows, as a dict."""
    lock = assert_lock(lock_path, require_tool_version=False)
    manifest = lock_path.parent / str(lock["manifest"]["file"])
    sources: dict[str, dict[str, Any]] = {}
    licences: dict[str, int] = {}
    declared: dict[str, dict[str, int]] = {dim: {} for dim in DECLARED_ATTRIBUTES}
    total = 0
    for row in ManifestReader(manifest):
        record = row.record
        total += 1
        entry = sources.setdefault(record.source, {"records": 0, "licences": {}})
        entry["records"] += 1
        _bump(entry["licences"], record.licence)
        _bump(licences, record.licence)
        for dim in DECLARED_ATTRIBUTES:
            _bump(declared[dim], record.declared(dim) or UNDECLARED)
    facts: dict[str, Any] = {
        "schema": CARD_SCHEMA,
        "author": AUTHOR,
        "set_name": lock["set_name"],
        "version": lock["version"],
        "lock_sha256": lock["lock_sha256"],
        "parent_lock_sha256": lock["parent_lock_sha256"],
        "filter_config_sha256": lock["filter_config_sha256"],
        "records": total,
        "shards": lock["manifest"]["shard_count"],
        "sources": {name: {"records": v["records"], "licences": dict(sorted(v["licences"].items()))}
                    for name, v in sorted(sources.items())},
        "licences": dict(sorted(licences.items())),
        "declared": {dim: dict(sorted(counts.items())) for dim, counts in declared.items()},
    }
    report = _read_report(report_path)
    facts["filters"] = _filters(report)
    facts["gaps"] = known_gaps(facts["declared"], total, report)
    return facts


def _read_report(path: Path | None) -> Mapping[str, Any]:
    if path is None:
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw if isinstance(raw, dict) else {}


def _filters(report: Mapping[str, Any]) -> list[dict[str, Any]]:
    filters: list[dict[str, Any]] = []
    for stage in report.get("stages", []):
        if not isinstance(stage, dict):
            continue
        filters.append({"stage": stage.get("name"), "in": stage.get("count_in"),
                        "out": stage.get("count_out"),
                        "reasons": stage.get("reject_reasons", {})})
    return filters


def known_gaps(declared: Mapping[str, Mapping[str, int]], total: int,
               report: Mapping[str, Any]) -> list[str]:
    """Plain statements of what the set lacks."""
    gaps: list[str] = []
    if total == 0:
        return ["the set is empty"]
    for dim, allowed in DECLARED_ATTRIBUTES.items():
        counts = declared.get(dim, {})
        missing = counts.get(UNDECLARED, 0)
        if missing / total >= UNDECLARED_WARN:
            gaps.append(f"{dim}: {missing} of {total} records ({missing / total:.0%}) have no "
                        "declared value")
        absent = [value for value in allowed if counts.get(value, 0) == 0]
        if absent:
            gaps.append(f"{dim}: no records for {', '.join(absent)}")
    for cell in report.get("shortfall", []):
        if isinstance(cell, dict):
            gaps.append(f"slice {cell.get('cell')}: {cell.get('shortfall')} short of its "
                        f"quota of {cell.get('target')}")
    if not report:
        gaps.append("no run report supplied, so filter counts are not shown")
    return gaps


def render_card(facts: Mapping[str, Any]) -> str:
    """Markdown data card."""
    lines = [f"# Data card: {facts['set_name']} (version {facts['version']})", "",
             f"Author: {facts['author']}.", "",
             "## Summary", "",
             f"- Records: {facts['records']} in {facts['shards']} shards",
             f"- Lock: `{facts['lock_sha256']}`",
             f"- Parent lock: `{facts['parent_lock_sha256'] or 'none'}`",
             f"- Filter config: `{facts['filter_config_sha256']}`",
             "- Images are drawn from the sources below under the listed licences only. "
             "Attributes are as declared by each source; none were inferred.", "",
             "## Sources", "",
             "| Source | Records | Licences |", "|---|---|---|"]
    for name, info in facts["sources"].items():
        licence_text = ", ".join(f"{k} {v}" for k, v in info["licences"].items())
        lines.append(f"| {name} | {info['records']} | {licence_text} |")
    lines += ["", "## Licences", ""]
    lines.extend(f"- {name}: {count}" for name, count in facts["licences"].items())
    lines += ["", "## Counts by slice", ""]
    for dim, counts in facts["declared"].items():
        lines.append(f"- {dim}: " + ", ".join(f"{k} {v}" for k, v in counts.items()))
    lines += ["", "## Filters applied", ""]
    if facts["filters"]:
        lines += ["| Stage | In | Out | Reasons |", "|---|---|---|---|"]
        for item in facts["filters"]:
            reasons = ", ".join(f"{k} {v}" for k, v in item["reasons"].items()) or "-"
            lines.append(f"| {item['stage']} | {item['in']} | {item['out']} | {reasons} |")
    else:
        lines.append("Not available without the run report.")
    lines += ["", "## Known gaps", ""]
    if facts["gaps"]:
        lines.extend(f"- {gap}" for gap in facts["gaps"])
    else:
        lines.append("- none found")
    return "\n".join(lines) + "\n"


def write_card(lock_path: Path, out_dir: Path, report_path: Path | None = None
               ) -> tuple[Path, Path]:
    """Write <set>.datacard.md and <set>.datacard.json."""
    facts = card_facts(lock_path, report_path)
    out_dir.mkdir(parents=True, exist_ok=True)
    md_path = out_dir / f"{facts['set_name']}.datacard.md"
    json_path = out_dir / f"{facts['set_name']}.datacard.json"
    md_path.write_text(render_card(facts), encoding="utf-8")
    json_path.write_text(json.dumps(facts, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    return md_path, json_path
