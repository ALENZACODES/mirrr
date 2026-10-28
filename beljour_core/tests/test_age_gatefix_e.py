"""Drawn head-cover and Q4 regressions for local age-look simulations.

No real person, downloaded photo, biometric fixture or model file is used.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.shape import age
from plumb_api.engines.shape.age_protection import (
    compose_protected,
    interior_alpha,
    validated_protection,
)
from plumb_api.engines.shape.geometry import frame
from plumb_api.quality.metrics import q4_seam

from tests.gatefix_e_drawn import TONES, build_case, pad_case


@pytest.mark.parametrize("covering", ["band", "wrap"])
@pytest.mark.parametrize("stop", [-3, -2, -1, 1, 3, 5])
def test_protected_cloth_is_byte_identical(covering: str, stop: int) -> None:
    case = build_case(covering=covering)
    original = case.image.copy()
    output, edit, metrics = age.render(
        case.image, case.face, stop=stop, seed=19, protected_mask=case.covering
    )
    protected = case.covering >= 0.5
    np.testing.assert_array_equal(output[protected], original[protected])
    np.testing.assert_array_equal(case.image, original)
    assert edit.shape == original.shape[:2]
    assert np.all(np.isfinite(output))
    assert metrics["label"] == age.LABEL
    assert metrics["guard_scale"] >= 0.0
    assert np.count_nonzero(edit[protected]) == 0


@pytest.mark.parametrize("tone", TONES)
@pytest.mark.parametrize("covering", ["band", "wrap"])
def test_covering_contour_is_preserved_across_flat_tones(tone: int, covering: str) -> None:
    case = build_case(tone=tone, covering=covering)
    result, edit, _ = age.render(
        case.image, case.face, stop=3, seed=17, protected_mask=case.covering
    )
    marked = case.covering >= 0.5
    np.testing.assert_array_equal(result[marked], case.image[marked])
    assert int(edit[marked].sum()) == 0
    score = q4_seam(case.image, result, case.oval)
    assert score.passed
    assert float(score.measured["ratio"]) <= 1.5


@pytest.mark.parametrize("stop", [-3, -2, -1, 1, 2, 3, 4, 5])
def test_age_boundary_q4_is_unchanged_and_pinned(stop: int) -> None:
    case = build_case()
    result, edit, _ = age.render(case.image, case.face, stop=stop, seed=9)
    check = q4_seam(case.image, result, case.oval)
    assert check.passed
    assert float(check.measured["ratio"]) <= 1.5
    assert result.dtype == np.uint8
    assert result.shape == case.image.shape
    assert np.isfinite(result.astype(float)).all()
    assert np.any(edit > 0)
    np.testing.assert_array_equal(result[0, 0], case.image[0, 0])
    np.testing.assert_array_equal(result[-1, -1], case.image[-1, -1])


@pytest.mark.parametrize("tone", TONES)
def test_age_skin_tone_cannot_change_protected_pixels(tone: int) -> None:
    case = build_case(tone=tone, covering="wrap")
    output, _, _ = age.render(
        case.image, case.face, stop=5, seed=7, protected_mask=case.covering
    )
    keep = case.covering > 0.5
    assert keep.any()
    assert np.array_equal(output[keep], case.image[keep])


@pytest.mark.parametrize("mode", ["monochrome", "sepia", "rgba"])
def test_age_covering_is_stable_in_alternate_encodings(mode: str) -> None:
    flags = {mode: True}
    case = build_case(tone=185, covering="wrap", **flags)
    source = case.image.copy()
    result, _, _ = age.render(
        case.image, case.face, stop=3, seed=17, protected_mask=case.covering
    )
    assert np.array_equal(result[case.covering > 0.5], source[case.covering > 0.5])
    if mode == "rgba":
        np.testing.assert_array_equal(result[:, :, 3], source[:, :, 3])
    np.testing.assert_array_equal(case.image, source)


@pytest.mark.parametrize("orientation", [-12.0, -7.0, 0.0, 9.0, 16.0])
def test_rotated_face_mask_does_not_create_a_background_seam(orientation: float) -> None:
    case = build_case(orientation=orientation, covering="wrap")
    result, _, _ = age.render(
        case.image, case.face, stop=2, seed=123, protected_mask=case.covering
    )
    assert q4_seam(case.image, result, case.oval).passed
    covered = case.covering > 0.5
    np.testing.assert_array_equal(result[covered], case.image[covered])


@pytest.mark.parametrize("composition", ["single", "two", "three"])
def test_people_outside_the_selected_face_are_unchanged(composition: str) -> None:
    case = build_case(composition=composition, covering="band")
    result, _, _ = age.render(
        case.image, case.face, stop=5, seed=23, protected_mask=case.covering
    )
    outside = case.oval < 0.5
    np.testing.assert_array_equal(result[outside], case.image[outside])
    assert result.shape == case.image.shape


def test_padding_does_not_change_mask_semantics() -> None:
    original = build_case(tone=35, covering="wrap")
    case = pad_case(original, pixels=14)
    output, edit, _ = age.render(
        case.image, case.face, stop=-2, protected_mask=case.covering
    )
    outside = np.zeros(case.image.shape[:2], dtype=bool)
    outside[:14] = True
    outside[-14:] = True
    outside[:, :14] = True
    outside[:, -14:] = True
    np.testing.assert_array_equal(output[outside], case.image[outside])
    assert not edit[outside].any()
    assert q4_seam(case.image, output, case.oval).passed


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), -0.1, 1.1])
def test_invalid_covering_alpha_rejected(bad: float) -> None:
    case = build_case(covering="wrap")
    marked = case.covering.copy()
    marked[0, 0] = bad
    with pytest.raises(ValueError):
        age.render(case.image, case.face, stop=3, protected_mask=marked)


def test_protection_rejects_non_numeric_or_wrong_shape() -> None:
    case = build_case()
    height, width = case.image.shape[:2]
    for invalid in (
        np.zeros((height + 1, width)),
        np.full((height, width), "some text"),
        np.zeros((height, width, 1)),
    ):
        with pytest.raises(ValueError):
            validated_protection(invalid, height, width)


def test_default_covering_requirement_is_explicit_not_inferred() -> None:
    case = build_case(covering="band")
    # No automatic cloth inference is claimed. The opt-in marked region is binding.
    unprotected, _, _ = age.render(case.image, case.face, stop=4)
    protected, _, _ = age.render(
        case.image, case.face, stop=4, protected_mask=case.covering
    )
    marked = case.covering > 0.5
    assert np.any(unprotected[marked] != case.image[marked])
    assert np.array_equal(protected[marked], case.image[marked])


def test_full_covering_blocks_every_edit_and_keeps_alpha() -> None:
    case = build_case(rgba=True)
    full = np.ones(case.image.shape[:2], dtype=float)
    output, edit, _ = age.render(case.image, case.face, stop=5, protected_mask=full)
    np.testing.assert_array_equal(output, case.image)
    assert not np.any(edit)


def test_central_unprotected_skin_remains_editable() -> None:
    case = build_case(covering="band")
    result, edit, _ = age.render(
        case.image, case.face, stop=5, seed=17, protected_mask=case.covering
    )
    active = (case.oval > 0.9) & (case.covering == 0)
    assert np.count_nonzero(edit[active]) > 0
    assert not np.array_equal(result[active], case.image[active])


def test_age_mask_has_no_halo_outside_an_unmarked_oval() -> None:
    case = build_case()
    alpha = interior_alpha(
        case.face, case.image.shape[0], case.image.shape[1], iod=frame(case.face).iod
    )
    outside = case.oval < 0.5
    assert not np.any(alpha[outside])
    assert np.min(alpha) == 0.0
    assert np.max(alpha) <= 1.0
    assert np.count_nonzero(alpha > 0.9) > 100


def test_protection_composite_handles_identity_exactly() -> None:
    case = build_case(covering="band")
    output = compose_protected(
        case.image,
        case.image,
        case.face,
        iod=frame(case.face).iod,
        protected_mask=case.covering,
    )
    np.testing.assert_array_equal(output, case.image)


def test_protection_stays_in_source_colour_units() -> None:
    case = build_case(tone=68, covering="wrap")
    edited = 255 - case.image
    output = compose_protected(
        case.image,
        edited,
        case.face,
        iod=frame(case.face).iod,
        protected_mask=case.covering,
    )
    assert output.dtype == np.uint8
    assert int(output.max()) <= 255
    assert int(output.min()) >= 0
    np.testing.assert_array_equal(output[case.covering > 0.5], case.image[case.covering > 0.5])


def test_source_mask_and_output_do_not_alias() -> None:
    case = build_case(covering="band")
    source = case.image.copy()
    cover = case.covering.copy()
    edited = case.image.copy()
    edited[:, :, 0] = 0
    output = compose_protected(
        case.image, edited, case.face, iod=frame(case.face).iod, protected_mask=cover
    )
    assert not np.shares_memory(output, case.image)
    np.testing.assert_array_equal(case.image, source)
    np.testing.assert_array_equal(case.covering, cover)
