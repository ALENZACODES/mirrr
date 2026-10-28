"""R13 label sidecar: preregistered labels joined by image content hash.

Pass definition: a labels.csv keyed by image SHA-256 supplies Monk, size, yaw and
occlusion labels; it is read and its own SHA-256 frozen into the run plan before
inference; a sidecar that changes after the freeze rejects the run; labels are
never inferred (an empty cell stays unknown); `derived_*` columns can never
fill a label, whether they sit in the sidecar or the manifest.
Fixtures: drawn PNGs and hand-written CSVs in a temporary folder outside the
repo, a mocked detector and a stub runtime module. No faces, models or network.
Author: John Khan.
"""
from __future__ import annotations

import csv
import hashlib
import json
import sys
import types
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lab.python.beljour_lab.face_harness import synthetic_case
from plumb_api.arena import freeze as arena_freeze
from plumb_api.vision.box_first import DetectionResult, FaceBox

REALFACE = Path(__file__).resolve().parents[2] / "tests" / "realface"
sys.path.insert(0, str(REALFACE))
import definitions  # noqa: E402
import face_set  # noqa: E402
import gates  # noqa: E402
import realface_lib as lib  # noqa: E402
import run_realface as cli  # noqa: E402
import run_state  # noqa: E402

NEW = REALFACE / "pass_definitions-10000"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> Path:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)
    return path


def drawn_set(root: Path, count: int = 3) -> list[Path]:
    folder = root / "frozen-10000" / "fairface"
    folder.mkdir(parents=True)
    paths = []
    manifest = []
    for i in range(count):
        _, image = synthetic_case(i + 1, width=96, height=108)
        path = folder / f"img{i}.png"
        Image.fromarray(image).save(path)
        paths.append(path)
        manifest.append([path.name, "fairface", "CC BY 4.0", "Female", "20-39", "20-29", "0",
                         "glasses;derived:yaw_mp_frontal", "4.0", "0.5", "1"])
    write_csv(folder / "manifest.csv", ["file", "source", "licence", "gender", "age_band", "age_band_r12",
                                        "shard", "tags", "derived_yaw_deg", "derived_face_lum",
                                        "derived_n_faces_yunet"], manifest)
    return paths


def sidecar_for(paths: list[Path], target: Path, extra: list[list[str]] | None = None) -> Path:
    rows = [[sha(paths[0]), "7", "180", "", "4.5", "", "glasses"],
            [sha(paths[1]), "", "", "", "", "", ""]]
    return write_csv(target, ["sha256", "monk", "face_size_px", "size_slice", "yaw_degrees", "yaw_slice",
                              "occlusion"], rows + (extra or []))


def discovered(root: Path) -> list[lib.Face]:
    return lib.discover(root, ("frozen-10000",))


# --- join by hash ----------------------------------------------------------------

def test_sidecar_joins_labels_by_image_content_hash(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    faces = discovered(tmp_path / "faces")
    coverage = face_set.apply_sidecar(faces, labels, run_state.file_hash)
    assert coverage == {"faces": 3, "matched": 2}
    by_name = {f.path.name: run_state.face_labels(f) for f in faces}
    assert by_name["img0.png"]["monk"] == "7"
    assert by_name["img0.png"]["size"] == "large_ge128"
    assert by_name["img0.png"]["yaw"] == "frontal"
    assert by_name["img0.png"]["occlusion"] == "glasses"
    # A listed face with empty cells, and an unlisted face, both stay unknown.
    for name in ("img1.png", "img2.png"):
        assert (by_name[name]["monk"], by_name[name]["size"], by_name[name]["yaw"]) == ("unknown",) * 3
    assert by_name["img2.png"]["occlusion"] == "unknown"


def test_join_is_by_bytes_not_by_file_name(tmp_path):
    paths = drawn_set(tmp_path / "faces", 2)
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    # Swap the two files' bytes: the labels follow the image, not the name.
    a, b = paths[0].read_bytes(), paths[1].read_bytes()
    paths[0].write_bytes(b)
    paths[1].write_bytes(a)
    faces = discovered(tmp_path / "faces")
    face_set.apply_sidecar(faces, labels, run_state.file_hash)
    by_name = {f.path.name: run_state.face_labels(f) for f in faces}
    assert by_name["img1.png"]["monk"] == "7" and by_name["img0.png"]["monk"] == "unknown"


def test_sidecar_hash_and_coverage_are_frozen_into_the_plan(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    path = sidecar_for(paths, tmp_path / "labels.csv")
    labels = face_set.load_sidecar(path)
    faces = discovered(tmp_path / "faces")
    face_set.apply_sidecar(faces, labels, run_state.file_hash)
    defs = definitions.load_definitions(("regions",), NEW)
    plan = run_state.freeze(faces, defs, lib.API.parent, max_side=640, include=("frozen-10000",), labels=labels)
    frozen = plan["labels_sidecar"]
    assert frozen["sha256"] == sha(path)
    assert frozen["rows"] == 2 and frozen["matched_faces"] == 2
    assert frozen["format"] == "beljour-realface-labels/1"
    assert str(tmp_path) not in json.dumps(plan)  # no private path in the plan
    sources = {face["face_id"]: face["labels_source"] for face in plan["faces"]}
    assert sorted(sources.values()) == ["manifest", "sidecar", "sidecar"]
    unlabelled = run_state.freeze(discovered(tmp_path / "faces"), defs, lib.API.parent, max_side=640,
                                  include=("frozen-10000",))
    assert "labels_sidecar" not in unlabelled and unlabelled["run_id"] != plan["run_id"]


def test_supplied_labels_reduce_the_missing_label_count_in_the_gate(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    defs = definitions.load_definitions(("regions",), NEW)
    bare = run_state.freeze(discovered(tmp_path / "faces"), defs, lib.API.parent, max_side=640,
                            include=("frozen-10000",))
    faces = discovered(tmp_path / "faces")
    face_set.apply_sidecar(faces, labels, run_state.file_hash)
    joined = run_state.freeze(faces, defs, lib.API.parent, max_side=640, include=("frozen-10000",), labels=labels)

    def missing_monk(plan):
        gate = gates.evaluate([], defs, plan)["gates"][0]
        return [m for m in gate["missing_evidence"] if "monk labels" in m]

    assert missing_monk(bare) == ["3 faces lack preregistered monk labels."]
    assert missing_monk(joined) == ["2 faces lack preregistered monk labels."]


# --- frozen before inference --------------------------------------------------------

def test_a_sidecar_changed_after_the_freeze_is_rejected(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    path = sidecar_for(paths, tmp_path / "labels.csv")
    labels = face_set.load_sidecar(path)
    faces = discovered(tmp_path / "faces")
    face_set.apply_sidecar(faces, labels, run_state.file_hash)
    defs = definitions.load_definitions(("regions",), NEW)
    plan = run_state.freeze(faces, defs, lib.API.parent, max_side=640, include=("frozen-10000",), labels=labels)
    face_set.verify_sidecar(plan, path)  # unchanged bytes pass
    path.write_text(path.read_text().replace(",7,", ",8,"))
    with pytest.raises(face_set.ScopeError, match="changed after the run was frozen"):
        face_set.verify_sidecar(plan, path)
    path.unlink()
    with pytest.raises(face_set.ScopeError, match="disappeared"):
        face_set.verify_sidecar(plan, path)
    with pytest.raises(face_set.ScopeError, match="presence"):
        face_set.verify_sidecar(plan, None)
    with pytest.raises(face_set.ScopeError, match="presence"):
        face_set.verify_sidecar({"run_id": "x"}, tmp_path / "late.csv")
    face_set.verify_sidecar({"run_id": "x"}, None)


def test_a_changed_sidecar_produces_a_different_run_identity(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    defs = definitions.load_definitions(("regions",), NEW)
    ids = []
    for monk in ("7", "8"):
        path = sidecar_for(paths, tmp_path / f"labels-{monk}.csv")
        path.write_text(path.read_text().replace(",7,", f",{monk},"))
        labels = face_set.load_sidecar(path)
        faces = discovered(tmp_path / "faces")
        face_set.apply_sidecar(faces, labels, run_state.file_hash)
        ids.append(run_state.freeze(faces, defs, lib.API.parent, max_side=640,
                                    include=("frozen-10000",), labels=labels)["run_id"])
    assert ids[0] != ids[1]


# --- never inferred, never derived -----------------------------------------------------

@pytest.mark.parametrize("column", ("derived_yaw_deg", "derived_face_lum", "derived_n_faces_yunet", "derived_monk"))
def test_sidecar_with_a_derived_column_is_refused(tmp_path, column):
    path = write_csv(tmp_path / "labels.csv", ["sha256", "monk", column], [["a" * 64, "5", "1"]])
    with pytest.raises(face_set.ScopeError, match="derived"):
        face_set.load_sidecar(path)


def test_manifest_derived_columns_cannot_fill_labels_even_with_a_sidecar(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    faces = discovered(tmp_path / "faces")
    face_set.apply_sidecar(faces, labels, run_state.file_hash)
    unlabelled = next(f for f in faces if f.path.name == "img2.png")
    assert unlabelled.row["derived_yaw_deg"] == "4.0"
    assert run_state.face_labels(unlabelled)["yaw"] == "unknown"


@pytest.mark.parametrize("header,row,match", (
    (["sha256", "monk"], ["A" * 64, "5"], "64 lower-case hex"),
    (["sha256", "monk"], ["a" * 63, "5"], "64 lower-case hex"),
    (["sha256", "monk"], ["a" * 64, "11"], "monk"),
    (["sha256", "monk"], ["a" * 64, "dark"], "monk"),
    (["sha256", "yaw_degrees"], ["a" * 64, "120"], "yaw_degrees"),
    (["sha256", "yaw_degrees"], ["a" * 64, "nan"], "yaw_degrees"),
    (["sha256", "face_size_px"], ["a" * 64, "-4"], "face_size_px"),
    (["sha256", "size_slice"], ["a" * 64, "huge"], "size_slice"),
    (["sha256", "yaw_slice"], ["a" * 64, "left"], "yaw_slice"),
    (["sha256", "occlusion"], ["a" * 64, "Glasses!"], "occlusion"),
    (["sha256", "gender"], ["a" * 64, "female"], "unregistered"),
    (["sha256", "race"], ["a" * 64, "x"], "unregistered"),
    (["file", "monk"], ["a.png", "5"], "sha256 column"),
    (["sha256"], ["a" * 64], "no label columns"),
))
def test_malformed_sidecars_are_refused(tmp_path, header, row, match):
    path = write_csv(tmp_path / "labels.csv", header, [row])
    with pytest.raises(face_set.ScopeError, match=match):
        face_set.load_sidecar(path)


def test_duplicate_rows_and_empty_or_ragged_files_are_refused(tmp_path):
    for rows, match in (([["a" * 64, "5"], ["a" * 64, "6"]], "twice"), ([], "no rows"),
                        ([["a" * 64, "5", "extra"]], "wrong number")):
        path = write_csv(tmp_path / "labels.csv", ["sha256", "monk"], rows)
        with pytest.raises(face_set.ScopeError, match=match):
            face_set.load_sidecar(path)
    (tmp_path / "bin.csv").write_bytes(b"\xff\xfe\x00bad")
    with pytest.raises(face_set.ScopeError, match="UTF-8"):
        face_set.load_sidecar(tmp_path / "bin.csv")
    with pytest.raises(face_set.ScopeError, match="cannot be read"):
        face_set.load_sidecar(tmp_path / "absent.csv")


def test_a_sidecar_that_disagrees_with_the_manifest_is_refused(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    faces = discovered(tmp_path / "faces")
    faces[0].row["monk"] = "3"
    with pytest.raises(face_set.ScopeError, match="disagrees"):
        face_set.apply_sidecar(faces, labels, run_state.file_hash)


def test_agreeing_manifest_label_is_accepted(tmp_path):
    paths = drawn_set(tmp_path / "faces")
    labels = face_set.load_sidecar(sidecar_for(paths, tmp_path / "labels.csv"))
    faces = discovered(tmp_path / "faces")
    faces[0].row["monk"] = "7"
    assert face_set.apply_sidecar(faces, labels, run_state.file_hash)["matched"] == 2


# --- end to end through the CLI, mocked runtime ------------------------------------------

@pytest.fixture
def runtime(monkeypatch, tmp_path):
    xyz, _ = synthetic_case(3, width=96, height=108)
    xyz[:, 0] = 48 + (xyz[:, 0] - 48) * 0.6
    xyz[:, 2] *= 0.6
    normalized = xyz / np.array([96, 108, 96])

    class DrawnDetector:
        def __init__(self, models):
            pass

        def detect(self, rgb):
            return DetectionResult([normalized.copy()], [{}], [FaceBox(8, 12, 80, 84)], [], False)

    monkeypatch.setattr(lib, "Detectors", DrawnDetector)
    monkeypatch.setitem(sys.modules, "mediapipe", types.ModuleType("mediapipe"))
    root = tmp_path / "faces"
    paths = drawn_set(root)
    # Exercise the real frozen-input contract before sidecar behavior. These
    # tiny drawn inputs use the arena's existing lock format, never a bypass.
    frozen = root / "frozen-10000"
    with (paths[0].parent / "manifest.csv").open(newline="", encoding="utf-8") as handle:
        folder_rows = list(csv.DictReader(handle))
    identities = [{"face_id": arena_freeze.face_id(index), "sha256": sha(path),
                   "rel_path": path.relative_to(frozen).as_posix()}
                  for index, path in enumerate(paths, 1)]
    manifest_rows = [{**row, **identity} for row, identity in zip(folder_rows, identities, strict=True)]
    with (frozen / "manifest.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(manifest_rows[0]))
        writer.writeheader()
        writer.writerows(manifest_rows)
    lock = {"format": arena_freeze.LOCK_FORMAT, "version": 1, "total": len(paths),
            "manifest_sha256": sha(frozen / "manifest.csv"), "faces": identities,
            "faces_sha256": arena_freeze._canonical(identities)}
    (frozen / "frozen.lock").write_text(json.dumps(lock), encoding="utf-8")
    assert arena_freeze.verify_directory(frozen) == []
    models = root / "_models"
    models.mkdir()
    for name in ("face_landmarker.task", "yunet_2023mar.onnx"):
        (models / name).write_bytes(b"stand-in bytes; never loaded")
    return root, paths


def test_cli_freezes_sidecar_shards_and_content_and_reports_derived_separately(runtime, tmp_path):
    root, paths = runtime
    labels = sidecar_for(paths, tmp_path / "labels.csv")
    out = tmp_path / "out" / "r.md"
    code = cli.main(["--faces", str(root), "--include", "frozen-10000", "--modules", "landmarks,posture",
                     "--definitions", str(NEW), "--shards", "0", "--labels", str(labels), "--report", str(out)])
    assert code == 3  # never PASS: 3 faces against a 10,000-face definition
    plan = json.loads(out.with_suffix(".run.json").read_text())
    assert plan["shards"] == [0] and plan["shard_counts"] == {"0": 3}
    assert plan["labels_sidecar"]["sha256"] == sha(labels)
    assert plan["face_set_content"] == []
    evidence = json.loads(out.with_suffix(".gates.json").read_text())
    by_id = {g["id"]: g for g in evidence["gates"]}
    assert by_id["posture"]["status"] == gates.NOT_APPLICABLE
    assert by_id["landmarks"]["status"] in {"UNPROVEN", "FAIL"}
    assert any("cannot stand in" in m for m in by_id["landmarks"]["missing_evidence"])
    text = out.read_text()
    assert "Declared shard subset [0]" in text
    assert "derived (not ground truth)" in text
    assert str(root) not in text and "img0.png" not in text
    rows = [json.loads(line) for line in out.with_suffix(".jsonl").read_text().splitlines()[1:]]
    observed = [r for r in rows if r.get("module") == "landmarks" and r.get("check") == "detect"]
    assert observed and all(r["yaw"] in {"frontal", "unknown"} for r in observed)
    labelled = next(r for r in observed if r["monk"] == "7")
    assert labelled["occlusion"] == "glasses" and labelled["derived_yaw_deg"] == "4.0"


def test_cli_refuses_a_malformed_sidecar_before_inference(runtime, tmp_path, monkeypatch, capsys):
    root, _ = runtime
    monkeypatch.setattr(lib, "run_all", lambda *a, **k: pytest.fail("no inference with a bad sidecar"))
    bad = write_csv(tmp_path / "bad.csv", ["sha256", "derived_yaw_deg"], [["a" * 64, "3"]])
    code = cli.main(["--faces", str(root), "--include", "frozen-10000", "--modules", "landmarks",
                     "--definitions", str(NEW), "--labels", str(bad)])
    assert code == 2 and "derived" in capsys.readouterr().err


def test_cli_rejects_a_sidecar_edited_during_the_run(runtime, tmp_path, capsys):
    root, paths = runtime
    labels = sidecar_for(paths, tmp_path / "labels.csv")
    real = lib.run_all

    def edit_then_run(*args, **kwargs):
        rows = real(*args, **kwargs)
        labels.write_text(labels.read_text().replace(",7,", ",9,"))
        return rows

    lib.run_all = edit_then_run
    try:
        code = cli.main(["--faces", str(root), "--include", "frozen-10000", "--modules", "landmarks",
                         "--definitions", str(NEW), "--labels", str(labels),
                         "--report", str(tmp_path / "o" / "r.md")])
    finally:
        lib.run_all = real
    assert code == 2
    assert "changed after the run was frozen" in capsys.readouterr().err
    assert not (tmp_path / "o" / "r.gates.json").exists()
