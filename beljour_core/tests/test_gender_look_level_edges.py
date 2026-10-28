"""R25c identity-contract fault handling and preview invariants. Author: John Khan."""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.gender_look.levels import GenderLevelEngine, GuardDecision


def scene(seed: int) -> np.ndarray:
    yy, xx = np.mgrid[:48, :56]
    photo = np.empty((48, 56, 4), dtype=np.uint8)
    photo[..., 0] = ((seed + yy * 5 + xx) % 256).astype(np.uint8)
    photo[..., 1] = ((seed + yy * 3 + xx * 2) % 256).astype(np.uint8)
    photo[..., 2] = ((seed + yy + xx * 7) % 256).astype(np.uint8)
    photo[..., 3] = ((xx * 7 + yy) % 256).astype(np.uint8)
    return photo


class CountedProvider:
    def __init__(self, bad: bool = False) -> None:
        self.calls = 0
        self.bad = bad

    def masks(self, photo_hash: str, photo: np.ndarray) -> dict[str, np.ndarray]:
        self.calls += 1
        area = np.ones(photo.shape[:2], dtype=float)
        area[:6] = 0
        if self.bad:
            area[8, 8] = float("nan")
        return {"brow": area, "skin": area, "stubble": area}


class InvalidGuard:
    def __init__(self, malformed: bool) -> None:
        self.malformed = malformed

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        if self.malformed:
            return GuardDecision(np.zeros((2, 3, 4), dtype=np.uint8), 0.0, False)
        changed = after.copy()
        changed[..., 3] = 0
        changed[..., :3] = 255
        return GuardDecision(changed, 0.0, False)


def test_replacing_photo_never_reuses_prior_mask_evidence() -> None:
    provider = CountedProvider()
    engine = GenderLevelEngine(provider)
    for seed in (60, 80, 60):
        image = scene(seed)
        result = engine.render(image, "feminine", 3.5, primary_box=(0, 0, 1, 1))
        assert result.status == "rendered"
    assert provider.calls == 2


def test_bad_masks_fail_instead_of_falling_back_to_whole_image() -> None:
    provider = CountedProvider(bad=True)
    engine = GenderLevelEngine(provider)
    with pytest.raises(ValueError, match="mask must be finite"):
        engine.render(scene(42), "masculine", 5, primary_box=(0, 0, 1, 1))


def test_invalid_external_identity_guard_result_is_refused() -> None:
    engine = GenderLevelEngine(CountedProvider(), InvalidGuard(malformed=True))
    with pytest.raises(ValueError, match="identity guard returned incompatible"):
        engine.render(scene(10), "feminine", 5, primary_box=(0, 0, 1, 1))


def test_faulty_guard_cannot_erase_alpha_or_modify_other_face() -> None:
    photo = scene(81)
    engine = GenderLevelEngine(CountedProvider(), InvalidGuard(malformed=False))
    result = engine.render(photo, "masculine", 5, primary_box=(0, 0, 0.5, 1))
    assert np.array_equal(result.image[..., 3], photo[..., 3])
    assert np.array_equal(result.image[:, 28:], photo[:, 28:])


def test_resized_preview_preserves_original_source_and_has_expected_corner_pixels() -> None:
    image = scene(111)
    source = CountedProvider()
    engine = GenderLevelEngine(source)
    result = engine.render(image, "feminine", 2.0, primary_box=(0, 0, 1, 1), preview_edge=24)
    final = engine.render(image, "feminine", 2.0, primary_box=(0, 0, 1, 1))
    assert result.image.shape == (21, 24, 4)
    assert np.array_equal(result.image[0, 0], final.image[0, 0])
    assert np.array_equal(result.image[-1, -1], final.image[-1, -1])
    assert source.calls == 1
    assert np.array_equal(image, scene(111))
