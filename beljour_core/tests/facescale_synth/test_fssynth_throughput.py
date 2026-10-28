"""Tests for the throughput harness with fake detectors (no models, no network).

The fakes are module-level functions so worker processes can pickle them.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.facescale_synth.stress.canvas import U8
from lab.facescale_synth.stress.scene import SceneConfig
from lab.facescale_synth.stress.scoring import Detection
from lab.facescale_synth.stress.throughput import STAGES, run_throughput

CONFIG = SceneConfig(width=96, height=96, min_face_px=10.0)


def blind_detector(image: U8) -> list[Detection]:
    """Finds nothing."""
    del image
    return []


def whole_frame_detector(image: U8) -> list[Detection]:
    """Reports one box covering the whole frame."""
    height, width = image.shape[:2]
    return [Detection((0.0, 0.0, float(width), float(height)), float(np.mean(image)) / 255.0)]


def test_inline_run_reports_rates_and_stages() -> None:
    report = run_throughput(CONFIG, 1, 30, blind_detector, chunk=7)
    assert report.items == 30 and report.workers == 0
    assert report.items_per_second > 0
    assert set(report.stage_seconds) == set(STAGES)
    assert all(v >= 0 for v in report.stage_seconds.values())
    summary = report.to_json()["score"]
    assert isinstance(summary, dict) and summary["scenes"] == 30


def test_pool_run_matches_inline_counts() -> None:
    inline = run_throughput(CONFIG, 2, 24, whole_frame_detector, chunk=6)
    pooled = run_throughput(CONFIG, 2, 24, whole_frame_detector, chunk=6, workers=2)
    assert pooled.workers == 2
    assert pooled.tally.counts == inline.tally.counts
    assert pooled.tally.scenes == inline.tally.scenes == 24


def test_blind_detector_has_zero_recall() -> None:
    report = run_throughput(CONFIG, 3, 20, blind_detector)
    for row in report.tally.counts.get("size", {}).values():
        assert row[0] == 0 and row[2] == 0


def test_bad_arguments() -> None:
    with pytest.raises(ValueError):
        run_throughput(CONFIG, 1, -1, blind_detector)
    with pytest.raises(ValueError):
        run_throughput(CONFIG, 1, 5, blind_detector, chunk=0)
