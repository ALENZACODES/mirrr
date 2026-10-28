"""New R27A written acceptance: no historical redefinition and no invented pass."""
from __future__ import annotations

import json
import sys
from importlib import import_module
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests" / "realface"))
definitions = import_module("definitions")
load_definition = definitions.load_definition
validate = definitions.validate
run_realface = import_module("run_realface")

FOLDER = ROOT / "tests" / "realface" / "pass_definitions_r27a"


def definition():
    return load_definition("proportions_control", FOLDER)


def test_new_definition_has_exact_names_and_multi_face_slice() -> None:
    d = definition()
    assert d.id == "proportions_control"
    assert d.content["expected_check_names"] == ["level_3.0"]
    assert "multi_face" in d.content["slices"]
    assert d.content["threshold"]["overall"] == 0.95
    assert d.content["threshold"]["every_slice"] == 0.95


def test_still_requires_independent_identity_similarity() -> None:
    d = definition()
    row = {"check": "level_3.0", "definition_sha256": d.sha256,
           "metric_pass": True, "level": 3.0,
           "target_ratio_distance_reduction": .004, "fold_count": 0,
           "nan": False, "bystanders_unchanged": True}
    assert "missing measurement: identity_similarity" in d.row_problems(row)
    row["identity_similarity"] = .96
    assert any("identity_similarity" in error for error in d.row_problems(row))
    row["identity_similarity"] = .985
    assert d.row_problems(row) == []


def test_forged_plain_pass_cannot_satisfy_definition() -> None:
    d = definition()
    assert d.row_problems({"check": "level_3.0", "pass": True})
    assert d.row_problems({"check": "refused", "metric_pass": True})
    assert d.row_problems({"check": "dependency_missing", "metric_pass": True})


def test_incorrect_or_relaxed_definition_is_rejected() -> None:
    raw = json.loads((FOLDER / "proportions_control.json").read_text())
    raw["threshold"]["every_slice"] = float("nan")
    with pytest.raises(ValueError):
        validate(raw, "proportions_control")
    raw["threshold"]["every_slice"] = .95
    raw["regression"]["max_drop"] = .01
    with pytest.raises(ValueError):
        validate(raw, "proportions_control")


def test_original_ratios_and_turn_definitions_stay_separate() -> None:
    d = definition()
    for name in ("proportions", "warp_turn"):
        old = load_definition(name)
        assert old.id != d.id
        assert "multi_face" not in old.content["slices"]


def test_validation_cli_lists_new_definition(capsys) -> None:
    code = run_realface.main(["--validate-definitions"])
    assert code == 0
    printed = capsys.readouterr().out
    assert "proportions_control: criteria loaded" in printed
    assert "not committed in HEAD" in printed or "committed" in printed
    assert "No real-face quality result has been measured" in printed
