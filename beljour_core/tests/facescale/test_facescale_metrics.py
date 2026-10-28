"""Vectorised aggregation equals a per-row reference and is at least 10x faster.

The per-row reference lives here, written independently of metrics.py. The
benchmark runs on 200,000 synthetic rows.
Author: John Khan.
"""

from __future__ import annotations

import math
import time
from typing import Any

import numpy as np
import pytest

from lab.facescale import metrics as M


def _columns(n: int, seed: int = 3) -> dict[str, Any]:
    """Rows shaped like one shard: 23 modules, 4 checks, 3 sources, 30 groups."""
    rng = np.random.default_rng(seed)
    seconds = rng.exponential(0.2, n)
    seconds[rng.random(n) < 0.1] = np.nan
    return {
        "module": rng.integers(0, 23, n), "check": rng.integers(0, 4, n),
        "source": rng.integers(0, 3, n), "group": rng.integers(0, 30, n),
        "status": rng.choice(4, n, p=[0.8, 0.12, 0.05, 0.03]), "seconds": seconds,
        "names": ([f"m{i}" for i in range(23)], [f"c{i}" for i in range(4)],
                  [f"S{i:02d}" for i in range(3)], [f"g{i}" for i in range(30)]),
    }


def reference(cols: dict[str, Any]) -> dict[tuple[str, str, str, str], list[Any]]:
    """Plain per-row loop over the same columns."""
    names = cols["names"]
    out: dict[tuple[str, str, str, str], list[Any]] = {}
    rows = zip(cols["module"].tolist(), cols["check"].tolist(), cols["source"].tolist(),
               cols["group"].tolist(), cols["status"].tolist(), cols["seconds"].tolist(),
               strict=True)
    for m, c, s, g, status, sec in rows:
        key = (names[0][m], names[1][c], names[2][s], names[3][g])
        slot = out.get(key)
        if slot is None:
            slot = [[0, 0, 0, 0], 0.0, 0, [0] * M.NBINS]
            out[key] = slot
        slot[0][status] += 1
        if not math.isnan(sec):
            slot[1] += sec
            slot[2] += 1
            b = 0
            while b + 1 < M.NBINS and M.EDGES[b + 1] <= sec:
                b += 1
            slot[3][b] += 1
    return out


def _vector(cols: dict[str, Any]) -> dict[M.CellKey, M.Cell]:
    return M.reduce_columns(cols["module"], cols["check"], cols["source"], cols["group"],
                            cols["status"], cols["seconds"], cols["names"])


def test_vectorised_matches_reference_exactly() -> None:
    cols = _columns(20_000)
    fast, slow = _vector(cols), reference(cols)
    assert set(fast) == set(slow)
    for key, cell in fast.items():
        counts, total, timed, hist = slow[key]
        assert cell.counts.tolist() == counts
        assert cell.seconds_n == timed
        assert cell.seconds_sum == pytest.approx(total, rel=1e-9, abs=1e-12)
        assert cell.hist.tolist() == hist


def test_timing_vectorised_is_ten_times_faster_on_200k_rows() -> None:
    cols = _columns(200_000)
    started = time.perf_counter()
    slow = reference(cols)
    slow_s = time.perf_counter() - started
    best = math.inf
    for _ in range(3):
        started = time.perf_counter()
        fast = _vector(cols)
        best = min(best, time.perf_counter() - started)
    assert len(fast) == len(slow)
    assert slow_s / best >= 10, f"only {slow_s / best:.1f}x ({slow_s:.3f} s vs {best:.3f} s)"


def test_empty_columns_give_no_cells() -> None:
    empty = np.zeros(0, np.int64)
    assert M.reduce_columns(empty, empty, empty, empty, empty, np.zeros(0),
                            ([], [], [], [])) == {}


def test_histogram_percentiles_are_conservative_upper_edges() -> None:
    hist = np.zeros(M.NBINS, np.int64)
    bins = M.seconds_bins(np.array([0.05] * 50 + [2.0] * 50))
    np.add.at(hist, bins, 1)
    p50, p95 = M.hist_percentile(hist, 0.5), M.hist_percentile(hist, 0.95)
    assert p50 is not None and p95 is not None
    assert 0.05 <= p50 < 0.08
    assert 2.0 <= p95 < 2.8
    assert M.hist_percentile(np.zeros(M.NBINS, np.int64), 0.5) is None
    assert M.seconds_bins(np.array([np.nan, 0.0, 5e3])).tolist() == [-1, 0, M.NBINS - 1]


def test_cells_round_trip_and_merge() -> None:
    cols = _columns(5_000)
    cells = _vector(cols)
    key, cell = next(iter(cells.items()))
    back_key, back = M.Cell.from_list(cell.to_list(key))
    assert back_key == key
    assert back.counts.tolist() == cell.counts.tolist()
    assert back.hist.tolist() == cell.hist.tolist()
    total: dict[M.CellKey, M.Cell] = {}
    M.merge_cells(total, cells)
    M.merge_cells(total, cells)
    assert total[key].n == 2 * cell.n
    assert cells[key].n == cell.n


@pytest.mark.parametrize("raw", [
    ["m", "c", "s", "g", 1, 0, 0, 0, 0.0, 0, None, None, [99, 1]],
    ["m", "c", "s", "g", -1, 0, 0, 0, 0.0, 0, None, None, []],
    ["m", "c"],
])
def test_bad_cell_rows_are_refused(raw: list[Any]) -> None:
    with pytest.raises(ValueError):
        M.Cell.from_list(raw)


def test_accumulator_flushes_and_caps_failures() -> None:
    acc = M.Accumulator(failure_cap=2, flush_rows=10)
    for n in range(30):
        rows = [("gender", "check_0", M.FAIL, 0.1, "below"), ("gender", "check_1", M.PASS, 0.2, "")]
        acc.add_item(f"{n:064x}", "S01", "a/b/c", rows)
    cells = acc.result()
    assert cells[("gender", "check_0", "S01", "a/b/c")].counts.tolist() == [0, 30, 0, 0]
    assert cells[("gender", "check_1", "S01", "a/b/c")].seconds_n == 30
    failures = acc.failure_list()
    assert len(failures) == 2
    assert failures[0].face == "0" * 16 and failures[0].reason == "below"
    assert acc.faces == {"S01": 30}


def test_face_rows_take_the_worst_status_per_module() -> None:
    rows: list[M.ItemRow] = [
        ("a", "x", M.PASS, 0.1, ""), ("a", "y", M.FAIL, 0.2, "bad"),
        ("b", "x", M.REFUSED, math.nan, "mesh"), ("b", "y", M.PASS, 0.1, ""),
        ("c", "x", M.ERROR, 0.0, "exc"), ("c", "y", M.REFUSED, 0.0, "mesh"),
        ("d", "x", M.PASS, 0.5, ""),
    ]
    out = {r[0]: r for r in M.face_rows(rows)}
    assert out["a"][2] == M.FAIL and out["a"][4] == "bad"
    assert out["a"][3] == pytest.approx(0.3)
    assert out["b"][2] == M.REFUSED
    assert out["c"][2:4] == (M.ERROR, 0.0)
    assert out["d"][2] == M.PASS
    assert all(r[1] == M.FACE_CHECK for r in out.values())


def test_rate_summary_totals() -> None:
    acc = M.Accumulator()
    acc.add_item("f" * 64, "S01", "g", [("m", M.FACE_CHECK, M.PASS, 1.0, ""),
                                        ("m", "c", M.FAIL, 1.0, "r")])
    acc.add_item("e" * 64, "S02", "g", [("m", M.FACE_CHECK, M.FAIL, 2.0, "r")])
    summary = M.rate_summary(acc.result())
    assert summary["m"]["pass"] == 1 and summary["m"]["fail"] == 1
    assert summary["m"]["seconds"] == pytest.approx(3.0)
