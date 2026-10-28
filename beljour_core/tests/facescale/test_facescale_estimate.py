"""Run-time estimates from the cost model and from measured shard results.

Author: John Khan.
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path

import pytest

from lab.facescale import cli
from lab.facescale import estimate as ES
from lab.facescale.resume import atomic_write_json, shard_name
from lab.facescale.shards import Member, build_plan, save_plan

NOW = datetime.datetime(2026, 10, 25, 12, 0, tzinfo=datetime.UTC)


def test_model_estimate_for_two_million_faces() -> None:
    deadline = ES.parse_deadline("2026-10-29T18:00")
    core = ES.estimate(2_000_000, "core", 256, 12, NOW, deadline=deadline)
    assert core.basis == "MODEL"
    assert core.hours == pytest.approx(2_000_000 * (2.7439 + ES.OVERHEAD_S) / 12 / 3600, rel=1e-3)
    assert core.fits is False
    scale = ES.estimate(2_000_000, "scale", 256, 12, NOW, deadline=deadline)
    assert scale.fits is True and scale.hours < 10
    assert "America/Toronto" in scale.line() and "fits" in scale.line()
    assert ES.estimate(10, "scale", 256, 1, NOW).fits is None


def test_measured_rate_wins_over_the_model(tmp_path: Path) -> None:
    for i in range(2):
        atomic_write_json(tmp_path / shard_name(i),
                          {"complete": True, "tier": "scale", "working_side": 256,
                           "items": 1_000, "seconds_wall": 100.0, "budget": {"workers": 2}},
                          gz=True)
    atomic_write_json(tmp_path / shard_name(2), {"complete": True, "tier": "core",
                                                 "working_side": 256, "items": 5,
                                                 "seconds_wall": 9.0}, gz=True)
    result = ES.estimate(10_000, "scale", 256, 4, NOW, results=[tmp_path])
    assert result.basis == "measured" and result.seconds_per_face == pytest.approx(0.2)
    assert ES.measured_seconds([tmp_path], "full", 256) is None
    assert result.as_dict()["fits"] is None


def test_worker_parsing_and_refusals() -> None:
    assert ES.parse_workers("box=2,kaggle=10") == 12
    assert ES.parse_workers("7") == 7
    for bad in ("box=0", "box=x"):
        with pytest.raises(ES.EstimateError):
            ES.parse_workers(bad)
    with pytest.raises(ES.EstimateError):
        ES.estimate(1, "scale", 256, 0, NOW)
    with pytest.raises(ES.EstimateError):
        ES.parse_deadline("next friday")
    aware = ES.parse_deadline("2026-10-31T18:00:00+00:00")
    assert aware.utcoffset() == datetime.timedelta(0)


def test_cli_estimate(tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
                      capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.chdir(tmp_path)
    members = [Member(f"{n:064x}", "S01", f"{n}", "") for n in range(50)]
    save_plan(build_plan(members, shard_size=10), tmp_path / "plan")
    assert cli.main(["estimate", "--plan", str(tmp_path / "plan"), "--tier", "core",
                     "--workers", "box=2", "--deadline", "2026-12-31T00:00"]) == 0
    out = capsys.readouterr().out
    assert out.startswith("50 faces, core tier") and "MODEL" in out
    assert json.dumps({"ok": True})
