"""Accumulate scalar per-module/per-group quality diagnostics from real-face rows.

An absent commercial-cleared embedding model is not papered over with a fake
FID/identity value. Artifact probes are screening only. The reported status is
UNPROVEN until all required measurements (including independent review) exist.
Author: John Khan.
"""
from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from typing import Any

METRIC_IDS = frozenset({"fid", "kid", "identity", "artifacts"})


def parse_metrics(csv: str) -> tuple[str, ...]:
    if not csv.strip():
        return ()
    names = tuple(token.strip() for token in csv.split(","))
    if not names or len(names) != len(set(names)) or any(name not in METRIC_IDS for name in names):
        raise ValueError("--metrics must be comma-separated fid,kid,identity,artifacts without repetitions")
    return names


def summarize(rows: Iterable[dict[str, Any]], metrics: tuple[str, ...]) -> dict[str, Any]:
    """Only scalar counters are retained in the gate report; no image or embedding."""
    items: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        if row.get("check") in {"dependency_missing", "exception"}:
            continue
        for group_field in ("group", "race", "gender", "age", "monk"):
            group = str(row.get(group_field) or "unknown")
            items[(str(row.get("module")), f"{group_field}:{group}")].append(row)
    report: dict[str, Any] = {"status": "UNPROVEN", "screening_only": True,
                              "reason": "No licensed Inception-v3 or identity weights supplied; human review also required",
                              "required": list(metrics), "by_module_group": []}
    for (module, group), observations in sorted(items.items()):
        # A face can generate several checks. Average per face before group
        # aggregation so three stops do not bias a shorter engine's rate.
        per_face: dict[str, list[float]] = defaultdict(list)
        for row in observations:
            value = row.get("artifact_score")
            if isinstance(value, (int, float)) and value >= 0:
                per_face[str(row.get("face_id"))].append(float(value))
        vals = [sum(series) / len(series) for series in per_face.values() if series]
        entry: dict[str, Any] = {"module": module, "group": group, "faces_with_artifact_probe": len(vals),
                                 "artifact_score_mean": sum(vals) / len(vals) if vals else None,
                                 "status": "UNPROVEN"}
        for name in ("fid", "kid", "identity"):
            if name in metrics:
                entry[name] = None
                entry[f"{name}_status"] = "UNPROVEN"
        if "artifacts" in metrics:
            entry["artifacts_status"] = "SCREENING" if vals else "UNPROVEN"
        report["by_module_group"].append(entry)
    return report
