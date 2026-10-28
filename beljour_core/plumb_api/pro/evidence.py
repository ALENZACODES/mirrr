"""Lane E's preregistered real-face contract checks; no face access.

Only criteria and privacy-safe group accounting live here. This does not
modify or substitute for Lane A's release runner, definition registry or
frozen 100,000-case quality gate. A synthetic result can NEVER be a pass.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

IDS = ("pro_masks", "pro_identity", "upscale_detail")
SLICES = ("source", "race", "gender", "age", "monk", "size", "yaw", "occlusion")
FORMAT = "beljour-realface-pass/1"
FACE_SET = "frozen-100000"
EXPECTED_FACES = 100_000


@dataclass(frozen=True)
class WrittenDefinition:
    name: str
    sha256: str
    metric: str
    threshold_overall: float
    threshold_slice: float
    slices: tuple[str, ...]
    number_of_faces: int


def default_directory() -> Path:
    return Path(__file__).resolve().parents[3] / "tests" / "realface" / "pass_definitions_r24e"


def _rate(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not 0 <= value <= 1:
        raise ValueError("invalid real-face threshold")
    return float(value)


def read_definition(directory: Path, name: str) -> WrittenDefinition:
    if name not in IDS:
        raise ValueError("unknown Lane E quality module")
    path = directory / (name + ".json")
    payload = path.read_bytes()
    data: object = json.loads(payload)
    if not isinstance(data, dict):
        raise ValueError("quality definition must be an object")
    contents = data
    scope = contents.get("face_set")
    rules = contents.get("rules")
    limits = contents.get("threshold")
    if contents.get("format") != FORMAT or contents.get("id") != name or contents.get("version") != 1:
        raise ValueError("invalid definition identity")
    if contents.get("author") != "John Khan" or not isinstance(contents.get("metric"), str):
        raise ValueError("missing definition author or metric")
    if not isinstance(scope, dict) or scope.get("id") != FACE_SET:
        raise ValueError("unexpected frozen face set")
    if type(scope.get("number_of_faces")) is not int or scope["number_of_faces"] != EXPECTED_FACES:
        raise ValueError("definition must name exact frozen set size")
    if contents.get("slices") != list(SLICES) or contents.get("expected_checks") != 1:
        raise ValueError("missing preregistered demographic or geometric slices")
    if contents.get("expected_check_names") != [name] or not isinstance(rules, dict) or name not in rules:
        raise ValueError("missing exact quality check rule")
    if not isinstance(limits, dict):
        raise ValueError("missing thresholds")
    if not isinstance(rules[name], list) or not rules[name]:
        raise ValueError("definition needs measurable criteria")
    for rule in rules[name]:
        if not isinstance(rule, dict) or set(rule) != {"field", "op", "value"}:
            raise ValueError("invalid metric rule")
        if rule["op"] not in ("eq", "ge", "le"):
            raise ValueError("unsupported real-face comparison")
        if not isinstance(rule["field"], str) or not rule["field"]:
            raise ValueError("missing metric name")
    return WrittenDefinition(
        name=name,
        sha256=hashlib.sha256(payload).hexdigest(),
        metric=str(contents["metric"]),
        threshold_overall=_rate(limits.get("overall")),
        threshold_slice=_rate(limits.get("every_slice")),
        slices=SLICES,
        number_of_faces=EXPECTED_FACES,
    )


def read_all(directory: Path | None = None) -> tuple[WrittenDefinition, ...]:
    root = directory if directory is not None else default_directory()
    return tuple(read_definition(root, name) for name in IDS)


@dataclass(frozen=True)
class GroupCount:
    module: str
    group: str
    count: int
    passing: int
    source: str


def summary_rows(definitions: Sequence[WrittenDefinition], observations: Sequence[GroupCount]) -> list[dict[str, Any]]:
    """Count-only records; synthetic rows are never an accepted quality gate.

    This is a diagnostic summary, not a replacement for paired baseline checks,
    preregistered small-slice rules or Lane A's release machinery.
    """
    known = {definition.name: definition for definition in definitions}
    seen: set[tuple[str, str]] = set()
    output: list[dict[str, Any]] = []
    for row in observations:
        if row.module not in known or not row.group or (row.module, row.group) in seen:
            raise ValueError("invalid or duplicate quality group")
        if type(row.count) is not int or type(row.passing) is not int:
            raise ValueError("group counts must be integers")
        if row.count < 0 or not 0 <= row.passing <= row.count:
            raise ValueError("group count is inconsistent")
        if row.source not in ("synthetic", "external"):
            raise ValueError("unknown evidence origin")
        seen.add((row.module, row.group))
        output.append({
            "module": row.module,
            "group": row.group,
            "count": row.count,
            "passing": row.passing,
            "status": "NOT_TESTED" if row.source == "synthetic" else "UNPROVEN",
            "definition_sha256": known[row.module].sha256,
        })
    return output


def synthetic_rows(definitions: Sequence[WrittenDefinition]) -> list[dict[str, Any]]:
    """Exercise every requested slice label without touching or creating faces."""
    groups = ["source:synthetic", "race:unknown", "gender:unknown", "age:unknown", "monk:unknown",
              "size:unknown", "yaw:unknown", "occlusion:unknown"]
    observations = [GroupCount(item.name, group, 1, 1, "synthetic")
                    for item in definitions for group in groups]
    return summary_rows(definitions, observations)


def validate_report(report: Mapping[str, Any], definitions: Sequence[WrittenDefinition]) -> None:
    if report.get("source") != "synthetic" or report.get("status") != "NOT_TESTED":
        raise ValueError("only synthetic not-tested demonstration reports are supported")
    expected = {(item.name, group) for item in definitions for group in SLICES}
    rows = report.get("rows")
    if not isinstance(rows, list):
        raise ValueError("report requires group records")
    actual = {(r["module"], r["group"].split(":", 1)[0]) for r in rows if isinstance(r, dict)}
    if actual != expected or len(rows) != len(expected):
        raise ValueError("missing or duplicate slice group")


def main() -> int:
    parser = argparse.ArgumentParser(description="Lane E quality-definition validation (no inference)")
    parser.add_argument("--definitions", type=Path, default=default_directory())
    parser.add_argument("--validate-definitions", action="store_true")
    parser.add_argument("--synthetic-demo", action="store_true")
    args = parser.parse_args()
    definitions = read_all(args.definitions)
    if args.validate_definitions:
        for item in definitions:
            print(f"{item.name}: written, {item.number_of_faces} faces, {len(item.slices)} slice axes")
    if args.synthetic_demo:
        rows = synthetic_rows(definitions)
        print(json.dumps({"source": "synthetic", "status": "NOT_TESTED", "rows": rows}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
