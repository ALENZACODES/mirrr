"""Shard plans: exact membership, sizes, 2M timing, stable extension, storage.

Keys and hashes are synthetic; the 2M test measures planning time.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import time
from pathlib import Path

import numpy as np
import pytest

from lab.facescale import shards as P
from lab.facescale.loaders import loader_for
from lab.facescale.registry import load_local
from lab.facescale.synthetic import all_layouts, sources_file


def _members(n: int, source: str = "S01", start: int = 0) -> list[P.Member]:
    out = []
    for i in range(start, start + n):
        sha = hashlib.sha256(f"{source}:{i}".encode()).hexdigest()
        out.append(P.Member(sha, source, f"k{i:07d}.jpg", "gender=male"))
    return out


def test_every_member_lands_in_exactly_one_shard() -> None:
    plan = P.build_plan(_members(12_345), shard_size=1_000)
    seen = [m.sha for s in plan.shards for m in s.members]
    assert len(seen) == len(set(seen)) == 12_345
    assert [len(s.members) for s in plan.shards] == [1_000] * 12 + [345]
    assert [s.index for s in plan.shards] == list(range(13))
    assert plan.total == 12_345


def test_shard_count_gives_sizes_within_one_percent() -> None:
    plan = P.build_plan(_members(10_007), shard_count=10)
    sizes = [len(s.members) for s in plan.shards]
    assert len(sizes) == 10
    assert max(sizes) - min(sizes) <= 0.01 * max(sizes) + 1
    with pytest.raises(P.PlanError):
        P.build_plan(_members(5), shard_size=2, shard_count=2)
    with pytest.raises(P.PlanError):
        P.build_plan(_members(5), shard_count=0)


def test_plan_is_independent_of_input_order() -> None:
    members = _members(3_000)
    a = P.build_plan(members, shard_size=500)
    b = P.build_plan(list(reversed(members)), shard_size=500)
    assert a.plan_hash == b.plan_hash
    assert [s.member_hash for s in a.shards] == [s.member_hash for s in b.shards]


def test_duplicates_are_kept_once_and_counted() -> None:
    base = _members(10, "S07")
    copies = [P.Member(m.sha, "S08", m.key, "") for m in base[:4]]
    plan = P.build_plan(base + copies, shard_size=100)
    assert plan.total == 10
    assert plan.duplicates == {"S08->S07": 4}
    assert {m.source for s in plan.shards for m in s.members} == {"S07"}


def test_adding_a_source_keeps_old_shard_hashes() -> None:
    first = P.build_plan(_members(5_000, "S01"), shard_size=1_000)
    grown = P.build_plan(_members(5_000, "S01") + _members(2_500, "S04"), previous=first)
    assert [s.member_hash for s in grown.shards[:5]] == [s.member_hash for s in first.shards]
    assert [len(s.members) for s in grown.shards[5:]] == [1_000, 1_000, 500]
    assert {m.source for s in grown.shards[5:] for m in s.members} == {"S04"}
    assert grown.lineage == [first.plan_hash]
    assert grown.family() == {grown.plan_hash, first.plan_hash}
    with pytest.raises(P.PlanError):
        P.build_plan(_members(10), shard_count=3, previous=first)


def test_timing_two_million_keys_plan_in_under_30_seconds() -> None:
    shas = [hashlib.sha256(i.to_bytes(4, "big")).hexdigest() for i in range(2_000_000)]
    members = [P.Member(sha, "S06", f"{i:07d}", "") for i, sha in enumerate(shas)]
    started = time.perf_counter()
    plan = P.build_plan(members, shard_size=5_000)
    seconds = time.perf_counter() - started
    assert seconds < 30, f"planning 2M keys took {seconds:.1f} s"
    sizes = [len(s.members) for s in plan.shards]
    assert len(sizes) == 400 and set(sizes) == {5_000}
    assert sum(sizes) == 2_000_000


def test_labels_encode_and_decode() -> None:
    text = P.encode_labels({"race": "a;b", "gender": "x=y", "age": "20\t29"})
    assert text == "age=20_29;gender=x_y;race=a_b"
    assert P.decode_labels(text) == {"age": "20_29", "gender": "x_y", "race": "a_b"}
    assert P.decode_labels("") == {}
    assert P.Member("0" * 64, "S01", "k", "race=a;gender=b;age=c").group() == "a/b/c"


def test_save_and_load_round_trip(tmp_path: Path) -> None:
    plan = P.build_plan(_members(2_500), shard_size=1_000)
    header = P.save_plan(plan, tmp_path / "plan")
    assert header["shard_count"] == 3 and header["sources"] == {"S01": 2_500}
    assert P.read_header(tmp_path / "plan")["plan_hash"] == plan.plan_hash
    members = P.shard_members(tmp_path / "plan", 1)
    assert members == plan.shards[1].members
    back = P.load_plan(tmp_path / "plan")
    assert back.plan_hash == plan.plan_hash
    guard = np.load(tmp_path / "plan" / "guard.npy")
    assert guard.dtype == np.uint64 and len(guard) == 2_500
    with pytest.raises(P.PlanError, match="not in the plan"):
        P.shard_members(tmp_path / "plan", 3)


def test_tampered_members_file_is_refused(tmp_path: Path) -> None:
    plan = P.build_plan(_members(20), shard_size=10)
    P.save_plan(plan, tmp_path)
    P.write_members(P.members_path(tmp_path, 0), plan.shards[0].members[:-1])
    with pytest.raises(P.PlanError, match="do not match"):
        P.shard_members(tmp_path, 0)
    P.save_plan(plan, tmp_path)
    assert len(P.shard_members(tmp_path, 0)) == 10


def test_bad_plan_folder(tmp_path: Path) -> None:
    with pytest.raises(P.PlanError, match="cannot read"):
        P.read_header(tmp_path)
    (tmp_path / "plan.json").write_text('{"format": "other"}')
    with pytest.raises(P.PlanError, match="not a"):
        P.read_header(tmp_path)


def test_scan_plans_real_loaders_and_dedupes_across_sources(tmp_path: Path) -> None:
    local = load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets")))
    loaders = [loader_for(e) for e in local.values()]
    plan = P.build_plan(P.scan(loaders), shard_size=10)
    assert plan.total == 28 - 1
    assert plan.duplicates == {"S08->S04": 1}
    s01 = [m for s in plan.shards for m in s.members if m.source == "S01"]
    assert {m.group() for m in s01} == {"group_a/male/20-29", "group_b/female/30-39",
                                        "group_a/female/20-29", "group_c/male/40-49"}
