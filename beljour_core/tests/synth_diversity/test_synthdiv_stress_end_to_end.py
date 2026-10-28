"""End-to-end input-only stress workflow, never storing portrait images.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.stress_audit import audit_stress_manifest
from lab.synth_diversity.stress_cli import main
from lab.synth_diversity.stress_manifest import (
    iter_stress_rows,
    load_stress_header,
    verify_stress_manifest,
)
from lab.synth_diversity.stress_render import assert_render_contract, jobs_from_manifest
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.stress_spec import stress_case_from_row
from lab.synth_diversity.types import SyntheticInputError


def test_manifest_to_render_to_count_only_report_is_consistent(tmp_path: Path) -> None:
    folder = tmp_path / "metadata"
    study = StressSchedule(seed=25, count=40)
    assert main(["plan", "--count", "40", "--seed", "25", "--out", str(folder)]) == 0
    assert verify_stress_manifest(folder) == []
    assert load_stress_header(folder)["study_seed"] == study.seed
    case_rows = list(iter_stress_rows(folder))
    assert len(case_rows) == study.count
    assert [stress_case_from_row(row) for row in case_rows] == list(study.cases())
    base = make_drawn_face(seed=5, base_id="drawn_face")
    before_hash = hashlib.sha256(base.image.tobytes()).hexdigest()
    job = next(jobs_from_manifest(folder, {"drawn_face": base}))
    output = job.render()
    assert_render_contract(output, job.case)
    assert output.image.dtype == np.uint8
    assert hashlib.sha256(base.image.tobytes()).hexdigest() == before_hash
    audit = audit_stress_manifest(folder)
    assert audit.count == study.count
    assert audit.gaps() == ()
    assert audit.to_dict()["real_face_quality_status"] == "UNPROVEN"
    assert sorted(path.suffix for path in folder.iterdir()) == [".json", ".jsonl"]


def test_external_mapped_labels_stay_bound_across_all_steps(tmp_path: Path) -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "Lane G supplied deep", "acne=mild": "Mild acne"})
    mapping = tmp_path / "groups.json"
    mapping.write_text(json.dumps(bridge.as_dict()), encoding="utf-8")
    folder = tmp_path / "metadata"
    argv = ["plan", "--out", str(folder), "--count", "42", "--seed", "50",
            "--lane-g-bridge", str(mapping)]
    assert main(argv) == 0
    assert verify_stress_manifest(folder, bridge) == []
    assert load_stress_header(folder)["lane_g_bridge_sha256"] == bridge.digest
    records = list(iter_stress_rows(folder))
    assert any("Lane G supplied deep" in row["lane_g_groups"] for row in records)
    assert any("Mild acne" in row["lane_g_groups"] for row in records)
    report = audit_stress_manifest(folder, bridge).to_dict()
    assert set(report["lane_g_group_counts"]).issubset(set(bridge.mappings.values()))
    assert report["lane_g_mapping_status"] == "PARTIAL"
    assert report["fairness_performance_status"] == "NOT_EVALUATED"
    with pytest.raises(SyntheticInputError):
        next(jobs_from_manifest(folder, {"drawn_face": make_drawn_face()}))


def test_multiple_study_seeds_produce_distinct_rows_without_images(tmp_path: Path) -> None:
    first = tmp_path / "first"
    second = tmp_path / "second"
    assert main(["plan", "--count", "41", "--seed", "100", "--out", str(first)]) == 0
    assert main(["plan", "--count", "41", "--seed", "101", "--out", str(second)]) == 0
    ids_a = {row["case_id"] for row in iter_stress_rows(first)}
    ids_b = {row["case_id"] for row in iter_stress_rows(second)}
    assert not ids_a.intersection(ids_b)
    assert not any(path.suffix.lower() in {".png", ".jpg", ".jpeg"}
                   for directory in (first, second) for path in directory.iterdir())


def test_manifest_metadata_cannot_be_repurposed_for_training(tmp_path: Path) -> None:
    folder = tmp_path / "metadata"
    assert main(["plan", "--count", "40", "--seed", "6", "--out", str(folder)]) == 0
    for row in iter_stress_rows(folder):
        assert row["test_only"] is True
        assert row["train_allowed"] is False
        assert row["licence"] == "Own work, John Khan"
        assert row["source_id"] == "S21"
        assert row["base_source_id"] in ("S02", "S05")
        assert 18 <= row["age_years"] <= 80


def test_declared_traits_remain_reproducible_after_reverification(tmp_path: Path) -> None:
    folder = tmp_path / "metadata"
    assert main(["plan", "--count", "45", "--seed", "7", "--out", str(folder)]) == 0
    before = (folder / "stress.jsonl").read_bytes()
    assert verify_stress_manifest(folder) == []
    assert verify_stress_manifest(folder) == []
    after = (folder / "stress.jsonl").read_bytes()
    assert before == after
    cases = list(iter_stress_rows(folder))
    assert len({row["case_id"] for row in cases}) == 45
    assert set(row["profile"] for row in cases) == {
        profile.name for profile in StressSchedule(seed=7, count=45).required_profiles
    }
