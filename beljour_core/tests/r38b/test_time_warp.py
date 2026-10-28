"""BELJOUR Studio Play framebuffer time scan, synthetic-only regression tests.

The harness never opens a camera, imports a person photo or writes frames.
Author: John Khan.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np
import pytest
from numpy.typing import NDArray

from plumb_api.filters.artistic import ScanOptions, ScanState, TimeWarpScan

ROOT = Path(__file__).resolve().parents[3]
PARITY = ROOT / "parity" / "filters-timewarp.json"
U8 = NDArray[np.uint8]


def image(height: int = 9, width: int = 13, channels: int = 3, seed: int = 0) -> U8:
    values = np.arange(height * width * channels, dtype=np.uint32)
    out = (values * 11 + seed * 53 + 19) % 256
    return out.astype(np.uint8).reshape(height, width, channels)


@pytest.mark.parametrize("axis,direction,step", [
    ("horizontal", "forward", 1),
    ("horizontal", "reverse", 3),
    ("vertical", "forward", 2),
    ("vertical", "reverse", 5),
])
def test_only_the_next_strip_is_frozen(axis: str, direction: str, step: int) -> None:
    first = image()
    scan = TimeWarpScan(first, ScanOptions(axis=axis, direction=direction, step=step))
    observed = first.copy()
    extent = first.shape[0] if axis == "horizontal" else first.shape[1]
    frozen = 0
    frame_id = 1
    while scan.state != ScanState.COMPLETE:
        next_frame = image(seed=frame_id)
        count = min(step, extent - frozen)
        start = frozen if direction == "forward" else extent - frozen - count
        if axis == "horizontal":
            observed[start:start + count] = next_frame[start:start + count]
        else:
            observed[:, start:start + count] = next_frame[:, start:start + count]
        result = scan.advance(next_frame)
        frozen += count
        assert result.frozen == frozen
        assert result.progress == frozen / extent
        assert result.user_review_required is True
        assert result.real_faces_evaluated == 0
        np.testing.assert_array_equal(result.image, observed)
        np.testing.assert_array_equal(first, image())
        assert result.image is not first
        frame_id += 1
    assert result.state == ScanState.COMPLETE
    assert result.next_line is None
    with pytest.raises(RuntimeError, match="finished"):
        scan.advance(image(seed=100))


@pytest.mark.parametrize("channels", [3, 4])
def test_incoming_frame_is_not_retained(channels: int) -> None:
    original = image(channels=channels)
    scan = TimeWarpScan(original, ScanOptions(step=2))
    incoming = image(channels=channels, seed=3)
    one = scan.advance(incoming)
    incoming.fill(255)
    one.image.fill(0)
    later = scan.snapshot()
    assert np.any(later.image != 0)
    np.testing.assert_array_equal(later.image[:2], image(channels=channels, seed=3)[:2])
    np.testing.assert_array_equal(original, image(channels=channels))


def test_capture_is_bounded_and_cancel_restores_original() -> None:
    original = image(height=11, width=23, channels=4)
    scan = TimeWarpScan(original, ScanOptions(axis="vertical", step=7))
    assert scan.footprint_bytes == original.nbytes * 2
    scan.advance(image(height=11, width=23, channels=4, seed=3))
    cancelled = scan.cancel()
    assert cancelled.state == ScanState.CANCELLED
    assert cancelled.progress == 0
    np.testing.assert_array_equal(cancelled.image, original)
    with pytest.raises(RuntimeError, match="finished"):
        scan.advance(original)
    restarted = scan.restart()
    assert restarted.state == ScanState.READY
    np.testing.assert_array_equal(restarted.image, original)
    scan.advance(image(height=11, width=23, channels=4, seed=9))
    scan.dispose()
    assert scan.state == ScanState.DISPOSED
    assert scan.footprint_bytes == 0
    with pytest.raises(RuntimeError, match="disposed"):
        scan.snapshot()
    scan.dispose()


def test_preview_marker_never_changes_export_pixels() -> None:
    original = image()
    scan = TimeWarpScan(original, ScanOptions(direction="reverse", step=3))
    exact = scan.snapshot()
    marked = scan.snapshot(mark_line=True)
    assert not np.array_equal(exact.image, marked.image)
    np.testing.assert_array_equal(scan.snapshot().image, exact.image)
    scan.advance(image(seed=9))
    np.testing.assert_array_equal(scan.snapshot().image, scan.snapshot(mark_line=False).image)


@pytest.mark.parametrize("options", [
    ScanOptions(axis="diagonal"),  # type: ignore[arg-type]
    ScanOptions(direction="sideways"),  # type: ignore[arg-type]
    ScanOptions(step=0),
    ScanOptions(step=-1),
    ScanOptions(step=1.25),  # type: ignore[arg-type]
    ScanOptions(step=True),  # type: ignore[arg-type]
    ScanOptions(step=100),
])
def test_invalid_configurations_fail_closed(options: ScanOptions) -> None:
    with pytest.raises(ValueError):
        TimeWarpScan(image(), options)


@pytest.mark.parametrize("broken", [
    np.zeros((2, 2), dtype=np.uint8),
    np.zeros((2, 2, 2), dtype=np.uint8),
    np.zeros((2, 2, 3), dtype=np.float32),
    np.zeros((1, 5, 3), dtype=np.uint8),
    np.zeros((2000, 3000, 3), dtype=np.uint8),
])
def test_bad_initial_images_fail_closed(broken: NDArray[np.generic]) -> None:
    with pytest.raises(ValueError):
        TimeWarpScan(broken)


def test_wrong_incoming_geometry_and_type_are_rejected_without_consuming_progress() -> None:
    scan = TimeWarpScan(image())
    with pytest.raises(ValueError, match="shape"):
        scan.advance(image(width=14))
    with pytest.raises(ValueError):
        scan.advance(image().astype(np.int32))
    assert scan.frozen == 0
    assert scan.state == ScanState.READY


def test_max_size_guard_does_not_allocate_buffer() -> None:
    too_large = np.zeros((3000, 1800, 3), dtype=np.uint8)
    with pytest.raises(ValueError, match="pixels"):
        TimeWarpScan(too_large)


def test_completed_session_can_restart_after_final_partial_strip() -> None:
    initial = image(height=8, width=11)
    scan = TimeWarpScan(initial, ScanOptions(step=3))
    for i in range(3):
        result = scan.advance(image(height=8, width=11, seed=i + 1))
    assert result.state == ScanState.COMPLETE
    assert result.frozen == 8
    assert scan.restart().state == ScanState.READY
    assert scan.frozen == 0
    assert scan.advance(image(height=8, width=11, seed=8)).frozen == 3


def test_parity_manifest_is_reproducible() -> None:
    spec = importlib.util.spec_from_file_location(
        "timewarp_vectors", ROOT / "api" / "scripts" / "artistic" / "timewarp_vectors.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    expected = json.loads(PARITY.read_text(encoding="utf-8"))
    assert module.build() == expected
    assert expected["format"] == "beljour-timewarp/1"
    assert len(expected["cases"]) == 6


def test_alpha_is_frozen_only_in_captured_strips() -> None:
    first = image(height=8, width=9, channels=4)
    scan = TimeWarpScan(first, ScanOptions(axis="horizontal", step=3))
    later = image(height=8, width=9, channels=4, seed=2)
    result = scan.advance(later)
    np.testing.assert_array_equal(result.image[:3, :, 3], later[:3, :, 3])
    np.testing.assert_array_equal(result.image[3:, :, 3], first[3:, :, 3])


def test_benchmark_claims_are_source_bound_and_review_locked() -> None:
    import hashlib

    report_path = ROOT / "docs" / "artistic" / "studio_play" / "time_warp" / "BELJOUR_TIME_WARP_EVIDENCE.json"
    measured = json.loads(report_path.read_text(encoding="utf-8"))
    python_file = ROOT / "api" / "plumb_api" / "filters" / "artistic" / "time_warp.py"
    browser_file = ROOT / "web" / "src" / "filters" / "artistic" / "time-warp.ts"
    digest = hashlib.sha256(python_file.read_bytes() + browser_file.read_bytes()).hexdigest()
    assert measured["sourceFingerprintSha256"] == digest
    assert measured["released"] is False
    assert measured["userReviewRequired"] is True
    assert measured["consentRequired"] is True
    assert measured["realFacesEvaluated"] == 0
    assert len(measured["variants"]) == 3
    for row in measured["variants"]:
        assert row["coverTestGrade"] == "UNVERIFIED_TEMPORAL"
        assert row["reviewStatus"] == "draft"
        assert row["liveEnabled"] is False
        assert len(row["warmSamplesMs"]) == 7
        assert min(row["warmSamplesMs"]) > 0
        assert row["warmP50Ms"] > 0
        assert row["warmP95Ms"] > 0


def test_release_evidence_does_not_require_any_camera_or_real_face() -> None:
    assert PARITY.is_file()
    content = PARITY.read_text(encoding="utf-8")
    assert "synthetic_byte_parity_not_real_faces" in content
    assert "data:image" not in content
    assert "base64" not in content
    assert "\"realFacesEvaluated\": 0" in content
