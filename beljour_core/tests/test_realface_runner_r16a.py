"""R16A real-face input-stage integration with generated RGB and mock detectors.

Asserts the new primary-selection decline path preserves every frozen face
in the denominator, never writes a filename and cannot accidentally run the
editing engine on ambiguous people. Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest
from PIL import Image

from plumb_api.arena.registry import LANE_A_R16A_MODULES, lane_a_r16a_ownership
from plumb_api.vision.box_first import DetectionResult

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
import realface_lib as lib  # noqa: E402
import run_realface as cli  # noqa: E402
import run_state  # noqa: E402


def mesh(cx: float, radius: float = .08) -> np.ndarray:
    theta = np.linspace(0, 2 * np.pi, 478, endpoint=False)
    return np.column_stack((cx + radius * np.cos(theta),
                            .5 + radius * np.sin(theta), np.zeros(478)))


@pytest.fixture
def harness(tmp_path, monkeypatch):
    image = np.full((128, 160, 3), 111, dtype=np.uint8)
    path = tmp_path / "never-export-this-filename.png"
    Image.fromarray(image).save(path)
    face = lib.Face(path, "drawn", "own", "synthetic", race="unknown", gender="unknown",
                    age="30-39", row={"face_id": "fixture-hash", "yaw_slice": "frontal", "occlusion": "none"})
    result = SimpleNamespace(value=DetectionResult())

    class Detector:
        def __init__(self, models, landmark_input="none"):
            self.models = models

        def detect(self, rgb):
            return result.value

    monkeypatch.setattr(lib, "Detectors", Detector)
    bench = lib.Bench(tmp_path / "models-unused", modules=("landmarks", "regions"), run_id="r16a-test")
    return face, bench, result


def test_multiple_similarly_sized_faces_keep_one_frozen_observation(harness):
    face, bench, source = harness
    source.value = DetectionResult(faces=[mesh(.3), mesh(.7)])
    rows = bench.run(face)
    assert rows[0]["check"] == "detect"
    assert rows[0]["reason_code"] == "selected_centre_tiebreak"
    assert rows[0]["detected"] is True
    assert rows[0]["candidate_count"] == 2
    assert {row["module"] for row in rows} == {"landmarks", "regions"}
    assert all(row.get("face_id") == rows[0].get("face_id") for row in rows)
    assert not any("file" in row for row in rows)
    assert "never-export" not in json.dumps(rows)


def test_no_face_in_annotated_side_profile_has_specific_reason(harness):
    face, bench, source = harness
    source.value = DetectionResult()
    face.row["yaw_slice"] = "profile"
    rows = bench.run(face)
    assert rows[0]["reason_code"] == "side_profile_no_face"
    assert rows[1]["reason_code"] == "side_profile_no_face"


def test_no_face_in_annotated_head_covering_has_specific_reason(harness):
    face, bench, source = harness
    source.value = DetectionResult()
    face.row["occlusion"] = "hijab"
    rows = bench.run(face)
    assert rows[0]["reason_code"] == "head_covering_no_face"
    assert rows[1]["reason_code"] == "head_covering_no_face"


def test_unknown_labels_remain_no_face_not_demographic_guesses(harness):
    face, bench, source = harness
    source.value = DetectionResult()
    face.row["occlusion"] = "unknown"
    face.row["yaw_slice"] = "unknown"
    rows = bench.run(face)
    assert rows[0]["reason_code"] == "no_face"
    assert rows[0]["faces"] == 0


def test_largest_face_gets_selected_without_choosing_first(harness):
    face, bench, source = harness
    source.value = DetectionResult(faces=[mesh(.8, .04), mesh(.35, .16)])
    rows = bench.run(face)
    # Detection row reports the selected primary, not an arbitrary detector rank.
    assert rows[0]["reason_code"] == "selected_largest"
    assert rows[0]["candidate_count"] == 2
    assert rows[0]["detected"] is True
    assert rows[0]["area_share"] > .09


def test_unreadable_external_file_generates_no_sensitive_error_text(harness):
    face, bench, source = harness
    face.path.write_text("invalid-pretend-photo-with-private-pii")
    rows = bench.run(face)
    assert rows[0]["reason_code"] == "image_unreadable"
    assert rows[1]["reason_code"] == "image_unreadable"
    assert "invalid-pretend" not in json.dumps(rows)


def test_label_free_setting_participates_in_resume_run_identity(harness, monkeypatch):
    face, bench, source = harness
    # Source hashes are real but only for a synthetic local PNG.
    from definitions import load_definitions
    definitions = load_definitions(("landmarks", "regions"))
    reference = run_state.freeze([face], definitions, lib.API.parent, max_side=640,
                                 include=("frozen-1000",), landmark_self_check=False)
    changed = run_state.freeze([face], definitions, lib.API.parent, max_side=640,
                               include=("frozen-1000",), landmark_self_check=True)
    assert reference["run_id"] != changed["run_id"]
    assert "landmark_self_check" not in reference
    assert changed["landmark_self_check"]["flip_p95_iod_max"] == .25


def test_aggregate_comparison_mode_never_needs_models_or_faces(tmp_path, capsys):
    from plumb_api.quality import realface_regression as reg
    def result(passed: int) -> dict[str, object]:
        c = {"passed": passed, "total": 100, "rate": passed / 100}
        return {"format": reg.SOURCE_FORMAT, "run_id": "synthetic", "face_set_sha256": "set",
                "engine_sha256": "engine", "max_side": 640, "model_hashes": {},
                "gates": [{"id": "regions", "definition_sha256": "rules", "all_faces": c,
                           "overall": c, "slices": [{"dimension": "source", "value": "drawn", **c}]}]}
    before, after = tmp_path / "before.json", tmp_path / "after.json"
    before.write_text(json.dumps(result(99)))
    after.write_text(json.dumps(result(55)))
    assert cli.main(["--compare-commits", str(before), str(after), "--faces", "/no/faces/here"]) == 2
    output = capsys.readouterr().out
    assert "regions" in output and "FAIL" in output
    assert "/no/faces" not in output


def test_lane_a_registry_owns_every_new_module():
    assert all(owner == "A" for owner in LANE_A_R16A_MODULES.values())
    assert lane_a_r16a_ownership() == []
    assert len(LANE_A_R16A_MODULES) >= 6
