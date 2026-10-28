"""Concise Tuesday technical-lock worksheet from checked metadata only.

No photographic content is accepted, and no externally independent verdict is
fabricated. Every command retains its own failing and missing level ranges.
Author: John Khan.
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from statistics import median
from typing import cast

from .errors import CommandValidationError
from .lock_matrix import COMMANDS
from .tuesday_lock import verify_tuesday_lock_json


def _numbers(rows: list[dict[str, object]], key: str) -> tuple[float, ...]:
    result: list[float] = []
    for row in rows:
        field = row.get(key)
        if type(field) in (int, float):
            result.append(float(cast(float, field)))
    return tuple(result)


def _percentile(numbers: tuple[float, ...], fraction: float) -> float | None:
    if not numbers:
        return None
    ordered = sorted(numbers)
    rank = (len(ordered) - 1) * fraction
    lower = math.floor(rank)
    upper = math.ceil(rank)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (rank - lower)


def _ms(value: float | None) -> str:
    return "not measured" if value is None else f"{value:.2f}"


def _level(value: int) -> str:
    return f"{value / 10:.1f}"


def _ranges(values: tuple[int, ...]) -> str:
    if not values:
        return "none"
    ordered = sorted(set(values))
    intervals: list[str] = []
    first = ordered[0]
    last = first
    for current in ordered[1:]:
        if current == last + 1:
            last = current
            continue
        intervals.append(_level(first) if first == last else f"{_level(first)}–{_level(last)}")
        first = current
        last = current
    intervals.append(_level(first) if first == last else f"{_level(first)}–{_level(last)}")
    return ", ".join(intervals)


def _rows(record: Mapping[str, object]) -> list[dict[str, object]]:
    value = record["rows"]
    if not isinstance(value, list) or any(not isinstance(entry, dict) for entry in value):
        raise CommandValidationError("invalid_lock_packet", "Technical rows are unavailable.")
    return cast(list[dict[str, object]], value)


def _bool_count(rows: list[dict[str, object]], key: str) -> int:
    return sum(row[key] is True for row in rows)


def _status_count(rows: list[dict[str, object]], status: str) -> int:
    return sum(row["status"] == status for row in rows)


def render_tuesday_lock_sheet(contents: str) -> str:
    """Return deterministic, sanitized Markdown with explicit open blockers."""
    record = verify_tuesday_lock_json(contents)
    rows = _rows(record)
    matrix = record["matrix"]
    if not isinstance(matrix, dict):
        raise CommandValidationError("invalid_lock_packet", "Matrix evidence is missing.")
    preview_budget = float(cast(float, matrix["preview_budget_ms"]))
    export_budget = float(cast(float, matrix["export_budget_ms"]))
    status = str(record["technical_status"])
    lines = [
        "# BELJOUR | Five Pro Commands: Tuesday technical lock",
        "",
        f"Run: `{record['run_id']}` | Renderer: `{record['renderer_build']}`",
        f"Technical verdict: **{status.upper().replace('_', ' ')}**",
        "Independent real-face gate: **NOT RUN**. Production identity qualification: **NOT VERIFIED**.",
        "Release authorized: **NO**. This sheet is not an external evaluation.",
        "",
        f"Observed slots: {len(rows) - _status_count(rows, 'missing')}/205 "
        f"(5 commands × 41 levels from 1.0 to 5.0 at 0.1 increments).",
        f"Budget requirements: preview ≤ {preview_budget:.1f} ms; "
        f"full render ≤ {export_budget:.1f} ms. Device figures require actual device observation.",
        "",
        "| Command | Captured/41 | Missing | Safety failures | Over budget | "
        "Device evidence | Preview median / P95 ms | Export median / P95 ms |",
        "|---|---:|---:|---:|---:|---:|---|---|",
    ]
    for command in COMMANDS:
        group = [row for row in rows if row["command"] == command.value]
        checked = 41 - _status_count(group, "missing")
        previews = _numbers(group, "preview_ms")
        exports = _numbers(group, "export_ms")
        preview_med = median(previews) if previews else None
        export_med = median(exports) if exports else None
        lines.append(
            f"| /{command.value} | {checked} | {_status_count(group, 'missing')} | "
            f"{_status_count(group, 'failed_safety')} | {_status_count(group, 'over_budget')} | "
            f"{_bool_count(group, 'measured_device')} | "
            f"{_ms(preview_med)} / {_ms(_percentile(previews, 0.95))} | "
            f"{_ms(export_med)} / {_ms(_percentile(exports, 0.95))} |"
        )
    lines.extend([
        "",
        "## Per-command action list",
        "",
        "All failed levels must be corrected and measured again on the same registered build.",
    ])
    for command in COMMANDS:
        group = [row for row in rows if row["command"] == command.value]
        missing = tuple(cast(int, row["level_tenths"]) for row in group if row["status"] == "missing")
        failed = tuple(
            cast(int, row["level_tenths"])
            for row in group
            if row["status"] == "failed_safety"
        )
        slow = tuple(cast(int, row["level_tenths"]) for row in group if row["status"] == "over_budget")
        lines.append(
            f"- `/{command.value}`: missing {_ranges(missing)}; "
            f"safety failed {_ranges(failed)}; timing failed {_ranges(slow)}."
        )
    lines.extend([
        "",
        "## External release prerequisites",
        "",
        "- Approved commercial identity model, independently validated on consenting adults.",
        "- Preregistered, unchanged real-face pass definitions and source hashes.",
        "- Completed locked 100,000-face run with independent labels, group fairness and no regression.",
        "- Tested preview and export on the intended physical mobile devices.",
        "- Independent human quality reviews and judge-visible end-to-end demo.",
        "",
        "Evidence ledger: the corresponding JSON packet contains all 205 slots "
        "and its SHA-256 checksum.",
        "The checksum detects corruption only; it is not proof of authorship, consent or authenticity.",
    ])
    return "\n".join(lines) + "\n"
