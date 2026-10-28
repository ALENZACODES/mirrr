"""Shared fixtures for the bqa_core tests: a run context in tmp_path and row builders.

Everything here is synthetic; no face images, no real records.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from lab.bqa_core.registry import load_registry
from lab.bqa_core.results import make_row


@pytest.fixture
def context(tmp_path: Path) -> dict[str, object]:
    work = tmp_path / "work"
    work.mkdir()
    return {"run_id": "R-0001", "build": "a" * 40, "dataset_id": "GOLD-v1",
            "catalogue_snapshot": "CAT-2026-10", "trend_snapshot": "TRD-2026-10", "seed": 7,
            "work_dir": str(work), "now_utc": "2026-10-25T12:00:00Z"}


def synthetic_row(context: dict[str, object], key: str, status: str = "PASS",
                  **extra: object) -> dict[str, object]:
    """A valid row for a check key, synthetic values only."""
    row = make_row(context, load_registry().get(key), status, n=30,
                   measured={"rate": 0.9}, threshold={"rate_min": 0.8},
                   note="Synthetic row for a unit test.")
    row.update(extra)
    return row
