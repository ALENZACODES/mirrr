"""Drawn-image regressions for proportion and turn refusals in the runner.

Errors consume the preregistered face observation and never become a pass.
Author: John Khan.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.proportions.ratios import measure_checked
from plumb_api.engines.shape import turn, turn_pyramid
from plumb_api.engines.shape.turn_blend import support, with_blend
from plumb_api.vision.box_first import DetectionResult

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "tests" / "realface"))
import realface_lib as lib  # noqa: E402


@pytest.mark.parametrize("bad", [math.nan, math.inf, -math.inf, -0.01, 1.01])
def test_unsafe_weights_do_not_pass_the_guard(bad: float) -> None:
    weights = np.zeros((20, 20), dtype=np.float64)
    weights[10, 10] = bad
    assert not turn_pyramid.valid_weights(weights, weights.shape)


@pytest.mark.parametrize("invalid", [np.nan, np.inf, -np.inf])
def test_nonfinite_mesh_returns_a_typed_proportions_refusal(invalid: float) -> None:
    points = np.full((478, 2), invalid, dtype=np.float64)
    result = measure_checked(points)
    assert isinstance(result, Refusal)
    assert result.refused
    assert result.module == "proportions"
    assert result.code == "invalid_geometry"


def test_face_with_no_length_never_raises_out_of_checked_measurement() -> None:
    points = np.ones((478, 2), dtype=np.float64) * (100.0, 100.0)
    result = measure_checked(points)
    assert isinstance(result, Refusal)
    assert result.code in {"no_face_length", "no_face_width", "invalid_geometry"}
    assert result.message


@pytest.mark.parametrize("invalid", [math.nan, math.inf, -1.0, 2.0])
def test_unusable_protected_field_does_not_produce_a_turn(invalid: float) -> None:
    pixels = np.full((64, 64, 3), 85, dtype=np.uint8)
    face = np.ones((478, 3), dtype=np.float64)
    protection = np.zeros((64, 64), dtype=np.float64)
    protection[20, 21] = invalid
    record = turn.render_turn_checked(pixels, face, yaw=8, protected_mask=protection)
    assert isinstance(record, Refusal)
    assert record.refused
    np.testing.assert_array_equal(pixels, np.full_like(pixels, 85))


def test_low_signal_mask_clearance_never_creates_nonfinite_weights() -> None:
    # A degenerate or fully protected support is unavailable, not a fake edit.
    from plumb_api.engines.proportions.synthetic import symmetric_face

    face = symmetric_face(160, 160, face_width=85, face_length=120)
    protected = np.ones((160, 160), np.float32)
    region = support(160, 160, face, protected_mask=protected)
    assert np.isfinite(region.weights).all()
    assert not region.weights.any()
    amended = with_blend(region, 8.0)
    assert np.isfinite(amended.weights).all()
    assert not amended.weights.any()


def test_duplicate_mesh_is_a_refusal_row_not_an_exception(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch,
) -> None:
    source = np.full((160, 160, 3), 80, dtype=np.uint8)
    path = tmp_path / "drawn-only.png"
    Image.fromarray(source).save(path)
    malformed = np.zeros((478, 3), dtype=np.float64)

    class Detector:
        def __init__(self, _models: Path) -> None:
            pass

        def detect(self, _image: np.ndarray) -> DetectionResult:
            return DetectionResult(faces=[malformed])

    monkeypatch.setattr(lib, "Detectors", Detector)
    face = lib.Face(path, "drawn", "own", "main", row={"face_id": "artificial-refusal"})
    bench = lib.Bench(tmp_path, modules=("landmarks", "proportions", "warp_turn"))
    rows = bench.run(face)
    assert len(rows) == 3
    assert rows[0]["module"] == "landmarks" and not rows[0]["pass"]
    for row in rows[1:]:
        assert row["check"] == "refused"
        assert not row["pass"]
        assert isinstance(row["reason_code"], str)
    assert "exception" not in [row["check"] for row in rows]
