"""Grade tests plus the skin-tone fairness check across six drawn tones.

Grades and face paint must never lighten skin and must keep contrast, on very
light through very deep skin alike.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import Look, LookKind, Palette, apply_look, get_pack, list_packs
from plumb_api.seasonal.packs.grades import GradeSettings, grade_array, settings_for
from plumb_api.seasonal.packs.raster import luminance
from plumb_api.seasonal.packs.synthetic import SKIN_TONES, single
from plumb_api.seasonal.packs.target import FaceTarget, polygon_mask

GRADES = [
    (pack.occasion, look.id)
    for pack in list_packs()
    for look in pack.looks
    if look.kind is LookKind.GRADE
]
PAINTS = [
    (pack.occasion, look.id)
    for pack in list_packs()
    for look in pack.looks
    if look.renderer == "accessory.paint"
]
PALETTE = Palette("#aa3300", "#0033aa", "#ffcc00", "#101010", "#f0f0f0")


def skin_mask(image: np.ndarray, target: FaceTarget) -> np.ndarray:
    """Cheek and forehead skin of the drawn face, away from features."""
    height, width = image.shape[:2]
    patches = []
    for u, v in ((-0.27, 0.12), (0.27, 0.12), (0.0, -0.3)):
        cx, cy = target.to_image(u, v)
        r = target.box.width * 0.05
        patches.append([(cx - r, cy - r), (cx + r, cy - r), (cx + r, cy + r), (cx - r, cy + r)])
    mask: np.ndarray = polygon_mask(width, height, patches)
    return mask


def contrast(image: np.ndarray, target: FaceTarget) -> float:
    """Luminance spread inside the face box."""
    box = target.box
    crop = image[int(box.y) : int(box.y + box.height), int(box.x) : int(box.x + box.width)]
    lum = luminance(crop)
    return float(np.percentile(lum, 95) - np.percentile(lum, 5))


@pytest.mark.parametrize(("occasion", "look_id"), GRADES)
@pytest.mark.parametrize("skin", SKIN_TONES)
def test_grades_never_lighten_skin(occasion: str, look_id: str, skin: str) -> None:
    image, target = single(256, skin=skin)
    for strength in (1.0, 3.0, 5.0):
        out = apply_look(image, occasion, look_id, strength=strength)
        mask = skin_mask(image, target)
        assert (luminance(out)[mask] <= luminance(image)[mask] + 1e-3).all()


@pytest.mark.parametrize(("occasion", "look_id"), GRADES)
def test_grades_never_lighten_any_pixel(occasion: str, look_id: str) -> None:
    image, _ = single(200)
    out = apply_look(image, occasion, look_id, strength=5.0)
    assert (luminance(out) <= luminance(image) + 1e-3).all()


@pytest.mark.parametrize(("occasion", "look_id"), GRADES)
@pytest.mark.parametrize("skin", SKIN_TONES)
def test_grades_keep_contrast_on_every_skin_tone(occasion: str, look_id: str, skin: str) -> None:
    image, target = single(256, skin=skin)
    out = apply_look(image, occasion, look_id, strength=5.0)
    assert contrast(out, target) >= 0.8 * contrast(image, target)


@pytest.mark.parametrize(("occasion", "look_id"), PAINTS)
@pytest.mark.parametrize("skin", SKIN_TONES)
def test_face_paint_only_darkens_and_stays_visible(occasion: str, look_id: str, skin: str) -> None:
    image, target = single(256, skin=skin)
    out = apply_look(image, occasion, look_id, target, strength=5.0)
    before, after = luminance(image), luminance(out)
    diff = np.any(image != out, axis=2)
    assert diff.any()
    assert (after[diff] <= before[diff] + 0.5).all()
    # Visible on deep skin too: the strongest mark is a clear step down.
    assert float(np.max((before - after)[diff])) >= 8.0


def test_grade_of_grey_stays_grey_at_the_ends() -> None:
    black = np.zeros((16, 16, 3), np.uint8)
    white = np.full((16, 16, 3), 255, np.uint8)
    settings = GradeSettings((0.5, 0.0, -0.5), (-0.5, 0.0, 0.5), 0.3, 0.0, 0.0, 0.0)
    assert np.array_equal(grade_array(black, settings), black)
    graded_white = grade_array(white, settings)
    assert int(np.abs(graded_white.astype(int) - 255).max()) <= 1


def test_grade_settings_scale_with_amount() -> None:
    look = Look(
        "g",
        LookKind.GRADE,
        "G",
        "grade.split_tone",
        {"tint": 0.2, "desaturate": 0.4, "shadow_depth": 0.3, "vignette": 0.5},
    )
    low = settings_for(look, PALETTE, 0.2)
    high = settings_for(look, PALETTE, 1.0)
    assert low.tint == pytest.approx(0.04)
    assert high.tint == pytest.approx(0.2)
    assert high.desaturate == pytest.approx(0.4)
    assert high.vignette == pytest.approx(0.5)


def test_grade_settings_clamp_wild_values() -> None:
    look = Look(
        "g",
        LookKind.GRADE,
        "G",
        "grade.split_tone",
        {"tint": 5.0, "desaturate": 3.0, "shadow_depth": -1.0, "vignette": 9.0},
    )
    settings = settings_for(look, PALETTE, 1.0)
    assert settings.tint == 0.3
    assert settings.desaturate == 1.0
    assert settings.shadow_depth == 0.0
    assert settings.vignette == 0.6


def test_full_desaturation_gives_grey() -> None:
    rng = np.random.default_rng(1)
    image = rng.integers(0, 256, (32, 32, 3), dtype=np.uint8)
    settings = GradeSettings((0.0, 0.0, 0.0), (0.0, 0.0, 0.0), 0.0, 1.0, 0.0, 0.0)
    out = grade_array(image, settings).astype(int)
    assert int(np.abs(out[..., 0] - out[..., 1]).max()) <= 1
    assert int(np.abs(out[..., 1] - out[..., 2]).max()) <= 1


def test_vignette_darkens_corners_more_than_centre() -> None:
    image = np.full((64, 64, 3), 180, np.uint8)
    settings = GradeSettings((0.0, 0.0, 0.0), (0.0, 0.0, 0.0), 0.0, 0.0, 0.0, 0.5)
    out = grade_array(image, settings)
    assert int(out[0, 0, 0]) < int(out[32, 32, 0])
    assert int(out[32, 32, 0]) >= 178


def test_moonlit_grade_cools_the_picture() -> None:
    image, _ = single(160)
    out = apply_look(image, "halloween", "moonlit_grade", strength=5.0).astype(float)
    base = image.astype(float)
    shift = (out[..., 2] - out[..., 0]).mean() - (base[..., 2] - base[..., 0]).mean()
    assert shift > 3.0


def test_warm_grade_warms_the_picture() -> None:
    image, _ = single(160)
    out = apply_look(image, "christmas", "warm_grade", strength=5.0).astype(float)
    base = image.astype(float)
    shift = (out[..., 0] - out[..., 2]).mean() - (base[..., 0] - base[..., 2]).mean()
    assert shift > 3.0


def test_every_pack_has_a_grade() -> None:
    for occasion in ("halloween", "christmas", "thanksgiving", "new_year", "easter"):
        assert LookKind.GRADE in get_pack(occasion).kinds()
