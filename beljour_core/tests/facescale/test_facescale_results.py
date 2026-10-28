"""Compact shard results: shape, no pixels, and under 1 MB for 5,000 faces.

Author: John Khan.
"""

from __future__ import annotations

import gzip
import json
import math
from pathlib import Path

import numpy as np
import pytest

from lab.facescale import results as RS
from lab.facescale.checkers import FULL_MODULES
from lab.facescale.metrics import FACE_CHECK, Accumulator, face_rows

META = RS.RunMeta("fs-1", "p" * 64, 400, 256, "full", tuple(FULL_MODULES), "fake")


def _accumulate(faces: int, seed: int = 9) -> Accumulator:
    rng = np.random.default_rng(seed)
    groups = [f"r{r}/g{g}/a{a}" for r in range(7) for g in range(2) for a in range(9)]
    acc = Accumulator(failure_cap=3)
    for n in range(faces):
        rows = []
        for module in FULL_MODULES:
            for check in range(4):
                status = int(rng.choice(4, p=[0.9, 0.06, 0.03, 0.01]))
                rows.append((module, f"check_{check}", status, float(rng.exponential(0.3)),
                             "" if status == 0 else f"{module}_reason_{check}"))
        rows.extend(list(face_rows(rows)))
        acc.add_item(f"{rng.integers(0, 2**63):064x}", ["S01", "S07"][n % 2],
                     groups[n % len(groups)], rows)
    return acc


def test_timing_full_tier_shard_of_5000_faces_is_under_1_mb() -> None:
    acc = _accumulate(5_000)
    body = RS.build_result(META, 7, "m" * 64, acc.result(), acc.failure_list(), acc.faces,
                           planned=5_000, complete=True)
    data = RS.encode(body)
    assert len(data) < 1_000_000, f"{len(data)} bytes"
    back = RS.check_result(json.loads(gzip.decompress(data)))
    assert back["items"] == 5_000 and back["complete"] is True
    cells = RS.cells_of(back)
    faces = sum(c.n for k, c in cells.items() if k[0] == "gender" and k[1] == FACE_CHECK)
    assert faces == 5_000
    assert len(RS.failures_of(back)) <= 3 * len(FULL_MODULES) * 126


def test_result_never_holds_pixel_like_arrays() -> None:
    acc = _accumulate(50)
    body = RS.build_result(META, 0, "m", acc.result(), acc.failure_list(), acc.faces,
                           planned=50, complete=True)
    keys = set(body) | set(body["cell_fields"])
    for word in ("pixels", "points", "embedding", "rgb", "image"):
        assert not any(word in key for key in keys)
    for failure in body["failures"]:
        assert len(failure[0]) == 16


def test_incomplete_when_counts_do_not_match() -> None:
    acc = _accumulate(10)
    body = RS.build_result(META, 0, "m", acc.result(), [], acc.faces, planned=11, complete=True)
    assert body["complete"] is False
    assert body["engine_hash"] == "unknown" and body["tier"] == "full"


@pytest.mark.parametrize("change", [{"format": "x"}, {"cells": "no"}, {"run_id": None}])
def test_check_result_refuses_bad_shapes(change: dict[str, object]) -> None:
    acc = _accumulate(3)
    body = RS.build_result(META, 0, "m", acc.result(), [], acc.faces, planned=3, complete=True)
    if change.get("run_id", 1) is None:
        body.pop("run_id")
    else:
        body.update(change)
    with pytest.raises(RS.ResultError):
        RS.check_result(body)


def test_duplicate_cells_and_bad_failures_are_refused() -> None:
    acc = _accumulate(3)
    body = RS.build_result(META, 0, "m", acc.result(), [], acc.faces, planned=3, complete=True)
    body["cells"].append(body["cells"][0])
    with pytest.raises(RS.ResultError, match="duplicate"):
        RS.cells_of(body)
    with pytest.raises(RS.ResultError):
        RS.failures_of({"failures": [["a", "b"]]})


def test_failure_rows_file_is_capped(tmp_path: Path) -> None:
    rows = [{"face": f"{n:016x}", "module": "m", "seconds": None} for n in range(10)]
    assert RS.write_failure_rows(tmp_path / "f.jsonl.gz", rows, 4) == 4
    lines = gzip.decompress((tmp_path / "f.jsonl.gz").read_bytes()).decode().splitlines()
    assert len(lines) == 4 and json.loads(lines[0])["face"] == "0" * 16


def test_engine_hashes_are_unknown_without_run_state(tmp_path: Path) -> None:
    assert RS.engine_hashes(tmp_path) == ("unknown", "unknown")


def test_engine_hashes_use_run_state_public_helpers(tmp_path: Path) -> None:
    folder = tmp_path / "realface_fake"
    (folder / "pass_definitions").mkdir(parents=True)
    (folder / "pass_definitions" / "a.json").write_text("{}")
    (folder / "run_state.py").write_text(
        '"""Stand-in. Author: John Khan."""\n'
        "def code_hash(repo):\n    return 'engine-1'\n"
        "def file_hash(path):\n    return 'f-' + path.name\n"
        "def digest(value):\n    return 'd-' + str(len(value))\n")
    engine, definition = RS.engine_hashes(folder, repo=tmp_path)
    assert engine == "engine-1" and definition == "d-1"
    assert not math.isnan(0.0)
