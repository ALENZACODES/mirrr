"""Synthetic low-light and two-face filters, including missed-mask cases.

This is not a demographic or real-face fairness result. Both drawn people
must pass independently; averaging away a failure is prohibited.
Created by John Khan.
"""
from __future__ import annotations

import copy
from dataclasses import replace

import numpy as np
import pytest

from plumb_api.filters import engine
from plumb_api.filters.masks.blend import FilterMasks
from plumb_api.filters.qa import cover, fixtures
from plumb_api.filters.recipe import registry

CAT = registry.default()
SAMPLES = ("C01", "C03", "C08", "C09", "C20", "C28", "C33", "M02")


def test_two_independent_faces_with_distinct_skin_tones() -> None:
    scene = fixtures.group_scene("very_light", "very_dark")
    assert scene.faces[0].shape == scene.image.shape[:2]
    assert scene.faces[1].shape == scene.image.shape[:2]
    assert scene.tones == ("very_light", "very_dark")
    assert not np.any(scene.faces[0] & scene.faces[1])
    assert scene.faces[0].sum() > 100
    assert scene.faces[1].sum() > 100
    assert scene.masks.skin is not None
    assert scene.masks.person is not None
    assert np.all(scene.masks.skin[scene.faces[0]] >= 0.75)
    assert np.all(scene.masks.skin[scene.faces[1]] >= 0.75)
    assert scene.masks.source == "segmenter"


def test_group_photo_has_background_gap_and_no_overlap() -> None:
    scene = fixtures.group_scene("light", "dark")
    assert np.all(scene.image[:, 96:108] == (219, 224, 233))
    assert scene.masks.skin is not None
    assert np.count_nonzero(scene.masks.skin[:, 96:108]) == 0
    assert not np.any(scene.faces[0] & scene.faces[1])


def test_low_light_is_really_darker_without_destroying_photo_dimensions() -> None:
    original = fixtures.group_scene("tan", "dark")
    dim = fixtures.group_scene("tan", "dark", low_light=True)
    assert dim.image.shape == original.image.shape
    assert dim.image.dtype == np.uint8
    assert float(dim.image.mean()) < float(original.image.mean()) * 0.45
    assert np.array_equal(dim.faces[0], original.faces[0])
    assert np.array_equal(dim.faces[1], original.faces[1])


def test_single_low_light_fixture_has_valid_evidence() -> None:
    scene = fixtures.dim_scene("very_dark")
    assert scene.condition == "low-light"
    assert scene.tones == ("very_dark",)
    assert len(scene.faces) == 1
    assert scene.masks.skin is not None
    assert np.count_nonzero(scene.faces[0]) > 100
    assert scene.image.dtype == np.uint8


@pytest.mark.parametrize("recipe_id", SAMPLES)
def test_two_person_protection_per_face(recipe_id: str) -> None:
    scene = fixtures.group_scene("very_light", "very_dark")
    report = cover.evaluate_edge(CAT.get(recipe_id), scene)
    assert report.faces == 2
    assert report.protected_faces == 2
    assert report.deterministic
    assert report.original_unchanged_on_protected_skin
    assert report.passed, (recipe_id, report.problems)


@pytest.mark.parametrize("recipe_id", SAMPLES)
def test_two_person_low_light_protection_per_face(recipe_id: str) -> None:
    scene = fixtures.group_scene("medium", "dark", low_light=True)
    report = cover.evaluate_edge(CAT.get(recipe_id), scene)
    assert report.faces == 2
    assert report.protected_faces == 2
    assert report.passed, (recipe_id, report.problems)


@pytest.mark.parametrize("recipe_id", SAMPLES)
def test_low_light_solo_photo_preserves_skin_on_protect(recipe_id: str) -> None:
    scene = fixtures.dim_scene("very_dark")
    report = cover.evaluate_edge(CAT.get(recipe_id), scene)
    assert report.faces == 1
    assert report.protected_faces == 1
    assert report.passed, (recipe_id, report.problems)


def test_group_missing_second_face_mask_fails_even_if_first_face_passes() -> None:
    scene = fixtures.group_scene()
    assert scene.masks.skin is not None
    missing = scene.masks.skin.copy()
    missing[scene.faces[1]] = 0.0
    bad = replace(scene, masks=FilterMasks(missing, scene.masks.person, "segmenter"))
    report = cover.evaluate_edge(CAT.get("C08"), bad)
    assert not report.passed
    assert report.protected_faces < 2
    assert any("face 2" in failure for failure in report.problems)


def test_group_missing_first_face_mask_fails_even_if_second_face_passes() -> None:
    scene = fixtures.group_scene()
    assert scene.masks.skin is not None
    missing = scene.masks.skin.copy()
    missing[scene.faces[0]] = 0.0
    bad = replace(scene, masks=FilterMasks(missing, scene.masks.person, "segmenter"))
    report = cover.evaluate_edge(CAT.get("C08"), bad)
    assert not report.passed
    assert report.protected_faces < 2
    assert any("face 1" in failure for failure in report.problems)


def test_group_mask_rejects_nan_before_render() -> None:
    scene = fixtures.group_scene()
    assert scene.masks.skin is not None
    broken = scene.masks.skin.copy()
    broken[20, 20] = float("nan")
    with pytest.raises(ValueError, match="mask alpha"):
        cover.evaluate_edge(CAT.get("C08"), replace(scene, masks=FilterMasks(
            broken, scene.masks.person, "segmenter"
        )))


def test_group_mask_rejects_negative_alpha() -> None:
    scene = fixtures.group_scene()
    assert scene.masks.skin is not None
    broken = scene.masks.skin.copy()
    broken[20, 20] = -0.5
    with pytest.raises(ValueError, match="mask alpha"):
        engine.render(scene.image, CAT.get("C08"), masks=FilterMasks(broken, scene.masks.person, "segmenter"))


def test_group_regions_reject_incorrect_dimensions() -> None:
    scene = fixtures.group_scene()
    wrong = replace(scene, faces=(np.zeros((2, 3), dtype=bool), scene.faces[1]))
    with pytest.raises(ValueError, match="each edge face"):
        cover.evaluate_edge(CAT.get("C08"), wrong)


def test_group_rejects_missing_constituent_face() -> None:
    scene = fixtures.group_scene()
    wrong = replace(scene, faces=(scene.faces[0],))
    with pytest.raises(ValueError, match="each constituent face"):
        cover.evaluate_edge(CAT.get("C08"), wrong)


def test_lowlight_preserves_original_input_buffers() -> None:
    scene = fixtures.dim_scene("dark")
    original = scene.image.copy()
    original_mask = copy.deepcopy(scene.masks.skin)
    cover.evaluate_edge(CAT.get("C09"), scene)
    assert np.array_equal(scene.image, original)
    assert np.array_equal(scene.masks.skin, original_mask)


def test_group_rejects_missing_skin_mask() -> None:
    scene = fixtures.group_scene()
    bad = replace(scene, masks=FilterMasks(None, scene.masks.person, "segmenter"))
    with pytest.raises(ValueError, match="skin mask"):
        cover.evaluate_edge(CAT.get("C08"), bad)


def test_identity_lock_default_stays_enabled_with_optional_guard_disabled() -> None:
    scene = fixtures.group_scene("light", "dark")
    out = engine.render(scene.image, CAT.get("C01"), engine.Settings(guard=False), scene.masks)
    assert out.plan.identity_lock
    assert out.image.shape == scene.image.shape


def test_both_people_keep_hard_mask_pixels_even_when_optional_guard_disabled() -> None:
    scene = fixtures.group_scene("light", "very_dark")
    out = engine.render(scene.image, CAT.get("C09"),
                        engine.Settings(guard=False, protect_skin=True), scene.masks)
    for region in scene.faces:
        assert np.array_equal(out.image[region], scene.image[region])
