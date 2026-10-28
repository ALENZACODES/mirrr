"""Session W6 pixel preview: memo, explicit reading provenance and guard by default."""
from __future__ import annotations

import hashlib
import io

import numpy as np
import pytest
from PIL import Image

from plumb_api.engines.shade.session import ShadeSession
from tests.test_w6_shade import BACKGROUND, POINTS, drawn, lab_from


def photo() -> np.ndarray:
    return drawn(lab_from(60, 19, 64), seed=88, grain=0.1)


def digest(image: np.ndarray) -> str:
    return hashlib.sha256(image.tobytes()).hexdigest()


def test_five_levels_share_one_reading_and_release_uses_full_resolution() -> None:
    image = photo()
    session = ShadeSession()
    prepared = session.prepare(image, POINTS, background_mask=BACKGROUND)
    assert prepared.photo_hash == digest(image)
    assert prepared.reading.refused is False
    assert prepared.audit.usable
    assert prepared.cheek_mask().shape == image.shape[:2]
    assert prepared.public()["reading"]["tested_against_real_products"] is False
    results = []
    for level in (1.0, 1.1, 1.2, 3.0, 5.0):
        assert session.prepare(image, POINTS, background_mask=BACKGROUND) is prepared
        results.append(session.apply(image, prepared, level, lock_level=1.0))
    assert session.reading_computes == 1
    assert session.render_computes == 5
    assert all(row.identity_guard.engine == "pixel_proxy" for row in results)
    assert all(row.identity_guard.similarity >= 0.9 for row in results)
    assert all(row.label.startswith("In-house") and row.simulated for row in results)
    assert all(row.public()["provider_calls"] == 0 for row in results)
    assert results[0].image != results[-1].image
    with Image.open(io.BytesIO(results[0].image)) as sampled:
        assert sampled.size == (image.shape[1], image.shape[0])
    assert session.apply(image, prepared, 5.0).reading_cached is True
    assert session.render_computes == 5


def test_cache_is_bound_to_supplied_photo_and_landmarks() -> None:
    image = photo()
    session = ShadeSession()
    first = session.prepare(image, POINTS, background_mask=BACKGROUND)
    changed = image.copy()
    changed[0, 0, 0] ^= 1
    with pytest.raises(ValueError, match="another photo"):
        session.apply(changed, first, 3.0)
    other_points = POINTS.copy()
    other_points[4, 0] += 0.5
    second = session.prepare(image, other_points, background_mask=BACKGROUND)
    assert second.evidence_hash != first.evidence_hash
    assert session.reading_computes == 2
    different_background = BACKGROUND.copy()
    different_background[0, 0] = 0.0
    third = session.prepare(image, POINTS, background_mask=different_background)
    assert third.evidence_hash != first.evidence_hash
    assert session.reading_computes == 3
    session.clear()
    session.prepare(image, POINTS, background_mask=BACKGROUND)
    assert session.reading_computes == 4


def test_bad_levels_or_refused_reading_leave_photo_unmodified() -> None:
    image = photo()
    before = image.copy()
    session = ShadeSession()
    prepared = session.prepare(image, POINTS, background_mask=BACKGROUND)
    for bad in (0.5, 5.1, 3.05, float("inf")):
        with pytest.raises(ValueError):
            session.apply(image, prepared, bad)
    assert np.array_equal(image, before)
    refused_image = np.zeros_like(image)
    refused_image[:] = (8, 8, 8)
    refused = session.prepare(refused_image, POINTS)
    assert refused.reading.refused
    with pytest.raises(ValueError, match="not reliable"):
        session.apply(refused_image, refused, 3.0)
