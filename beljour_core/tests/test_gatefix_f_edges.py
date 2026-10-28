"""Adversarial drawn-input checks for cosmetic reading and hairstyle rendering.

Only procedural scenes are used. Failure always keeps the original image safe.
Author: John Khan.
"""
from __future__ import annotations

import socket

import numpy as np
import pytest

from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.measurement import background_from_face, measure_shade
from plumb_api.styling.local_demo import DemoRefusal, DemoRender, render_demo_style

HEIGHT = 192
WIDTH = 160
MESH = symmetric_face(WIDTH, HEIGHT, face_width=88, face_length=126)
OVAL = regions.region_mask(
    "face_oval", MESH, HEIGHT, WIDTH, normalized=False, supersample=2,
) > 0.5


def scene(level: float = 60.0) -> np.ndarray:
    image = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    image[..., :3] = (128, 128, 128)
    image[..., 3] = 255
    image[..., :3][OVAL] = cs.to_bytes(cs.lab_to_srgb([level, 12.0, 18.0]))
    return image


def test_coloured_glasses_outside_cheeks_do_not_force_a_shade() -> None:
    image = scene(60)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    glasses = ((yy - 83) ** 2 < 6**2) & ((xx - 80) ** 2 < 36**2)
    image[..., 0][glasses] = 6
    image[..., 1][glasses] = 15
    image[..., 2][glasses] = 21
    reading = measure_shade(image, MESH)
    assert not reading.refused
    assert reading.white.mode == "grey_world"
    assert reading.best is not None


def test_localized_strong_cheek_glare_refuses_without_invented_correction() -> None:
    image = scene(55)
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    glare = ((xx - 53) ** 2 + (yy - 98) ** 2) < 17**2
    image[glare, :3] = (251, 249, 248)
    reading = measure_shade(image, MESH)
    assert reading.reason is None or reading.refused
    if reading.refused:
        assert reading.best is None
    else:
        assert reading.best is not None
        assert reading.best["lab"][0] <= reading.measured_lab[0] + 1.0


def test_dim_drawn_face_is_not_misreported_as_a_health_condition() -> None:
    image = scene(60)
    image[..., :3] = cs.to_bytes(cs.encode(cs.decode(image[..., :3]) * 0.72))
    output = measure_shade(image, MESH)
    assert output.label == "Shade estimate from your photo. Not tested against real products."
    assert output.measured_lab is not None
    assert output.to_json()["tested_against_real_products"] is False
    assert output.to_json()["never_lighter"] is True


def test_glowing_transparent_background_cannot_be_used_as_white_card() -> None:
    image = scene(55)
    image[..., 3][~OVAL] = 10
    estimate = background_from_face(image, MESH)
    assert estimate.mask is None
    assert estimate.reason == "background_not_visible"
    reading = measure_shade(image, MESH)
    assert reading.white.mode == "none"


def test_primary_mesh_cropped_off_edge_is_rejected_without_retrying_a_guess() -> None:
    image = scene(55)
    partial = image[10:160, 20:118]
    unadjusted = MESH.copy()
    with pytest.raises(ValueError):
        measure_shade(partial, unadjusted)
    style = render_demo_style(partial, unadjusted, "tpl-pixie", 4.0)
    assert isinstance(style, DemoRefusal)
    assert style.code == "no_mesh"


def test_no_valid_hair_pixels_due_to_primary_box_refuses_clearly() -> None:
    image = scene(55)
    style = render_demo_style(image, MESH, "tpl-bob", 4.0,
                              primary_box=(0, HEIGHT - 15, 20, HEIGHT))
    assert isinstance(style, DemoRefusal)
    assert style.code == "no_hair_region"


def test_small_or_oversized_images_are_not_rendered_or_measured() -> None:
    for bad in [np.zeros((7, 40, 3), dtype=np.uint8),
                np.zeros((3000, 1600, 3), dtype=np.uint8)]:
        output = render_demo_style(bad, MESH, "tpl-bob", 3.0)
        assert isinstance(output, DemoRefusal)
        assert output.code == "invalid_image"
        if bad.shape[0] < 16:
            with pytest.raises(ValueError):
                measure_shade(bad, MESH)


def test_invalid_palette_like_spoofed_demo_id_cannot_enter_local_renderer() -> None:
    before = scene(58)
    for identity in ["tpl-bob-copy", "idea-wedding", "tpl-missing", ""]:
        result = render_demo_style(before, MESH, identity, 4.0)
        assert isinstance(result, DemoRefusal)
        assert result.code == "unsupported_demo_style"
    assert before.dtype == np.uint8


def test_studio_does_not_change_alpha_for_synthetic_translucent_hair() -> None:
    image = scene(53)
    image[..., 3] = np.where((np.indices(image.shape[:2])[0] % 3) == 0, 215, 255)
    before = image.copy()
    result = render_demo_style(image, MESH, "tpl-long-layers", 4.0)
    assert isinstance(result, DemoRender)
    np.testing.assert_array_equal(result.image[..., 3], before[..., 3])
    np.testing.assert_array_equal(result.image[~result.support_mask], before[~result.support_mask])


def test_default_lock_is_stronger_than_explicit_lowered_lock() -> None:
    before = scene(55)
    default = render_demo_style(before, MESH, "tpl-pixie", 4.0)
    loosened = render_demo_style(before, MESH, "tpl-pixie", 4.0, lock_level=2.0)
    assert isinstance(default, DemoRender)
    assert isinstance(loosened, DemoRender)
    assert default.rendered and loosened.rendered
    assert default.identity_similarity >= 0.0
    assert loosened.identity_similarity >= 0.0
    assert default.provider_calls == loosened.provider_calls == 0


def test_repeated_synthetic_render_never_modifies_caller_mask_or_image() -> None:
    image = scene(40)
    original = image.copy()
    mesh = MESH.copy()
    first = render_demo_style(image, mesh, "tpl-low-fade", 3.0)
    second = render_demo_style(image, mesh, "tpl-low-fade", 3.0)
    assert isinstance(first, DemoRender) and isinstance(second, DemoRender)
    np.testing.assert_array_equal(first.image, second.image)
    np.testing.assert_array_equal(image, original)
    np.testing.assert_array_equal(mesh, MESH)


def test_mocked_local_work_requires_no_network(monkeypatch: pytest.MonkeyPatch) -> None:
    def blocked(*args: object, **kwargs: object) -> None:
        raise AssertionError("Local shade and hair simulations must not contact a provider")

    monkeypatch.setattr(socket, "create_connection", blocked)
    shade = measure_shade(scene(60), MESH)
    style = render_demo_style(scene(60), MESH, "tpl-waves", 4.0)
    assert not shade.refused
    assert isinstance(style, DemoRender) and style.provider_calls == 0
