"""R14 lock verification before inference, with no faces, models or network.

Written pass definition: the unchanged arena lock format verifies both named
sets; altered membership, bytes, root labels or shared folder labels refuse;
checkpoint reuse binds every metadata file; legacy compatible aggregate
baselines still compare; strict gate mode cannot succeed by skipping its run.
Only tiny synthetic byte files and CSV labels are used. Author: John Khan.
"""
from __future__ import annotations

import csv
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

from plumb_api.arena import freeze as arena_freeze

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests" / "realface"))
import definitions  # noqa: E402
import gates  # noqa: E402
import lock_contract  # noqa: E402
import realface_lib as lib  # noqa: E402
import run_realface as cli  # noqa: E402
import run_state  # noqa: E402

FIELDS = ("file", "face_id", "sha256", "rel_path", "source", "licence", "race", "gender", "age_band", "age_band_r12",
          "monk", "monk_tone", "slice", "shard", "yaw_slice", "yaw_degrees", "face_size_px", "size_slice", "occlusion")


def write_csv(path: Path, rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def make_set(tmp_path: Path, name: str = "frozen-10000") -> SimpleNamespace:
    folder = tmp_path / name
    leaf = folder / "drawn"
    leaf.mkdir(parents=True)
    rows = []
    for index in range(2):
        path = leaf / f"drawn-{index}.png"
        path.write_bytes(f"synthetic bytes, never decoded: {index}".encode())
        rows.append({"file": path.name, "face_id": f"LG{index+1:04d}",
                     "sha256": arena_freeze.sha256_file(path), "rel_path": f"drawn/{path.name}",
                     "source": "drawn", "licence": "own work", "race": "", "gender": "female",
                     "age_band": "30-39", "monk": "5", "slice": "synthetic", "shard": str(index),
                     "yaw_slice": "frontal", "occlusion": "none"})
    write_csv(folder / "manifest.csv", rows)
    write_csv(leaf / "manifest.csv", rows)
    locked = [{key: row[key] for key in ("face_id", "sha256", "rel_path")} for row in rows]
    lock = {"format": arena_freeze.LOCK_FORMAT, "version": 1, "total": len(rows),
            "manifest_sha256": arena_freeze.sha256_file(folder / "manifest.csv"),
            "faces": locked, "faces_sha256": arena_freeze._canonical(locked)}
    (folder / "frozen.lock").write_text(json.dumps(lock), encoding="utf-8")
    return SimpleNamespace(root=tmp_path, name=name, folder=folder, leaf=leaf, rows=rows, lock=lock)


def check(case: SimpleNamespace) -> dict:
    return lock_contract.verify(case.root, (case.name,), lib.discover(case.root, (case.name,)))


def write_lock(case: SimpleNamespace) -> None:
    (case.folder / "frozen.lock").write_text(json.dumps(case.lock), encoding="utf-8")


def set_labels(case: SimpleNamespace, locked: dict, discovered: dict) -> None:
    root_rows = [dict(row) for row in case.rows]
    folder_rows = [dict(row) for row in case.rows]
    root_rows[0].update(locked)
    folder_rows[0].update(discovered)
    write_csv(case.folder / "manifest.csv", root_rows)
    write_csv(case.leaf / "manifest.csv", folder_rows)
    case.lock["manifest_sha256"] = arena_freeze.sha256_file(case.folder / "manifest.csv")
    write_lock(case)


@pytest.mark.parametrize("locked,discovered,dimension", (
    ({"age_band": "20-29"}, {"age_band": "20-29", "age_band_r12": "60+"}, "age"),
    ({"age_band": "20-39", "age_band_r12": "20-29"}, {"age_band": "20-39", "age_band_r12": "30-39"}, "age"),
    ({"monk": "", "monk_tone": "5"}, {"monk": "8", "monk_tone": "5"}, "monk"),
    ({"monk": "5"}, {"monk": "", "monk_tone": "8"}, "monk"),
    ({"face_size_px": "96", "size_slice": ""}, {"face_size_px": "96", "size_slice": "small_lt64"}, "size"),
    ({"yaw_degrees": "0", "yaw_slice": ""}, {"yaw_degrees": "0", "yaw_slice": "profile"}, "yaw"),
))
def test_higher_priority_alias_cannot_override_a_locked_effective_label(tmp_path, locked, discovered, dimension):
    case = make_set(tmp_path)
    set_labels(case, locked, discovered)
    with pytest.raises(ValueError, match=f"effective {dimension} label conflicts"):
        check(case)


@pytest.mark.parametrize("locked,discovered", (
    ({"age_band": "20-39"}, {"age_band": "20-39", "age_band_r12": "20-29"}),
    ({"age_band": "20-39"}, {"age_band": "20-39", "age_band_r12": "30-39"}),
    ({"age_band": "20-39"}, {"age_band": "20-29"}),
    ({"age_band": "60+"}, {"age_band": "60+", "age_band_r12": "60+"}),
    ({"monk": "5"}, {"monk": "", "monk_tone": "5"}),
    ({"monk": "", "monk_tone": "5"}, {"monk": "5", "monk_tone": ""}),
))
def test_documented_age_refinements_and_equivalent_monk_aliases_preserve_discovery(tmp_path, locked, discovered):
    case = make_set(tmp_path)
    set_labels(case, locked, discovered)
    before = lib.discover(tmp_path, (case.name,))
    original = [(face.age, dict(face.row)) for face in before]
    lock_contract.verify(tmp_path, (case.name,), before)
    assert [(face.age, dict(face.row)) for face in before] == original


def test_additional_unmeasured_label_is_allowed_but_changes_baseline_identity(tmp_path):
    case = make_set(tmp_path)
    set_labels(case, {"monk": "", "monk_tone": ""}, {"monk": "", "monk_tone": ""})
    original = plan(case, binding=check(case))
    set_labels(case, {"monk": "", "monk_tone": ""}, {"monk": "", "monk_tone": "8"})
    updated = plan(case, binding=check(case))
    assert updated["face_set_sha256"] != original["face_set_sha256"]
    criteria = definitions.load_definitions(("regions",))
    baseline = gates.evaluate([], criteria, original)
    current = gates.evaluate([], criteria, updated, baseline=baseline)
    assert current["regression"]["status"] == "UNPROVEN"
    assert any("face_set_sha256 differs" in reason for reason in current["regression"]["reasons"])


@pytest.mark.parametrize("name", ("frozen-1000", "frozen-10000", "frozen-10000-v2"))
def test_existing_arena_lock_format_and_named_set_paths_work_without_writes(tmp_path, name):
    case = make_set(tmp_path, name)
    before = {p.relative_to(tmp_path): p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()}
    evidence = check(case)
    assert arena_freeze.verify_directory(case.folder) == []
    assert evidence[name]["lock_sha256"] == hashlib.sha256(before[Path(name) / "frozen.lock"]).hexdigest()
    assert set(evidence[name]["metadata_sha256"]) == {"manifest.csv", "drawn/manifest.csv"}
    assert {p.relative_to(tmp_path): p.read_bytes() for p in tmp_path.rglob("*") if p.is_file()} == before


@pytest.mark.parametrize("mutation", ("missing_lock", "lock_json", "lock_format", "lock_hash", "image", "manifest_label", "folder_label", "unlisted_image", "missing_image"))
def test_unverified_inputs_refuse_before_the_bench_can_run(tmp_path, mutation, monkeypatch, capsys):
    case = make_set(tmp_path)
    if mutation == "missing_lock":
        (case.folder / "frozen.lock").unlink()
    elif mutation == "lock_json":
        (case.folder / "frozen.lock").write_text("{")
    elif mutation == "lock_format":
        case.lock["format"] = "unrecognized/2"
        write_lock(case)
    elif mutation == "lock_hash":
        case.lock["faces"][0]["sha256"] = "0" * 64
        write_lock(case)
    elif mutation == "image":
        (case.leaf / case.rows[0]["file"]).write_bytes(b"altered synthetic source")
    elif mutation in {"manifest_label", "folder_label"}:
        case.rows[0]["monk"] = "6"
        write_csv((case.folder if mutation == "manifest_label" else case.leaf) / "manifest.csv", case.rows)
    elif mutation == "unlisted_image":
        (case.leaf / "extra.png").write_bytes(b"another synthetic source")
    else:
        (case.leaf / case.rows[0]["file"]).unlink()
    models = tmp_path / "_models"
    models.mkdir()
    for name in ("face_landmarker.task", "yunet_2023mar.onnx"):
        (models / name).write_bytes(b"synthetic never-loaded model placeholder")
    monkeypatch.setitem(sys.modules, "mediapipe", SimpleNamespace())
    monkeypatch.setattr(lib, "run_all", lambda *args, **kwargs: pytest.fail("unverified input reached inference"))
    assert cli.main(["--faces", str(tmp_path), "--include", case.name, "--modules", "regions"]) == 2
    assert "UNPROVEN" in capsys.readouterr().err


@pytest.mark.parametrize("record", (None, {}, {"face_id": "x", "sha256": "f" * 64, "rel_path": "../escape.png"},
                                  {"face_id": "x", "sha256": "f" * 64, "rel_path": "/outside.png"}))
def test_malformed_or_escaping_lock_records_fail_closed(tmp_path, record):
    case = make_set(tmp_path)
    case.lock["faces"] = [record]
    write_lock(case)
    with pytest.raises(ValueError, match="frozen input verification"):
        check(case)


def test_locked_manifest_identity_cannot_differ_even_with_a_matching_manifest_digest(tmp_path):
    case = make_set(tmp_path)
    case.rows[0]["face_id"] = "LG9999"
    write_csv(case.folder / "manifest.csv", case.rows)
    case.lock["manifest_sha256"] = arena_freeze.sha256_file(case.folder / "manifest.csv")
    write_lock(case)
    with pytest.raises(ValueError, match="manifest identities"):
        check(case)


def plan(case: SimpleNamespace, *, binding: dict | None) -> dict:
    faces = lib.discover(case.root, (case.name,))
    return run_state.freeze(faces, definitions.load_definitions(("regions",)), ROOT,
                            max_side=640, include=(case.name,), frozen_inputs=binding)


def test_changed_lock_cannot_resume_but_a_compatible_legacy_baseline_still_compares(tmp_path):
    case = make_set(tmp_path)
    legacy = plan(case, binding=None)
    current = plan(case, binding=check(case))
    assert legacy["face_set_sha256"] == current["face_set_sha256"]
    assert legacy["run_id"] != current["run_id"]
    criteria = definitions.load_definitions(("regions",))
    baseline = gates.evaluate([], criteria, legacy)
    compared = gates.evaluate([], criteria, current, baseline=baseline)
    assert compared["regression"]["status"] == "PASS"
    assert compared["selected_status"] != "PASS", "no image evidence was manufactured"
    saved = tmp_path / "pre-lock.run.json"
    run_state.save_plan(saved, legacy)
    with pytest.raises(ValueError, match="pre-lock checkpoints.*new R14 run"):
        run_state.save_plan(saved, current)
    saved = tmp_path / "r14.run.json"
    run_state.save_plan(saved, current)
    run_state.save_plan(saved, current)
    case.lock["version"] += 1
    write_lock(case)
    with pytest.raises(ValueError, match="frozen.lock or manifest binding differs"):
        run_state.save_plan(saved, plan(case, binding=check(case)))


def test_changed_additional_folder_metadata_invalidates_checkpoint_without_relabelling(tmp_path):
    case = make_set(tmp_path)
    original = plan(case, binding=check(case))
    saved = tmp_path / "before.run.json"
    run_state.save_plan(saved, original)
    # A harmless extra blank line changes consumed metadata bytes, not labels.
    with (case.leaf / "manifest.csv").open("a", encoding="utf-8") as handle:
        handle.write("\n")
    updated = plan(case, binding=check(case))
    assert updated["face_set_sha256"] == original["face_set_sha256"]
    with pytest.raises(ValueError, match="manifest binding differs"):
        run_state.save_plan(saved, updated)


def test_verification_precedes_shard_selection_and_does_not_change_it(tmp_path):
    import face_set
    case = make_set(tmp_path)
    faces = lib.discover(tmp_path, (case.name,))
    lock_contract.verify(tmp_path, (case.name,), faces)
    selected = face_set.select_shards(faces, (0,))
    assert [face.row["shard"] for face in selected] == ["0"]
    with pytest.raises(ValueError, match="membership differs"):
        lock_contract.verify(tmp_path, (case.name,), selected)


def test_strict_gate_requires_baseline_and_never_succeeds_by_skipping(tmp_path, capsys):
    with pytest.raises(SystemExit) as error:
        cli.main(["--faces", str(tmp_path), "--require-baseline"])
    assert error.value.code == 2
    assert "explicit --baseline" in capsys.readouterr().err
    case = make_set(tmp_path)
    baseline = gates.evaluate([], definitions.load_definitions(("regions",)), plan(case, binding=None))
    path = tmp_path / "previous.gates.json"
    path.write_text(json.dumps(baseline))
    assert cli.main(["--faces", str(tmp_path), "--require-baseline", "--baseline", str(path)]) == 3
    assert "no PASS" in capsys.readouterr().out


@pytest.mark.parametrize("mutation", ("lock", "source", "root_labels", "folder_labels", "sidecar"))
def test_inputs_changed_during_a_run_cannot_reach_acceptance(tmp_path, mutation, monkeypatch, capsys):
    case = make_set(tmp_path)
    models = tmp_path / "_models"
    models.mkdir()
    for name in ("face_landmarker.task", "yunet_2023mar.onnx"):
        (models / name).write_bytes(b"synthetic never-loaded model placeholder")
    labels = tmp_path / "labels.csv"
    labels.write_text(f"sha256,monk\n{case.rows[0]['sha256']},5\n")

    def change_input(*args, **kwargs):
        if mutation == "lock":
            case.lock["version"] += 1
            write_lock(case)
        elif mutation == "source":
            (case.leaf / case.rows[0]["file"]).write_bytes(b"changed during synthetic execution")
        elif mutation in {"root_labels", "folder_labels"}:
            case.rows[0]["monk"] = "6"
            write_csv((case.folder if mutation == "root_labels" else case.leaf) / "manifest.csv", case.rows)
        else:
            labels.write_text(f"sha256,monk\n{case.rows[0]['sha256']},6\n")
        return []

    monkeypatch.setitem(sys.modules, "mediapipe", SimpleNamespace())
    monkeypatch.setattr(lib, "run_all", change_input)
    monkeypatch.setattr(gates, "evaluate", lambda *args, **kwargs: pytest.fail("changed input reached acceptance"))
    code = cli.main(["--faces", str(tmp_path), "--include", case.name, "--modules", "regions",
                     "--report", str(tmp_path / "changed.md"), "--labels", str(labels)])
    assert code == 2
    assert "UNPROVEN" in capsys.readouterr().err
    assert not (tmp_path / "changed.gates.json").exists()


def test_make_realface_gate_forwards_explicit_baseline_to_strict_runner():
    result = subprocess.run(["make", "-n", "realface-gate", "REALFACE_BASELINE=/external/previous.gates.json"],
                            cwd=ROOT, capture_output=True, text=True, check=True)
    assert "--require-baseline" in result.stdout
    assert "--baseline /external/previous.gates.json" in result.stdout
