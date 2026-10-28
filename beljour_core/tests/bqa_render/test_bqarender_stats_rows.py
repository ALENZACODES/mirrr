"""Statistics rules, row format, run context and the vectorised colour maths.

Synthetic numbers only; the colour test compares with the product's own scalar
functions. Author: John Khan.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pytest

from lab.bqa_render import colour, rows, stats
from lab.bqa_render.catalogue import owned
from plumb_api.engines.core import ciede2000, rgb_to_lab


def test_wilson_interval_matches_known_values() -> None:
    interval = stats.wilson(19, 20)
    assert interval.rate == pytest.approx(0.95)
    assert interval.low == pytest.approx(0.7639, abs=1e-3)
    assert interval.high == pytest.approx(0.9911, abs=1e-3)
    assert stats.wilson(0, 0).high == 1.0


def test_rate_status_rules() -> None:
    assert stats.rate_status(19, 19, 0.9) == "UNPROVEN"
    assert stats.rate_status(100, 100, 0.9) == "PASS"
    assert stats.rate_status(90, 100, 0.9) == "UNPROVEN"
    assert stats.rate_status(50, 100, 0.9) == "FAIL"


def test_zero_tolerance_and_required_rules() -> None:
    assert stats.zero_tolerance_status(1, 500) == "FAIL"
    assert stats.zero_tolerance_status(0, 19) == "UNPROVEN"
    assert stats.zero_tolerance_status(0, 20) == "PASS"
    assert stats.all_required_status(20, 21) == "FAIL"
    assert stats.worst(["PASS", "UNPROVEN", "FAIL"]) == "FAIL"
    assert stats.worst(["PASS", "NOT_APPLICABLE"]) == "NOT_APPLICABLE"


def test_percentile_and_groups() -> None:
    assert stats.percentile([1, 2, 3, 4, 5], 50) == 3
    assert math.isnan(stats.percentile([], 95))
    groups = stats.group_rows("mst_band", {"1-2": (40, 40), "9-10": (5, 20)}, 0.9)
    assert [g["status"] for g in groups] == ["PASS", "FAIL"]


def test_context_parsing_and_repo_guard(tmp_path: Path) -> None:
    ctx = rows.parse_context({"run_id": "r-1", "seed": 3, "work_dir": str(tmp_path)})
    assert ctx.seed == 3 and ctx.work_dir == tmp_path.resolve()
    with pytest.raises(ValueError, match="outside the repository"):
        rows.parse_context({"run_id": "r", "work_dir": str(rows.REPO_ROOT / "lab")})
    with pytest.raises(ValueError):
        rows.parse_context({"run_id": "has space"})
    with pytest.raises(ValueError):
        rows.parse_context({"run_id": "r", "seed": True})


def test_rows_validate_format_and_refuse_paths() -> None:
    ctx = rows.parse_context({"run_id": "r1"})
    spec = owned()["PRD-03"]
    row = rows.make_row(spec, ctx, "PASS", n=20, measured={"x": 1, "flag": True},
                        threshold={"tol": "required"}, reasons=["drawn_faces"])
    assert tuple(row) == rows.ROW_KEYS
    assert row["measured"] == {"x": 1.0, "flag": 1}
    with pytest.raises(ValueError):
        rows.make_row(spec, ctx, "PASS", note="see faces/a.png")
    with pytest.raises(ValueError):
        rows.make_row(spec, ctx, "MAYBE")
    with pytest.raises(ValueError):
        rows.make_row(spec, ctx, "PASS", measured={"x": "text"})
    with pytest.raises(ValueError):
        rows.make_row(spec, ctx, "PASS", reasons=["Not A Code"])


def test_error_row_names_the_exception() -> None:
    ctx = rows.parse_context({"run_id": "r1"})
    row = rows.error_row("VTO-01", ctx, KeyError("x"))
    assert row["status"] == "ERROR" and row["reason_codes"] == ["exception:KeyError"]


def test_vectorised_colour_matches_product_scalar_functions() -> None:
    rng = np.random.default_rng(7)
    a = rng.integers(0, 256, (40, 3))
    b = np.clip(a + rng.integers(-40, 41, (40, 3)), 0, 255)
    lab_a = colour.srgb_to_lab(a)
    lab_b = colour.srgb_to_lab(b)
    for i in range(len(a)):
        expected = rgb_to_lab([float(v) for v in a[i]])
        assert lab_a[i] == pytest.approx(expected, abs=0.05)
        de = ciede2000(list(lab_a[i]), list(lab_b[i]))
        assert colour.ciede2000(lab_a[i:i + 1], lab_b[i:i + 1])[0] == pytest.approx(de, abs=1e-6)
