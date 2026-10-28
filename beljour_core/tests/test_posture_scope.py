"""R13 posture scope: a head-shot face set gives NOT_APPLICABLE, never PASS.

Pass definition (tests/realface/pass_definitions/posture.json, version 2): the
posture gate requires `full_body` input. A face set that does not declare that
content in its own face_set.json is out of scope: the gate reports
NOT_APPLICABLE and stays out of the selected verdict. A set that declares
full_body runs the real checks against the unchanged 100% thresholds.
Fixtures: synthetic plans and rows only; zero faces, models or network.
Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import definitions  # noqa: E402
import face_set  # noqa: E402
import gates  # noqa: E402
import realface_lib as lib  # noqa: E402
import run_state  # noqa: E402

FOLDERS = ("pass_definitions", "pass_definitions-10000")


def posture(count: int = 2, *, content: dict | None = None) -> definitions.Definition:
    data = json.loads((REALFACE / "pass_definitions" / "posture.json").read_text())
    data["face_set"] = {"id": "synthetic-r13", "number_of_faces": count}
    data["required_monk_tones"] = ["1", "10"]
    data["required_matrix"] = {"gender": ["female"], "age": ["30-39"]}
    if content:
        data.update(content)
    return definitions.Definition("posture", run_state.digest(data), data, True)


def regions_definition(count: int = 2) -> definitions.Definition:
    data = json.loads((REALFACE / "pass_definitions" / "regions.json").read_text())
    data["face_set"] = {"id": "synthetic-r13", "number_of_faces": count}
    data["required_monk_tones"] = ["1", "10"]
    data["required_matrix"] = {"gender": ["female"], "age": ["30-39"]}
    return definitions.Definition("regions", run_state.digest(data), data, True)


def plan_for(defs: dict, count: int = 2, content: list[str] | None = None) -> dict:
    faces = []
    for index in range(count):
        tone = "1" if index == 0 else "10"
        faces.append({"face_id": f"synthetic-{index}", "labels": {
            "source": "drawn", "race": "not-inferred", "gender": "female", "age": "30-39",
            "monk": tone, "monk_gender_age": f"{tone}/female/30-39", "slice": "drawn",
            "size": "large_ge128", "yaw": "frontal", "occlusion": "none"}})
    plan = {"run_id": "synthetic-run", "faces": faces, "number_of_faces": count,
            "face_set_sha256": run_state.digest(faces), "engine_sha256": "engine", "max_side": 640,
            "include": ["synthetic-r13"], "model_hashes": {"fixture": "none"},
            "definitions": {k: d.sha256 for k, d in defs.items()}, "definition_committed": True}
    if content is not None:
        plan["face_set_content"] = content
    return plan


def posture_rows(definition, plan, *, ok: bool = True) -> list[dict]:
    return [{"module": "posture", "check": "full_body_required", "face_id": f["face_id"],
             "run_id": plan["run_id"], "pass": ok, "metric_pass": ok,
             "definition_sha256": definition.sha256} for f in plan["faces"]]


def region_rows(definition, plan) -> list[dict]:
    return [{"module": "regions", "check": "masks", "face_id": f["face_id"], "run_id": plan["run_id"],
             "pass": True, "metric_pass": True, "definition_sha256": definition.sha256,
             "empty": "", "skin_share": 0.75, "eyes_inside": 0.99, "invalid_geometry": False}
            for f in plan["faces"]]


def evaluated(rows, defs, plan):
    first = gates.evaluate(rows, defs, plan)
    return gates.evaluate(rows, defs, plan, baseline=first)


@pytest.mark.parametrize("folder", FOLDERS)
def test_written_definition_requires_full_body_and_keeps_every_threshold(folder):
    data = json.loads((REALFACE / folder / "posture.json").read_text())
    assert data["requires_input"] == "full_body"
    assert data["threshold"] == {"overall": 1.0, "every_slice": 1.0}
    assert "blocked" not in data
    assert data["version"] >= 2
    assert data["rules"] == {"*": [{"field": "metric_pass", "op": "eq", "value": True}]}
    loaded = definitions.load_definition("posture", REALFACE / folder)
    assert loaded.content["requires_input"] == "full_body"


@pytest.mark.parametrize("content", (None, [], ["head_shot"], ["head_shot", "group"]))
def test_head_shot_set_is_not_applicable_even_when_every_row_passes(content):
    d = posture()
    defs = {"posture": d}
    plan = plan_for(defs, content=content)
    output = evaluated(posture_rows(d, plan, ok=True), defs, plan)
    gate = output["gates"][0]
    assert gate["status"] == gates.NOT_APPLICABLE
    assert gate["status"] != "PASS"
    assert output["selected_status"] == gates.NOT_APPLICABLE
    assert output["not_applicable"] == ["posture"]
    assert gate["failures"] == []
    assert "NOT_APPLICABLE" in gate["missing_evidence"][0]
    assert "Not applicable to this face set" in gates.markdown(output)


def test_head_shot_failures_cannot_fail_or_pass_the_selected_verdict():
    p, r = posture(), regions_definition()
    defs = {"posture": p, "regions": r}
    plan = plan_for(defs, content=["head_shot"])
    rows = posture_rows(p, plan, ok=False) + region_rows(r, plan)
    output = evaluated(rows, defs, plan)
    by_id = {g["id"]: g for g in output["gates"]}
    assert by_id["posture"]["status"] == gates.NOT_APPLICABLE
    # The applicable gate alone decides; a 0/N posture result does not drag it to FAIL.
    assert output["selected_status"] == by_id["regions"]["status"]
    assert output["selected_status"] != "FAIL"


def test_full_body_set_runs_the_real_checks_and_can_fail():
    d = posture()
    defs = {"posture": d}
    plan = plan_for(defs, content=["full_body"])
    failed = evaluated(posture_rows(d, plan, ok=False), defs, plan)
    assert failed["gates"][0]["status"] == "FAIL"
    assert failed["selected_status"] == "FAIL"
    assert "Overall metric is below its written threshold." in failed["gates"][0]["failures"]


def test_full_body_set_passes_only_on_complete_passing_evidence():
    d = posture()
    defs = {"posture": d}
    plan = plan_for(defs, content=["full_body"])
    passed = evaluated(posture_rows(d, plan, ok=True), defs, plan)
    assert passed["gates"][0]["status"] == "PASS"
    one_short = posture_rows(d, plan, ok=True)
    one_short[1] = {**one_short[1], "pass": False, "metric_pass": False}
    assert evaluated(one_short, defs, plan)["gates"][0]["status"] == "FAIL"


def test_not_applicable_gate_is_left_out_of_the_regression_comparison():
    p, r = posture(), regions_definition()
    defs = {"posture": p, "regions": r}
    plan = plan_for(defs, content=["head_shot"])
    rows = posture_rows(p, plan) + region_rows(r, plan)
    baseline = gates.evaluate(rows, {"regions": r}, plan)
    output = gates.evaluate(rows, defs, plan, baseline=baseline)
    assert output["regression"]["status"] == "PASS"


def test_unknown_required_input_is_refused():
    data = json.loads((REALFACE / "pass_definitions" / "posture.json").read_text())
    data["requires_input"] = "head_and_shoulders"
    with pytest.raises(definitions.DefinitionError, match="requires_input"):
        definitions.validate(data, "posture")


def write_declaration(root: Path, name: str, payload: object) -> None:
    (root / name).mkdir(parents=True, exist_ok=True)
    (root / name / "face_set.json").write_text(json.dumps(payload), encoding="utf-8")


def test_set_content_comes_only_from_the_sets_own_declaration(tmp_path):
    assert face_set.read_set_content(tmp_path, ("frozen-1000",)) == []
    write_declaration(tmp_path, "heads", {"format": "beljour-face-set/1", "content": ["head_shot"]})
    write_declaration(tmp_path, "bodies", {"format": "beljour-face-set/1", "content": ["full_body", "head_shot"]})
    assert face_set.read_set_content(tmp_path, ("bodies",)) == ["full_body", "head_shot"]
    # Several included sets share only what all of them declare.
    assert face_set.read_set_content(tmp_path, ("bodies", "heads")) == ["head_shot"]
    assert face_set.read_set_content(tmp_path, ("bodies", "absent")) == []
    for bad in ({"format": "other", "content": ["full_body"]}, {"format": "beljour-face-set/1", "content": []},
                {"format": "beljour-face-set/1", "content": ["torso"]},
                {"format": "beljour-face-set/1", "content": ["full_body", "full_body"]}, ["full_body"]):
        write_declaration(tmp_path, "bad", bad)
        with pytest.raises(face_set.ScopeError):
            face_set.read_set_content(tmp_path, ("bad",))


def test_content_declaration_is_part_of_the_frozen_run_identity(tmp_path):
    image = tmp_path / "a.png"
    image.write_bytes(b"synthetic-bytes-a")
    face = lib.Face(image, "drawn", "own work", "", row={})
    defs = {"posture": posture(1)}
    heads = run_state.freeze([face], defs, lib.API.parent, max_side=640, include=("x",), content=["head_shot"])
    bodies = run_state.freeze([face], defs, lib.API.parent, max_side=640, include=("x",), content=["full_body"])
    assert heads["face_set_content"] == ["head_shot"] and bodies["face_set_content"] == ["full_body"]
    assert heads["run_id"] != bodies["run_id"]


def test_bench_still_records_posture_as_unmeasured_on_portraits():
    source = (REALFACE / "realface_lib.py").read_text()
    assert '"full_body_required", False' in source
