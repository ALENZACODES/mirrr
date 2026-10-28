"""R16A aggregate-only cross-commit comparison, with fail-closed provenance.

Count fixtures stand in for committed JSON evidence; no test photo is opened.
The independent Wilson difference interval is deliberately conservative.
Author: John Khan.
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

from plumb_api.quality import realface_regression as reg


def counts(passed: int, total: int) -> dict[str, int | float | None]:
    return {"passed": passed, "total": total, "rate": passed / total if total else None}


def report(passed: int = 98, total: int = 100) -> dict[str, object]:
    gate = {"id": "regions", "definition_sha256": "synthetic-definition-hash",
            "overall": counts(passed, total), "all_faces": counts(passed, total),
            "slices": [{"dimension": "source", "value": "drawn", **counts(passed, total)},
                       {"dimension": "gender", "value": "unknown", **counts(passed, total)}]}
    return {"format": reg.SOURCE_FORMAT, "run_id": "synthetic-run-0", "face_set_sha256": "synthetic-digest",
            "engine_sha256": "synthetic-code-0", "max_side": 640,
            "model_hashes": {"detector": "known-model-hash"}, "gates": [gate]}


def test_no_face_identifiers_are_needed_for_comparison():
    before, after = report(98), report(40)
    compared = reg.compare(before, after)
    assert compared["comparable"] is True
    assert compared["status"] == "FAIL"
    assert compared["significant_drops"] == 4
    assert compared["observed_drops"] == 4
    rendered = reg.markdown(compared)
    assert "regions/source=drawn" in rendered
    assert "frozen face regression" in rendered.lower()
    assert ".png" not in rendered
    assert "face_id" not in rendered


def test_large_loss_is_flagged_beyond_wilson_interval():
    compared = reg.compare(report(98), report(60))
    item = compared["gates"][0]["comparisons"][0]
    assert item["delta"] == pytest.approx(-.38)
    assert item["delta_ci95_conservative"][1] < 0
    assert item["status"] == "FAIL"
    assert item["reason"] == "drop_outside_95pct_uncertainty"


def test_small_observed_loss_stays_visible_but_is_not_a_definitive_failure():
    compared = reg.compare(report(98), report(97))
    row = compared["gates"][0]["comparisons"][0]
    assert compared["status"] == "UNPROVEN"
    assert row["status"] == "UNPROVEN"
    assert row["reason"] == "observed_drop_within_uncertainty"
    assert row["delta"] < 0
    assert row["delta_ci95_conservative"][1] > 0


def test_equal_counts_are_not_statistical_proof_of_no_regression():
    compared = reg.compare(report(98), report(98))
    assert compared["status"] == "UNPROVEN"
    assert all(item["reason"] == "change_not_statistically_resolved"
               for item in compared["gates"][0]["comparisons"])


def test_clear_improvement_does_not_hide_other_dimensions():
    compared = reg.compare(report(10), report(99))
    assert compared["status"] == "PASS"
    assert compared["significant_drops"] == 0
    assert all(item["status"] == "PASS" for item in compared["gates"][0]["comparisons"])


def test_reference_git_hash_is_not_used_to_claim_statistical_comparability():
    old = report(98)
    new = report(97)
    new["engine_sha256"] = "a-distinct-commit"
    assert reg.compare(old, new)["comparable"] is True


@pytest.mark.parametrize("key,value", [
    ("face_set_sha256", "a-different-set"),
    ("max_side", 400),
    ("model_hashes", {"detector": "unverified-new-version"}),
])
def test_changed_population_or_runtime_is_unproven_not_flagged_as_regression(key, value):
    after = report(90)
    after[key] = value
    compared = reg.compare(report(), after)
    assert not compared["comparable"]
    assert compared["status"] == "UNPROVEN"
    assert f"changed_{key}" in compared["reasons"]
    assert not compared["gates"]


def test_changed_definition_is_incompatible_even_with_same_counts():
    after = report(95)
    after["gates"][0]["definition_sha256"] = "new-regime"
    compared = reg.compare(report(), after)
    assert "changed_definition:regions" in compared["reasons"]


def test_missing_slice_cannot_disappear_from_comparison():
    after = report(95)
    after["gates"][0]["slices"].pop()
    compared = reg.compare(report(), after)
    assert compared["status"] == "UNPROVEN"
    assert "slice_membership_changed:regions" in compared["reasons"]


def test_missing_gate_does_not_make_other_gates_appear_complete():
    before, after = report(), report()
    second = copy.deepcopy(before["gates"][0])
    second["id"] = "warp_turn"
    before["gates"].append(second)
    assert "gate_membership_changed" in reg.compare(before, after)["reasons"]


def test_changed_count_denominator_is_not_a_compatible_improvement():
    old, new = report(98), report(101, 110)
    # The same declared set with different counts cannot claim an improvement.
    compared = reg.compare(old, new)
    assert compared["status"] == "UNPROVEN"
    assert any(item["reason"] == "different_denominator"
               for item in compared["gates"][0]["comparisons"])


def test_small_group_is_unproven_even_for_complete_loss():
    compared = reg.compare(report(3, 3), report(0, 3))
    assert compared["status"] == "UNPROVEN"
    assert compared["gates"][0]["comparisons"][0]["reason"] == "small_group"


def test_zero_denominator_does_not_invent_a_rate():
    compared = reg.compare(report(0, 0), report(0, 0))
    row = compared["gates"][0]["comparisons"][0]
    assert row["delta"] is None
    assert row["delta_ci95_conservative"] is None
    assert row["status"] == "UNPROVEN"


@pytest.mark.parametrize("mutation", [
    lambda obj: obj.update(format="unknown-format"),
    lambda obj: obj.update(run_id=""),
    lambda obj: obj.update(model_hashes=None),
    lambda obj: obj.update(gates=[]),
    lambda obj: obj["gates"].append(copy.deepcopy(obj["gates"][0])),
    lambda obj: obj["gates"][0].update(definition_sha256=""),
    lambda obj: obj["gates"][0].update(overall=counts(101, 100)),
    lambda obj: obj["gates"][0]["slices"].clear(),
    lambda obj: obj["gates"][0]["slices"][0].update(rate=.2),
    lambda obj: obj["gates"][0]["slices"][0].update(total=True),
    lambda obj: obj["gates"][0]["slices"][0].update(dimension=""),
    lambda obj: obj["gates"][0]["slices"].append(copy.deepcopy(obj["gates"][0]["slices"][0])),
])
def test_invalid_provenance_or_arithmetic_cannot_be_compared(mutation):
    old = report()
    mutation(old)
    with pytest.raises(ValueError):
        reg.validate(old)
    with pytest.raises(ValueError):
        reg.compare(old, report())


def test_no_filenames_or_image_buffers_are_accepted_as_report_evidence():
    old = report()
    old["photo"] = "/private/face.png"  # extraneous private field must never be echoed
    compared = reg.compare(old, report())
    assert "face.png" not in json.dumps(compared)
    assert "photo" not in json.dumps(compared)


def test_cli_offline_comparison_refuses_bad_json_without_echoing_private_text(tmp_path):
    before = tmp_path / "before.gates.json"
    after = tmp_path / "after.gates.json"
    before.write_text(json.dumps(report(99)))
    after.write_text("this is a private image filename /private/face.png")
    script = Path(__file__).resolve().parents[2] / "tests" / "realface" / "compare_commits.py"
    process = subprocess.run([sys.executable, str(script), str(before), str(after)],
                             capture_output=True, text=True, timeout=10)
    assert process.returncode == 3
    assert "private/face" not in process.stderr


def test_cli_offline_comparison_outputs_only_counts(tmp_path):
    before = tmp_path / "before.gates.json"
    after = tmp_path / "after.gates.json"
    output = tmp_path / "report.json"
    before.write_text(json.dumps(report(99)))
    after.write_text(json.dumps(report(50)))
    script = Path(__file__).resolve().parents[2] / "tests" / "realface" / "compare_commits.py"
    process = subprocess.run([sys.executable, str(script), str(before), str(after), "--json", str(output)],
                             capture_output=True, text=True, timeout=10)
    assert process.returncode == 2
    assert json.loads(output.read_text())["status"] == "FAIL"
    assert "Before" in process.stdout
    assert "face_id" not in process.stdout
    assert "face_id" not in output.read_text()


@pytest.mark.parametrize("unsafe", [
    "/home/employee/face.jpg", "C:/Users/person/portrait",
    "../parent/secret", "private\\face.png", "portrait.tiff",
    "<img src=x>", "unsafe\nfilename",
])
def test_regression_refuses_a_face_path_embedded_in_gate_or_slice(unsafe):
    for where in ("gate", "dimension", "value"):
        candidate = report()
        if where == "gate":
            candidate["gates"][0]["id"] = unsafe
        else:
            candidate["gates"][0]["slices"][0][where] = unsafe
        with pytest.raises(ValueError, match="invalid|paths|file names"):
            reg.validate(candidate)


def test_regression_verdict_is_order_independent_over_slice_rows():
    before, after = report(98), report(73)
    forward = reg.compare(before, after)
    before["gates"][0]["slices"].reverse()
    after["gates"][0]["slices"].reverse()
    backward = reg.compare(before, after)
    assert forward == backward


def test_regression_never_accepts_changed_label_as_an_unchanged_cohort():
    before, after = report(98), report(73)
    after["gates"][0]["slices"][1]["value"] = "silently-renamed"
    result = reg.compare(before, after)
    assert result["status"] == "UNPROVEN"
    assert result["comparable"] is False
    assert "slice_membership_changed:regions" in result["reasons"]
