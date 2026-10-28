"""Landmark error report and the symmetrisation tracking check.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from lab.bqa_render import lmk
from lab.bqa_render.bench import Bench, TortureCase
from lab.bqa_render.faces import FaceSpec, portrait
from lab.bqa_render.landmarks import REGIONS, mesh_pixels
from lab.bqa_render.rows import parse_context


def test_error_report_ranks_the_worst_cases() -> None:
    truth = {}
    guess = {}
    for i in range(30):
        mesh = mesh_pixels(portrait(f"synthetic-l{i}", tone=1 + i % 10).subject.geometry)
        truth[f"L{i:02d}"] = mesh
        guess[f"L{i:02d}"] = mesh + (i / 10.0)
    report = lmk.error_report(truth, guess, worst=5)
    assert report.n == 30 and [cid for cid, _ in report.worst][0] == "L29"
    assert set(report.p95) == set(REGIONS)
    missing = lmk.error_report(truth, {}, worst=3)
    assert missing.worst[0][1] == float("inf")


def test_lmk02_not_applicable_without_a_landmark_export() -> None:
    bench = Bench(parse_context({"run_id": "lmk"}), limit=1, variants=1)
    row = lmk.check_lmk02(bench)
    assert row["status"] == "NOT_APPLICABLE" and row["reason_codes"] == ["no_public_export"]


def test_products_follow_the_moved_side() -> None:
    bench = Bench(parse_context({"run_id": "lmk", "seed": 2}), limit=1, variants=1)
    case = TortureCase("synthetic-asym", FaceSpec(asymmetry=1.0, tone=4))
    for kind in lmk.TRACKED:
        ratio = lmk.tracking_ratio(bench, case, kind)
        assert ratio is not None and ratio >= lmk.TRACK_LOW, kind
    assert lmk.mesh_follows_asymmetry()
    assert np.isfinite(lmk.zone_centroid(bench.scene(case), "lid_left") or np.nan)
