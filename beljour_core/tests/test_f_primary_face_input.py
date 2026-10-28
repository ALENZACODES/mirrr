"""Two independent drawn heads, checking that only the designated one is edited."""
from __future__ import annotations

import numpy as np

from plumb_api.engines.concealer import CoverRefusal, CoverResult, CoverSession
from plumb_api.engines.hair_palette import PalettePreview, PaletteRefusal, apply_shade
from plumb_api.engines.menshair import HairAnchors, render_style_for_face
from plumb_api.engines.menshair.public_render import RenderRefusal, StyleRender
from plumb_api.engines.shade.session import ShadePrimaryRefusal, ShadeSession


def scene() -> tuple[np.ndarray, np.ndarray, np.ndarray, HairAnchors]:
    height, width = 96, 192
    image = np.full((height, width, 4), 255, dtype=np.uint8)
    image[..., :3] = (174, 134, 112)
    image[..., 3] = 211
    mask = np.zeros((height, width), dtype=np.uint8)
    scalp = np.zeros_like(mask)
    for offset in (0, 96):
        image[12:67, offset + 18:offset + 78, :3] = (56, 38, 35)
        mask[12:67, offset + 18:offset + 78] = 255
        scalp[42:61, offset + 28:offset + 68] = 255
        image[42:61, offset + 28:offset + 68, :3] = (145, 101, 88)
    points = HairAnchors.parse({
        "left_temple": (.28 / 2, .34), "right_temple": (.72 / 2, .34),
        "crown": (.5 / 2, .11), "left_ear": (.24 / 2, .59),
        "right_ear": (.76 / 2, .59), "nape": (.5 / 2, .83),
    })
    return image, mask, scalp, points


def test_concealer_cannot_edit_second_person_or_face_below_hair_region():
    img, hair, scalp, landmarks = scene()
    result = CoverSession().render(img, hair, scalp, zone="crown", level=5.0,
                                   landmarks=landmarks, primary_box=(0, 0, 96, 96))
    assert isinstance(result, CoverResult)
    assert result.changed_pixels > 0
    assert np.array_equal(result.image[:, 96:], img[:, 96:])
    assert np.array_equal(result.image[hair == 0], img[hair == 0])


def test_palette_preview_does_not_edit_second_person():
    image, mask, _scalp, landmarks = scene()
    result = apply_shade(image, mask, landmarks, "natural-03-n", level=5.0,
                         primary_box=(0, 0, 96, 96))
    assert isinstance(result, PalettePreview)
    assert result.changed_pixels > 0
    assert np.array_equal(result.image[:, 96:], image[:, 96:])
    assert np.array_equal(result.image[mask == 0], image[mask == 0])
    assert np.array_equal(result.image[..., 3], image[..., 3])


def test_mens_render_is_bound_to_primary_face_box():
    image, mask, _scalp, landmarks = scene()
    rendered = render_style_for_face(image, mask, landmarks, "local-high-fade", 5,
                                     primary_box=(0, 0, 96, 96))
    assert isinstance(rendered, StyleRender)
    assert rendered.rendered and rendered.affected_pixels > 0
    assert np.array_equal(rendered.image[:, 96:], image[:, 96:])
    assert np.array_equal(rendered.image[mask == 0], image[mask == 0])


def test_no_mesh_is_refused_for_every_new_primary_face_entry():
    image, hair, scalp, _landmarks = scene()
    c = CoverSession().render(image, hair, scalp, landmarks=None)
    assert isinstance(c, CoverRefusal) and c.code == "no_mesh"
    p = apply_shade(image, hair, None, "natural-03-n")
    assert isinstance(p, PaletteRefusal) and p.code == "no_mesh"
    m = render_style_for_face(image, hair, None, "local-high-fade")
    assert isinstance(m, RenderRefusal) and m.code == "no_mesh"
    s = ShadeSession().prepare_primary(image, None)
    assert isinstance(s, ShadePrimaryRefusal) and s.code == "no_mesh"


def test_primary_box_validation_fails_closed():
    image, hair, scalp, landmarks = scene()
    for bounds in ((0, 0, 400, 96), (40, 0, 0, 96), (-1, 0, 96, 96)):
        c = CoverSession().render(image, hair, scalp, landmarks=landmarks, primary_box=bounds)
        m = render_style_for_face(image, hair, landmarks, "local-high-fade", primary_box=bounds)
        p = apply_shade(image, hair, landmarks, "natural-03-n", primary_box=bounds)
        assert isinstance(c, CoverRefusal) and c.code == "degenerate_mask"
        assert isinstance(m, RenderRefusal) and m.code == "invalid_primary_face"
        assert isinstance(p, PaletteRefusal) and p.code == "invalid_primary_face"


def test_malformed_primary_face_evidence_returns_no_mesh():
    image, hair, scalp, _landmarks = scene()
    invalid = object()
    assert CoverSession().render(image, hair, scalp, landmarks=invalid).code == "no_mesh"
    assert apply_shade(image, hair, invalid, "natural-03-n").code == "no_mesh"
    assert render_style_for_face(image, hair, invalid, "local-high-fade").code == "no_mesh"
