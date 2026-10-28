"""R26E protected posture render and final-pixel inspection on drawn figures.

No photographs or faces; head masks are drawn regions. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.posture.identity import GuardDecision, IdentityLockUnavailable
from plumb_api.engines.posture.inspection import inspect_protected
from plumb_api.engines.posture.protected import (
    MAX_HEAD_SHARE,
    ProtectedRenderRefused,
    render_protected,
)
from plumb_api.engines.posture.synthetic import Figure, front_figure, side_figure

CASES = (
    ("lean", lambda: front_figure(lean=4, shoulder_drop=2)),
    ("uneven_shoulders", lambda: front_figure(shoulder_drop=4)),
    ("rounded_shoulders", lambda: side_figure(round_shoulder=12)),
    ("forward_head", lambda: side_figure(head_forward=8)),
    ("slouch", lambda: side_figure(slouch=8)),
    ("swayback", lambda: side_figure(sway=5)),
    ("pelvic_tilt", lambda: side_figure(belly=6)),
)


class EchoGuard:
    """Test double: returns the edited pixels with a fixed similarity."""

    def __init__(self, similarity: float) -> None:
        self.similarity = similarity
        self.calls = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        self.calls += 1
        return GuardDecision(after.copy(), self.similarity)


def head_of(figure: Figure) -> np.ndarray:
    """The drawn person above the shoulder line: a stand-in for a user's head marking."""
    points = figure.controls.points
    top = points["neck_base"][1] if figure.controls.view == "side" else min(
        points["right_shoulder"][1], points["left_shoulder"][1],
    )
    rows = np.arange(figure.image.shape[0])[:, None]
    return ((figure.person >= 0.5) & (rows < top - 2)).astype(np.float32)


@pytest.mark.parametrize(("fix", "make"), CASES)
def test_every_fix_keeps_head_and_background_bytes(fix: str, make) -> None:  # type: ignore[no-untyped-def]
    figure = make()
    head = head_of(figure)
    result = render_protected(figure.image, figure.person, head, figure.controls, fix, 5.0, guard=EchoGuard(0.99))
    report = inspect_protected(figure.image, result, head)
    assert report.passed, report.reasons
    assert report.head_changed == 0 and report.outside_band_changed == 0
    assert report.head_pixels == int((head >= 0.5).sum())
    assert not np.array_equal(result.image, figure.image)


def test_head_is_restored_even_when_the_user_lowers_the_lock() -> None:
    figure = side_figure(head_forward=8)
    head = head_of(figure)
    result = render_protected(
        figure.image, figure.person, head, figure.controls, "forward_head", 5.0,
        guard=EchoGuard(0.85), lock_level=1.0,
    )
    assert not result.guarded.identity_recovered
    assert result.head_pixels_restored > 0
    covered = head >= 0.5
    assert np.array_equal(result.image[covered], figure.image[covered])


def test_source_is_never_modified() -> None:
    figure = front_figure(lean=4)
    before = figure.image.copy()
    render_protected(figure.image, figure.person, head_of(figure), figure.controls, "lean", guard=EchoGuard(0.99))
    assert np.array_equal(figure.image, before)


def test_face_adjacent_fix_without_guard_fails_closed() -> None:
    figure = front_figure(lean=4)
    with pytest.raises(IdentityLockUnavailable):
        render_protected(figure.image, figure.person, head_of(figure), figure.controls, "lean")


@pytest.mark.parametrize(("mask", "code"), [
    (None, "head_mask_required"),
    (np.zeros((200, 160), np.float32), "empty_head_mask"),
    (np.ones((200, 160), np.float32), "oversized_head_mask"),
    (np.ones((100, 160), np.float32), "invalid_head_mask"),
    (np.full((200, 160), 2.0, np.float32), "invalid_head_mask"),
    (np.full((200, 160), np.nan, np.float32), "invalid_head_mask"),
    (np.ones((200, 160), np.int32), "invalid_head_mask"),
])
def test_missing_or_malformed_head_masks_are_refused(mask: object, code: str) -> None:
    figure = front_figure(shoulder_drop=4)
    with pytest.raises(ProtectedRenderRefused, match=code):
        render_protected(figure.image, figure.person, mask, figure.controls, "uneven_shoulders")


def test_head_share_limit_is_inclusive() -> None:
    figure = front_figure(shoulder_drop=4)
    limit = int(MAX_HEAD_SHARE * 200 * 160)
    mask = np.zeros((200, 160), np.float32)
    mask.reshape(-1)[:limit] = 1.0
    render_protected(figure.image, figure.person, mask, figure.controls, "uneven_shoulders")
    mask.reshape(-1)[limit] = 1.0
    with pytest.raises(ProtectedRenderRefused, match="oversized_head_mask"):
        render_protected(figure.image, figure.person, mask, figure.controls, "uneven_shoulders")


def test_inspection_catches_tampered_output() -> None:
    figure = front_figure(shoulder_drop=4)
    head = head_of(figure)
    result = render_protected(figure.image, figure.person, head, figure.controls, "uneven_shoulders")
    tampered = result.image.copy()
    tampered[0, 0] = 255 - tampered[0, 0]
    rows, cols = np.nonzero(head >= 0.5)
    tampered[rows[0], cols[0]] = 255 - tampered[rows[0], cols[0]]
    report = inspect_protected(figure.image, type(result)(
        tampered, result.guarded, result.plan, result.level, result.head_pixels, result.head_pixels_restored,
    ), head)
    assert set(report.reasons) == {"protected_head_changed", "outside_band_changed"}
    assert report.head_changed == 1 and report.outside_band_changed == 1


def test_inspection_reports_counts_only() -> None:
    figure = side_figure(slouch=8)
    head = head_of(figure)
    report = inspect_protected(
        figure.image, render_protected(figure.image, figure.person, head, figure.controls, "slouch"), head,
    ).to_json()
    assert set(report) == {
        "head_pixels", "head_changed", "outside_band_pixels", "outside_band_changed",
        "movement_px", "cap_px", "min_jacobian", "passed", "reasons",
    }
    assert all(isinstance(value, (int, float, bool, list)) for value in report.values())


def test_oversized_source_is_refused() -> None:
    with pytest.raises(ProtectedRenderRefused, match="invalid_source_image"):
        render_protected(np.zeros((4, 4, 3), np.uint8), np.zeros((4, 4), np.float32), None,
                         front_figure().controls, "lean")
