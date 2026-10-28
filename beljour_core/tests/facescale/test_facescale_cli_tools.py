"""CLI tools end to end: sample, fix-notes, progress, dedupe-audit, calibrate,
rebalance and validate, on drawn layouts in tmp_path.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.facescale import cli
from lab.facescale.fixnotes import LANE_FORMAT
from lab.facescale.merge import THRESHOLD_FORMAT
from lab.facescale.synthetic import all_layouts, sources_file


@pytest.fixture()
def ran(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """A box folder with a plan, two runs at 256 and 128 px, and merged reports."""
    monkeypatch.chdir(tmp_path)
    sources = sources_file(tmp_path / "sources.local.json", all_layouts(tmp_path / "sets"))
    (tmp_path / "thresholds.json").write_text(json.dumps(
        {"format": THRESHOLD_FORMAT, "modules": {}, "default": 0.99}))
    assert cli.main(["plan", "--sources", str(sources), "--out", str(tmp_path / "plan"),
                     "--shard-size", "9", "--guard-dir", str(tmp_path / "guard")]) == 0
    for side in ("256", "128"):
        out = tmp_path / f"out{side}"
        assert cli.main(["run", "--plan", str(tmp_path / "plan"), "--sources", str(sources),
                         "--out", str(out), "--checker", "fake", "--tier", "core",
                         "--side", side, "--workers", "1", "--disk-floor", "1",
                         "--machine", f"m{side}"]) == 0
        assert cli.main(["merge", "--results", str(out), "--thresholds",
                         str(tmp_path / "thresholds.json"),
                         "--out-json", str(tmp_path / f"merged{side}.json")]) == 0
    return tmp_path


def test_sample_and_validate(ran: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["sample", "--plan", str(ran / "plan"), "--out", str(ran / "sample"),
                     "--per-stratum-max", "2", "--shard-size", "5"]) == 0
    assert "sample" in capsys.readouterr().out
    assert (ran / "sample" / "sample.json").is_file()
    assert cli.main(["validate", "--results", str(ran / "out256")]) == 0
    assert "3 of 3 shard results match" in capsys.readouterr().out
    bad = ran / "out256" / "shard-00000.json.gz"
    from lab.facescale.resume import atomic_write_json, read_json

    data = read_json(bad)
    data["tier"] = "huge"
    atomic_write_json(bad, data, gz=True)
    assert cli.main(["validate", "--results", str(ran / "out256")]) == 2


def test_fix_notes_progress_and_rebalance(ran: Path, capsys: pytest.CaptureFixture[str]) -> None:
    (ran / "lanes.json").write_text(json.dumps(
        {"format": LANE_FORMAT, "modules": {"gender": "C", "enhance": "B"}, "default": "A"}))
    assert cli.main(["fix-notes", "--merged", str(ran / "merged256.json"),
                     "--lanes", str(ran / "lanes.json"), "--out", str(ran / "notes")]) == 0
    assert "fix notes:" in capsys.readouterr().out
    assert sorted(p.name for p in (ran / "notes").iterdir())
    assert cli.main(["progress", "--plan", str(ran / "plan"), "--results",
                     str(ran / "out256")]) == 0
    text = capsys.readouterr().out
    assert "27 of 27 faces" in text and "m256" in text
    assert cli.main(["rebalance", "--plan", str(ran / "plan"), "--results", str(ran / "none"),
                     "--speeds", "box=300,kaggle=100", "--out", str(ran / "rebalance.json")]) == 0
    plan = json.loads((ran / "rebalance.json").read_text())
    assert sorted(plan["box"] + plan["kaggle"]) == [0, 1, 2]


def test_calibrate_and_dedupe(ran: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["calibrate", "--gate", str(ran / "merged256.json"),
                     "--fast", str(ran / "merged128.json"),
                     "--out-json", str(ran / "cal.json"), "--out-md", str(ran / "cal.md")]) == 0
    assert "calibration:" in capsys.readouterr().out
    assert (ran / "cal.md").read_text().startswith("# Facescale calibration")
    assert cli.main(["dedupe-audit", "--sources", str(ran / "sources.local.json"),
                     "--a", "S04", "--b", "S08", "--out", str(ran / "audit.json")]) == 0
    assert "S04 vs S08: 1 exact" in capsys.readouterr().out
    assert cli.main(["dedupe-audit", "--sources", str(ran / "sources.local.json"),
                     "--a", "S04", "--b", "S10"]) == 2
