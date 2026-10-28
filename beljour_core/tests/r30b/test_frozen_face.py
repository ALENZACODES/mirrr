"""Batch-source proof for the immutable face-gate fast path.

Only in-memory drawn portraits. No personal photos, meshes, or mask payloads
are emitted by this test or retained outside its pytest process.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import asdict
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.filters.colour import sample_cache
from plumb_api.filters.masks import guard, hue_lock
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry


def _portrait(tone: str) -> fixtures.Portrait:
    return fixtures.portrait(tone, width=72, height=90, grain=4, seed=41)


@pytest.mark.parametrize("tone", ("very_light", "dark"))
def test_one_private_snapshot_serves_the_whole_filter_pack(tone: str) -> None:
    face = _portrait(tone)
    image = face.image
    masks = face.masks
    before = image.copy()
    assert masks.skin is not None
    with (patch.object(sample_cache, "_digest", wraps=sample_cache._digest) as sample,
          patch.object(hue_lock, "_digest", wraps=hue_lock._digest) as hue,
          patch.object(guard, "_digest", wraps=guard._digest) as guarding):
        prepared = still_her.prepare_face(image, face.face.points, masks)
        initial = (sample.call_count, hue.call_count, guarding.call_count)
        assert all(count >= 1 for count in initial)
        assert prepared.frozen_image is not image
        assert prepared.original_image is image
        assert prepared.original_masks is masks
        assert prepared.frozen_masks.skin is not masks.skin
        assert prepared.frozen_image.flags.owndata
        assert not prepared.frozen_image.flags.writeable
        assert not prepared.frozen_masks.skin.flags.writeable
        assert prepared.sampling.frozen_source is prepared.frozen_image
        assert prepared.hue_source.frozen_photo is prepared.frozen_image
        assert prepared.hue_source.frozen_skin is prepared.frozen_masks.skin
        assert prepared.guard_original.frozen_photo is prepared.frozen_image
        assert prepared.guard_original.frozen_skin is prepared.frozen_masks.skin
        for code in ("C01", "C03", "C53"):
            recipe = registry.default().get(code)
            report = still_her.measure_image(
                recipe, image, face.face.points, masks, tone,
                face_centre=prepared.face_centre, inputs=prepared,
            )
            assert isinstance(asdict(report), dict)
            assert (sample.call_count, hue.call_count, guarding.call_count) == initial, code
    np.testing.assert_array_equal(image, before)
    assert image.flags.writeable
    assert masks.skin.flags.writeable


def test_mutable_public_sampling_reference_still_checks_the_full_photo() -> None:
    portrait = _portrait("medium")
    photo = portrait.image.copy()
    reference = sample_cache.prepare(photo)
    assert reference.frozen_source is None
    assert sample_cache.for_image(reference, photo)
    photo[0, 0, 0] ^= 1
    assert not sample_cache.for_image(reference, photo)


def test_readonly_sampling_binding_falls_back_to_digest_after_unfreeze() -> None:
    portrait = _portrait("dark")
    photo = portrait.image.copy()
    photo.setflags(write=False)
    reference = sample_cache.prepare(photo)
    assert reference.frozen_source is photo
    with patch.object(sample_cache, "_digest", wraps=sample_cache._digest) as digest:
        assert sample_cache.for_image(reference, photo)
        assert digest.call_count == 0
        photo.setflags(write=True)
        photo[0, 0, 0] ^= 1
        assert not sample_cache.for_image(reference, photo)
        assert digest.call_count == 1


def test_readonly_hue_and_guard_sources_fall_back_after_unfreeze() -> None:
    face = _portrait("medium")
    assert face.masks.skin is not None
    photo = face.image.copy()
    mask = face.masks.skin.copy()
    photo.setflags(write=False)
    mask.setflags(write=False)
    hue = hue_lock.prepare_hue(photo, mask)
    prepared = guard.prepare_guard(photo, mask)
    with (patch.object(hue_lock, "_digest", wraps=hue_lock._digest) as hue_hash,
          patch.object(guard, "_digest", wraps=guard._digest) as guard_hash):
        assert hue_lock.clamp_hue(photo, photo, mask, hue).shape == photo.shape
        guard._validate_original(prepared, photo, mask)
        assert hue_hash.call_count == 0
        assert guard_hash.call_count == 0
        mask.setflags(write=True)
        mask[3, 3] = 1.0 - mask[3, 3]
        with pytest.raises(ValueError, match="different photo or skin mask"):
            hue_lock.clamp_hue(photo, photo, mask, hue)
        with pytest.raises(ValueError, match="another photo or mask"):
            guard._validate_original(prepared, photo, mask)
        assert hue_hash.call_count >= 1
        assert guard_hash.call_count >= 1
