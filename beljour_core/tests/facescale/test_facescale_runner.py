"""End-to-end shard runs with FakeChecker: pool, resume, guards, adapter.

Plans are built from tiny drawn layouts in tmp_path. The realface adapter is
tested against a stand-in realface_lib module written into tmp_path.
Author: John Khan.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from lab.facescale import checkers as C
from lab.facescale import pool as PL
from lab.facescale import runner as RN
from lab.facescale.disk import DiskGuard, Usage
from lab.facescale.loaders import BytesOpener, FaceItem, FileOpener, loader_for
from lab.facescale.metrics import ERROR, FACE_CHECK, FAIL, PASS, REFUSED
from lab.facescale.registry import LocalSource, load_local
from lab.facescale.results import cells_of
from lab.facescale.resume import checkpoint_name, read_json, shard_name
from lab.facescale.shards import build_plan, save_plan, scan
from lab.facescale.synthetic import all_layouts, draw_face, sources_file

GB = 1024**3


def _setup(tmp_path: Path, shard_size: int = 10) -> tuple[Path, dict[str, LocalSource]]:
    local = load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets")))
    plan = build_plan(scan([loader_for(e) for e in local.values()]), shard_size=shard_size)
    save_plan(plan, tmp_path / "plan")
    return tmp_path / "plan", local


def _config(plan: Path, local: dict[str, LocalSource], out: Path, **kw: Any) -> RN.ShardConfig:
    budget = PL.plan_workers(4, 8 * GB, 200 * 1024**2, kw.pop("workers", 1))
    base: dict[str, Any] = {"plan_dir": plan, "index": 0, "out_dir": out, "sources": local,
                            "spec": C.fake_spec(), "tier": "scale", "side": 128,
                            "budget": budget, "chunk_size": 4}
    base.update(kw)
    return RN.ShardConfig(**base)


def test_runs_a_shard_and_writes_a_complete_result(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path)
    outcome = RN.run_shard(_config(plan, local, tmp_path / "out"))
    assert outcome.status == "done" and outcome.exit_code == 0
    assert outcome.items_done == outcome.items_planned == 10
    data = read_json(tmp_path / "out" / shard_name(0))
    assert data["complete"] is True and data["items"] == 10
    assert data["tier"] == "scale" and data["modules"] == ["landmarks", "regions"]
    assert data["working_side"] == 128 and data["budget"]["workers"] == 1
    cells = cells_of(data)
    faces = sum(c.n for k, c in cells.items() if k[0] == "landmarks" and k[1] == FACE_CHECK)
    assert faces == 10
    opened = sum(c.n for k, c in cells.items() if k[0] == "open" and k[1] == "decode")
    assert opened == 10
    assert "faces/s" in outcome.line()


def test_second_run_sees_the_shard_as_done(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path)
    RN.run_shard(_config(plan, local, tmp_path / "out"))
    again = RN.run_shard(_config(plan, local, tmp_path / "out"))
    assert again.status == "already-done" and again.exit_code == 0
    other = RN.run_shard(_config(plan, local, tmp_path / "out", run_id="fs-other"))
    assert other.status == "done"


def test_deadline_stop_then_resume_gives_identical_totals(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path, shard_size=27)
    whole = RN.run_shard(_config(plan, local, tmp_path / "whole"))
    assert whole.items_done == 27
    ticks = iter(range(10_000))

    def clock() -> float:
        return float(next(ticks))

    stopped = RN.run_shard(_config(plan, local, tmp_path / "part", deadline=6.0, clock=clock))
    assert stopped.status == "stopped-deadline" and stopped.exit_code == RN.EXIT_DEADLINE
    assert 0 < stopped.items_done < 27
    assert (tmp_path / "part" / checkpoint_name(0)).is_file()
    assert not (tmp_path / "part" / shard_name(0)).exists()
    resumed = RN.run_shard(_config(plan, local, tmp_path / "part"))
    assert resumed.status == "done" and resumed.items_done == 27
    assert not (tmp_path / "part" / checkpoint_name(0)).exists()
    a = read_json(tmp_path / "whole" / shard_name(0))
    b = read_json(tmp_path / "part" / shard_name(0))
    assert a["sources"] == b["sources"]
    assert sorted(r[:8] for r in a["cells"]) == sorted(r[:8] for r in b["cells"])


def test_disk_floor_refuses_to_start(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path)
    guard = DiskGuard([tmp_path], floor=10 * GB, usage=lambda p: Usage(100 * GB, 95 * GB, 5 * GB))
    from lab.facescale.disk import DiskLow

    with pytest.raises(DiskLow):
        RN.run_shard(_config(plan, local, tmp_path / "out", guard=guard))


def test_disk_floor_crossed_mid_run_stops_with_exit_4(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path, shard_size=27)
    free = iter([20 * GB, 20 * GB] + [GB] * 50)
    guard = DiskGuard([tmp_path], floor=10 * GB,
                      usage=lambda p: Usage(100 * GB, 0, next(free)))
    outcome = RN.run_shard(_config(plan, local, tmp_path / "out", guard=guard,
                                   checkpoint_items=4))
    assert outcome.status == "stopped-disk" and outcome.exit_code == RN.EXIT_DISK
    assert not (tmp_path / "out" / shard_name(0)).exists()


def test_failure_rows_file_is_written_when_asked(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path, shard_size=27)
    spec = C.fake_spec(fail_rate=0.5)
    RN.run_shard(_config(plan, local, tmp_path / "out", spec=spec, failure_rows_cap=5))
    path = tmp_path / "out" / "shard-00000.failures.jsonl.gz"
    assert path.is_file()


def test_spawn_pool_with_two_workers_matches_in_process(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path, shard_size=27)
    one = RN.run_shard(_config(plan, local, tmp_path / "one"))
    two = RN.run_shard(_config(plan, local, tmp_path / "two", workers=2))
    assert one.items_done == two.items_done == 27
    a, b = read_json(tmp_path / "one" / shard_name(0)), read_json(tmp_path / "two" / shard_name(0))
    assert sorted(r[:8] for r in a["cells"]) == sorted(r[:8] for r in b["cells"])
    assert b["budget"]["workers"] == 2


def test_modules_outside_the_tier_are_refused(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path)
    with pytest.raises(RN.RunError, match="outside the scale tier"):
        RN.run_shard(_config(plan, local, tmp_path / "out", modules=("filters",)))
    with pytest.raises(RN.RunError, match="realface module list"):
        RN.run_shard(_config(plan, local, tmp_path / "out", tier="full", modules=("nope",)))


def test_missing_source_is_refused(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path)
    with pytest.raises(RN.RunError, match="not enabled"):
        RN.run_shard(_config(plan, {}, tmp_path / "out"))


def test_run_id_is_deterministic() -> None:
    a = RN.derive_run_id("p", "scale", 256, ("landmarks",), "e", "c")
    assert a == RN.derive_run_id("p", "scale", 256, ("landmarks",), "e", "c")
    assert a != RN.derive_run_id("p", "core", 256, ("landmarks",), "e", "c")
    assert a.startswith("fs-")


def test_budget_uses_cores_minus_one_and_memory() -> None:
    mb = 1024**2
    assert PL.plan_workers(8, 15 * GB, 300 * mb).workers == 7
    small = PL.plan_workers(8, 2 * GB, 300 * mb, model_bytes=900 * mb)
    assert small.workers == 1 and small.by_memory == 1 and small.by_cores == 7
    assert PL.plan_workers(1, 64 * GB, mb).workers == 1
    assert PL.plan_workers(8, 64 * GB, mb, requested=2).workers == 2
    with pytest.raises(ValueError):
        PL.plan_workers(8, GB, mb, requested=0)
    assert PL.plan_workers(4, GB, mb).as_dict()["cores"] == 4


def test_meminfo_parsing(tmp_path: Path) -> None:
    info = tmp_path / "meminfo"
    info.write_text("MemTotal: 100 kB\nMemAvailable:   2048 kB\n")
    assert PL.mem_available(info) == 2048 * 1024
    assert PL.mem_available(tmp_path / "none") > 0
    assert PL.cpu_cores() >= 1


def test_measured_worker_estimate_is_reasonable() -> None:
    estimate = PL.measure_worker_bytes(C.fake_spec(), 256, samples=2)
    assert PL.BASE_PROCESS_BYTES < estimate < PL.BASE_PROCESS_BYTES + 200 * 1024**2


def test_run_one_counts_open_failures_and_checker_errors() -> None:
    checker = C.FakeChecker()
    checker.setup(None, 128, ("landmarks",))
    bad = PL.WorkItem("a" * 64, "S04", "k", "", BytesOpener(b"junk"))
    sha, source, group, rows, code = PL.run_one(checker, bad, 128)
    assert code == "open_corrupt" and rows[0][:3] == ("open", "decode", FAIL)
    assert rows[-1][1] == FACE_CHECK
    gone = PL.WorkItem("b" * 64, "S04", "k", "", FileOpener("/no/such/file.png"))
    assert PL.run_one(checker, gone, 128)[4] == "read_error"

    class Broken(C.FakeChecker):
        def run(self, item: FaceItem, image: np.ndarray) -> list[Any]:
            raise RuntimeError("boom")

    good = PL.WorkItem("c" * 64, "S04", "k", "race=a", BytesOpener(draw_face(1, 64)))
    rows = PL.run_one(Broken(), good, 128)[3]
    assert rows[0] == ("checker", "exception", ERROR, rows[0][3], "RuntimeError")
    assert math.isnan(rows[0][3])


def test_checker_is_built_once_per_worker() -> None:
    PL.init_worker(C.fake_spec(), None, 128, ("landmarks",))
    first = PL._CHECKER
    items = [PL.WorkItem(f"{n:064x}", "S04", "k", "", BytesOpener(draw_face(n, 64)))
             for n in range(5)]
    for chunk in PL.chunked(items, 2):
        PL.work_chunk(chunk)
    assert PL._CHECKER is first
    assert isinstance(first, C.FakeChecker) and first.setups == 1
    assert [len(c) for c in PL.chunked(items, 2)] == [2, 2, 1]


def test_fake_checker_is_deterministic_and_costs_scale_with_pixels() -> None:
    checker = C.FakeChecker(fail_rate=0.3, refuse_rate=0.1, error_rate=0.05)
    checker.setup(None, 256, C.tier_modules("core"))
    item = FaceItem("S01", "k", "d" * 64, {}, BytesOpener(b""))
    image = np.zeros((256, 256, 3), np.uint8)
    rows_a, rows_b = checker.run(item, image), checker.run(item, image)
    assert [r[:3] for r in rows_a] == [r[:3] for r in rows_b]
    statuses = set()
    for n in range(200):
        for module in C.CORE_MODULES:
            statuses.add(checker.outcome(f"{n:064x}", module, "c")[0])
    assert statuses == {PASS, FAIL, REFUSED, ERROR}
    assert C.module_cost("filters", 640) == pytest.approx(52.1)
    assert C.module_cost("filters", 256) < 0.5 * C.module_cost("filters", 640)
    assert C.module_cost("unknown_module", 640) == pytest.approx(C.OTHER_COST)


def test_tiers() -> None:
    assert C.tier_modules("scale") == ("landmarks", "regions")
    assert set(C.tier_modules("core")) == {"gender", "regions", "enhance", "warp_turn",
                                           "landmarks"}
    assert len(C.tier_modules("full")) == 23 and "filters" in C.tier_modules("full")
    with pytest.raises(ValueError):
        C.tier_modules("huge")


FAKE_LIB = '''"""Stand-in realface_lib for adapter tests. Author: John Khan."""
import os
from dataclasses import dataclass, field
from pathlib import Path

MAX_SIDE = int(os.environ.get("REALFACE_MAX_SIDE", "640"))
MODULES = ("landmarks", "regions", "gender")
BUILT = []


@dataclass
class Face:
    path: Path
    source: str
    licence: str
    slice: str
    race: str = ""
    gender: str = ""
    age: str = ""
    row: dict = field(default_factory=dict)


class Det:
    def boxes(self, rgb):
        return [1, 2] if rgb.shape[0] > 100 else [1]


class Bench:
    def __init__(self, models, modules):
        BUILT.append(tuple(modules))
        self.modules = modules
        self.det = Det()

    def run(self, face):
        assert Path(face.path).is_file()
        rows = [{"module": "landmarks", "check": "detect", "pass": True, "seconds": 0.01}]
        rows.append({"module": "regions", "check": "refused", "pass": False,
                     "reason_code": "mesh_flat"})
        rows.append({"module": "gender", "check": "exception", "pass": False,
                     "error": "ValueError: x"})
        rows.append({"module": "gender", "check": "identity", "pass": False, "seconds": True,
                     "race": face.race})
        return rows
'''


@pytest.fixture()
def fake_realface(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    import sys

    # import_realface sets these for worker processes; keep them out of this one,
    # and give back the real realface_lib and sys.path to later tests.
    monkeypatch.setenv("REALFACE_MAX_SIDE", "640")
    monkeypatch.setenv("OMP_NUM_THREADS", "4")
    monkeypatch.setattr(sys, "path", list(sys.path))
    monkeypatch.delitem(sys.modules, "realface_lib", raising=False)
    folder = tmp_path / "rf"
    folder.mkdir()
    (folder / "realface_lib.py").write_text(FAKE_LIB)
    return folder


def test_realface_adapter_with_stand_in_bench(fake_realface: Path, tmp_path: Path) -> None:
    checker = C.RealfaceBenchChecker(folder=str(fake_realface), scratch=str(tmp_path))
    checker.setup(tmp_path, 256, ("landmarks", "gender"))
    assert checker.lib is not None and checker.lib.MAX_SIDE == 256
    assert checker.lib.BUILT == [("landmarks", "gender")]
    image_path = tmp_path / "f.png"
    image_path.write_bytes(draw_face(1, 64, "PNG"))
    item = FaceItem("S01", "f.png", "e" * 64, {"race": "a", "gender": "unknown"},
                    FileOpener(str(image_path)))
    rows = checker.run(item, np.zeros((200, 200, 3), np.uint8))
    assert rows[0][:3] == ("detect", "faces_2", PASS)
    by_check = {r[1]: r for r in rows}
    assert by_check["detect"][2] == PASS and by_check["detect"][3] == 0.01
    assert by_check["refused"][2:3] == (REFUSED,) and by_check["refused"][4] == "mesh_flat"
    assert by_check["exception"][2] == ERROR
    assert by_check["identity"][2] == FAIL and math.isnan(by_check["identity"][3])
    container = FaceItem("S09", "000000001", "f" * 64, {}, BytesOpener(b""))
    rows = checker.run(container, np.zeros((50, 50, 3), np.uint8))
    assert rows[0][1] == "faces_1"
    assert list(tmp_path.glob("tmp*.png")) == []
    with pytest.raises(C.CheckerError, match="not in realface_lib.MODULES"):
        checker.setup(tmp_path, 256, ("filters",))
    with pytest.raises(C.CheckerError, match="models folder"):
        checker.setup(None, 256, ("landmarks",))
    with pytest.raises(C.CheckerError, match="setup"):
        C.RealfaceBenchChecker().run(item, np.zeros((1, 1, 3), np.uint8))


def test_bench_row_conversion() -> None:
    assert C.convert_bench_row({"module": "m", "check": "c", "pass": True, "seconds": 1})[2:] \
        == (PASS, 1.0, "")
    row = C.convert_bench_row({"module": "m", "check": "dependency_missing", "pass": False,
                               "reason_code": "image_unreadable"})
    assert row[2] == ERROR and row[4] == "image_unreadable"
    assert C.convert_bench_row({"module": "m", "check": "c", "pass": False})[4] == "c"
    assert C.face_bucket(0) == "faces_0" and C.face_bucket(7) == "faces_3plus"


def test_chunk_size_follows_the_tier() -> None:
    assert RN.chunk_for("scale") == 16
    assert RN.chunk_for("core") == 4
    assert RN.chunk_for("full") == 1
    assert RN.chunk_for("full", 8) == 8


def test_resumed_shard_keeps_earlier_wall_seconds(tmp_path: Path) -> None:
    plan, local = _setup(tmp_path, shard_size=27)
    ticks = iter(range(0, 100_000, 10))

    def clock() -> float:
        return float(next(ticks))

    first = RN.run_shard(_config(plan, local, tmp_path / "out", deadline=30.0, clock=clock))
    assert first.status == "stopped-deadline"
    partial = read_json(tmp_path / "out" / checkpoint_name(0))["partial"]
    assert partial["seconds_wall"] > 0
    RN.run_shard(_config(plan, local, tmp_path / "out", clock=clock))
    final = read_json(tmp_path / "out" / shard_name(0))
    assert final["seconds_wall"] > partial["seconds_wall"]
    assert final["items"] == 27
