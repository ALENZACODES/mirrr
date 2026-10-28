"""Offline metadata stress command contract and safe failure modes.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_cli import build_parser, execute, main
from lab.synth_diversity.stress_manifest import load_stress_header, verify_stress_manifest
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.types import SyntheticInputError
from lab.synth_diversity.writer import repository_root


def _plan_args(tmp_path: Path) -> list[str]:
    return ["plan", "--out", str(tmp_path / "fixture-manifest"), "--count", "44",
            "--seed", "29"]


def test_plan_command_writes_only_verified_metadata(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    argv = _plan_args(tmp_path)
    assert main(argv) == 0
    root = tmp_path / "fixture-manifest"
    assert verify_stress_manifest(root) == []
    output = json.loads(capsys.readouterr().out)
    assert output["operation"] == "plan"
    assert output["count"] == 44
    assert output["source_id"] == "S21"
    assert output["manifest"] == "stress.jsonl"
    assert output["train_allowed"] is False
    assert sorted(path.suffix for path in root.iterdir()) == [".json", ".jsonl"]


def test_cli_plan_is_reproducible_across_output_directories(tmp_path: Path) -> None:
    first = tmp_path / "one"
    second = tmp_path / "two"
    assert main(["plan", "--out", str(first), "--count", "40", "--seed", "5"]) == 0
    assert main(["plan", "--out", str(second), "--count", "40", "--seed", "5"]) == 0
    assert (first / "stress.jsonl").read_bytes() == (second / "stress.jsonl").read_bytes()
    assert (first / "stress-spec.json").read_bytes() == (second / "stress-spec.json").read_bytes()


def test_verify_command_returns_success_and_fails_on_mutation(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(_plan_args(tmp_path)) == 0
    capsys.readouterr()
    location = tmp_path / "fixture-manifest"
    assert main(["verify", "--dir", str(location)]) == 0
    assert json.loads(capsys.readouterr().out)["verified"] is True
    file = location / "stress.jsonl"
    file.write_bytes(file.read_bytes() + b"\n")
    assert main(["verify", "--dir", str(location)]) == 1
    output = json.loads(capsys.readouterr().out)
    assert output["verified"] is False
    assert output["errors"]


def test_coverage_command_has_synthetic_evidence_label(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(_plan_args(tmp_path)) == 0
    capsys.readouterr()
    assert main(["coverage", "--dir", str(tmp_path / "fixture-manifest")]) == 0
    result = json.loads(capsys.readouterr().out)
    assert result["input_coverage_status"] == "COVERED"
    assert result["fairness_performance_status"] == "NOT_EVALUATED"
    assert result["real_face_quality_status"] == "UNPROVEN"
    assert result["lane_g_mapping_status"] == "UNMAPPED"
    assert result["lane_g_group_counts"] == {}


def test_cli_accepts_exact_user_supplied_g_mapping(tmp_path: Path) -> None:
    bridge = SliceBridge({"fitzpatrick=VI": "Exact G VI", "head_covering=hijab": "Headwear"})
    mapping = tmp_path / "g-slices.json"
    mapping.write_text(json.dumps(bridge.as_dict()), encoding="utf-8")
    destination = tmp_path / "with-groups"
    argv = ["plan", "--out", str(destination), "--seed", "4", "--count", "45",
            "--lane-g-bridge", str(mapping)]
    assert main(argv) == 0
    assert load_stress_header(destination)["lane_g_bridge_sha256"] == bridge.digest
    assert main(["verify", "--dir", str(destination), "--lane-g-bridge", str(mapping)]) == 0
    assert main(["verify", "--dir", str(destination)]) == 1


def test_cli_refuses_unknown_mapping_source(tmp_path: Path) -> None:
    mapping = tmp_path / "bad.json"
    mapping.write_text('{"format":1,"source":"other","labels":{"age_band=70+":"old"}}')
    destination = tmp_path / "out"
    assert main(["plan", "--count", "40", "--seed", "2", "--out",
                 str(destination), "--lane-g-bridge", str(mapping)]) == 2
    assert not destination.exists()


def test_cli_refuses_unbounded_or_nonadult_schedule_counts(tmp_path: Path) -> None:
    destination = tmp_path / "out"
    for count in ("0", "12", "100001", "-1"):
        assert main(["plan", "--count", count, "--seed", "5", "--out", str(destination)]) == 2
        assert not destination.exists()


def test_cli_refuses_images_in_repository_output(tmp_path: Path) -> None:
    root = repository_root() / "must_never_create_synthetic_stress"
    assert main(["plan", "--count", "40", "--seed", "5", "--out", str(root)]) == 2
    assert not root.exists()
    assert not tuple(tmp_path.iterdir())


def test_cli_rejects_unknown_base_source_identifier(tmp_path: Path) -> None:
    parser = build_parser()
    with pytest.raises(SystemExit) as exc:
        parser.parse_args(["plan", "--count", "40", "--seed", "5", "--out",
                           str(tmp_path / "plan"), "--base-source-id", "PHOTO"])
    assert exc.value.code == 2


def test_cli_can_use_second_declared_synthetic_base_source(tmp_path: Path) -> None:
    destination = tmp_path / "plan"
    assert main(["plan", "--count", "40", "--seed", "5", "--out",
                 str(destination), "--base-source-id", "S05", "--base-id", "fixture_05"]) == 0
    header = load_stress_header(destination)
    assert header["base_id"] == "fixture_05"
    assert header["base_source_id"] == "S05"


def test_command_rejects_invalid_json_mapping_from_execute(tmp_path: Path) -> None:
    location = tmp_path / "invalid.json"
    location.write_text("[]", encoding="utf-8")
    parser = build_parser()
    argv = parser.parse_args(["verify", "--dir", str(tmp_path),
                              "--lane-g-bridge", str(location)])
    with pytest.raises(SyntheticInputError):
        execute(argv)


def test_cli_prints_no_image_or_face_file_names(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    assert main(_plan_args(tmp_path)) == 0
    result = capsys.readouterr()
    assert ".png" not in result.out
    assert ".jpg" not in result.out
    assert "image_path" not in result.out
    assert "landmarks" not in result.out
