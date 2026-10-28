"""Adult pigment and non-destructive geometry checks. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.brows import render_brows
from plumb_api.engines.brows.geometry import brow_frames, curve_points, union
from plumb_api.engines.brows.pigment import compare_methods, noise
from plumb_api.engines.brows.shape import design_shape
from plumb_api.engines.brows.synthetic import brow_fixture


@pytest.mark.parametrize("feature", ["W71", "W72"])
@pytest.mark.parametrize("value", [None, False, 0, 1, "true", [], {}])
def test_adult_attestation_cannot_be_inferred_or_coerced(feature: str, value: object) -> None:
    image, points, _ = brow_fixture()
    settings = {} if value is None else {"adultConfirmed": value}
    with pytest.raises(ValueError, match="adult|boolean"):
        render_brows(image, points, feature, settings)


@pytest.mark.parametrize("feature", ["W71", "W72"])
@pytest.mark.parametrize("tone", [45, 80, 120, 165, 205, 235])
def test_pigment_healed_default_is_contained_without_lightening_background(feature: str, tone: int) -> None:
    image, points, _ = brow_fixture(tone=tone, rgba=True)
    original = image.copy()
    result = render_brows(image, points, feature, {"adultConfirmed": True, "amount": 1})
    region = union(brow_frames(points, 128, 128))
    assert result.metrics["state"] == "healed"
    assert result.metrics["maximum_opacity"] <= 0.28
    assert result.metrics["prediction"] is False
    assert result.metrics["new_hair_claim"] is False
    assert np.array_equal(result.image[region == 0], image[region == 0])
    assert np.array_equal(image, original)
    assert np.array_equal(result.image[..., 3], image[..., 3])
    assert any("professional" in warning for warning in result.warnings)


def test_fresh_healed_faded_have_ordered_actual_pixel_change() -> None:
    image, points, _ = brow_fixture(tone=190)
    settings = {"adultConfirmed": True, "amount": 1, "colour": [30, 25, 20]}
    change = []
    for state in ("fresh", "healed", "faded"):
        result = render_brows(image, points, "W71", {**settings, "state": state})
        change.append(float(np.sum(np.abs(result.image.astype(float) - image))))
    assert change[0] > change[1] > change[2] > 0


def test_three_methods_are_different_on_the_same_face_and_settings() -> None:
    image, points, _ = brow_fixture()
    outputs = compare_methods(image, brow_frames(points, 128, 128), {"adultConfirmed": True, "amount": 1})
    assert set(outputs) == {"microblading", "powder", "nano"}
    assert not np.array_equal(outputs["microblading"].image, outputs["powder"].image)
    assert not np.array_equal(outputs["nano"].image, outputs["powder"].image)
    assert not np.array_equal(outputs["microblading"].support, outputs["nano"].support)
    assert outputs["powder"].metrics["pigment_strokes"] == 0
    assert outputs["nano"].metrics["pigment_strokes"] > 0


def test_powder_density_cannot_make_a_solid_block() -> None:
    image, points, _ = brow_fixture()
    for state in ("fresh", "healed", "faded"):
        result = render_brows(image, points, "W72", {"adultConfirmed": True, "density": 0.75, "amount": 1, "state": state})
        assert float(np.max(result.support)) <= 0.75 * 0.45 * 0.72
        assert len(np.unique(result.support[result.support > 0])) > 20
    with pytest.raises(ValueError, match="density"):
        render_brows(image, points, "W72", {"adultConfirmed": True, "density": 1})


def test_pigment_zero_is_identity_for_every_method() -> None:
    image, points, _ = brow_fixture()
    outputs = compare_methods(image, brow_frames(points, 128, 128), {"adultConfirmed": True, "amount": 0})
    for result in outputs.values():
        assert np.array_equal(result.image, image)
        assert not np.any(result.support)


def test_low_contrast_pigment_discloses_the_actual_limitation() -> None:
    image, points, _ = brow_fixture(tone=72)
    result = render_brows(image, points, "W71", {"adultConfirmed": True, "colour": [70, 63, 56]})
    assert result.metrics["observed_pigment_contrast"] < 25
    assert any("low contrast" in warning for warning in result.warnings)


def test_seed_changes_texture_but_never_geometry_or_support_extent() -> None:
    image, points, _ = brow_fixture()
    one = render_brows(image, points, "W72", {"adultConfirmed": True, "seed": 17})
    two = render_brows(image, points, "W72", {"adultConfirmed": True, "seed": 89})
    same = render_brows(image, points, "W72", {"adultConfirmed": True, "seed": 17})
    assert np.array_equal(one.image, same.image)
    assert not np.array_equal(one.image, two.image)
    assert np.array_equal(one.support > 0, two.support > 0)
    assert one.metrics["geometry_changed"] is False
    assert noise(37, 17) == noise(37, 17)
    assert 0 <= noise(2147483647, 2147483647) < 1


def test_default_shape_preserves_independent_width_and_asymmetry() -> None:
    image, points, _ = brow_fixture(asymmetric=True)
    frames = brow_frames(points, 128, 128)
    design = design_shape(frames)
    assert design["automatic_thinning"] is False
    assert design["geometry_preserved"] is True
    assert design["thickness_scale"] == 1
    left, right = design["brows"][1], design["brows"][0]
    assert left["width_px"] != right["width_px"]
    assert left["height_px"] != right["height_px"]
    assert np.allclose(right["centreline"][0], frames[0].inner)
    assert np.allclose(left["centreline"][-1], frames[1].tail)
    assert left["proposed_thickness_px"] == frames[1].height
    assert right["proposed_thickness_px"] == frames[0].height
    assert render_brows(image, points, "W73").metrics["guide_only"] is True


def test_shape_never_auto_thins_and_has_independent_arch_controls() -> None:
    _, points, _ = brow_fixture()
    frames = brow_frames(points, 128, 128)
    with pytest.raises(ValueError, match="thickness"):
        design_shape(frames, {"thickness": 0.9})
    before = design_shape(frames, {"leftArch": 0.08, "rightArch": 0.04})
    after = design_shape(frames, {"leftArch": 0.15, "rightArch": 0.04})
    assert before["brows"][0] == after["brows"][0]
    assert before["brows"][1]["centreline"] != after["brows"][1]["centreline"]


def test_curve_endpoints_and_peak_are_independently_verifiable() -> None:
    _, points, _ = brow_fixture()
    frame = brow_frames(points, 128, 128)[0]
    curve = curve_points(frame, arch=0.1, peak=0.5, tail=0.1, steps=101)
    assert np.allclose(curve[0], frame.inner)
    assert np.allclose(curve[-1], frame.point(1.1, 0))
    u, v = frame.project(*curve[50])
    assert u == pytest.approx(0.55)
    assert v == pytest.approx(0.1)


def test_shape_guides_do_not_mutate_landmarks_or_photo() -> None:
    image, points, _ = brow_fixture(roll=15)
    original, face = image.copy(), points.copy()
    result = render_brows(image, points, "W73", {"amount": 1, "tail": 0.15})
    assert np.array_equal(image, original)
    assert np.array_equal(points, face)
    assert result.metrics["geometry_preserved"] is True
    assert result.metrics["changed_pixels"] > 0
    assert np.array_equal(result.image[result.support == 0], image[result.support == 0])
    assert any("no lifting promise" in warning for warning in result.warnings)
