"""Local photo fixes on drawn faces with known ground truth (tests/photo_fix_vectors.py).

Each tool: changes only inside its intended region, keeps alpha, does nothing at strength
0, refuses a broken mesh with a coded reason and says plainly when there is nothing to do.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core.distance import dilate
from plumb_api.engines.eyes.mesh_colour import eye_colour
from plumb_api.engines.repair.glare import remove_glare
from plumb_api.engines.repair.id_crop import PRESETS, guide_overlay, id_crop
from plumb_api.engines.repair.object_removal import MAX_AREA_SHARE, brush_mask, remove_object
from plumb_api.engines.repair.old_photo import find_scratches, restore_old_photo
from plumb_api.engines.repair.photo_fix import MESSAGES
from plumb_api.engines.repair.red_eye import fix_red_eye
from tests.photo_fix_vectors import HEIGHT, WIDTH, bomber_scene, id_scene, old_scene, scene


def changed(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    out: np.ndarray = np.any(a[..., :3] != b[..., :3], axis=2)
    return out


# ---- #54 red eye ---------------------------------------------------------------------------

def test_red_eye_darkens_only_the_glow_and_keeps_catchlights_and_iris() -> None:
    sc = scene(red_eye=True, alpha=True)
    result = fix_red_eye(sc.image, sc.points)
    assert (result.status, result.reason_code) == ("edited", "edited")
    irises = sc.truth["right_iris"] | sc.truth["left_iris"]
    assert not (changed(result.image, sc.image) & ~irises).any()
    for side in ("right", "left"):
        pupil = sc.truth[side + "_pupil"]
        before, after = sc.image[pupil].astype(int), result.image[pupil].astype(int)
        assert (after[:, 0] - np.maximum(after[:, 1], after[:, 2]) <= 1).all()
        assert (after[:, 0] < before[:, 0] - 100).all()
        catch = sc.truth[side + "_catchlight"]
        assert np.array_equal(result.image[catch], sc.image[catch])
        ring = sc.truth[side + "_iris"] & ~pupil & ~catch
        assert np.array_equal(result.image[ring], sc.image[ring])
    np.testing.assert_array_equal(result.image[..., 3], sc.image[..., 3])
    assert result.alpha.max() == 1.0


def test_red_eye_strength_scales_and_zero_is_a_no_op() -> None:
    sc = scene(red_eye=True)
    full, half = fix_red_eye(sc.image, sc.points), fix_red_eye(sc.image, sc.points, strength=50)
    pupil = sc.truth["right_pupil"]
    assert (sc.image[pupil, 0] > half.image[pupil, 0]).all()
    assert (half.image[pupil, 0] > full.image[pupil, 0]).all()
    zero = fix_red_eye(sc.image, sc.points, strength=0)
    assert (zero.status, zero.reason_code) == ("not_applicable", "zero_strength")
    assert np.array_equal(zero.image, sc.image) and not zero.alpha.any()


def test_a_closed_eye_is_never_edited_and_the_open_one_is() -> None:
    sc = scene("dark", seed=5, red_eye=True, closed="left")
    result = fix_red_eye(sc.image, sc.points)
    assert result.status == "edited" and result.report["open_eyes"] == ["right"]
    assert not (changed(result.image, sc.image) & ~sc.truth["right_iris"]).any()
    glow = sc.truth["left_closed_glow"]
    assert np.array_equal(result.image[glow], sc.image[glow])


def test_no_glow_and_bad_meshes_give_coded_results() -> None:
    plain = scene("light", seed=2)
    none = fix_red_eye(plain.image, plain.points)
    assert (none.status, none.reason_code) == ("not_applicable", "no_red_eye")
    assert none.message == MESSAGES["no_red_eye"] and np.array_equal(none.image, plain.image)
    broken = fix_red_eye(plain.image, plain.points[:100])
    assert (broken.status, broken.reason_code) == ("refused", "wrong_shape")
    with pytest.raises(ValueError, match="strength"):
        fix_red_eye(plain.image, plain.points, strength=101)


# ---- #42 eye colour ------------------------------------------------------------------------

def test_eye_colour_recolours_only_the_iris_and_keeps_pupil_and_catchlight() -> None:
    sc = scene(alpha=True)
    result = eye_colour(sc.image, sc.points, shade="ocean", strength=100)
    assert result.status == "edited"
    assert result.report["sides"] == {"right": "recoloured", "left": "recoloured"}
    irises = sc.truth["right_iris"] | sc.truth["left_iris"]
    moved = changed(result.image, sc.image)
    assert not (moved & ~irises).any()
    assert moved[irises].mean() > 0.5
    for side in ("right", "left"):
        for part in ("_pupil", "_catchlight"):
            mask = sc.truth[side + part]
            assert np.array_equal(result.image[mask], sc.image[mask]), side + part
    np.testing.assert_array_equal(result.image[..., 3], sc.image[..., 3])
    assert "simulation" in result.label.lower()


def test_eye_colour_skips_a_closed_eye_and_refuses_bad_input() -> None:
    sc = scene("very_dark", seed=6, closed="right")
    result = eye_colour(sc.image, sc.points, shade="forest")
    assert result.report["sides"]["right"] == "closed"
    assert not (changed(result.image, sc.image) & ~sc.truth["left_iris"]).any()
    zero = eye_colour(sc.image, sc.points, strength=0)
    assert zero.reason_code == "zero_strength" and np.array_equal(zero.image, sc.image)
    with pytest.raises(ValueError, match="shade"):
        eye_colour(sc.image, sc.points, shade="violet-glow")
    assert eye_colour(sc.image, sc.points[:10]).reason_code == "wrong_shape"


# ---- #55 glasses glare ---------------------------------------------------------------------

def test_glare_is_filled_beside_the_eyes_and_the_eyes_never_change() -> None:
    sc = scene(glare=True, alpha=True)
    result = remove_glare(sc.image, sc.points)
    assert result.status == "edited"
    glare = sc.truth["glare_outside"]
    halo = dilate(glare.astype(np.float32), 1.5) >= 0.5
    moved = changed(result.image, sc.image)
    assert not (moved & ~halo).any()
    assert not (moved & sc.truth["eyes"]).any()
    over = sc.truth["glare_over_eye"]
    assert over.any() and np.array_equal(result.image[over], sc.image[over])
    before = sc.image[glare, :3].astype(float).mean(axis=0)
    after = result.image[glare, :3].astype(float).mean(axis=0)
    assert before.min() > 240 and after.max() < 215
    np.testing.assert_array_equal(result.image[..., 3], sc.image[..., 3])


def test_glare_strength_zero_and_no_glare_are_coded() -> None:
    sc = scene(glare=True)
    half = remove_glare(sc.image, sc.points, strength=50)
    glare = sc.truth["glare_outside"]
    full = remove_glare(sc.image, sc.points)
    assert (half.image[glare, 0] > full.image[glare, 0]).mean() > 0.9
    zero = remove_glare(sc.image, sc.points, strength=0)
    assert zero.reason_code == "zero_strength" and np.array_equal(zero.image, sc.image)
    plain = scene("very_light", seed=4)
    none = remove_glare(plain.image, plain.points)
    assert (none.status, none.reason_code) == ("not_applicable", "no_glare")
    assert np.array_equal(none.image, plain.image)


# ---- #51 old photo restoration -------------------------------------------------------------

def test_old_photo_scratches_and_dust_are_found_and_marks_are_kept() -> None:
    sc = old_scene()
    marks = find_scratches(sc.image, sc.points)
    truth = sc.truth["scratches"] | sc.truth["specks"]
    assert np.array_equal(marks, truth)
    for x, y, _ in sc.marks:
        assert not marks[int(y), int(x)]
    assert not find_scratches(old_scene(scratches=False).image, sc.points).any()


def test_old_photo_repair_fills_scratches_restores_tone_and_keeps_moles() -> None:
    sc = old_scene()
    result = restore_old_photo(sc.image, sc.points)
    assert result.status == "edited"
    assert result.report["condition"] == "old" and result.report["tone_applied"]
    lines = sc.truth["scratches"]
    ys, xs = np.nonzero(lines)
    after = result.image[ys, xs, :3].astype(float)
    beside = result.image[ys, np.minimum(xs + 3, sc.image.shape[1] - 1), :3].astype(float)
    assert np.abs(after - beside).mean() < 12
    clean = ~(lines | sc.truth["specks"])
    assert float(result.image[clean, :3].std()) > float(sc.image[clean, :3].std())
    for x, y, r in sc.marks:
        cy, cx, step = int(y), int(x), int(r * 3) + 2
        def depth(img: np.ndarray, cy: int = cy, cx: int = cx, step: int = step) -> float:
            around = (img[cy, cx - step, :3].astype(float) + img[cy, cx + step, :3].astype(float)) / 2
            return float(around.mean() - img[cy, cx, :3].astype(float).mean())
        assert depth(result.image) >= 0.8 * depth(sc.image) - 1, (x, y)


def test_old_photo_without_face_points_takes_only_bright_lines() -> None:
    sc = old_scene()
    marks = find_scratches(sc.image, None)
    assert marks[sc.truth["scratches"]].all()
    assert not marks[sc.truth["specks"]].any()


def test_old_photo_clean_zero_and_bad_mesh_are_coded() -> None:
    clean = scene("light", seed=2)
    none = restore_old_photo(clean.image, clean.points)
    assert (none.status, none.reason_code) == ("not_applicable", "no_scratches")
    assert np.array_equal(none.image, clean.image)
    sc = old_scene()
    zero = restore_old_photo(sc.image, sc.points, strength=0)
    assert zero.reason_code == "zero_strength" and np.array_equal(zero.image, sc.image)
    assert restore_old_photo(sc.image, sc.points[:20]).reason_code == "wrong_shape"


# ---- #59 object removal --------------------------------------------------------------------

def test_marked_photobomber_is_removed_and_nothing_else_changes() -> None:
    sc = bomber_scene(alpha=True)
    mask = sc.truth["brush"].astype(np.float32)
    result = remove_object(sc.image, mask, landmarks=sc.points)
    assert result.status == "edited" and result.report["method"] == "patchmatch"
    grown = dilate(mask, 2.0) >= 0.5
    moved = changed(result.image, sc.image)
    assert not (moved & ~grown).any()
    blob = sc.truth["bomber"]
    rgb = result.image[blob, :3].astype(int)
    assert ((rgb[:, 0] - rgb[:, 1] > 120) & (rgb[:, 2] - rgb[:, 1] > 100)).sum() == 0
    np.testing.assert_array_equal(result.image[..., 3], sc.image[..., 3])
    again = remove_object(sc.image, mask, landmarks=sc.points)
    assert np.array_equal(again.image, result.image)


def test_removal_refuses_the_face_a_huge_area_and_an_empty_mark() -> None:
    sc = bomber_scene()
    on_face = brush_mask(HEIGHT, WIDTH, [sc.points[1]], 8.0)
    face = remove_object(sc.image, on_face, landmarks=sc.points)
    assert (face.status, face.reason_code) == ("refused", "covers_face")
    assert np.array_equal(face.image, sc.image)
    huge = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    huge[:, : int(WIDTH * (MAX_AREA_SHARE + 0.05))] = 1
    assert remove_object(sc.image, huge).reason_code == "area_too_large"
    empty = remove_object(sc.image, np.zeros((HEIGHT, WIDTH)))
    assert (empty.status, empty.reason_code) == ("not_applicable", "nothing_marked")
    zero = remove_object(sc.image, sc.truth["brush"], strength=0)
    assert zero.reason_code == "zero_strength" and np.array_equal(zero.image, sc.image)
    with pytest.raises(ValueError, match="matching"):
        remove_object(sc.image, np.ones((4, 4)))


# ---- #64 ID photo crop guide ---------------------------------------------------------------

@pytest.mark.parametrize("preset", sorted(PRESETS))
def test_id_crop_puts_the_head_in_the_preset_band_and_copies_pixels(preset: str) -> None:
    sc = id_scene(alpha=True)
    crop = id_crop(sc.image, sc.points, preset=preset)
    assert crop.status == "edited" and crop.box is not None
    left, top, width, height = crop.box
    spec = PRESETS[preset]
    assert abs(width / height - spec["aspect"]) < 0.01
    assert spec["head_min"] <= crop.checks["head_share"] <= spec["head_max"]
    assert np.array_equal(crop.image, sc.image[top:top + height, left:left + width])
    assert abs(crop.guides["centre_x"] - width / 2) <= 1
    assert crop.checks["level"] and crop.checks["frontal"]
    assert "does not check any official rules" in crop.label
    drawn = guide_overlay(crop)
    y = int(np.floor(crop.guides["chin_y"] + 0.5))
    assert (drawn[y, :, :3] == (0, 140, 255)).all()
    assert np.array_equal(drawn[..., 3], crop.image[..., 3])


def test_id_crop_flags_a_tilted_head_and_refuses_without_room() -> None:
    sc = id_scene()
    tilted = sc.points.copy()
    tilted[473, 1] += 8
    checks = id_crop(sc.image, tilted).checks
    assert checks["level"] is False and checks["roll_degrees"] > 5
    tight = scene()
    refused = id_crop(tight.image, tight.points)
    assert (refused.status, refused.reason_code) == ("refused", "not_enough_margin")
    assert np.array_equal(refused.image, tight.image)
    assert id_crop(sc.image, sc.points, preset="poster").reason_code == "unknown_preset"
    assert id_crop(sc.image, sc.points[:5]).reason_code == "wrong_shape"
