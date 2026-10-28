"""New public men's short-sides render entry on synthetic head shapes."""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.menshair import HairAnchors, available_presets
from plumb_api.engines.menshair.public_render import RenderRefusal, StyleRender, render_style_for_face


@dataclass
class GuardSpy:
    calls: int = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        self.calls += 1
        assert lock_level == 5.0
        return CoverDecision(after.copy(), 1.0, False)


def anchors() -> HairAnchors:
    return HairAnchors.parse({
        "left_temple": (.28, .34), "right_temple": (.72, .34), "crown": (.5, .11),
        "left_ear": (.24, .59), "right_ear": (.76, .59), "nape": (.5, .83),
    })


def synthetic_head(texture: str, skin: tuple[int, int, int]) -> tuple[np.ndarray, np.ndarray]:
    w = h = 96
    yy, xx = np.mgrid[:h, :w]
    image = np.zeros((h, w, 4), dtype=np.uint8)
    image[..., :3] = skin
    image[..., 3] = np.where((yy % 5) == 0, 170, 255)
    hair = ((xx - 48) / 26) ** 2 + ((yy - 33) / 26) ** 2 <= 1
    pattern = {"straight": xx, "wavy": xx + (yy % 9),
               "curly": (xx // 3) ** 2 + (yy // 3) ** 2,
               "coily": (xx // 2 + yy // 2) % 7}[texture]
    image[..., 0][hair] = 58 + (pattern[hair] % 11)
    image[..., 1][hair] = 36 + (pattern[hair] % 9)
    image[..., 2][hair] = 28 + (pattern[hair] % 8)
    return image, hair.astype(np.uint8) * 255


@pytest.mark.parametrize("texture", ["straight", "wavy", "curly", "coily"])
@pytest.mark.parametrize("skin", [(220, 179, 138), (61, 43, 36)])
def test_every_short_sides_preset_renders_without_editing_face_or_background(texture, skin):
    image, mask = synthetic_head(texture, skin)
    untouched = image.copy()
    guard = GuardSpy()
    presets = available_presets()[:18]
    assert len(presets) == 18
    for preset in presets:
        result = render_style_for_face(image, mask, anchors(), preset.id, 4.0, guard=guard)
        assert isinstance(result, StyleRender), preset.id
        assert result.rendered and result.simulated and result.provider_calls == 0
        assert result.style_id == preset.id
        assert result.affected_pixels > 0
        assert result.side_reveal_share > 0
        assert result.changed_pixel_share > 0
        assert result.identity_similarity == 1
        assert np.array_equal(result.image[mask == 0], image[mask == 0])
        assert np.array_equal(result.image[..., 3], image[..., 3])
        assert np.array_equal(image, untouched)
    assert guard.calls == 18


@pytest.mark.parametrize("preset_id", ["local-low-fade", "local-high-fade", "local-low-taper"])
def test_level_one_identity_and_five_level_monotone_reveal(preset_id):
    image, mask = synthetic_head("curly", (80, 54, 45))
    results = [render_style_for_face(image, mask, anchors(), preset_id, strength)
               for strength in (1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)]
    assert all(isinstance(result, StyleRender) for result in results)
    clean = [result for result in results if isinstance(result, StyleRender)]
    assert np.array_equal(clean[0].image, image)
    assert all(clean[i].side_reveal_share <= clean[i + 1].side_reveal_share
               for i in range(len(clean) - 1))
    assert clean[-1].affected_pixels > 0


@pytest.mark.parametrize("bad", [0.95, 5.1, 2.25, float("nan"), True])
def test_invalid_strength_refused_early(bad):
    image, mask = synthetic_head("straight", (171, 127, 108))
    with pytest.raises(ValueError):
        render_style_for_face(image, mask, anchors(), "local-high-fade", bad)


def test_missing_mesh_and_empty_mask_report_coded_refusal():
    image, hair = synthetic_head("wavy", (201, 165, 135))
    empty = np.zeros(hair.shape, dtype=np.uint8)
    r = render_style_for_face(image, hair, None, "local-high-fade", 4)
    assert r == RenderRefusal("no_mesh", "No primary-face landmarks supplied")
    missing = render_style_for_face(image, empty, anchors(), "local-high-fade", 4)
    assert isinstance(missing, RenderRefusal) and missing.code == "invalid_mask"
