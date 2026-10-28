"""Definition versioning and non-loosening audits for the gatefix C criteria.

The source files are checked as data; no external face is processed.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import importlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest


ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / "tests" / "realface" / "pass_definitions"
NEW = ROOT / "tests" / "realface" / "pass_definitions_gatefixc"


def _read(folder: Path, name: str) -> dict[str, Any]:
    return dict(json.loads((folder / f"{name}.json").read_text(encoding="utf-8")))


def _rules(data: dict[str, Any]) -> set[tuple[str, str, str]]:
    return {
        (str(item["field"]), str(item["op"]), repr(item["value"]))
        for entries in data["rules"].values()
        for item in entries
    }


@pytest.mark.parametrize("name", ("regions", "iris"))
def test_supersedes_exact_committed_content_without_lowering_gates(name: str) -> None:
    original = OLD / f"{name}.json"
    next_file = NEW / f"{name}.json"
    before = _read(OLD, name)
    after = _read(NEW, name)
    supersedes = after["supersedes"]
    assert supersedes["path"] == f"tests/realface/pass_definitions/{name}.json"
    assert supersedes["sha256"] == hashlib.sha256(original.read_bytes()).hexdigest()
    assert after["version"] > before["version"]
    assert after["format"] == before["format"]
    assert after["threshold"] == before["threshold"]
    assert after["regression"] == before["regression"]
    assert after["face_set"] == before["face_set"]
    assert after["slices"] == before["slices"]
    assert after["minimum_slice_faces"] == before["minimum_slice_faces"]
    assert after["required_monk_tones"] == before["required_monk_tones"]
    assert after["expected_check_names"] == before["expected_check_names"]
    assert after["expected_checks"] == before["expected_checks"]
    assert _rules(before).issubset(_rules(after))
    assert next_file.is_file()


def test_all_other_definitions_are_byte_identical() -> None:
    original_names = {p.name for p in OLD.glob("*.json")}
    current_names = {p.name for p in NEW.glob("*.json")}
    assert current_names == original_names
    for name in original_names - {"regions.json", "iris.json"}:
        assert (NEW / name).read_bytes() == (OLD / name).read_bytes()


def test_iris_new_rules_require_one_real_edit_and_no_unexplained_missing() -> None:
    iris = _read(NEW, "iris")
    names = {(r["field"], r["op"], repr(r["value"])) for r in iris["rules"]["*"]}
    assert ("visible_irises", "ge", "1") in names
    assert ("undeclared_missing", "eq", "[]") in names
    assert iris["human_required"] is True


def test_region_eligibility_requires_independent_head_turn_evidence() -> None:
    region = _read(NEW, "regions")
    assert "width" in " ".join(region["notes"][-1:]).lower() or "depth" in (
        ROOT / "docs" / "reviews" / "gatefix-c-definition-changes.md"
    ).read_text(encoding="utf-8")
    assert region["threshold"]["overall"] == 0.95
    assert region["threshold"]["every_slice"] == 0.95
    assert ("invalid_geometry", "eq", "False") in _rules(region)


def test_runner_accepts_all_versioned_definition_files_without_faces() -> None:
    runner = ROOT / "tests" / "realface" / "run_realface.py"
    command = [
        sys.executable, str(runner), "--validate-definitions", "--definitions", str(NEW)
    ]
    proc = subprocess.run(command, check=False, capture_output=True, text=True, timeout=40)
    assert proc.returncode == 0, proc.stderr
    assert "regions: criteria loaded" in proc.stdout
    assert "iris: criteria loaded" in proc.stdout
    assert "No real-face quality result" in proc.stdout


def test_gatefix_does_not_write_into_the_old_definitions() -> None:
    original_regions = _read(OLD, "regions")
    original_iris = _read(OLD, "iris")
    assert "supersedes" not in original_regions
    assert "supersedes" not in original_iris
    assert original_regions["version"] == 2
    assert original_iris["version"] == 1


def test_versioned_iris_rules_accept_visible_eye_without_missing_claims() -> None:
    realface = ROOT / "tests" / "realface"
    if str(realface) not in sys.path:
        sys.path.insert(0, str(realface))
    definitions = importlib.import_module("definitions")
    written = definitions.load_definition("iris", NEW)
    row = {
        "check": "iris_hazel",
        "metric_pass": True,
        "definition_sha256": written.sha256,
        "outside_unchanged": True,
        "catchlight_unchanged": True,
        "shape_ok": True,
        "visible_irises": 1,
        "undeclared_missing": [],
    }
    assert written.row_problems(row) == []
    row["visible_irises"] = 0
    assert any("visible_irises" in item for item in written.row_problems(row))
    row["visible_irises"] = 1
    row["undeclared_missing"] = ["right:unobserved"]
    assert any("undeclared_missing" in item for item in written.row_problems(row))
