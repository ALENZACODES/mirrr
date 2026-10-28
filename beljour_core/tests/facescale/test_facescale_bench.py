"""Synthetic speed proof: the runner shape is at least 10x the old shape.

The 10x target applies to the scale and core tiers. The time scale keeps the
modelled module costs small so the test takes seconds.
Author: John Khan.
"""

from __future__ import annotations

import pytest

from lab.facescale import bench as B
from lab.facescale.synthetic import draw_face


def test_timing_scale_and_core_tiers_are_ten_times_the_old_shape() -> None:
    result = B.run_bench(faces=16, time_scale=0.002, tiers=("scale", "core"))
    measured = result["measured"]
    assert measured["scale"]["ratio_vs_old"] >= 10, measured
    assert measured["core"]["ratio_vs_old"] >= 10, measured
    assert "scale" in B.format_bench(result)


def test_cost_model_matches_the_box_measurements() -> None:
    model = B.cost_model()
    assert model["old_640_full_s"] == pytest.approx(63.6, abs=0.1)
    assert model["new_256_s"]["scale"] < model["new_256_s"]["core"] < model["new_256_s"]["full"]
    assert 0.75 < model["filters_share_of_full_256"] < 0.9
    estimate = model["lane_b_once_per_face_ESTIMATE"]["shared_0.5"]
    assert estimate["filters_640_s"] < 52.1
    assert estimate["full_tier_640_s"] < model["old_640_full_s"]


def test_old_decode_and_per_row_aggregate() -> None:
    image = B.old_decode(draw_face(1, 900), 640)
    assert image.shape == (640, 640, 3)
    rows = [{"module": "m", "group": "g", "pass": True, "seconds": 0.5},
            {"module": "m", "group": "g", "pass": False, "seconds": None}]
    assert B.per_row_aggregate(rows) == {("m", "g"): [2.0, 1.0, 0.5]}
    with pytest.raises(ValueError):
        B.run_bench(faces=0)
