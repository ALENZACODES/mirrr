"""Tests for the C14 command line: every box command runs on temporary folders.

No network, no real faces; the box config uses invalid example hosts.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.cli import build_parser, main
from lab.facescale_synth.fairness.export import export_problems
from lab.facescale_synth.stress.stream import read_manifest


def _json_out(capsys: pytest.CaptureFixture[str]) -> dict[str, object]:
    text = capsys.readouterr().out
    start = text.index("{")
    value = json.loads(text[start:])
    assert isinstance(value, dict)
    return value


def test_parser_lists_every_group() -> None:
    parser = build_parser()
    for argv in (["stress", "write"], ["gan", "kernels"], ["fairness", "notes"]):
        with pytest.raises(SystemExit):
            parser.parse_args(argv)


def test_gan_plan_dry_run(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["gan", "plan", "--master", "3", "--count", "5000", "--shards", "8"]) == 0
    summary = _json_out(capsys)
    assert summary["distinct_seeds"] == 5000 and summary["items_per_shard_max"] == 625


def test_stress_dry_run_and_write(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    common = [
        "stress",
        "write",
        "--out",
        str(tmp_path / "sets"),
        "--master",
        "5",
        "--size",
        "64",
        "64",
    ]
    assert main([*common, "--total", "2000000", "--shards", "64", "--dry-run"]) == 0
    planned = _json_out(capsys)
    assert planned["items"] == 31_250 and planned["dry_run"] is True
    assert not (tmp_path / "sets").exists()
    assert main([*common, "--total", "6", "--format", "png"]) == 0
    written = _json_out(capsys)
    assert written["items"] == 6
    manifest = Path(str(written["folder"])) / "manifest.jsonl"
    assert len(list(read_manifest(manifest, "test"))) == 6


def test_refusals_exit_with_code_two(capsys: pytest.CaptureFixture[str]) -> None:
    inside = str(policy.REPO_ROOT / "lab" / "out")
    code = main(["stress", "write", "--out", inside, "--master", "1", "--total", "2"])
    assert code == 2
    assert "refused" in capsys.readouterr().err


def test_stress_audit(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["stress", "audit", "--master", "2", "--count", "200"]) == 0
    assert _json_out(capsys)["distinct"] == 200


def test_gan_kernels_from_box_config(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    box = tmp_path / "generator.box.json"
    box.write_text(
        json.dumps(
            {
                "format": "beljour-gen-box/1",
                "weights_url": "https://weights.example.invalid/net.pkl",
                "weights_sha256": "1" * 64,
                "code_repo": "https://code.example.invalid/gen.git",
                "code_commit": "2" * 40,
                "kernel_prefix": "beljour-gen-cli-",
            }
        )
    )
    argv = ["gan", "kernels", "--box-config", str(box), "--owner", "box-owner"]
    argv += ["--out", str(tmp_path / "kernels"), "--master", "4", "--count", "100", "--shards", "4"]
    assert main([*argv, "--only", "1,3"]) == 0
    result = _json_out(capsys)
    assert result == {"kernels": 2, "first": "beljour-gen-cli-001"}
    meta = json.loads(
        (tmp_path / "kernels" / "beljour-gen-cli-003" / "kernel-metadata.json").read_text()
    )
    assert meta["enable_gpu"] is False and meta["is_private"] is True


def _fairness_files(tmp_path: Path) -> tuple[list[str], Path]:
    assert (
        main(
            [
                "stress",
                "write",
                "--out",
                str(tmp_path / "sets"),
                "--master",
                "8",
                "--total",
                "80",
                "--size",
                "64",
                "64",
                "--portrait",
            ]
        )
        == 0
    )
    manifest = next((tmp_path / "sets").glob("*/manifest.jsonl"))
    rows = tmp_path / "rows.jsonl"
    with rows.open("w") as handle:
        for row in read_manifest(manifest, "test"):
            label = row["label"]
            assert isinstance(label, dict)
            band = label["faces"][0]["traits"]["fitzpatrick"]
            passed = band not in ("V", "VI")
            handle.write(
                json.dumps(
                    {
                        "content_hash": row["sha256"],
                        "module": "toy",
                        "check": "bright",
                        "passed": passed,
                        "reason": None if passed else "too_dark",
                    }
                )
                + "\n"
            )
    thresholds = tmp_path / "thresholds.json"
    thresholds.write_text(json.dumps({"format": "beljour-thresholds/1", "default": 0.9}))
    argv = [
        "--rows",
        str(rows),
        "--stress-manifest",
        str(manifest),
        "--thresholds",
        str(thresholds),
    ]
    argv += ["--families", "fitzpatrick", "--min-cell", "5"]
    return argv, tmp_path / "out"


def test_fairness_report_and_notes(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    argv, out = _fairness_files(tmp_path)
    capsys.readouterr()
    assert main(["fairness", "report", *argv, "--out", str(out)]) == 0
    counts = _json_out(capsys)
    assert isinstance(counts["cells"], int) and counts["cells"] == 6
    assert (out / "fairness-report.md").read_text().startswith("# Fairness slices")
    export = json.loads((out / "beljour-fairness.json").read_text())
    assert export_problems(export) == []
    lanes = tmp_path / "lanes.json"
    lanes.write_text(json.dumps({"format": "beljour-lane-map/1", "modules": {"toy": "A"}}))
    reasons = tmp_path / "reasons.json"
    reasons.write_text(json.dumps({"format": "beljour-reason-map/1", "reasons": {}}))
    box_only = tmp_path / "box-only" / "hashes.json"
    notes_argv = ["fairness", "notes", *argv, "--out", str(out / "n"), "--lanes", str(lanes)]
    notes_argv += ["--reasons", str(reasons), "--box-only", str(box_only)]
    assert main(notes_argv) == 0
    summary = _json_out(capsys)
    assert summary["lanes"] in (["A"], [])
    assert (out / "n" / "fix-notes.md").exists() and box_only.exists()


def test_contact_and_curriculum_commands(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    sheet = tmp_path / "debug" / "beard"
    assert (
        main(
            [
                "stress",
                "contact",
                "--family",
                "beard",
                "--out",
                str(sheet),
                "--size",
                "40",
                "--per-value",
                "2",
            ]
        )
        == 0
    )
    assert _json_out(capsys)["file"] == "beard.png"
    report = tmp_path / "report.json"
    report.write_text(
        json.dumps({"cells": [{"slice": [["beard", "full"]], "status": "FAIL", "n": 50}]})
    )
    out = tmp_path / "plan" / "curriculum.json"
    argv = ["stress", "curriculum", "--report", str(report), "--master", "3", "--count", "10"]
    assert main([*argv, "--out", str(out)]) == 0
    assert _json_out(capsys)["items"] == 10
    assert json.loads(out.read_text())["train_allowed"] is False
