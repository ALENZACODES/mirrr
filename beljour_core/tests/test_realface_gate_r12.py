"""Synthetic adversarial tests for preregistered real-face reporting, R12.

Pass definition: no result may PASS without matching committed criteria, a compatible
baseline, complete check transactions and declared slice metadata. Counts include
missing observations; a falling slice rejects an improving overall rate. Fixture set:
two to four labelled records plus tiny arbitrary byte files; zero real faces/models.
Author: John Khan.
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace

import pytest

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import definitions  # noqa: E402
import gates  # noqa: E402
import run_state  # noqa: E402


def criteria(name="regions", count=2, *, committed=True):
    data = json.loads((REALFACE / "pass_definitions" / f"{name}.json").read_text())
    data["face_set"] = {"id": "synthetic-r12", "number_of_faces": count}
    data["required_monk_tones"] = ["1", "10"]
    data["required_matrix"] = {"gender": ["female"], "age": ["30-39"]}
    if name == "landmarks":
        data["minimum_frontal_faces"] = 1
    return definitions.Definition(name, run_state.digest(data), data, committed)


def planned(definition):
    faces = []
    for index in range(definition.expected_faces):
        tone = "1" if index == 0 else "10"
        faces.append({"face_id": f"synthetic-{index}", "labels": {
            "source": "drawn", "race": "not-inferred", "gender": "female", "age": "30-39",
            "monk": tone, "monk_gender_age": f"{tone}/female/30-39", "slice": "drawn",
            "size": "large", "yaw": "frontal", "occlusion": "none",
        }})
    return {"run_id": "synthetic-run", "faces": faces, "number_of_faces": len(faces),
            "face_set_sha256": run_state.digest(faces), "engine_sha256": "engine-one", "max_side": 640,
            "include": ["synthetic-r12"], "model_hashes": {"fixture-only": "no-weight-file"},
            "definitions": {definition.id: definition.sha256}, "definition_committed": True}


def mask_rows(definition, plan):
    return [{"module": "regions", "check": "masks", "face_id": face["face_id"], "run_id": plan["run_id"],
             "pass": True, "metric_pass": True, "definition_sha256": definition.sha256,
             "empty": "", "skin_share": 0.75, "eyes_inside": 0.99, "invalid_geometry": False}
            for face in plan["faces"]]


def observed(definition, plan, rows):
    initial = gates.evaluate(rows, {definition.id: definition}, plan)
    return gates.evaluate(rows, {definition.id: definition}, plan, baseline=initial)


def stream_rows(plan, identity="synthetic-0"):
    return [{"record_type": "observation", "face_id": identity, "run_id": plan["run_id"],
             "module": "regions", "check": "masks", "metric_pass": True}]


def test_no_definition_can_produce_no_quality_pass(tmp_path):
    with pytest.raises(definitions.DefinitionError, match="missing"):
        definitions.load_definition("regions", tmp_path)
    d = criteria()
    plan = planned(d)
    output = gates.evaluate(mask_rows(d, plan), {}, plan)
    assert output["gates"] == [] and output["p0_status"] == "UNPROVEN"


def test_existing_uncommitted_definition_cannot_pass():
    d = criteria(committed=False)
    plan = planned(d)
    output = observed(d, plan, mask_rows(d, plan))
    assert output["gates"][0]["status"] == "UNPROVEN"
    assert any("committed" in note for note in output["gates"][0]["missing_evidence"])


def test_definition_must_match_git_head_bytes(tmp_path):
    path = tmp_path / "regions.json"
    content = (REALFACE / "pass_definitions" / "regions.json").read_text()
    path.write_text(content)
    def git(*args):
        return subprocess.run(["git", "-C", str(tmp_path), *args], check=True, capture_output=True)
    git("init", "--quiet")
    assert not definitions.load_definition("regions", tmp_path).committed
    git("add", "regions.json")
    git("-c", "user.name=John Khan", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Synthetic criteria")
    assert definitions.load_definition("regions", tmp_path).committed
    path.write_text(content + "\n")
    assert not definitions.load_definition("regions", tmp_path).committed


def test_no_baseline_cannot_report_pass_even_when_every_numeric_measure_passes():
    d = criteria()
    plan = planned(d)
    output = gates.evaluate(mask_rows(d, plan), {d.id: d}, plan)
    assert output["gates"][0]["metric_status"] == "PASS"
    assert output["gates"][0]["status"] == "UNPROVEN"
    assert output["regression"]["status"] == "UNPROVEN"


def test_changed_preregistered_definition_hash_cannot_support_pass():
    d = criteria()
    plan = planned(d)
    plan["definitions"][d.id] = "different-criteria-before-run"
    output = observed(d, plan, mask_rows(d, plan))
    assert output["gates"][0]["status"] != "PASS"


@pytest.mark.parametrize("measurement", (0.2, float("nan"), float("inf"), True, "0.75", None))
def test_numeric_threshold_is_independent_of_the_engine_pass_flag(measurement):
    d = criteria()
    row = mask_rows(d, planned(d))[0]
    row["skin_share"] = measurement
    assert d.row_problems(row), "a PASS flag cannot replace a finite measured threshold"


def test_missing_measurement_wrong_definition_and_unwritten_check_are_rejected():
    d = criteria()
    good = mask_rows(d, planned(d))[0]
    assert not d.row_problems(good)
    missing = {key: value for key, value in good.items() if key != "eyes_inside"}
    assert any("missing measurement" in problem for problem in d.row_problems(missing))
    assert d.row_problems({**good, "definition_sha256": "old"})
    assert d.row_problems({**good, "check": "unwritten"})
    assert d.row_problems({**good, "metric_pass": False})


def test_missing_detection_is_kept_in_frozen_denominator():
    d = criteria("landmarks")
    plan = planned(d)
    base = {"module": "landmarks", "face_id": "synthetic-0", "run_id": plan["run_id"],
            "definition_sha256": d.sha256, "metric_pass": True}
    rows = [{**base, "check": "detect", "detected": True},
            {**base, "check": "mesh_valid", "in_frame_share": 1.0, "finite": True}]
    gate = observed(d, plan, rows)["gates"][0]
    assert gate["overall"] == {"passed": 1, "total": 2, "rate": 0.5}
    assert gate["all_faces"]["total"] == 2
    assert gate["status"] == "FAIL"


def test_direction_failure_parity_handles_both_zero_one_zero_and_boundary():
    assert gates.failure_parity(0, 0, 1.2)["passed"]
    for first, second in ((0, 1), (1, 0), (5, 7), (112, 11)):
        assert not gates.failure_parity(first, second, 1.2)["passed"]
    assert gates.failure_parity(5, 6, 1.2)["passed"]
    assert gates.failure_parity(6, 5, 1.2)["passed"]
    with pytest.raises(ValueError):
        gates.failure_parity(-1, 1, 1.2)


def test_slice_regression_rejects_an_improving_overall_rate():
    d = criteria(count=4)
    plan = planned(d)
    rows = mask_rows(d, plan)
    old_rows = copy.deepcopy(rows)
    old_rows[2]["skin_share"] = old_rows[3]["skin_share"] = 0.2
    baseline = gates.evaluate(old_rows, {d.id: d}, plan)
    rows[0]["skin_share"] = 0.2
    current = gates.evaluate(rows, {d.id: d}, plan, baseline=baseline)
    assert current["gates"][0]["overall"]["rate"] > baseline["gates"][0]["overall"]["rate"]
    assert current["regression"]["status"] == "FAIL"
    assert any("monk=1 dropped" in reason for reason in current["regression"]["reasons"])
    assert current["gates"][0]["status"] == "FAIL"


@pytest.mark.parametrize("key,replacement", (("face_set_sha256", "other-set"), ("max_side", 1024), ("model_hashes", {})))
def test_incompatible_measurement_conditions_cannot_supply_a_baseline(key, replacement):
    d = criteria()
    plan = planned(d)
    current = gates.evaluate(mask_rows(d, plan), {d.id: d}, plan)
    baseline = copy.deepcopy(current)
    baseline[key] = replacement
    status, reasons = gates.compare_baseline(current, baseline)
    assert status == "UNPROVEN" and reasons


def test_unknown_required_slice_metadata_prevents_pass():
    d = criteria("landmarks")
    plan = planned(d)
    for face in plan["faces"]:
        face["labels"]["occlusion"] = "unknown"
    rows = []
    for face in plan["faces"]:
        base = {"module": "landmarks", "face_id": face["face_id"], "run_id": plan["run_id"],
                "definition_sha256": d.sha256, "metric_pass": True}
        rows.extend([{**base, "check": "detect", "detected": True},
                     {**base, "check": "mesh_valid", "in_frame_share": 1.0, "finite": True}])
    gate = observed(d, plan, rows)["gates"][0]
    assert gate["status"] != "PASS"
    assert any("occlusion" in reason for reason in gate["missing_evidence"])


def test_absent_monk_gender_age_cell_is_unproven_not_an_inferred_demographic():
    d = criteria()
    plan = planned(d)
    plan["faces"][1]["labels"]["monk_gender_age"] = "unknown/female/30-39"
    gate = observed(d, plan, mask_rows(d, plan))["gates"][0]
    assert gate["status"] == "UNPROVEN"
    assert "10/female/30-39" in gate["missing_cells"]


@pytest.mark.parametrize("field", ("required_monk_tones", "required_matrix"))
def test_deleting_required_slice_matrix_cannot_disable_it(field):
    data = copy.deepcopy(criteria().content)
    del data[field]
    with pytest.raises(definitions.DefinitionError):
        definitions.validate(data, "regions")


def test_wrong_face_count_and_partial_face_set_are_unproven():
    d = criteria()
    plan = planned(d)
    plan["faces"].pop()
    plan["include"] = ["another-subset"]
    gate = observed(d, plan, mask_rows(d, plan))["gates"][0]
    assert gate["status"] == "UNPROVEN"
    assert any("Expected 2 faces" in problem for problem in gate["missing_evidence"])


def test_duplicate_check_cannot_replace_a_missing_check():
    d = criteria()
    plan = planned(d)
    rows = mask_rows(d, plan)
    rows.append(copy.deepcopy(rows[0]))
    gate = observed(d, plan, rows)["gates"][0]
    assert gate["overall"]["passed"] == 1
    assert any(item["reason"] == "duplicate check name" for item in gate["kill_list"])


def test_worst_slice_sorting_and_markdown_expose_small_failures():
    d = criteria(count=4)
    plan = planned(d)
    rows = mask_rows(d, plan)
    rows[0]["eyes_inside"] = 0.5
    output = observed(d, plan, rows)
    slices = output["gates"][0]["slices"]
    assert slices[0]["passed"] == 0 and slices[0]["total"] == 1
    text = gates.markdown(output)
    assert "worst first" in text and "0/1" in text and "eyes_inside" in text


def test_face_metadata_does_not_infer_monk_from_race():
    face = SimpleNamespace(row={}, gender="Female", age="30-39", source="drawn", race="Black", slice="test")
    labels = run_state.face_labels(face)
    assert labels["monk"] == "unknown" and labels["race"] == "Black"
    assert labels["monk_gender_age"] == "unknown/female/30-39"


def test_plan_file_is_immutable_across_engine_changes(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "run.json"
    run_state.save_plan(path, plan)
    before = path.read_bytes()
    run_state.save_plan(path, plan)
    assert path.read_bytes() == before
    with pytest.raises(ValueError, match="differs"):
        run_state.save_plan(path, {**plan, "run_id": "new-engine-run"})
    assert path.read_bytes() == before


def test_unversioned_and_wrong_engine_streams_are_rejected(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "rows.jsonl"
    path.write_text(json.dumps({"module": "regions", "pass": True}) + "\n")
    with pytest.raises(ValueError, match="unversioned|incompatible"):
        run_state.read_stream(path, plan)
    path.unlink()
    with run_state.open_stream(path, plan) as sink:
        run_state.write_face(sink, stream_rows(plan), plan)
    with pytest.raises(ValueError, match="incompatible"):
        run_state.read_stream(path, {**plan, "run_id": "different-engine-run"})


def test_torn_face_transaction_is_discarded_and_cannot_resume_as_complete(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "rows.jsonl"
    with run_state.open_stream(path, plan) as sink:
        run_state.write_face(sink, stream_rows(plan), plan)
        sink.write(json.dumps(stream_rows(plan, "synthetic-1")[0]) + "\n")
        sink.write('{"incomplete":')
    rows, done = run_state.read_stream(path, plan)
    assert done == {"synthetic-0"} and len(rows) == 1
    assert "incomplete" not in path.read_text() and "synthetic-1" not in path.read_text()


def test_resume_checksum_and_internal_corruption_are_rejected(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "rows.jsonl"
    with run_state.open_stream(path, plan) as sink:
        run_state.write_face(sink, stream_rows(plan), plan)
    records = path.read_text().splitlines()
    changed = json.loads(records[1])
    changed["metric_pass"] = False
    path.write_text("\n".join([records[0], json.dumps(changed), *records[2:]]) + "\n")
    with pytest.raises(ValueError, match="checksum"):
        run_state.read_stream(path, plan)
    path.write_text("\n".join([records[0], "not json", *records[1:]]) + "\n")
    with pytest.raises(ValueError, match="corrupt"):
        run_state.read_stream(path, plan)


def test_unknown_or_duplicate_face_transaction_cannot_expand_frozen_set(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "rows.jsonl"
    with run_state.open_stream(path, plan) as sink:
        run_state.write_face(sink, stream_rows(plan), plan)
        run_state.write_face(sink, stream_rows(plan), plan)
    with pytest.raises(ValueError, match="repeated"):
        run_state.read_stream(path, plan)


def test_all_committed_definition_documents_have_required_fields():
    files = sorted((REALFACE / "pass_definitions").glob("*.json"))
    assert {f.stem for f in files} >= set(gates.P0)
    for path in files:
        data = definitions.validate(json.loads(path.read_text()), path.stem)
        assert data["metric"] and data["expected_checks"] >= 1
        structural = data.get("test_kind") == "structural"
        assert data["face_set"]["number_of_faces"] == (0 if structural else 983)
        assert data["regression"]["max_drop"] == 0
        if data.get("test_kind", "quality") == "quality":
            assert "monk_gender_age" in data["slices"]


def test_engine_fingerprint_changes_with_production_code_but_not_bytecode(tmp_path):
    folder = tmp_path / "api" / "plumb_api"
    folder.mkdir(parents=True)
    source = folder / "engine.py"
    source.write_text("LIMIT = 1\n")
    initial = run_state.code_hash(tmp_path)
    cache = folder / "__pycache__"
    cache.mkdir()
    (cache / "ignored.py").write_text("unrelated = True\n")
    assert run_state.code_hash(tmp_path) == initial
    source.write_text("LIMIT = 2\n")
    assert run_state.code_hash(tmp_path) != initial


def test_human_review_cannot_be_substituted_by_engine_passes():
    d = criteria()
    data = {**d.content, "human_required": True}
    d = replace(d, content=data)
    plan = planned(d)
    gate = observed(d, plan, mask_rows(d, plan))["gates"][0]
    assert gate["status"] == "UNPROVEN"
    assert "Independent identity" in gate["missing_evidence"][-1]
