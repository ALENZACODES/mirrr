"""Provenance and false-PASS regressions using temporary synthetic inputs.

No real face or licensed dataset is consumed. The runner fixture substitutes
only discovery and evaluation so exact-byte, journal and final-verification
behaviour remains exercised. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests" / "realface"))
from eyes_brows import run as runner  # noqa: E402
from eyes_brows.aggregate import summarize  # noqa: E402
from eyes_brows.checkpoint import Journal  # noqa: E402
from eyes_brows.criteria import FEATURES, digest, normalize_observation  # noqa: E402
from eyes_brows.evidence import EvidenceChanged, frozen_files, load, parse, path_for  # noqa: E402

SHA = "a" * 64


def _sidecar(sha=SHA, **values):
    return {"format": "beljour-eyes-brows-evidence/1", "image_sha256": sha,
            "width": 16, "height": 16, "provenance": "checked_manual", **values}


def _bytes(value):
    return json.dumps(value, sort_keys=True).encode()


def _observation(feature="W59", status="PASS", **metrics):
    return {"feature": feature, "status": status, "metrics": metrics}


def _rows(sha=SHA):
    return [{**_observation(feature), "image_sha256": sha} for feature in FEATURES]


def _plan():
    return {"format": "synthetic-provenance-test", "selected": [SHA], "source": "fixed"}


@pytest.mark.parametrize("status", ["BOGUS", "", "pass", None])
def test_unknown_status_cannot_disappear_from_mixed_pass_denominator(status):
    values = [_observation() for _ in range(30)] + [_observation(status=status)]
    with pytest.raises(ValueError, match="status"):
        summarize(values)


def test_untested_alias_is_counted_as_unproven_in_mixed_pass_group():
    values = [_observation() for _ in range(30)] + [_observation(status="UNTESTED")]
    measured = summarize(values)
    assert measured["status"] == "UNPROVEN"
    assert measured["faces"] == 31
    assert measured["passed"] == measured["eligible"] == 30
    assert measured["unproven"] == 1
    assert values[-1]["status"] == "UNTESTED"


@pytest.mark.parametrize("feature,proof", [
    ("W59", {"adult_refusal_verified": True, "under18_verified": True}),
    ("W71", {}),
    ("W71", {"adult_refusal_verified": True}),
    ("W72", {"under18_verified": True}),
    ("W72", {"adult_refusal_verified": True, "under18_verified": False}),
    ("rain-expression", {"adult_refusal_verified": False, "under18_verified": True}),
    ("rain-expression", {"adult_refusal_verified": 1, "under18_verified": True}),
])
def test_forged_exemption_rejected_even_beside_thirty_valid_passes(feature, proof):
    exempt = _observation(feature, "NOT_APPLICABLE", **proof)
    with pytest.raises(ValueError, match="exemption"):
        normalize_observation(exempt)
    with pytest.raises(ValueError, match="exemption"):
        summarize([_observation(feature) for _ in range(30)] + [exempt])


@pytest.mark.parametrize("feature", ["W71", "W72", "rain-expression"])
def test_verified_underage_refusal_is_explicitly_counted(feature):
    exempt = _observation(feature, "NOT_APPLICABLE", adult_refusal_verified=True, under18_verified=True)
    mixed = summarize([_observation(feature) for _ in range(30)] + [exempt])
    assert mixed["status"] == "PASS"
    assert mixed["faces"] == 31 and mixed["eligible"] == 30
    assert mixed["not_applicable"] == 1
    all_exempt = summarize([exempt.copy() for _ in range(30)])
    assert all_exempt["status"] == "NOT_APPLICABLE"
    assert all_exempt["pass_rate"] is None and all_exempt["eligible"] == 0


def test_aggregate_uses_sanitized_metrics_without_mutating_source():
    value = _observation(elapsed_ms=2.5, private_path="private/photo.jpg", landmarks=[[.2, .3]])
    measured = summarize([value], minimum=1)
    assert set(measured["metrics"]) == {"elapsed_ms"}
    assert value["metrics"]["private_path"] == "private/photo.jpg"


@pytest.mark.parametrize("status", ["BOGUS", "NOT_APPLICABLE"])
def test_recomputed_payload_digest_does_not_bypass_checkpoint_status_validation(tmp_path, status):
    with Journal(tmp_path, _plan()) as journal:
        journal.append(SHA, _rows())
    target = tmp_path / "observations.jsonl"
    item = json.loads(target.read_bytes())
    item["rows"][0]["status"] = status
    item["payload_sha256"] = digest(item["rows"])
    target.write_text(json.dumps(item) + "\n")
    with pytest.raises(ValueError, match="status|exemption"):
        with Journal(tmp_path, _plan()):
            pass


def test_invalidated_checkpoint_remains_unusable_after_restoring_original_plan(tmp_path):
    with Journal(tmp_path, _plan()) as journal:
        journal.append(SHA, _rows())
        journal.invalidate("evidence_changed_during_run")
    marker = json.loads((tmp_path / "invalidated.json").read_bytes())
    assert marker["reason"] == "evidence_changed_during_run"
    for plan in (_plan(), {**_plan(), "source": "different"}):
        with pytest.raises(ValueError, match="invalidated"):
            with Journal(tmp_path, plan):
                pass
    assert len((tmp_path / "observations.jsonl").read_text().splitlines()) == 1


def test_frozen_evidence_binds_exact_bytes_even_if_json_meaning_is_unchanged(tmp_path):
    path = path_for(tmp_path, SHA)
    original = _bytes(_sidecar(age_years=24))
    path.write_bytes(original)
    expected = frozen_files(tmp_path, [SHA])[SHA]
    assert load(tmp_path, SHA, 16, 16, expected)["age_years"] == 24
    path.write_bytes(original + b"\n")
    with pytest.raises(EvidenceChanged, match="bytes"):
        load(tmp_path, SHA, 16, 16, expected)


@pytest.mark.parametrize("was_present", [False, True])
def test_frozen_sidecar_presence_cannot_change_during_run(tmp_path, was_present):
    path = path_for(tmp_path, SHA)
    if was_present:
        path.write_bytes(_bytes(_sidecar()))
    expected = frozen_files(tmp_path, [SHA])[SHA]
    if was_present:
        path.unlink()
    else:
        path.write_bytes(_bytes(_sidecar()))
    with pytest.raises(EvidenceChanged):
        load(tmp_path, SHA, 16, 16, expected)


def test_absent_frozen_sidecar_remains_missing_evidence(tmp_path):
    expected = frozen_files(tmp_path, [SHA])[SHA]
    assert expected == "missing"
    assert load(tmp_path, SHA, 16, 16, expected) == {}


@pytest.mark.parametrize("count,accepted", [(2, True), (64, True), (65, False)])
def test_lash_sidecar_point_limit_matches_engine_contract(count, accepted):
    trace = {"side": "right", "lower": False, "confidence": 1,
             "points": [[.2 + index / 1000, .3] for index in range(count)]}
    payload = _bytes(_sidecar(observed_lashes=[trace]))
    if accepted:
        parsed = parse(payload, image_sha256=SHA, width=16, height=16)
        assert len(parsed["observed_lashes"][0]["points"]) == count
    else:
        with pytest.raises(ValueError, match="point count"):
            parse(payload, image_sha256=SHA, width=16, height=16)


@pytest.mark.parametrize("component", ["python", "max_side", "numpy", "pillow", "opencv"])
def test_runtime_identity_changes_checkpoint_identity(tmp_path, monkeypatch, component):
    versions = {"numpy": "2.5.4", "Pillow": "11.0.0", "opencv-python-headless": "4.12.0"}
    monkeypatch.setattr(runner.platform, "python_version", lambda: "3.12.1")
    monkeypatch.setattr(runner.importlib.metadata, "version", versions.__getitem__)
    monkeypatch.setattr(runner.realface_lib, "MAX_SIDE", 640)
    initial = runner.runtime_identity()
    with Journal(tmp_path, {**_plan(), "runtime": initial}):
        pass
    if component == "python":
        monkeypatch.setattr(runner.platform, "python_version", lambda: "3.12.2")
    elif component == "max_side":
        monkeypatch.setattr(runner.realface_lib, "MAX_SIDE", 512)
    else:
        key = {"numpy": "numpy", "pillow": "Pillow", "opencv": "opencv-python-headless"}[component]
        versions[key] += ".changed"
    changed = runner.runtime_identity()
    assert digest(initial) != digest(changed)
    with pytest.raises(ValueError, match="different"):
        with Journal(tmp_path, {**_plan(), "runtime": changed}):
            pass


def test_source_fingerprint_includes_consumed_json_and_ignores_cache(tmp_path, monkeypatch):
    engine = tmp_path / "api" / "plumb_api" / "engines"
    engine.mkdir(parents=True)
    python = engine / "geometry.py"
    contour = engine / "contours.json"
    python.write_text("VALUE = 1\n")
    contour.write_text('{"contour":[1,2]}')
    monkeypatch.setattr(runner, "ROOT", tmp_path)
    monkeypatch.setattr(runner, "REALFACE", tmp_path / "tests" / "realface")
    initial = runner.source_hash()
    contour.write_text('{"contour":[1,3]}')
    changed_json = runner.source_hash()
    assert changed_json != initial
    python.write_text("VALUE = 2\n")
    changed_python = runner.source_hash()
    assert changed_python != changed_json
    cache = engine / "__pycache__"
    cache.mkdir()
    (cache / "ignored.json").write_text('{"generated":true}')
    assert runner.source_hash() == changed_python


@pytest.fixture
def small_runner(tmp_path, monkeypatch):
    faces = tmp_path / "faces"
    evidence = tmp_path / "evidence"
    output = tmp_path / "checkpoint"
    faces.mkdir()
    evidence.mkdir()
    photo = faces / "mathematical.png"
    pixels = np.arange(16 * 16 * 3, dtype=np.uint8).reshape(16, 16, 3)
    Image.fromarray(pixels).save(photo)
    sha = hashlib.sha256(photo.read_bytes()).hexdigest()
    sidecar = path_for(evidence, sha)
    original = _bytes(_sidecar(sha, age_years=24))
    sidecar.write_bytes(original)
    face = runner.realface_lib.Face(photo, "synthetic", "test-only", "", gender="female", age="20-29", row={})
    selected = [face]
    monkeypatch.setattr(runner, "EXPECTED_SETS", {"frozen-10000": 1})
    monkeypatch.setattr(runner.realface_lib, "discover", lambda *_args: selected)
    monkeypatch.setattr(runner.face_set, "select_shards", lambda values, _shards: values)
    monkeypatch.setattr(runner.lock_contract, "verify", lambda *_args: {"frozen": "synthetic-input"})
    monkeypatch.setattr(runner, "source_hash", lambda: "fixed-source")
    monkeypatch.setattr(runner, "runtime_identity", lambda: {"python": "test", "max_side": 640})
    monkeypatch.setattr(runner, "evaluate", lambda *_args: [_observation(feature) for feature in FEATURES])
    args = runner.parser().parse_args(["--faces", str(faces), "--evidence", str(evidence), "--output", str(output)])
    return SimpleNamespace(args=args, sidecar=sidecar, original=original, output=output, sha=sha, face=face)


@pytest.mark.parametrize("change_phase", ["before_consumption", "after_evaluation"])
def test_changed_sidecar_then_restored_bytes_cannot_resume_rejected_run(small_runner, monkeypatch, change_phase):
    case = small_runner
    changed = _bytes(_sidecar(case.sha, age_years=25))
    if change_phase == "before_consumption":
        original_load = runner.load

        def changed_load(*args, **kwargs):
            case.sidecar.write_bytes(changed)
            return original_load(*args, **kwargs)

        monkeypatch.setattr(runner, "load", changed_load)
    else:
        original_evaluate = runner.evaluate

        def changed_evaluate(*args, **kwargs):
            result = original_evaluate(*args, **kwargs)
            case.sidecar.write_bytes(changed)
            return result

        monkeypatch.setattr(runner, "evaluate", changed_evaluate)
    with pytest.raises(ValueError, match="changed"):
        runner.run(case.args)
    assert (case.output / "invalidated.json").is_file()
    assert not (case.output / "aggregate.json").exists()
    path = case.output / "observations.jsonl"
    if change_phase == "before_consumption":
        assert not path.exists()
    else:
        assert len(path.read_text().splitlines()) == 1
    case.sidecar.write_bytes(case.original)
    with pytest.raises(ValueError, match="invalidated"):
        runner.run(case.args)


def test_changed_runtime_then_restored_identity_cannot_reuse_completed_rows(small_runner, monkeypatch):
    current = {"max_side": 640}
    monkeypatch.setattr(runner, "runtime_identity", lambda: dict(current))

    def evaluate_with_changed_runtime(*_args):
        current["max_side"] = 512
        return [_observation(feature) for feature in FEATURES]

    monkeypatch.setattr(runner, "evaluate", evaluate_with_changed_runtime)
    with pytest.raises(ValueError, match="changed"):
        runner.run(small_runner.args)
    assert (small_runner.output / "invalidated.json").is_file()
    current["max_side"] = 640
    with pytest.raises(ValueError, match="invalidated"):
        runner.run(small_runner.args)


def test_final_verification_exception_invalidates_checkpoint_before_exit(small_runner, monkeypatch):
    calls = 0

    def verify(*_args):
        nonlocal calls
        calls += 1
        if calls > 1:
            raise ValueError("frozen lock is no longer valid")
        return {"frozen": "synthetic-input"}

    monkeypatch.setattr(runner.lock_contract, "verify", verify)
    with pytest.raises(ValueError, match="frozen"):
        runner.run(small_runner.args)
    assert (small_runner.output / "invalidated.json").is_file()
    monkeypatch.setattr(runner.lock_contract, "verify", lambda *_args: {"frozen": "synthetic-input"})
    with pytest.raises(ValueError, match="invalidated"):
        runner.run(small_runner.args)


def _label_csv(sha, *, monk="7"):
    return f"sha256,monk,face_size_px,yaw_degrees,occlusion\n{sha},{monk},180,4.5,glasses\n".encode()


def test_default_labels_join_uses_frozen_image_hash_and_binds_summary_and_map(small_runner, monkeypatch):
    case = small_runner
    labels = case.args.faces / "labels.csv"
    payload = _label_csv(case.sha)
    labels.write_bytes(payload)
    hashes = []
    original_hash = runner.file_hash

    def hash_once(path):
        hashes.append(path)
        assert hashes.count(path) == 1, "label joins must use the frozen image hash"
        return original_hash(path)

    captured = []

    def inspect_labels(_image, _mesh, _evidence, values):
        captured.append(values)
        return [_observation(feature) for feature in FEATURES]

    monkeypatch.setattr(runner, "file_hash", hash_once)
    monkeypatch.setattr(runner, "evaluate", inspect_labels)
    code, report = runner.run(case.args)
    assert code == 3
    assert len(captured) == 1 and hashes == [case.face.path]
    assert {name: captured[0][name] for name in ("monk", "size", "yaw", "occlusion")} == {
        "monk": "7", "size": "large_ge128", "yaw": "frontal", "occlusion": "glasses"}
    plan = json.loads((case.output / "plan.json").read_bytes())
    summary = plan["labels_sidecar"]
    assert summary["sha256"] == hashlib.sha256(payload).hexdigest()
    assert summary["matched_faces"] == summary["rows"] == 1
    assert plan["labels"][case.sha] == captured[0]
    expected = digest({"labels": plan["labels"], "labels_sidecar": summary})
    assert plan["labels_sha256"] == report["labels_sha256"] == expected
    assert report["labels_sidecar"] == summary
    assert str(labels) not in json.dumps(plan) + json.dumps(report)


def test_explicit_labels_path_overrides_default_without_reading_it(small_runner):
    case = small_runner
    (case.args.faces / "labels.csv").write_text("invalid default file")
    case.args.labels = case.args.faces.parent / "checked-reference.csv"
    case.args.labels.write_bytes(_label_csv(case.sha))
    _, report = runner.run(case.args)
    assert report["labels_sidecar"]["matched_faces"] == 1


def test_explicit_missing_labels_fail_instead_of_falling_back_to_default(small_runner):
    case = small_runner
    (case.args.faces / "labels.csv").write_bytes(_label_csv(case.sha))
    case.args.labels = case.args.faces.parent / "missing.csv"
    with pytest.raises(ValueError, match="cannot be read"):
        runner.run(case.args)
    assert not case.output.exists()


def test_absent_default_labels_are_bound_as_absent(small_runner):
    _, report = runner.run(small_runner.args)
    plan = json.loads((small_runner.output / "plan.json").read_bytes())
    assert plan["labels_sidecar"] is None and report["labels_sidecar"] is None
    assert plan["labels"][small_runner.sha]["monk"] == "unknown"
    assert report["labels_sha256"] == digest({"labels": plan["labels"], "labels_sidecar": None})


@pytest.mark.parametrize("change", ["changed", "deleted", "appeared"])
def test_labels_provenance_change_invalidates_even_after_original_state_restored(small_runner, monkeypatch, change):
    case = small_runner
    labels = case.args.faces / "labels.csv"
    original = _label_csv(case.sha)
    if change != "appeared":
        labels.write_bytes(original)

    def evaluate_with_labels_change(*_args):
        if change == "changed":
            labels.write_bytes(original + b"\n")
        elif change == "deleted":
            labels.unlink()
        else:
            labels.write_bytes(original)
        return [_observation(feature) for feature in FEATURES]

    monkeypatch.setattr(runner, "evaluate", evaluate_with_labels_change)
    with pytest.raises(ValueError, match="labels sidecar"):
        runner.run(case.args)
    assert (case.output / "invalidated.json").is_file()
    assert not (case.output / "aggregate.json").exists()
    if change == "appeared":
        labels.unlink()
    else:
        labels.write_bytes(original)
    with pytest.raises(ValueError, match="invalidated"):
        runner.run(case.args)


def test_changed_labels_with_same_meaning_cannot_resume_previous_checkpoint(small_runner):
    case = small_runner
    labels = case.args.faces / "labels.csv"
    payload = _label_csv(case.sha)
    labels.write_bytes(payload)
    runner.run(case.args)
    labels.write_bytes(payload + b"\n")
    with pytest.raises(ValueError, match="different"):
        runner.run(case.args)


@pytest.mark.parametrize("column", ["derived_monk", "derived_yaw_deg", "gender", "race"])
def test_derived_or_unregistered_reference_labels_fail_before_checkpoint(small_runner, column):
    case = small_runner
    labels = case.args.faces / "labels.csv"
    labels.write_text(f"sha256,{column}\n{case.sha},1\n")
    with pytest.raises(ValueError, match="derived|unregistered"):
        runner.run(case.args)
    assert not case.output.exists()


@pytest.mark.parametrize("manifest", [
    {"monk": "4"}, {"monk_tone": "4"}, {"size_slice": "small_lt64"},
    {"yaw_slice": "profile"}, {"occlusion": "none"},
])
def test_labels_cannot_override_direct_or_effective_manifest_labels(small_runner, manifest):
    case = small_runner
    case.face.row.update(manifest)
    (case.args.faces / "labels.csv").write_bytes(_label_csv(case.sha))
    with pytest.raises(ValueError, match="disagrees|conflicts"):
        runner.run(case.args)
    assert not case.output.exists()


@pytest.mark.parametrize("columns,values", [
    ("face_size_px,size_slice", "180,small_lt64"),
    ("yaw_degrees,yaw_slice", "4.5,profile"),
])
def test_reference_measurements_and_category_columns_must_agree(small_runner, columns, values):
    case = small_runner
    (case.args.faces / "labels.csv").write_text(f"sha256,{columns}\n{case.sha},{values}\n")
    with pytest.raises(ValueError, match="conflicts"):
        runner.run(case.args)
    assert not case.output.exists()


def test_unmatched_labels_do_not_fill_unknown_groups(small_runner):
    case = small_runner
    (case.args.faces / "labels.csv").write_bytes(_label_csv("f" * 64))
    _, report = runner.run(case.args)
    assert report["labels_sidecar"]["matched_faces"] == 0
    assert report["features"]["W59"]["groups"]["monk"]["unknown"]["faces"] == 1


@pytest.mark.parametrize("via_symlink", [False, True])
def test_reference_labels_cannot_reside_inside_repository(small_runner, via_symlink):
    case = small_runner
    if via_symlink:
        candidate = case.args.faces / "labels.csv"
        candidate.symlink_to(ROOT / "Makefile")
    else:
        case.args.labels = ROOT / "inside-labels.csv"
    with pytest.raises(ValueError, match="labels must remain outside"):
        runner.run(case.args)
    assert not case.output.exists()
