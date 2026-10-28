"""Command line: find (USE-01), list, scorecard and dashboard; run through a subprocess.

Author: John Khan.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from pathlib import Path

import pytest

from lab.bqa_core.cli import main, parse_thresholds
from lab.bqa_core.paths import REPO_ROOT


def test_find_prints_page_check_and_criteria(capsys: pytest.CaptureFixture[str]) -> None:
    """USE-01: python -m lab.bqa_core find <key or words>."""
    assert main(["find", "FND-01"]) == 0
    out = capsys.readouterr().out
    assert "FND-01  page 25  owner C18" in out
    assert "Pass: Launch gate" in out
    assert main(["find", "oxidation", "30"]) == 0
    assert "FND-03" in capsys.readouterr().out
    assert main(["find", "zzzz"]) == 1


def test_list_filters(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["list", "--owner", "C17"]) == 0
    assert capsys.readouterr().out.rstrip().endswith("40 checks")
    assert main(["list", "--kind", "h"]) == 0
    out = capsys.readouterr().out
    assert "SUM-01" in out and "MOD-01" not in out
    assert main(["list", "--suite", "fnd"]) == 0
    assert capsys.readouterr().out.rstrip().endswith("3 checks")


def test_run_scorecard_and_dashboard_subprocess(tmp_path: Path) -> None:
    """Stretch: one command runs every installed package and prints the scorecard.

    bqa_render runs in its smoke mode (bqa_render_limit=1) so the whole command stays
    under a minute; the per-package timeout is below the test's own timeout so the
    runner, not the test, stops a slow package and kills its worker.
    """
    env = dict(os.environ)
    env["PYTHONPATH"] = os.pathsep.join([str(REPO_ROOT), str(REPO_ROOT / "api")])
    work = tmp_path / "work"
    started = time.monotonic()
    done = subprocess.run(
        [sys.executable, "-m", "lab.bqa_core", "run", "--work-dir", str(work), "--build",
         "c" * 40, "--run-id", "R-cli", "--replays", "2", "--timeout", "120",
         "--threshold", "bqa_render_limit=1"],
        capture_output=True, text=True, cwd=tmp_path, env=env, timeout=300, check=False)
    assert done.returncode == 0, done.stderr
    assert time.monotonic() - started < 60, done.stdout
    assert "bqa_core: ok (40 rows" in done.stdout
    assert "# Scorecard for build" in done.stdout
    assert main(["scorecard", "--run-dir", str(work / "R-cli")]) == 0
    assert main(["dashboard", "--work-dir", str(work)]) == 0
    assert main(["dashboard", "--work-dir", str(tmp_path / "none")]) == 1


def test_threshold_pairs_parse() -> None:
    assert parse_thresholds(["bqa_render_limit=1", "ratio=0.5", "name=x"]) == {
        "bqa_render_limit": 1, "ratio": 0.5, "name": "x"}
    with pytest.raises(SystemExit):
        parse_thresholds(["no-equals"])
