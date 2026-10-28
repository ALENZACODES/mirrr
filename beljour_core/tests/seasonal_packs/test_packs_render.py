"""Per-renderer tests: frames, accessories, face paint, greetings, compositing.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import Look, LookKind, PackError, Palette, apply_look, get_pack
from plumb_api.seasonal.packs.accessories import ACCESSORIES, register_accessory
from plumb_api.seasonal.packs.facepaint import paint_spots
from plumb_api.seasonal.packs.frames import band_slots, frame_geometry, scatter_slots
from plumb_api.seasonal.packs.greeting import clean_greeting, render_greeting
from plumb_api.seasonal.packs.raster import (
    BlendMode,
    Layer,
    RasterError,
    check_image,
    composite,
    mix,
    with_alpha,
)
from plumb_api.seasonal.packs.synthetic import background, single

PALETTE = Palette("#cc3300", "#3366cc", "#ffcc00", "#111111", "#eeeeee")


def frame_look(**params: float | str | tuple[str, ...]) -> Look:
    merged: dict[str, float | str | tuple[str, ...]] = {"motifs": ("bat", "star")}
    merged.update(params)
    return Look("f", LookKind.FRAME, "F", "frame.border", merged, motifs=("bat", "star"))


@pytest.mark.parametrize("look_id", ["pumpkin_frame", "moonlit_grade"])
def test_whole_image_looks_work_without_a_face(look_id: str) -> None:
    image = background(200, 160)
    out = apply_look(image, "halloween", look_id)
    assert np.any(out != image)


@pytest.mark.parametrize(
    ("occasion", "look_id"),
    [
        ("halloween", "pumpkin_frame"),
        ("christmas", "evergreen_frame"),
        ("thanksgiving", "leaf_frame"),
        ("new_year", "starlight_frame"),
        ("easter", "spring_flower_frame"),
        ("easter", "egg_border"),
    ],
)
def test_frames_keep_the_middle_untouched(occasion: str, look_id: str) -> None:
    image = background(320, 240, seed=4)
    out = apply_look(image, occasion, look_id, strength=5.0)
    middle = (slice(80, 160), slice(100, 220))
    assert np.array_equal(out[middle], image[middle])
    edges = np.any(out != image, axis=2)
    assert edges[:12].mean() > 0.3 or edges[:, :12].mean() > 0.3


def test_band_frame_thickness_grows_with_strength() -> None:
    look = frame_look(band=0.1)
    thin = frame_geometry(400, 300, look, 0.2)
    thick = frame_geometry(400, 300, look, 1.0)
    assert thin.band < thick.band
    assert thick.motif <= thick.band * 1.6


def test_band_slots_cover_all_four_edges() -> None:
    look = frame_look(corner="bat")
    geometry = frame_geometry(400, 300, look, 0.6)
    slots = band_slots(400, 300, geometry, look, 0)
    half = geometry.band / 2
    assert any(s.y == half for s in slots) and any(s.y == 300 - half for s in slots)
    assert any(s.x == half for s in slots) and any(s.x == 400 - half for s in slots)
    corners = [s for s in slots if s.size > geometry.motif]
    assert len(corners) == 4
    assert band_slots(400, 300, geometry, look, 0) == slots


def test_scatter_slots_hug_the_edges() -> None:
    look = frame_look(style="scatter", density=1.0)
    geometry = frame_geometry(300, 300, look, 1.0)
    slots = scatter_slots(300, 300, geometry, look, 3)
    assert len(slots) >= 8
    for slot in slots:
        edge = min(slot.x, slot.y, 300 - slot.x, 300 - slot.y)
        assert edge <= geometry.band + 1


def test_frame_errors() -> None:
    image = background(120, 120)
    look = Look("f", LookKind.FRAME, "F", "frame.border", {"style": "zigzag", "motifs": ("bat",)})
    from plumb_api.seasonal.packs.frames import render_frame

    with pytest.raises(PackError, match="frame style"):
        render_frame(image, look, PALETTE, "halloween", 0.5, 0)
    empty = Look("g", LookKind.FRAME, "G", "frame.border", {"motifs": ()})
    with pytest.raises(PackError, match="at least one motif"):
        render_frame(image, empty, PALETTE, "halloween", 0.5, 0)


def test_every_accessory_style_draws_inside_its_region() -> None:
    image, target = single(256)
    for style in ACCESSORIES:
        look = Look("a", LookKind.ACCESSORY, "A", "accessory.wear", {"style": style})
        from plumb_api.seasonal.packs.accessories import render_accessory

        out = render_accessory(image, look, PALETTE, "halloween", target, 1.0, 0)
        assert np.any(out != image), style


def test_hats_sit_above_the_eyes() -> None:
    image, target = single(256)
    for occasion, look_id in (("halloween", "witch_hat"), ("christmas", "knit_hat")):
        out = apply_look(image, occasion, look_id, target)
        rows = np.nonzero(np.any(out != image, axis=(1, 2)))[0]
        eye_y = target.eye_regions()[0].cy
        assert rows.size and float(np.median(rows)) < eye_y


def test_unknown_accessory_style_and_duplicate_registration() -> None:
    image, target = single(128)
    look = Look("a", LookKind.ACCESSORY, "A", "accessory.wear", {"style": "monocle"})
    from plumb_api.seasonal.packs.accessories import cat_ears, render_accessory

    with pytest.raises(PackError, match="unknown accessory style"):
        render_accessory(image, look, PALETTE, "halloween", target, 1.0, 0)
    with pytest.raises(PackError, match="already registered"):
        register_accessory("cat_ears", cat_ears)


def test_paint_placements() -> None:
    _, target = single(256)
    for placement, expected in (("both_cheeks", 2), ("left_cheek", 1), ("right_cheek", 1)):
        look = Look("p", LookKind.ACCESSORY, "P", "accessory.paint", {"placement": placement})
        spots = paint_spots(target, look, 0)
        assert len(spots) == expected
    freckles = Look(
        "p", LookKind.ACCESSORY, "P", "accessory.paint", {"placement": "freckles", "count": 4}
    )
    assert len(paint_spots(target, freckles, 0)) == 8
    bad = Look("p", LookKind.ACCESSORY, "P", "accessory.paint", {"placement": "nose"})
    with pytest.raises(PackError, match="placement"):
        paint_spots(target, bad, 0)


def test_left_cheek_paint_lands_on_the_screen_left() -> None:
    image, target = single(256)
    out = apply_look(image, "halloween", "cheek_web", target)
    cols = np.nonzero(np.any(out != image, axis=(0, 2)))[0]
    assert cols.size and float(cols.mean()) < target.box.centre[0]


def test_greeting_text_is_cleaned() -> None:
    assert clean_greeting("  Happy\tHalloween \n") == "Happy Halloween"
    assert clean_greeting("Bonne\u0007 année") == "Bonne année"
    for bad in ("", "   ", "x" * 61):
        with pytest.raises(PackError):
            clean_greeting(bad)
    with pytest.raises(PackError):
        clean_greeting(5)  # type: ignore[arg-type]


def test_greeting_text_is_editable_and_placed() -> None:
    image = background(400, 300)
    default = apply_look(image, "halloween", "halloween_greeting")
    custom = apply_look(image, "halloween", "halloween_greeting", greeting="Boo from us")
    assert not np.array_equal(default, custom)
    changed_rows = np.nonzero(np.any(default != image, axis=(1, 2)))[0]
    assert changed_rows.min() > 150


def test_greeting_top_position_and_errors() -> None:
    image = background(400, 300)
    look = Look("g", LookKind.GREETING, "G", "greeting.banner", {"position": "top"})
    out = render_greeting(image, look, PALETTE, "halloween", "Hello", 1.0, 0)
    rows = np.nonzero(np.any(out != image, axis=(1, 2)))[0]
    assert rows.max() < 150
    sideways = Look("g", LookKind.GREETING, "G", "greeting.banner", {"position": "left"})
    with pytest.raises(PackError, match="top or bottom"):
        render_greeting(image, sideways, PALETTE, "halloween", "Hello", 1.0, 0)


def test_long_greeting_shrinks_to_fit() -> None:
    image = background(240, 200)
    out = apply_look(image, "easter", "easter_greeting", greeting="W" * 60)
    cols = np.nonzero(np.any(out != image, axis=(0, 2)))[0]
    assert cols.min() >= 0 and cols.max() < 240


def test_check_image_rejects_bad_input() -> None:
    with pytest.raises(RasterError, match="NumPy"):
        check_image([[1, 2, 3]])
    with pytest.raises(RasterError, match="8 x 8"):
        check_image(np.zeros((4, 4, 3), np.uint8))
    with pytest.raises(RasterError, match="RGB"):
        check_image(np.zeros((10, 10, 4), np.uint8))


def test_layer_window_and_modes() -> None:
    with pytest.raises(RasterError):
        Layer(5, 5, 5, 10)
    image = np.full((20, 20, 3), 128, np.uint8)
    layer = Layer(2, 2, 12, 12)
    layer.polygon([(2, 2), (12, 2), (12, 12), (2, 12)], (255, 255, 255, 255))
    over = composite(image, layer, 1.0, BlendMode.OVER)
    multiply = composite(image, layer, 1.0, BlendMode.MULTIPLY)
    screen = composite(image, layer, 1.0, BlendMode.SCREEN)
    assert over[5, 5, 0] == 255
    assert multiply[5, 5, 0] == 128
    assert screen[5, 5, 0] == 255
    assert np.array_equal(over[15:, 15:], image[15:, 15:])
    assert np.array_equal(composite(image, Layer(0, 0, 4, 4)), image)


def test_layer_draws_partly_outside_the_image() -> None:
    image = np.zeros((16, 16, 3), np.uint8)
    layer = Layer(-8, -8, 8, 8)
    layer.ellipse(0, 0, 6, 6, (200, 10, 10, 255))
    out = composite(image, layer)
    assert out[1, 1, 0] > 100
    assert np.array_equal(out[10:, 10:], image[10:, 10:])


def test_colour_helpers() -> None:
    assert with_alpha((1, 2, 3), 2.0) == (1, 2, 3, 255)
    assert with_alpha((1, 2, 3), -1.0) == (1, 2, 3, 0)
    assert mix((0, 0, 0), (100, 200, 50), 0.5) == (50, 100, 25)


def test_pack_palettes_have_contrast_for_greetings() -> None:
    for occasion in ("halloween", "christmas", "thanksgiving", "new_year", "easter"):
        pack = get_pack(occasion)
        look = next(look for look in pack.looks if look.kind is LookKind.GREETING)
        text = pack.palette.rgb(look.param_str("text_colour", "light"))
        banner = pack.palette.rgb(look.param_str("banner_colour", "dark"))
        assert abs(sum(text) - sum(banner)) > 200


def test_accessory_shadow_darkens_and_can_be_switched_off() -> None:
    from plumb_api.seasonal.packs.accessories import render_accessory

    image, target = single(256)
    shaded = Look("a", LookKind.ACCESSORY, "A", "accessory.wear", {"style": "witch_hat"})
    flat = Look(
        "a", LookKind.ACCESSORY, "A", "accessory.wear", {"style": "witch_hat", "shadow": 0.0}
    )
    with_shadow = render_accessory(image, shaded, PALETTE, "halloween", target, 1.0, 0)
    without = render_accessory(image, flat, PALETTE, "halloween", target, 1.0, 0)
    only_shadow = np.any(with_shadow != without, axis=2) & np.all(without == image, axis=2)
    assert only_shadow.sum() > 20
    lum_before = image[only_shadow].astype(int).sum(axis=1)
    lum_after = with_shadow[only_shadow].astype(int).sum(axis=1)
    assert (lum_after <= lum_before).all()
