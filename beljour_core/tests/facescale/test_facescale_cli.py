"""The command line end to end on drawn layouts, plus its refusals.

Every command runs from tmp_path; the repo is never a working folder.
Author: John Khan.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from lab.facescale import cli
from lab.facescale.merge import THRESHOLD_FORMAT
from lab.facescale.registry import REPO_ROOT
from lab.facescale.synthetic import all_layouts, sources_file


@pytest.fixture()
def box(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    monkeypatch.chdir(tmp_path)
    sources_file(tmp_path / "sources.local.json", all_layouts(tmp_path / "sets"))
    (tmp_path / "thresholds.json").write_text(json.dumps(
        {"format": THRESHOLD_FORMAT, "modules": {"landmarks": 0.5}, "default": 0.9}))
    return tmp_path


def _run_args(box: Path) -> list[str]:
    return ["--plan", str(box / "plan"), "--sources", str(box / "sources.local.json"),
            "--out", str(box / "out"), "--checker", "fake", "--side", "128",
            "--workers", "1", "--disk-floor", "1"]


def test_full_box_flow(box: Path, capsys: pytest.CaptureFixture[str]) -> None:
    sources = str(box / "sources.local.json")
    assert cli.main(["check-sources", "--sources", sources]) == 0
    assert "sources ok: enabled S01" in capsys.readouterr().out
    assert cli.main(["plan", "--sources", sources, "--out", str(box / "plan"),
                     "--shard-size", "10", "--guard-dir", str(box / "guard")]) == 0
    line = capsys.readouterr().out
    assert "27 items in 3 shards of 10" in line
    assert list((box / "guard").glob("plan-*.npy"))
    assert cli.main(["run-shard", *_run_args(box), "--index", "0"]) == 0
    assert "shard 0: done 10/10" in capsys.readouterr().out
    assert cli.main(["run", *_run_args(box), "--shards", "1:3"]) == 0
    assert "run done: 2 shards" in capsys.readouterr().out
    assert cli.main(["merge", "--results", str(box / "out"), "--thresholds",
                     str(box / "thresholds.json"), "--out-json", str(box / "merged.json"),
                     "--out-md", str(box / "merged.md"), "--plan", str(box / "plan")]) == 0
    assert "merged 3 shards, 27 items" in capsys.readouterr().out
    assert (box / "merged.md").read_text().startswith("# Facescale")
    assert cli.main(["report", "--merged", str(box / "merged.json"),
                     "--out-md", str(box / "again.md")]) == 0
    assert "report:" in capsys.readouterr().out
    assert cli.main(["kaggle-gen", "--plan", str(box / "plan"), "--sources", sources,
                     "--out", str(box / "kernels"), "--owner", "box-owner",
                     "--code-slug", "box-owner/code", "--plan-slug", "box-owner/plan"]) == 0
    assert "nothing was pushed" in capsys.readouterr().out


def test_second_plan_without_extend_is_refused(box: Path) -> None:
    sources = str(box / "sources.local.json")
    args = ["plan", "--sources", sources, "--out", str(box / "plan"), "--guard-dir",
            str(box / "guard")]
    assert cli.main(args) == 0
    assert cli.main(args) == 2
    assert cli.main([*args, "--extend"]) == 0


def test_output_inside_the_repo_is_refused(box: Path, capsys: pytest.CaptureFixture[str]) -> None:
    code = cli.main(["plan", "--sources", str(box / "sources.local.json"),
                     "--out", str(REPO_ROOT / "lab" / "plan_here")])
    assert code == 2 and "inside the repo" in capsys.readouterr().out
    assert not (REPO_ROOT / "lab" / "plan_here").exists()


def test_working_folder_inside_the_repo_is_refused(
    box: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.chdir(REPO_ROOT)
    assert cli.main(["check-sources", "--sources", str(box / "sources.local.json")]) == 2
    assert "working folder" in capsys.readouterr().out


def test_bad_sources_and_bad_shards_exit_non_zero(box: Path) -> None:
    (box / "bad.json").write_text("{}")
    assert cli.main(["check-sources", "--sources", str(box / "bad.json")]) == 2
    sources = str(box / "sources.local.json")
    assert cli.main(["plan", "--sources", sources, "--out", str(box / "plan"),
                     "--guard-dir", str(box / "guard")]) == 0
    assert cli.main(["run", *_run_args(box), "--shards", "5"]) == 2


def test_disk_floor_exit_code(box: Path) -> None:
    sources = str(box / "sources.local.json")
    assert cli.main(["plan", "--sources", sources, "--out", str(box / "plan"),
                     "--guard-dir", str(box / "guard")]) == 0
    args = _run_args(box)
    args[args.index("--disk-floor") + 1] = "999999T"
    assert cli.main(["run-shard", *args, "--index", "0"]) == 4


def test_index_ranges() -> None:
    assert cli._indexes("all", 3) == [0, 1, 2]
    assert cli._indexes("0,2:4", 5) == [0, 2, 3]


def test_module_entry_point_runs_from_outside_the_repo(box: Path) -> None:
    result = subprocess.run(
        [sys.executable, "-m", "lab.facescale", "check-sources", "--sources",
         str(box / "sources.local.json")],
        cwd=box, env={"PYTHONPATH": str(REPO_ROOT), "PATH": "/usr/bin:/bin"},
        capture_output=True, text=True, timeout=60, check=False)
    assert result.returncode == 0, result.stderr
    assert result.stdout.startswith("sources ok")
