"""Save versus preview, photo paths, mirroring, rotation and degraded uploads.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_render import outputs
from lab.bqa_render.adapters import Product
from lab.bqa_render.bench import Bench, TortureCase
from lab.bqa_render.faces import FaceSpec
from lab.bqa_render.rows import parse_context


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "out", "seed": 2}), limit=2, variants=1)


def test_png_round_trip_is_lossless_and_jpeg_is_not() -> None:
    rng = np.random.default_rng(1)
    image = rng.integers(0, 256, (32, 32, 3), dtype=np.uint8)
    assert np.array_equal(outputs.encode(image, "image/png", 1.0), image)
    assert not np.array_equal(outputs.encode(image, "image/jpeg", 0.5), image)


def test_lossless_save_matches_the_release_render() -> None:
    check = outputs.save_vs_preview(TortureCase("synthetic-o1", FaceSpec()),
                                    Product.of("lipstick"), "lossless", 2)
    assert check.deterministic and check.ok and check.mean_de == 0.0
    assert check.drag_drift < 2.0


def test_export_geometry_round_trips_quarter_turns() -> None:
    assert max(outputs.rotation_errors()) <= 1.0


def test_mirrored_render_flips_back_on_an_asymmetric_face() -> None:
    case = TortureCase("synthetic-o2", FaceSpec(asymmetry=1.0, marks=True))
    for kind in ("eyeshadow", "lipstick", "brow"):
        assert outputs.mirror_error(case, Product.of(kind), 2) <= outputs.MIRROR_DE


def test_compare_frames_resizes_and_measures() -> None:
    frame = np.full((16, 16, 3), 120, dtype=np.uint8)
    zone = np.ones((16, 16), dtype=bool)
    same = outputs.compare_frames([frame], [frame.copy()], zone)
    assert same == [0.0]
    big = np.full((32, 32, 3), 150, dtype=np.uint8)
    assert outputs.compare_frames([frame], [big], zone)[0] > 5
    with pytest.raises(ValueError):
        outputs.compare_frames([frame], [], zone)


def _result(outcome: str, harm: int = 0) -> outputs.UploadResult:
    return outputs.UploadResult("synthetic", "jpeg_q10", outcome, 1.0, harm)


def test_upload_rows_need_a_gate_for_below_standard(bench: Bench) -> None:
    clean = outputs.upload_row(bench, "PHO-03", [_result("standard")] * 20)
    assert clean["status"] == "PASS"
    below = outputs.upload_row(bench, "PHO-03", [_result("standard")] * 19 + [_result("below")])
    assert below["status"] == "NOT_APPLICABLE"
    reasons = below["reason_codes"]
    assert isinstance(reasons, list) and "no_public_export:upload_gate" in reasons
    harm = outputs.upload_row(bench, "PHO-03", [_result("standard", harm=3)] * 20)
    assert harm["status"] == "FAIL"


def test_upload_case_effect_ratio_on_a_mild_jpeg() -> None:
    case = TortureCase("synthetic-o3", FaceSpec())
    found = outputs.upload_case(case, outputs.UPLOADS[3], Product.of("blush"), 2)
    assert found.outcome == "standard" and found.harm_px == 0


def test_video_check_is_not_applicable_without_an_export(bench: Bench) -> None:
    row = outputs.check_vid03(bench)
    assert row["status"] == "NOT_APPLICABLE" and row["reason_codes"] == ["no_public_export"]


def test_photo_and_live_paths_are_reported_separately(bench: Bench) -> None:
    row = outputs.check_pho01(bench)
    measured = row["measured"]
    assert isinstance(measured, dict)
    assert {"photo_points", "live_points", "gap_points"} <= set(measured)
    assert row["triage_only"] is True
