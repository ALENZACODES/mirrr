"""W39 curl-pattern-respecting recolour and W28 balayage painter, on drawn coil textures.

Pass definition (written before the run, drawn textures only): for loose to tight coils
(periods 14, 8 and 4 px, standing in for 2A-4C), every recolour keeps the strand structure
(high-pass sign agreement >= 0.99, zero-crossing edge map IoU >= 0.9), leaves every pixel
outside the hair mask byte-identical and never edits the mask; blurring the hair (the
"straightening" failure) is caught by the same checks. Balayage shows session 1 only: a
dark base cannot reach the lightest blonde in one session, and unpainted hair is unchanged.
Not tested on real hair or real colour services. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.haircolour import balayage, recolour
from plumb_api.engines.shade import colourspace as cs

H, W = 120, 100
YY, XX = np.mgrid[0:H, 0:W].astype(np.float64)
HAIR = ((((XX - 50) / 40) ** 2 + ((YY - 55) / 50) ** 2) <= 1).astype(np.float64)


def coils(period: float, *, base_rgb: tuple[float, float, float] = (1.0, 0.8, 0.6), mean: float = 30.0,
          depth: float = 12.0) -> np.ndarray:
    phase = 2 * np.pi * ((XX + 0.6 * np.sin(YY / period * 2 * np.pi) * period) / period)
    lum = mean + depth * np.sin(phase)
    image = np.zeros((H, W, 3), np.uint8)
    image[:] = (200, 210, 220)
    rgb = np.stack([lum * base_rgb[0], lum * base_rgb[1], lum * base_rgb[2]], -1)
    image[HAIR > 0] = np.clip(np.rint(rgb[HAIR > 0]), 0, 255).astype(np.uint8)
    return image


PERIODS = (14.0, 8.0, 4.0)
TARGETS = ([25.0, 3.0, 2.0], [60.0, 8.0, 25.0], [45.0, 30.0, 20.0], [35.0, 18.0, -12.0])


@pytest.mark.parametrize("period", PERIODS)
@pytest.mark.parametrize("target", TARGETS)
def test_recolour_keeps_the_curl_pattern(period: float, target: list[float]) -> None:
    image = coils(period)
    original = image.copy()
    result = recolour.recolour_hair(image, HAIR, target)
    checks = result.checks
    assert checks["outside_unchanged"] and checks["geometry_lock"]
    assert checks["structure_sign_agreement"] >= 0.99
    assert checks["edge_map_iou"] >= 0.9
    np.testing.assert_array_equal(image, original)
    np.testing.assert_array_equal(result.image[HAIR == 0], image[HAIR == 0])
    hair = HAIR >= 0.5
    got = cs.srgb_to_lab(result.image[hair].astype(float)).mean(axis=0)
    assert abs(got[0] - target[0]) < 4.0, "mean lightness lands near the target"
    assert np.hypot(got[1] - target[1], got[2] - target[2]) < 8.0
    assert result.label.startswith("Hair colour simulation")


def test_blurring_the_hair_is_caught_as_straightening() -> None:
    image = coils(4.0)
    blurred = image.copy()
    for c in range(3):
        smooth = recolour.box_blur(image[..., c].astype(float), 3)
        blurred[..., c] = np.where(HAIR > 0, np.rint(smooth), image[..., c]).astype(np.uint8)
    checks = recolour.geometry_checks(image, blurred, HAIR)
    assert not checks["geometry_lock"]
    assert checks["edge_map_iou"] < 0.9 or checks["structure_sign_agreement"] < 0.99


def test_shifted_strands_are_caught() -> None:
    image = coils(8.0)
    moved = image.copy()
    moved[:, 3:] = image[:, :-3]
    moved[HAIR == 0] = image[HAIR == 0]
    assert not recolour.geometry_checks(image, moved, HAIR)["geometry_lock"]


def test_lightness_map_is_increasing_so_order_is_kept() -> None:
    lab = np.zeros((1, 50, 3))
    lab[0, :, 0] = np.linspace(5, 40, 50)
    out = recolour.recolour_lab(lab, np.ones((1, 50)), np.array([55.0, 10.0, 20.0]), mean_l=20.0, gain=1.4)
    assert np.all(np.diff(out[0, :, 0]) > 0)
    assert recolour.texture_gain(20, 70) > 1 > recolour.texture_gain(60, 20)
    assert recolour.GAIN_LIMITS[0] <= recolour.texture_gain(5, 100) <= recolour.GAIN_LIMITS[1]


def test_strength_zero_is_identity_and_partial_strength_is_between() -> None:
    image = coils(8.0)
    zero = recolour.recolour_hair(image, HAIR, [60, 8, 25], strength=0.0)
    np.testing.assert_array_equal(zero.image, image)
    half = recolour.recolour_hair(image, HAIR, [60, 8, 25], strength=0.5)
    full = recolour.recolour_hair(image, HAIR, [60, 8, 25], strength=1.0)
    hair = HAIR >= 0.5
    l0, l5, l1 = (cs.srgb_to_lab(x[hair].astype(float))[:, 0].mean() for x in (image, half.image, full.image))
    assert l0 < l5 < l1


@pytest.mark.parametrize("bad", [dict(target_lab=[120, 0, 0]), dict(target_lab=[50, 0]), dict(strength=1.5)])
def test_recolour_input_validation(bad: dict) -> None:
    kwargs = {"target_lab": [50, 10, 10], **bad}
    with pytest.raises(ValueError):
        recolour.recolour_hair(coils(8.0), HAIR, **kwargs)
    with pytest.raises(ValueError, match="not enough hair"):
        recolour.recolour_hair(coils(8.0), np.zeros((H, W)), [50, 10, 10])


# --- W28 -------------------------------------------------------------------------------------

def test_session_plan_reflects_base_depth_and_history() -> None:
    dark = balayage.session_plan(2, 10, "virgin")
    assert dark["sessions"] == 2 and dark["session_1_level"] == 6 and not dark["reachable_in_one_session"]
    assert "needs 2 sessions" in dark["note"]
    easy = balayage.session_plan(6, 9, "virgin")
    assert easy["sessions"] == 1 and easy["reachable_in_one_session"]
    boxed = balayage.session_plan(4, 8, "box_dye")
    assert boxed["sessions"] == 4 and boxed["levels_by_session"] == [5, 6, 7, 8]
    assert "colour remover" in boxed["note"]
    with pytest.raises(ValueError, match="lightens"):
        balayage.session_plan(7, 5)
    with pytest.raises(ValueError):
        balayage.session_plan(3, 9, "henna")


def test_dark_base_preview_shows_session_one_not_icy_blonde() -> None:
    image = coils(8.0, mean=30.0)
    strokes = (XX > 50).astype(float)
    result = balayage.paint(image, HAIR, strokes, target_level=10, base_level=2)
    assert result.plan["session_1_level"] == 6
    lifted = (result.lift > 0.95) & (HAIR >= 0.5)
    lightness = cs.srgb_to_lab(result.image[lifted].astype(float))[:, 0].mean()
    level6 = balayage.level_row(6)["lightness"]
    assert abs(lightness - level6) < 5
    assert lightness < balayage.level_row(10)["lightness"] - 20
    exposed = cs.srgb_to_lab(result.image[lifted].astype(float))[:, 1:].mean(axis=0)
    assert exposed[1] > 10, "lightening a dark base exposes warm pigment"
    assert result.label.startswith("Balayage simulation of session 1")


def test_unpainted_hair_and_background_are_unchanged() -> None:
    image = coils(14.0)
    strokes = np.zeros((H, W))
    strokes[10:40, 30:70] = 1
    result = balayage.paint(image, HAIR, strokes, target_level=8, base_level=3, softness_px=3)
    untouched = result.lift == 0
    np.testing.assert_array_equal(result.image[untouched], image[untouched])
    np.testing.assert_array_equal(result.image[HAIR == 0], image[HAIR == 0])
    assert result.checks["geometry_lock"]


    image = coils(8.0)
    frame = np.zeros((H, W))
    frame[20:100, 12:20] = 1
    no_strokes = np.zeros((H, W))
    no_strokes[5:8, 45:55] = 1
    plain = balayage.lift_map(HAIR, no_strokes, softness_px=2)
    framed = balayage.lift_map(HAIR, no_strokes, softness_px=2, face_frame=frame)
    assert framed[20:100, 12:20].mean() > plain[20:100, 12:20].mean() + 0.3
    assert np.all(framed <= HAIR + 1e-12), "lift never leaves the hair"


def test_toner_deposits_and_never_lifts() -> None:
    for toner in ("pearl", "ash", "violet"):
        toned = balayage.level_lab(7, toner)
        plain = balayage.level_lab(7)
        assert toned[0] == plain[0]
        assert np.hypot(*toned[1:]) < np.hypot(*plain[1:])
    with pytest.raises(ValueError):
        balayage.level_lab(7, "silver-bright")


def test_measured_base_level_and_refusals() -> None:
    assert balayage.measure_base_level(coils(8.0, mean=30.0), HAIR) <= 2
    assert balayage.measure_base_level(coils(8.0, mean=150.0, depth=20.0), HAIR) >= 6
    with pytest.raises(ValueError, match="no painted hair"):
        balayage.paint(coils(8.0), HAIR, np.zeros((H, W)), target_level=9, base_level=4)
    with pytest.raises(ValueError):
        balayage.lift_map(HAIR, np.ones((3, 3)))
    data = balayage.paint(coils(8.0), HAIR, (YY > 60).astype(float), target_level=8, base_level=5).to_json()
    assert data["plan"]["assumed"] is True and 0 < data["coverage"] < 1
