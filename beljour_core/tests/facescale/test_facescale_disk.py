"""Disk-budget guard with a fake disk-usage function.

Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.facescale import disk as D

GB = D.GB


def _usage(free: int) -> D.UsageFn:
    return lambda path: D.Usage(100 * GB, 100 * GB - free, free)


def test_start_refused_below_floor() -> None:
    D.DiskGuard([Path("/x")], 10 * GB, _usage(11 * GB)).check_start()
    with pytest.raises(D.DiskLow) as info:
        D.DiskGuard([Path("/x")], 10 * GB, _usage(9 * GB)).check_start()
    assert info.value.exit_code == 4


def test_write_that_would_cross_the_floor_is_refused() -> None:
    guard = D.DiskGuard([Path("/x")], 10 * GB, _usage(11 * GB))
    guard.check_write(Path("/x"), GB // 2)
    with pytest.raises(D.DiskLow, match="floor"):
        guard.check_write(Path("/x"), 2 * GB)


def test_plan_estimate_from_first_shard() -> None:
    guard = D.DiskGuard([Path("/x")], 10 * GB, _usage(20 * GB))
    need = guard.check_plan(Path("/x"), 1024**2, 400)
    assert need == int(1024**2 * 400 * D.PLAN_MARGIN)
    with pytest.raises(D.DiskLow):
        guard.check_plan(Path("/x"), 100 * 1024**2, 400)


def test_parse_size() -> None:
    assert D.parse_size("10G") == 10 * GB
    assert D.parse_size("512m") == 512 * 1024**2
    assert D.parse_size("2048") == 2048
    assert D.parse_size("1.5K") == 1536


def test_system_usage_walks_up_to_an_existing_folder(tmp_path: Path) -> None:
    usage = D.system_usage(tmp_path / "not" / "yet")
    assert usage.free > 0 and usage.total >= usage.free
