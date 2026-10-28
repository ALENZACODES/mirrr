"""Missing or new frozen modules must be visible without hiding real regressions."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from plumb_api.quality import realface_regression as reg


def counts(passed: int, total: int = 100) -> dict[str, float | int]:
    return {"passed": passed, "total": total, "rate": passed / total}


def gate(name: str, passed: int) -> dict[str, object]:
    return {
        "id": name,
        "definition_sha256": "synthetic-definition-a",
        "overall": counts(passed),
        "all_faces": counts(passed),
        "slices": [
            {"dimension": "source", "value": "drawn", **counts(passed)},
            {"dimension": "race", "value": "Black", **counts(passed)},
        ],
    }


def report(*pairs: tuple[str, int]) -> dict[str, object]:
    return {
        "format": reg.SOURCE_FORMAT,
        "face_set_sha256": "fixed-synthetic-cohort",
        "engine_sha256": "original-code-revision",
        "run_id": "synthetic-exercise",
        "max_side": 640,
        "model_hashes": {"detector": "synthetic-model"},
        "gates": [gate(name, passed) for name, passed in pairs],
    }


def test_strict_compatibility_comparator_remains_fail_closed() -> None:
    before = report(("regions", 90), ("warp_turn", 90))
    after = report(("regions", 95), ("proportions_control", 95))
    comparison = reg.compare(before, after)
    assert comparison["status"] == "UNPROVEN"
    assert comparison["comparable"] is False
    assert "gate_membership_changed" in comparison["reasons"]


def test_shared_subset_exposes_new_and_removed_gates_without_a_false_pass() -> None:
    before = report(("regions", 20), ("warp_turn", 95))
    after = report(("regions", 98), ("proportions_control", 99))
    result = reg.compare_shared(before, after)
    assert result["partial"] is True
    assert result["comparable"] is True
    assert result["status"] == "UNPROVEN"
    assert result["missing_gates"] == ["warp_turn"]
    assert result["new_gates"] == ["proportions_control"]
    assert [row["id"] for row in result["gates"]] == ["regions"]
    assert "Partial module comparison only" in reg.markdown(result)
    assert "warp_turn" in reg.markdown(result)


def test_shared_significant_loss_is_still_a_failure() -> None:
    before = report(("regions", 100), ("warp_turn", 100))
    after = report(("regions", 10), ("proportions_control", 90))
    result = reg.compare_shared(before, after)
    assert result["status"] == "FAIL"
    assert result["significant_drops"] >= 1
    assert any(gate_row["status"] == "FAIL" for gate_row in result["gates"])


def test_no_overlap_has_no_comparisons_and_cannot_pass() -> None:
    before = report(("regions", 100))
    after = report(("proportions_control", 100))
    result = reg.compare_shared(before, after)
    assert result["status"] == "UNPROVEN"
    assert result["comparable"] is False
    assert result["gates"] == []
    assert result["missing_gates"] == ["regions"]


@pytest.mark.parametrize("key,changed", [
    ("face_set_sha256", "different-cohort"),
    ("max_side", 240),
    ("model_hashes", {"detector": "different-version"}),
])
def test_incompatible_provenance_still_unproven(key: str, changed: object) -> None:
    before, after = report(("regions", 100)), report(("regions", 0))
    after[key] = changed
    result = reg.compare_shared(before, after)
    assert result["status"] == "UNPROVEN"
    assert result["comparable"] is False
    assert f"changed_{key}" in result["reasons"]


def test_changed_definition_still_unproven() -> None:
    before, after = report(("regions", 100)), report(("regions", 0))
    after["gates"][0]["definition_sha256"] = "changed-definition"
    assert "changed_definition:regions" in reg.compare_shared(before, after)["reasons"]


def test_plain_comparison_retains_normal_semantics() -> None:
    result = reg.compare_shared(report(("regions", 100)), report(("regions", 0)))
    assert result["partial"] is False
    assert result["status"] == "FAIL"
    assert result["new_gates"] == []
    assert result["missing_gates"] == []


def test_private_text_from_reports_does_not_escape() -> None:
    before, after = report(("regions", 100)), report(("regions", 0), ("warp_turn", 0))
    before["secret"] = "/private/path/photo.png"
    result = reg.compare_shared(before, after)
    assert "private" not in json.dumps(result)
    assert "face_id" not in json.dumps(result)


def test_cli_shared_gate_mode_outputs_a_partial_count_only_report(tmp_path: Path) -> None:
    before, after = tmp_path / "old.gates.json", tmp_path / "new.gates.json"
    out = tmp_path / "comparison.json"
    before.write_text(json.dumps(report(("regions", 99), ("warp_turn", 99))))
    after.write_text(json.dumps(report(("regions", 40), ("proportions_control", 99))))
    script = Path(__file__).resolve().parents[2] / "tests" / "realface" / "compare_commits.py"
    command = [sys.executable, str(script), str(before), str(after), "--shared-gates", "--json", str(out)]
    execution = subprocess.run(command, capture_output=True, text=True, timeout=10)
    assert execution.returncode == 2
    result = json.loads(out.read_text())
    assert result["partial"] is True
    assert result["status"] == "FAIL"
    assert result["missing_gates"] == ["warp_turn"]
    assert "proportions_control" in execution.stdout


def test_cli_without_opt_in_does_not_launder_missing_gate(tmp_path: Path) -> None:
    before, after = tmp_path / "one.json", tmp_path / "two.json"
    before.write_text(json.dumps(report(("regions", 99), ("warp_turn", 99))))
    after.write_text(json.dumps(report(("regions", 99))))
    script = Path(__file__).resolve().parents[2] / "tests" / "realface" / "compare_commits.py"
    execution = subprocess.run([sys.executable, str(script), str(before), str(after)],
                               capture_output=True, text=True, timeout=10)
    assert execution.returncode == 3
    assert "gate_membership_changed" in execution.stdout
