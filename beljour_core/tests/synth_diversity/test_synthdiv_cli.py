"""Offline synthetic-only command, seed reproducibility and refusal tests.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.__main__ import build_parser, main
from lab.synth_diversity.fixtures import make_drawn_face, save_drawn_fixture
from lab.synth_diversity.writer import verify_manifest


def test_cli_make_then_verify(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    input_dir = tmp_path / "bases"
    save_drawn_fixture(input_dir, make_drawn_face())
    output = tmp_path / "generated"
    assert main(
        ["make", "--bases", str(input_dir), "--count", "2", "--seed", "101", "--out", str(output)]
    ) == 0
    assert len((output / "manifest.jsonl").read_text().splitlines()) == 2
    assert verify_manifest(output) == []
    assert main(["verify", "--dir", str(output)]) == 0
    assert "verified" in capsys.readouterr().out


def test_cli_accepts_a_joint_pair_quota(tmp_path: Path) -> None:
    input_dir = tmp_path / "bases"
    save_drawn_fixture(input_dir, make_drawn_face())
    quota = tmp_path / "quota.json"
    quota.write_text(json.dumps({
        "pairs": [{
            "first": "fitzpatrick",
            "second": "vitiligo",
            "weights": {"VI|focal": 1},
        }],
    }))
    output = tmp_path / "out"
    assert main([
        "make", "--bases", str(input_dir), "--count", "1", "--seed", "45",
        "--out", str(output), "--quota", str(quota),
    ]) == 0
    row = json.loads((output / "manifest.jsonl").read_text())
    assert row["tags"]["fitzpatrick"] == "VI"
    assert row["tags"]["vitiligo"] == "focal"


def test_cli_rejects_bad_count(tmp_path: Path) -> None:
    with pytest.raises(SystemExit) as exc:
        main([
            "make", "--bases", str(tmp_path), "--count", "300", "--seed", "4",
            "--out", str(tmp_path / "generated"),
        ])
    assert exc.value.code == 2


def test_cli_parser_requires_full_make_arguments() -> None:
    parser = build_parser()
    arguments = parser.parse_args(
        ["make", "--bases", "synthetic", "--out", "output", "--count", "5", "--seed", "22"]
    )
    assert arguments.command == "make"
    assert arguments.count == 5
    assert arguments.seed == 22
