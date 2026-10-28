"""A malicious or buggy future guard cannot edit another person or photo alpha.

Synthetic numeric colour blocks only; no captured faces. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from plumb_api.engines.concealer import CoverResult, CoverSession
from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.hair_palette import PalettePreview, apply_shade
from plumb_api.engines.menshair import HairAnchors, render_style_for_face
from plumb_api.engines.menshair.public_render import StyleRender


@dataclass
class UntrustedGuard:
    calls: int = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        self.calls += 1
        assert lock_level == 5.0
        before[...] = 0
        after[..., 3] = 0
        after[0:8, 0:8, :3] = 0
        return CoverDecision(after, 1.0, False)


def case() -> tuple[np.ndarray, np.ndarray, np.ndarray, HairAnchors]:
    img = np.empty((96, 96, 4), dtype=np.uint8)
    img[..., :3] = (111, 84, 68)
    img[..., 3] = 211
    hair = np.zeros((96, 96), dtype=np.uint8)
    hair[12:64, 20:76] = 255
    img[12:64, 20:76, :3] = (49, 32, 29)
    scalp = np.zeros((96, 96), dtype=np.uint8)
    scalp[40:59, 28:68] = 255
    img[40:59, 28:68, :3] = (160, 133, 108)
    head = HairAnchors.parse({
        "left_temple": (.28, .34),
        "right_temple": (.72, .34),
        "crown": (.5, .11),
        "left_ear": (.24, .59),
        "right_ear": (.76, .59),
        "nape": (.5, .83),
    })
    return img, hair, scalp, head


def check_boundary(before: np.ndarray, after: np.ndarray, hair: np.ndarray) -> None:
    assert np.array_equal(after[..., 3], before[..., 3])
    assert np.array_equal(after[hair == 0], before[hair == 0])
    assert np.array_equal(before[0:8, 0:8, :3], after[0:8, 0:8, :3])


def test_concealer_guard_cannot_change_original_alpha_or_nonhair_pixels() -> None:
    img, hair, scalp, head = case()
    original = img.copy()
    injected = UntrustedGuard()
    result = CoverSession().render(img, hair, scalp, landmarks=head, level=5.0, guard=injected)
    assert isinstance(result, CoverResult)
    check_boundary(original, result.image, hair)
    assert np.array_equal(img, original)
    assert injected.calls == 1


def test_palette_guard_cannot_change_original_alpha_or_nonhair_pixels() -> None:
    img, hair, _scalp, head = case()
    original = img.copy()
    injected = UntrustedGuard()
    result = apply_shade(img, hair, head, "natural-03-n", level=5.0, allow_lightening=True, guard=injected)
    assert isinstance(result, PalettePreview)
    check_boundary(original, result.image, hair)
    assert np.array_equal(img, original)
    assert injected.calls == 1


def test_mens_render_guard_cannot_change_original_alpha_or_nonhair_pixels() -> None:
    img, hair, _scalp, head = case()
    original = img.copy()
    injected = UntrustedGuard()
    result = render_style_for_face(img, hair, head, "local-low-fade", 5.0, guard=injected)
    assert isinstance(result, StyleRender)
    check_boundary(original, result.image, hair)
    assert np.array_equal(img, original)
    assert injected.calls == 1
