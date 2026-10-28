"""Progress, ETA in Toronto time, and the shard rebalancer.

Author: John Khan.
"""

from __future__ import annotations

import datetime
from pathlib import Path

import pytest

from lab.facescale import progress as PG
from lab.facescale import rebalance as RB
from lab.facescale.resume import Checkpoint, atomic_write_json, save_checkpoint, shard_name

HEADER = {"plan_hash": "p2", "lineage": ["p1"], "total": 10_000,
          "shards": [{"index": i, "count": 1_000} for i in range(10)]}


def _done(folder: Path, index: int, machine: str, seconds: float, plan: str = "p2") -> None:
    atomic_write_json(folder / shard_name(index),
                      {"plan_hash": plan, "shard_index": index, "complete": True,
                       "items": 1_000, "machine": machine, "seconds_wall": seconds}, gz=True)


def test_rates_remaining_and_finish(tmp_path: Path) -> None:
    _done(tmp_path, 0, "box", 3_600.0)
    _done(tmp_path, 1, "box", 3_600.0, plan="p1")
    _done(tmp_path, 2, "kaggle-1", 1_800.0)
    _done(tmp_path, 3, "other", 10.0, plan="unrelated")
    (tmp_path / shard_name(4)).write_bytes(b"broken")
    save_checkpoint(tmp_path, Checkpoint("r", "p2", 5, {f"{n:064x}" for n in range(250)}))
    progress = PG.scan_progress([tmp_path], HEADER)
    assert progress.done == 3_000 and progress.partial == 250
    assert progress.remaining == 6_750
    assert progress.machines["box"].faces_per_hour == pytest.approx(1_000)
    assert progress.faces_per_hour == pytest.approx(3_000)
    assert progress.hours_left() == pytest.approx(2.25)
    now = datetime.datetime(2026, 10, 25, 12, 0, tzinfo=datetime.UTC)
    finish = progress.finish(now)
    assert finish is not None and finish.utcoffset() == datetime.timedelta(hours=-4)
    assert finish.hour == 10 and finish.minute == 15
    text = PG.describe(progress, now)
    assert "America/Toronto" in text and "kaggle-1" in text


def test_no_finished_shards_means_no_eta(tmp_path: Path) -> None:
    progress = PG.scan_progress([tmp_path], HEADER)
    assert progress.hours_left() is None
    assert "no ETA" in PG.describe(progress, datetime.datetime.now(datetime.UTC))


def test_rebalance_gives_faster_machines_more_shards() -> None:
    shards = {i: 1_000 for i in range(12)}
    plan = RB.assign(shards, {"box": 3_000.0, "kaggle-1": 1_000.0})
    assert sorted(plan["box"] + plan["kaggle-1"]) == list(range(12))
    assert len(plan["box"]) == 9 and len(plan["kaggle-1"]) == 3
    assert RB.makespan_hours(plan, shards, {"box": 3_000.0, "kaggle-1": 1_000.0}) == 3.0


def test_rebalance_refusals_and_remaining() -> None:
    with pytest.raises(RB.RebalanceError):
        RB.assign({0: 1}, {})
    with pytest.raises(RB.RebalanceError):
        RB.assign({0: 1}, {"a": 0.0})
    assert RB.remaining_shards(HEADER, [0, 1, 2]) == {i: 1_000 for i in range(3, 10)}
