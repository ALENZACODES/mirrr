"""A4 face-gate evidence must refuse bad masks before computing a report.

Only new in-memory synthetic faces are used, with no persisted face samples.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict

import numpy as np
import pytest

from plumb_api.engines.proportions import anatomy
from plumb_api.filters.masks import blend
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry


def _face() -> fixtures.Portrait:
    return fixtures.portrait("medium", width=76, height=88, seed=23)


def _record(report: still_her.ToneReport) -> bytes:
    return json.dumps(asdict(report), sort_keys=True, separators=(",", ":"),
                      allow_nan=False).encode("utf-8")


def test_valid_face_snapshot_preserves_exact_cached_and_legacy_reports() -> None:
    face = _face()
    mask = face.masks.skin
    assert mask is not None
    image = face.image.copy()
    before_mask = mask.copy()
    frozen = still_her.prepare_face(image, face.face.points, face.masks)
    for code in ("C01", "C03", "C08", "C53"):
        recipe = registry.default().get(code)
        legacy = still_her.measure_image(recipe, image, face.face.points,
                                         face.masks, "medium", face_centre=frozen.face_centre)
        reused = still_her.measure_image(recipe, image, face.face.points,
                                         face.masks, "medium", face_centre=frozen.face_centre,
                                         inputs=frozen)
        assert hashlib.sha256(_record(legacy)).digest() == hashlib.sha256(_record(reused)).digest()
        assert _record(legacy) == _record(reused)
    np.testing.assert_array_equal(image, face.image)
    np.testing.assert_array_equal(mask, before_mask)


@pytest.mark.parametrize("invalid", [
    lambda image: image[..., 0],
    lambda image: image[..., ::-1].astype(np.float64),
    lambda image: image[:0, :, :],
    lambda image: image[:, :0, :],
    lambda image: image[:, :, :2],
])
def test_refuse_non_rgb_byte_originals(invalid: object) -> None:
    photo = _face()
    assert callable(invalid)
    bad = invalid(photo.image)
    with pytest.raises(ValueError, match="RGB uint8"):
        still_her.prepare_face(bad, photo.face.points, photo.masks)


@pytest.mark.parametrize("variant", [
    "zero", "nan", "infinity", "negative", "over_one", "wrong_size", "missing",
])
def test_refuse_bad_skin_masks_instead_of_recording_fake_quality(variant: str) -> None:
    photo = _face()
    assert photo.masks.skin is not None
    skin = photo.masks.skin.copy()
    if variant == "zero":
        skin.fill(0)
    elif variant == "nan":
        skin.flat[0] = np.nan
    elif variant == "infinity":
        skin.flat[0] = np.inf
    elif variant == "negative":
        skin.flat[0] = -0.01
    elif variant == "over_one":
        skin.flat[0] = 1.01
    elif variant == "wrong_size":
        skin = skin[:-1]
    masks = blend.FilterMasks(None if variant == "missing" else skin,
                              photo.masks.person, photo.masks.source)
    with pytest.raises(ValueError, match="skin mask"):
        still_her.prepare_face(photo.image, photo.face.points, masks)
    with pytest.raises(ValueError, match="skin mask"):
        still_her.measure_image(registry.default().get("C08"), photo.image,
                                photo.face.points, masks, "medium")


@pytest.mark.parametrize("variant", ["nan", "wrong_size", "negative", "over_one"])
def test_refuse_invalid_person_outline_even_with_valid_skin(variant: str) -> None:
    photo = _face()
    assert photo.masks.person is not None
    person = photo.masks.person.copy()
    if variant == "nan":
        person.flat[0] = np.nan
    elif variant == "wrong_size":
        person = person[:, :-1]
    elif variant == "negative":
        person.flat[0] = -0.02
    else:
        person.flat[0] = 2.0
    masks = blend.FilterMasks(photo.masks.skin, person, photo.masks.source)
    with pytest.raises(ValueError, match="person mask"):
        still_her.prepare_face(photo.image, photo.face.points, masks)


@pytest.mark.parametrize("variant", ["nan", "infinity", "short", "one_dimensional", "text"])
def test_refuse_missing_or_nonfinite_mesh(variant: str) -> None:
    photo = _face()
    points = photo.face.points.copy()
    if variant == "nan":
        points[1, 0] = np.nan
    elif variant == "infinity":
        points[3, 1] = np.inf
    elif variant == "short":
        points = points[:15]
    elif variant == "one_dimensional":
        points = points.ravel()
    else:
        points = points.astype(str)
    with pytest.raises(ValueError, match="landmark mesh"):
        still_her.prepare_face(photo.image, points, photo.masks)




@pytest.mark.parametrize("variant", ["coincident_pupils", "zero_face_width"])
def test_refuse_degenerate_mesh_without_a_divide_by_zero(variant: str) -> None:
    photo = _face()
    points = photo.face.points.copy()
    if variant == "coincident_pupils":
        left = anatomy.LANDMARKS["left_pupil"]
        right = anatomy.LANDMARKS["right_pupil"]
        points[left, :2] = points[right, :2]
    else:
        for left, right in ((234, 454), (132, 361), (58, 288),
                            (172, 397), (136, 365)):
            points[left, :2] = points[right, :2]
    with pytest.raises(ValueError, match="non-degenerate landmark"):
        still_her.prepare_face(photo.image, points, photo.masks)


def test_synthetic_mask_alias_does_not_become_writable_during_preparation() -> None:
    photo = _face()
    assert photo.masks.skin is not None
    image = photo.image.copy()
    skin = photo.masks.skin.copy()
    masks = blend.FilterMasks(skin, photo.masks.person, "landmarks")
    original = image.copy()
    source = still_her.prepare_face(image, photo.face.points, masks)
    assert image.flags.writeable and skin.flags.writeable
    assert source.frozen_image.flags.owndata and not source.frozen_image.flags.writeable
    assert source.frozen_masks.skin is not None
    assert not source.frozen_masks.skin.flags.writeable
    np.testing.assert_array_equal(image, original)
    np.testing.assert_array_equal(skin, photo.masks.skin)
