"""Drawn-face render checks for all twelve local hair consultation styles.

No real photo, model weights, network request or physical haircut claims.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pytest

from plumb_api.engines.concealer.cover import CoverDecision
from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.styling import DemoRefusal, DemoRender, demo_catalogue, render_demo_style
from plumb_api.styling.local_demo import hair_and_forehead_mask

HEIGHT = 192
WIDTH = 160
MESH = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)


def painting(skin: tuple[int, int, int], texture: str) -> np.ndarray:
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    img = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    img[..., :3] = skin
    img[..., 3] = np.where((yy % 7) == 0, 225, 255)
    mask = regions.region_mask(
        "face_oval", MESH, HEIGHT, WIDTH, normalized=False, supersample=2,
    ) >= 0.5
    field = {
        "short": (xx + 2 * yy) % 13,
        "long": (3 * xx + yy // 2) % 19,
        "wavy": ((xx // 3 + yy // 4) % 11),
        "coily": ((xx // 2) ^ (yy // 2)) % 17,
    }[texture]
    hair = mask & (yy < 74)
    img[..., 0][hair] = 45 + field[hair]
    img[..., 1][hair] = 35 + field[hair] // 2
    img[..., 2][hair] = 25 + field[hair] // 3
    return img


@pytest.mark.parametrize("skin", [(225, 188, 158), (53, 35, 30)])
@pytest.mark.parametrize("texture", ["short", "long", "wavy", "coily"])
def test_twelve_styles_actually_render_and_keep_unselected_pixels(
    skin: tuple[int, int, int], texture: str,
) -> None:
    original = painting(skin, texture)
    before = original.copy()
    rows = demo_catalogue()
    assert len(rows) == 12
    assert len({row.id for row in rows}) == 12
    for row in rows:
        result = render_demo_style(original, MESH, row.id, 4.0)
        assert isinstance(result, DemoRender), (row.id, result)
        assert result.rendered is True
        assert result.changed_pixels > 0
        assert 0 < result.changed_pixel_share < 0.5
        assert result.support_mask.dtype == np.bool_
        assert result.affected_region_pixels > 50
        assert result.image.shape == original.shape
        assert result.image.dtype == np.uint8
        assert np.array_equal(result.image[~result.support_mask], original[~result.support_mask])
        assert np.array_equal(result.image[..., 3], original[..., 3])
        assert result.simulated and result.provider_calls == 0
        assert "simulation" in result.label or "illustration" in result.label
        assert result.public()["identity_lock"]["applied"]
    np.testing.assert_array_equal(original, before)


@pytest.mark.parametrize("style_id", [row.id for row in demo_catalogue()])
def test_level_one_is_byte_identical_and_not_falsely_counted_rendered(style_id: str) -> None:
    image = painting((210, 180, 155), "short")
    result = render_demo_style(image, MESH, style_id, 1.0)
    assert isinstance(result, DemoRender)
    assert not result.rendered
    assert result.changed_pixels == 0
    assert result.changed_pixel_share == 0.0
    np.testing.assert_array_equal(result.image, image)


@dataclass
class GuardSpy:
    calls: int = 0
    lower_lock_calls: int = 0

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> CoverDecision:
        self.calls += 1
        self.lower_lock_calls += int(lock_level < 5.0)
        damaged = after.copy()
        damaged[:, :, :] = 220
        return CoverDecision(damaged, 0.92, True)


def test_default_guard_is_called_and_spatial_and_alpha_boundaries_survive() -> None:
    image = painting((80, 57, 46), "wavy")
    spy = GuardSpy()
    result = render_demo_style(image, MESH, "tpl-curtain", 4.0, guard=spy)
    assert isinstance(result, DemoRender)
    assert spy.calls == 1 and spy.lower_lock_calls == 0
    assert result.identity_blended is True
    assert result.identity_similarity == 0.92
    np.testing.assert_array_equal(result.image[~result.support_mask], image[~result.support_mask])
    np.testing.assert_array_equal(result.image[..., 3], image[..., 3])


def test_explicit_lower_lock_is_only_way_to_weaken_default() -> None:
    image = painting((160, 111, 93), "short")
    spy = GuardSpy()
    res = render_demo_style(image, MESH, "tpl-low-fade", 4.0, guard=spy, lock_level=3.0)
    assert isinstance(res, DemoRender)
    assert spy.calls == 1 and spy.lower_lock_calls == 1


def test_normalized_mesh_and_pixel_mesh_produce_identical_result() -> None:
    image = painting((72, 53, 45), "long")
    normalized = MESH / [WIDTH, HEIGHT]
    px = render_demo_style(image, MESH, "tpl-bob", 3.0)
    scaled = render_demo_style(image, normalized, "tpl-bob", 3.0)
    assert isinstance(px, DemoRender) and isinstance(scaled, DemoRender)
    np.testing.assert_array_equal(px.image, scaled.image)
    np.testing.assert_array_equal(px.support_mask, scaled.support_mask)


def test_explicit_primary_face_box_prevents_edits_on_other_person() -> None:
    image = painting((88, 68, 61), "coily")
    second = image.copy()
    image = np.concatenate((image, second), axis=1)
    result = render_demo_style(image, MESH, "tpl-waves", 4.0,
                               primary_box=(0, 0, WIDTH, HEIGHT))
    assert isinstance(result, DemoRender)
    np.testing.assert_array_equal(result.image[:, WIDTH:], image[:, WIDTH:])
    assert result.changed_pixels > 0


@pytest.mark.parametrize("bad", [None, [], np.full((478, 2), np.nan)])
def test_missing_or_invalid_mesh_refuses_and_never_guesses(bad: object) -> None:
    image = painting((80, 56, 46), "long")
    result = render_demo_style(image, bad, "tpl-low-fade")
    assert isinstance(result, DemoRefusal)
    assert result.code == "no_mesh"
    assert not result.rendered


@pytest.mark.parametrize("box", [(2, 0, 1, HEIGHT), (-1, 0, WIDTH, HEIGHT)])
def test_invalid_primary_box_is_a_coded_refusal(box: tuple[int, int, int, int]) -> None:
    result = render_demo_style(
        painting((90, 60, 47), "short"), MESH, "tpl-shag", primary_box=box,
    )
    assert isinstance(result, DemoRefusal)
    assert result.code == "invalid_primary_face"


@pytest.mark.parametrize("level", [0.0, 0.95, 2.25, 5.1, float("nan"), True])
def test_invalid_strength_is_refused_before_render(level: object) -> None:
    with pytest.raises(ValueError):
        render_demo_style(painting((90, 60, 47), "short"), MESH, "tpl-shag", level)


def test_style_outside_demo_cannot_be_marked_as_rendered() -> None:
    image = painting((110, 80, 65), "wavy")
    result = render_demo_style(image, MESH, "idea-other", 4.0)
    assert isinstance(result, DemoRefusal)
    assert result.code == "unsupported_demo_style"
    assert result.public()["rendered"] is False


def test_mask_fits_head_and_forehead_and_not_lower_face() -> None:
    image = painting((110, 80, 65), "short")
    result = hair_and_forehead_mask(image, MESH)
    assert isinstance(result, np.ndarray)
    assert np.any(result[:68])
    assert not np.any(result[105:])
    assert not np.any(result[:, 0])


def test_repeat_determinism_and_no_wiring_to_provider() -> None:
    image = painting((90, 60, 50), "coily")
    one = render_demo_style(image, MESH, "tpl-mid-fade-crop", 5.0)
    two = render_demo_style(image, MESH, "tpl-mid-fade-crop", 5.0)
    assert isinstance(one, DemoRender) and isinstance(two, DemoRender)
    np.testing.assert_array_equal(one.image, two.image)
    assert one.public() == two.public()
    assert one.provider_calls == two.provider_calls == 0
