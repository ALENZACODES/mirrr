"""End-to-end pipeline runs on a drawn demo set: stages, resume, relock, holdout.

Author: John Khan.
"""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

import pytest

from plumb_api.data_factory import imaging
from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.hashing import sha256_file
from plumb_api.data_factory.holdout import FROZEN_LOCK_FORMAT, frozen_faces_hash
from plumb_api.data_factory.lockfile import read_lock, verify_lock
from plumb_api.data_factory.manifest import read_manifest
from plumb_api.data_factory.pipeline import Pipeline, RunResult, run_pipeline
from plumb_api.data_factory.report import build_report, write_report
from plumb_api.data_factory.stages import StageError


@pytest.fixture()
def demo(tmp_path: Path) -> DemoSet:
    return write_demo_set(tmp_path / "demo", distinct=10, size=256)


def statuses(result: RunResult) -> dict[str, str]:
    return {stage.name: stage.status for stage in result.stages}


def edit_config(demo: DemoSet, **changes: object) -> None:
    raw = json.loads(demo.config_path.read_text())
    raw.update(changes)
    demo.config_path.write_text(json.dumps(raw))


def write_frozen(folder: Path, hashes: list[str]) -> Path:
    faces = [{"face_id": f"t{i}", "sha256": h, "rel_path": f"{i}.png"}
             for i, h in enumerate(hashes)]
    folder.mkdir(parents=True)
    path = folder / "frozen.lock"
    path.write_text(json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": faces,
                                "faces_sha256": frozen_faces_hash(faces)}))
    return path


def test_full_run_matches_expectations(demo: DemoSet) -> None:
    result = run_pipeline(load_config(demo.config_path))
    assert [stage.name for stage in result.stages] == [
        "ingest", "licence", "exact_dedup", "quality", "near_dedup", "holdout", "balance",
        "manifest", "lock"]
    for stage in result.stages:
        assert stage.reject_reasons == demo.expected_rejects.get(stage.name, {}), stage.name
    assert len(result.items) == demo.expected_final
    assert result.lock_status == "created"
    assert result.manifest_path is not None and result.lock_path is not None
    assert verify_lock(result.lock_path) == []
    rows, summary = read_manifest(result.manifest_path)
    assert summary.count == demo.expected_final
    for row in rows:
        exported = demo.root / "out" / str(row.record.path)
        assert row.record.path is not None and row.record.path.startswith("images/")
        assert sha256_file(exported) == row.record.content_sha256
        assert imaging.metadata_keys(exported.read_bytes()) == []
        assert len(row.annotations["original_sha256"]) == 64
    # The lossless upload wins over its JPEG re-encode when scores tie.
    original = sha256_file(demo.root / "images" / "face-000.png")
    assert any(r.annotations["original_sha256"] == original for r in rows)
    json_path, md_path = write_report(build_report(result), demo.root / "out")
    report = json.loads(json_path.read_text())
    assert report["final_count"] == demo.expected_final and report["complete"]
    assert report["lock"]["status"] == "created"
    assert "| near_dedup | ran |" in md_path.read_text()
    assert str(demo.root) not in json_path.read_text()


def test_rerun_resumes_every_stage(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    first = run_pipeline(config)
    second = run_pipeline(config)
    assert all(status == "resumed" for name, status in statuses(second).items()
               if name not in {"manifest", "lock"})
    assert second.lock_status == "unchanged"
    assert second.lock_sha256 == first.lock_sha256


def test_interrupted_run_resumes_at_next_stage(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    partial = Pipeline(config, until="quality").run()
    assert partial.lock_path is None and len(partial.stages) == 4
    result = run_pipeline(config)
    state = statuses(result)
    assert [state[n] for n in ("ingest", "licence", "exact_dedup", "quality")] == ["resumed"] * 4
    assert state["near_dedup"] == "ran" and state["lock"] == "created"


def test_settings_change_reruns_only_later_stages(demo: DemoSet) -> None:
    first = run_pipeline(load_config(demo.config_path))
    edit_config(demo, near_dedup={"phash_threshold": 0, "dhash_threshold": 0})
    changed = load_config(demo.config_path)
    with pytest.raises(StageError, match="relock"):
        run_pipeline(changed)
    assert verify_lock(demo.root / "out" / "demo-set.lock") == []
    result = run_pipeline(changed, relock=True)
    state = statuses(result)
    # The refused run already rebuilt near_dedup; this run resumes it.
    assert state["quality"] == "resumed" and state["near_dedup"] == "resumed"
    assert result.lock_status == "relocked"
    lock = read_lock(demo.root / "out" / "demo-set.lock")
    assert lock["version"] == 2 and lock["parent_lock_sha256"] == first.lock_sha256
    assert (demo.root / "out" / "demo-set.lock.v1").is_file()
    assert len(result.items) > len(first.items)
    assert verify_lock(demo.root / "out" / "demo-set.lock") == []


def test_tampered_stage_file_is_rebuilt(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    run_pipeline(config)
    stage_file = config.work_dir / "stages" / "02-licence.jsonl"
    stage_file.write_text(stage_file.read_text().splitlines()[0] + "\n")
    state = statuses(run_pipeline(config))
    assert state["ingest"] == "resumed"
    assert state["licence"] == "ran"
    assert state["lock"] == "unchanged"


def test_from_stage_and_fresh(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    run_pipeline(config)
    state = statuses(run_pipeline(config, from_stage="near_dedup"))
    assert state["quality"] == "resumed" and state["near_dedup"] == "ran"
    assert all(s == "ran" for n, s in statuses(run_pipeline(config, fresh=True)).items()
               if n != "lock")
    with pytest.raises(ValueError):
        Pipeline(config, from_stage="nope")
    with pytest.raises(ValueError):
        Pipeline(config, until="lock")


def test_holdout_fail_and_drop(demo: DemoSet, tmp_path: Path) -> None:
    upload = sha256_file(demo.root / "images" / "face-004.png")
    write_frozen(tmp_path / "frozen" / "set-1000", [upload])
    edit_config(demo, holdout={"locks": [str(tmp_path / "frozen")], "on_leak": "fail"})
    with pytest.raises(StageError, match="frozen test"):
        run_pipeline(load_config(demo.config_path))
    assert not (demo.root / "out" / "demo-set.lock").exists()
    edit_config(demo, holdout={"locks": [str(tmp_path / "frozen")], "on_leak": "drop"})
    result = run_pipeline(load_config(demo.config_path))
    holdout = next(stage for stage in result.stages if stage.name == "holdout")
    assert holdout.reject_reasons == {"frozen-test-image": 1}
    assert holdout.stats["frozen_sets"] == ["set-1000"]
    assert len(result.items) == demo.expected_final - 1


def test_balance_stage_applies_quotas(demo: DemoSet) -> None:
    edit_config(demo, balance={"dimensions": ["lighting"], "per_cell": 1})
    result = run_pipeline(load_config(demo.config_path))
    assert len(result.items) == 5
    balance = next(stage for stage in result.stages if stage.name == "balance")
    assert balance.reject_reasons == {"over-quota-or-outside-targets": demo.expected_final - 5}
    assert balance.stats["shortfall_total"] == 0


def test_runs_in_two_folders_give_the_same_lock(tmp_path: Path) -> None:
    first = write_demo_set(tmp_path / "a", distinct=6, size=200)
    second = write_demo_set(tmp_path / "b", distinct=6, size=200)
    lock_a = read_lock(run_pipeline(load_config(first.config_path)).lock_path or Path())
    lock_b = read_lock(run_pipeline(load_config(second.config_path)).lock_path or Path())
    assert lock_a == lock_b


def test_no_strip_and_no_export(demo: DemoSet) -> None:
    edit_config(demo, strip_metadata=False, export_images=False)
    result = run_pipeline(load_config(demo.config_path))
    assert not (demo.root / "out" / "images").exists()
    rows, _ = read_manifest(result.manifest_path or Path())
    assert all(row.record.content_sha256 == row.annotations["original_sha256"] for row in rows)
    assert all(not str(row.record.path).startswith("images/") for row in rows)


def test_parallel_quality_stage_matches_single_process(tmp_path: Path) -> None:
    single = write_demo_set(tmp_path / "one", distinct=40, size=160)
    pooled = write_demo_set(tmp_path / "two", distinct=40, size=160)
    config_one = load_config(single.config_path)
    config_two = replace(load_config(pooled.config_path), workers=2)
    lock_one = read_lock(run_pipeline(config_one).lock_path or Path())
    lock_two = read_lock(run_pipeline(config_two).lock_path or Path())
    assert lock_one == lock_two


def test_stray_exports_are_removed(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    run_pipeline(config)
    stray = demo.root / "out" / "images" / "zz" / "stray.png"
    stray.parent.mkdir(parents=True)
    stray.write_bytes(b"x")
    run_pipeline(config)
    assert not stray.exists()


def test_failed_export_leaves_no_draft(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    first = run_pipeline(config)
    stored = Path(first.items[0].stored_path)
    stored.write_bytes(b"tampered after the quality stage")
    exported = demo.root / "out" / "images"
    for path in exported.rglob("*.png"):
        path.unlink()
    with pytest.raises(StageError, match="changed"):
        run_pipeline(config, from_stage="balance")
    assert not list((demo.root / "out").glob("*.next"))
    assert verify_lock(demo.root / "out" / "demo-set.lock") == []


def test_invalid_existing_lock_is_not_replaced(demo: DemoSet) -> None:
    config = load_config(demo.config_path)
    run_pipeline(config)
    lock = demo.root / "out" / "demo-set.lock"
    lock.write_text("{}")
    with pytest.raises(StageError, match="invalid"):
        run_pipeline(config)
    assert lock.read_text() == "{}"
