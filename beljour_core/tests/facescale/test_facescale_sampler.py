"""Stratified sampler: per-stratum sizes, stability and the written sub-plan.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
from pathlib import Path

import pytest

from lab.facescale import sampler as SM
from lab.facescale.merge import MIN_N
from lab.facescale.shards import Member, build_plan, read_header, save_plan


def _members() -> list[Member]:
    out = []
    sizes = {("S01", "a/male/20-29"): 900, ("S01", "b/female/30-39"): 150,
             ("S07", "unknown/male/young"): 12}
    for (source, group), n in sizes.items():
        race, gender, age = group.split("/")
        for i in range(n):
            sha = hashlib.sha256(f"{source}{group}{i}".encode()).hexdigest()
            out.append(Member(sha, source, f"{i}.jpg", f"age={age};gender={gender};race={race}"))
    return out


def test_needed_n_and_half_width() -> None:
    n = SM.needed_n(0.03, 0.9)
    assert n == 385
    assert SM.half_width(n, 0.9) == pytest.approx(0.03, abs=0.002)
    assert SM.needed_n(0.4, 0.9) == MIN_N
    assert SM.half_width(0, 0.9) == 0.5
    for bad in ((0.0, 0.9), (0.03, 1.0)):
        with pytest.raises(SM.SampleError):
            SM.needed_n(*bad)


def test_sample_sizes_per_stratum() -> None:
    chosen, table = SM.sample(_members(), target_half_width=0.03, expected_rate=0.9)
    by = {(s.source, s.group): s for s in table}
    assert by[("S01", "a/male/20-29")].chosen == 385
    assert by[("S01", "b/female/30-39")].chosen == 150
    assert by[("S07", "unknown/male/young")].chosen == 12
    assert len(chosen) == 385 + 150 + 12
    summary = SM.summary(table)
    assert summary["strata"] == 3 and summary["strata_below_min"] == 1
    assert summary["worst_half_width"] > 0.03


def test_sample_is_stable_and_capped() -> None:
    a, _ = SM.sample(_members(), per_stratum_max=50)
    b, _ = SM.sample(list(reversed(_members())), per_stratum_max=50)
    assert [m.sha for m in a] == [m.sha for m in b]
    assert len(a) == 50 + 50 + 12
    with pytest.raises(SM.SampleError):
        SM.sample(_members(), per_stratum_max=0)


def test_write_sample_makes_a_runnable_plan(tmp_path: Path) -> None:
    save_plan(build_plan(_members(), shard_size=200), tmp_path / "plan")
    plan, body = SM.write_sample(tmp_path / "plan", tmp_path / "sample", shard_size=100,
                                 settings={"per_stratum_max": 40})
    header = read_header(tmp_path / "sample")
    assert header["total"] == 40 + 40 + 12 == plan.total
    assert body["parent_plan"] == read_header(tmp_path / "plan")["plan_hash"]
    assert (tmp_path / "sample" / "sample.json").is_file()
    assert len(body["strata"]) == 3
