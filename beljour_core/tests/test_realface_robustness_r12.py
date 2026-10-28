"""R12 reporting failures that could hide regressions or inflate acceptance.

Written test contract: cross-run rows, malformed nested baselines and changing
denominators cannot support PASS; each filter keeps every frozen face and slice.
Fixtures contain two labelled scalar observations or generated pixels only.
No real face, model, network or private path is used. Author: John Khan.
"""
from __future__ import annotations

import copy
import json
import sys
from dataclasses import replace
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from plumb_api.filters.qa import still_her as SH
from plumb_api.filters.recipe import registry

from .test_realface_gate_r12 import criteria, mask_rows, observed, planned, stream_rows

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests/realface"))
import filters_bench as filters  # noqa: E402
import gates  # noqa: E402
import realface_lib as lib  # noqa: E402
import report  # noqa: E402
import run_state  # noqa: E402


@pytest.mark.parametrize("run_id", (None, "a-different-engine-run"))
def test_rows_cannot_be_relabelled_by_evaluating_them_under_another_plan(run_id):
    definition = criteria()
    plan = planned(definition)
    rows = mask_rows(definition, plan)
    rows[0]["run_id"] = run_id
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["overall"]["passed"] == 1 and gate["status"] == "FAIL"
    assert any("frozen run" in reason["reason"] for reason in gate["kill_list"])


def test_wildcard_rule_cannot_admit_an_invented_check_name():
    original = criteria()
    data = {**original.content, "rules": {"*": original.content["rules"]["masks"]}}
    definition = replace(original, content=data)
    plan = planned(definition)
    rows = mask_rows(definition, plan)
    rows[0]["check"] = "invented-success"
    assert definition.row_problems(rows[0]) == [], "a wildcard numeric rule alone is insufficient"
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["overall"]["passed"] == 1
    assert any("preregistered set" in reason["reason"] for reason in gate["kill_list"])


def test_sampled_checks_must_still_come_from_the_declared_allowed_set():
    original = criteria()
    data = {**original.content, "rules": {"*": original.content["rules"]["masks"]},
            "allowed_check_names": ["masks", "other-sampled-check"]}
    data.pop("expected_check_names")
    definition = replace(original, content=data)
    plan = planned(definition)
    rows = mask_rows(definition, plan)
    rows[0]["check"] = "other-sampled-check"
    assert observed(definition, plan, rows)["gates"][0]["status"] == "PASS"
    rows[0]["check"] = "unregistered-sample"
    assert observed(definition, plan, rows)["gates"][0]["status"] == "FAIL"


@pytest.mark.parametrize("mutation", (
    lambda value: value.update(gates=None),
    lambda value: value.update(gates=[None]),
    lambda value: value["gates"].append(copy.deepcopy(value["gates"][0])),
    lambda value: value["gates"][0].update(overall=[]),
    lambda value: value["gates"][0]["overall"].update(total=True),
    lambda value: value["gates"][0]["overall"].update(rate="1.0"),
    lambda value: value["gates"][0]["overall"].update(rate=float("nan")),
    lambda value: value["gates"][0]["overall"].update(rate=0.0),
    lambda value: value["gates"][0].update(slices=[None]),
    lambda value: value["gates"][0]["slices"].append(copy.deepcopy(value["gates"][0]["slices"][0])),
    lambda value: value["gates"][0]["slices"][0].update(directions=[]),
    lambda value: value.update(elo="unmeasured"),
))
def test_malformed_nested_baseline_is_controlled_unproven_not_a_crash_or_pass(mutation):
    definition = criteria()
    plan = planned(definition)
    current = gates.evaluate(mask_rows(definition, plan), {definition.id: definition}, plan)
    malformed = copy.deepcopy(current)
    mutation(malformed)
    with pytest.raises(ValueError):
        gates.validate_baseline(malformed)
    status, reasons = gates.compare_baseline(current, malformed)
    assert status == "UNPROVEN" and "invalid" in reasons[0]


def filter_fixture():
    original = criteria("filters")
    data = {**original.content, "expected_checks": 3, "expected_check_names": ["detect", "C01", "C08"]}
    definition = replace(original, content=data)
    plan = planned(definition)
    rows = []
    for face in plan["faces"]:
        base = {"module": "filters", "face_id": face["face_id"], "run_id": plan["run_id"],
                "pass": True, "metric_pass": True, "definition_sha256": definition.sha256}
        rows.append({**base, "check": "detect", "detected": True})
        for check in ("C01", "C08"):
            rows.append({**base, "check": check, "lift": 0.2, "grey_lift": 0.0,
                         "lift_over_grey": 0.2, "chroma_ratio": 1.0, "hue_turn": 0.5,
                         "checked_spread": 1.0, "checked_marks_kept": 1.0, "flags_count": 0,
                         "geometry_ops": 0, "neutral_ab": 0.0})
    return definition, plan, rows


def test_individual_filter_regression_is_rejected_when_the_all_filter_rate_stays_flat():
    definition, plan, old_rows = filter_fixture()
    old_rows[1]["chroma_ratio"] = 0.7  # The first face already fails C01.
    baseline = gates.evaluate(old_rows, {definition.id: definition}, plan)
    new_rows = copy.deepcopy(old_rows)
    new_rows[2]["hue_turn"] = 8.0  # C08 now also fails on that same face.
    current = gates.evaluate(new_rows, {definition.id: definition}, plan, baseline=baseline)
    assert current["gates"][0]["overall"] == baseline["gates"][0]["overall"]
    assert current["regression"]["status"] == "FAIL"
    assert any("filters/C08" in reason for reason in current["regression"]["reasons"])
    assert "Per-check comparisons" in gates.markdown(current)


def test_missing_per_filter_baseline_cannot_prove_no_regression():
    definition, plan, rows = filter_fixture()
    current = gates.evaluate(rows, {definition.id: definition}, plan)
    baseline = copy.deepcopy(current)
    del baseline["gates"][0]["per_check"]
    status, reasons = gates.compare_baseline(current, baseline)
    assert status == "UNPROVEN" and "per-check baseline" in reasons[0]


def test_partial_filter_selection_is_diagnostic_even_when_each_selected_metric_passes():
    definition, plan, rows = filter_fixture()
    plan["requested_checks"] = {"filters": ["detect", "C08"]}
    rows = [row for row in rows if row["check"] != "C01"]
    gate = observed(definition, plan, rows)["gates"][0]
    assert gate["overall"] == {"passed": 2, "total": 2, "rate": 1.0}
    assert gate["metric_status"] == "UNPROVEN" and gate["status"] == "UNPROVEN"
    assert any("subset" in reason for reason in gate["missing_evidence"])
    assert {check["id"] for check in gate["per_check"]} == {"detect", "C08"}


@pytest.mark.parametrize("field,value", (
    ("lift", 3.01), ("lift_over_grey", 1.01), ("chroma_ratio", 0.84), ("hue_turn", 6.01),
    ("checked_spread", 0.69), ("checked_spread", 1.31), ("checked_marks_kept", 0.89),
    ("flags_count", 1), ("geometry_ops", 1),
))
def test_filter_numeric_criteria_reject_a_true_engine_flag(field, value):
    definition, _, rows = filter_fixture()
    row = {**rows[1], field: value}
    assert row["metric_pass"] is True
    assert any(field in problem for problem in definition.row_problems(row))


def test_filter_numeric_criteria_keep_existing_conditional_exemptions_exact():
    definition, _, rows = filter_fixture()
    mono = registry.default().get("M04")
    measured = SH.ToneReport("drawn", -2.0, -5.0, 0.1, 50.0, 0.1, None, 0.4, skin_l=60.0)
    row = {**rows[1], "check": "M04", **filters.measurements(measured, mono)}
    assert not definition.row_problems(row), "mono chroma/hue and non-dark spread were already exempt"
    assert row["marks_detected"] is False and row["checked_marks_kept"] == 1.0
    assert row["lift_over_grey"] == 0, "darkening must not be relabelled lightening"
    assert definition.row_problems({**row, "neutral_ab": 0.51}), "neutral mono still has its numeric rule"


def test_filter_failed_dependencies_emit_rows_labels_and_progress_for_every_face(monkeypatch, tmp_path):
    recipes = [registry.default().get(name) for name in ("C01", "C08")]
    faces = [lib.Face(tmp_path / f"{index}.png", "synthetic", "own work", "drawn",
                      gender="female", age="30-39", row={"face_id": str(index), "monk": "10"})
             for index in range(3)]
    def load(path):
        if path.name == "0.png":
            raise OSError("synthetic unreadable image")
        return np.full((12, 12, 3), int(path.stem), dtype=np.uint8)
    def detect(image):
        if image[0, 0, 0] == 2:
            raise ValueError("synthetic detector error")
        return []
    monkeypatch.setattr(lib, "load_rgb", load)
    progress = []
    rows = filters.run(faces, detect, recipes, progress.append)
    assert progress == [1, 2, 3]
    for identity in ("0", "1", "2"):
        selected = [row for row in rows if row["face_id"] == identity]
        assert len(selected) == 3 and all(row["pass"] is False for row in selected)
        assert {row["check"] for row in selected} >= {"C01", "C08"}
        assert all(row["monk"] == "10" and row["gender"] == "female" for row in selected)
    text = filters.markdown(rows, recipes)
    assert "| C08 | Èze | 3 | 0.0% |" in text and "UNPROVEN" in text


def test_filter_report_counts_missing_rows_and_displays_small_slice_denominators():
    recipe = registry.default().get("C08")
    rows = []
    for identity in range(3):
        base = {"face_id": str(identity), "source": "synthetic", "file": "never-shown.png",
                "group": "minority" if identity == 2 else "majority", "pass": True}
        rows.append({**base, "check": "detect"})
        if identity < 2:
            rows.append({**base, "check": "C08"})
    text = filters.markdown(rows, [recipe])
    assert "| C08 | Èze | 3 | 66.7% | minority (0%; 0/1)" in text
    assert "never-shown" not in text and "population estimates" in text


def test_resume_non_object_record_and_reused_plan_id_fail_closed(tmp_path):
    plan = planned(criteria())
    path = tmp_path / "rows.jsonl"
    with run_state.open_stream(path, plan) as sink:
        run_state.write_face(sink, stream_rows(plan), plan)
        sink.write("[]\n")
    with pytest.raises(ValueError, match="JSON objects"):
        run_state.read_stream(path, plan)
    saved = tmp_path / "plan.json"
    run_state.save_plan(saved, plan)
    changed = copy.deepcopy(plan)
    changed["faces"][0]["labels"]["monk"] = "10"
    with pytest.raises(ValueError, match="differs"):
        run_state.save_plan(saved, changed)


def test_filter_selection_is_part_of_frozen_run_identity(tmp_path):
    path = tmp_path / "synthetic.bin"
    path.write_bytes(b"arbitrary synthetic bytes, not a face")
    face = SimpleNamespace(path=path, row={"monk": "1"}, source="drawn", race="", gender="female",
                           age="30-39", slice="synthetic")
    definition = criteria("filters", count=1)
    options = {"max_side": 640, "include": ("synthetic-r12",)}
    first = run_state.freeze([face], {"filters": definition}, tmp_path, checks={"filters": ["detect", "C01"]}, **options)
    second = run_state.freeze([face], {"filters": definition}, tmp_path, checks={"filters": ["detect", "C08"]}, **options)
    assert first["face_set_sha256"] == second["face_set_sha256"]
    assert first["run_id"] != second["run_id"]


def test_filtered_module_report_uses_frozen_counts_and_labels_detection_diagnostic():
    definition = criteria()
    plan = planned(definition)
    rows = mask_rows(definition, plan)[:1]
    rows[0].update(source="drawn", file="not-shown.png", group="small")
    evidence = gates.evaluate(rows, {definition.id: definition}, plan)
    text = report.markdown(rows, ["regions"], title="Synthetic report", notes=[], evidence=evidence)
    assert "| regions | 2 | 50.0% |" in text
    assert "Detection is a dependency diagnostic" in text
    assert "Selected gates: FAIL" in text and "monk=10 | 0/1" in text
    assert "not-shown.png" not in text


def test_filter_cli_rejects_nested_invalid_baseline_before_loading_models(tmp_path, monkeypatch, capsys):
    model_dir = tmp_path / "_models"
    model_dir.mkdir()
    for name in ("face_landmarker.task", "yunet_2023mar.onnx"):
        (model_dir / name).write_bytes(b"synthetic presence marker, never a model")
    definition, plan, rows = filter_fixture()
    malformed = gates.evaluate(rows, {definition.id: definition}, plan)
    malformed["gates"][0]["slices"] = [None]
    baseline = tmp_path / "bad.json"
    baseline.write_text(json.dumps(malformed))
    monkeypatch.setitem(sys.modules, "mediapipe", SimpleNamespace())
    monkeypatch.setattr(lib, "discover", lambda *_: [SimpleNamespace()])
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("bad baseline must stop before model loading"))
    code = filters.main(["--faces", str(tmp_path), "--baseline", str(baseline)])
    assert code == 2 and "UNPROVEN" in capsys.readouterr().err


def test_filter_definition_is_loaded_before_missing_model_skip(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(lib, "Detectors", lambda *_: pytest.fail("no model may load"))
    code = filters.main(["--faces", str(tmp_path), "--definitions", str(tmp_path / "missing")])
    output = capsys.readouterr()
    assert code == 2 and "definition" in output.err and "SKIPPED" not in output.out
