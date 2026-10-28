"""Performance report runs end to end on a small synthetic count.

The 100k and 500k figures in the hand-off note come from the perf command;
this test only checks the report is complete and its checks are sane.
Author: John Khan.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

from plumb_api.data_factory.cli import EXIT_OK, main
from plumb_api.data_factory.perf import measure, perf_report, render_perf


def test_measure_small_run() -> None:
    run = measure(3000, seed=4)
    assert run["records"] == 3000
    assert run["exact_duplicates_removed"] == 30
    assert run["near_duplicates_removed"] >= run["near_pairs_planted"] == 15
    assert run["manifest_rows"] == 3000 - run["near_duplicates_removed"]
    assert run["lock_problems"] == 0
    assert run["holdout_leaks"] == 10
    assert set(run["seconds"]) >= {"licence_filter", "near_dedup", "manifest_verify"}


def test_report_and_markdown() -> None:
    report = perf_report([500, 1000])
    text = render_perf(report)
    assert "| near_dedup |" in text and "1,000 records" in text
    assert "Author: John Khan." in text
    assert len(report["runs"]) == 2


def test_perf_command(tmp_path: Path) -> None:
    out = io.StringIO()
    assert main(["perf", "--records", "800", "--out", str(tmp_path)], out) == EXIT_OK
    assert json.loads((tmp_path / "perf.json").read_text())["runs"][0]["records"] == 800
    assert (tmp_path / "perf.md").is_file()
    assert out.getvalue().startswith("800 records:")
