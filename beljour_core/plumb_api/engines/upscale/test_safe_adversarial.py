"""Synthetic negative controls: hostile or malformed inputs to the guarded path.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from .safe import FaceSelection, SelectionRequired, safe_upscale
from .safe_tiles import AdmissionRefused, admit

IMAGE = np.full((24, 24, 4), 120, np.uint8)
MASK = np.zeros((24, 24), np.uint8)
MASK[6:18, 6:18] = 255


@pytest.mark.parametrize("image", [
    IMAGE.astype(np.float32), IMAGE[..., :2], IMAGE[..., 0], np.zeros((4, 4, 4), np.uint8),
    IMAGE.tolist(), None,
])
def test_malformed_images_are_refused(image: object) -> None:
    with pytest.raises(ValueError):
        safe_upscale(image, FaceSelection(MASK, True))  # type: ignore[arg-type]


@pytest.mark.parametrize("level", [0.9, 5.1, 2.25, float("nan"), float("inf"), True, "3", None])
def test_hostile_levels_are_refused(level: object) -> None:
    for name in ("detail_level", "lock_level"):
        with pytest.raises((ValueError, TypeError)):
            safe_upscale(IMAGE, FaceSelection(MASK, True), **{name: level})  # type: ignore[arg-type]


@pytest.mark.parametrize("scale", [1, 3, 8, 2.0, True, "2"])
def test_hostile_scales_are_refused(scale: object) -> None:
    with pytest.raises(ValueError):
        safe_upscale(IMAGE, FaceSelection(MASK, True), scale=scale)  # type: ignore[arg-type]


@pytest.mark.parametrize("confirmed", [1, "yes", None, np.True_])
def test_truthy_non_boolean_confirmation_is_refused(confirmed: object) -> None:
    with pytest.raises(SelectionRequired):
        safe_upscale(IMAGE, FaceSelection(MASK, confirmed))  # type: ignore[arg-type]


def test_mask_shape_and_dtype_tricks_are_refused() -> None:
    for mask in (MASK.T[:-1], MASK.astype(bool), MASK.astype(np.uint16), MASK[None], MASK.tolist()):
        with pytest.raises(SelectionRequired):
            safe_upscale(IMAGE, FaceSelection(mask, True))  # type: ignore[arg-type]


def test_strided_views_are_handled_without_reading_outside_them() -> None:
    wide = np.zeros((24, 48, 4), np.uint8)
    wide[:, ::2] = IMAGE
    view = wide[:, ::2]
    assert not view.flags.c_contiguous
    result = safe_upscale(view, FaceSelection(MASK, True))
    assert np.array_equal(result.image, safe_upscale(IMAGE, FaceSelection(MASK, True)).image)


@pytest.mark.parametrize("budget", [0, -1, 2**70, 1.5e9, True])
def test_hostile_budgets_are_refused(budget: object) -> None:
    with pytest.raises(AdmissionRefused):
        admit(100, 100, budget_bytes=budget)  # type: ignore[arg-type]


@pytest.mark.parametrize(("width", "height"), [(7, 100), (100, 7), (16_385, 10), (10.0, 10), (True, 10)])
def test_hostile_geometry_is_refused(width: object, height: object) -> None:
    with pytest.raises(AdmissionRefused):
        admit(width, height)  # type: ignore[arg-type]


def test_release_flag_must_be_boolean() -> None:
    with pytest.raises(ValueError, match="release"):
        safe_upscale(IMAGE, FaceSelection(MASK, True), release=1)  # type: ignore[arg-type]


def test_refusal_happens_before_the_output_is_allocated(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[object] = []
    real_empty = np.empty

    def watched(*args: object, **kwargs: object) -> np.ndarray:
        calls.append(args)
        return real_empty(*args, **kwargs)  # type: ignore[call-overload,no-any-return]

    monkeypatch.setattr(np, "empty", watched)
    big = np.zeros((2000, 2000, 4), np.uint8)
    with pytest.raises(AdmissionRefused):
        safe_upscale(big, FaceSelection(np.zeros((2000, 2000), np.uint8), True, no_face=True),
                     scale=4)
    assert calls == []
