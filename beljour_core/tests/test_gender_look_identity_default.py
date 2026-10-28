"""R25c identity lock must not be skipped by default. Author: John Khan."""

from __future__ import annotations

import numpy as np

from plumb_api.engines.gender_look.levels import GenderLevelEngine, GuardDecision, PixelChangeGuard


def scene(tone: int) -> np.ndarray:
    yy, xx = np.mgrid[:32, :32]
    image = np.zeros((32, 32, 4), dtype=np.uint8)
    image[..., 0] = ((tone + 2 * xx + 3 * yy) % 256).astype(np.uint8)
    image[..., 1] = ((tone + xx + 4 * yy) % 256).astype(np.uint8)
    image[..., 2] = ((tone + 3 * xx + 2 * yy) % 256).astype(np.uint8)
    image[..., 3] = 255
    return image


class CountingSource:
    def masks(self, photo_hash: str, photo: np.ndarray) -> dict[str, np.ndarray]:
        yy, xx = np.mgrid[:photo.shape[0], :photo.shape[1]]
        return {
            "brow": ((yy >= 5) & (yy <= 9) & (xx >= 5) & (xx <= 26)).astype(float),
            "skin": ((yy >= 8) & (yy <= 27) & (xx >= 6) & (xx <= 25)).astype(float),
            "stubble": ((yy >= 21) & (yy <= 26) & (xx >= 8) & (xx <= 23)).astype(float),
        }


class PassThrough:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


def change(before: np.ndarray, after: np.ndarray) -> float:
    return float(np.mean(np.abs(before[..., :3].astype(float) - after[..., :3].astype(float))))


def test_default_level_calls_guard_and_backs_off_strong_edit() -> None:
    image = scene(120)
    default = GenderLevelEngine(CountingSource())
    without_bound = GenderLevelEngine(CountingSource(), PassThrough())
    bounded = default.render(image, "masculine", 5, primary_box=(0, 0, 1, 1))
    requested = without_bound.render(image, "masculine", 5, primary_box=(0, 0, 1, 1))
    assert bounded.guard_called
    assert change(image, bounded.image) <= change(image, requested.image) + 1e-9
    assert np.array_equal(bounded.image[..., 3], image[..., 3])


def test_user_may_lower_lock_but_not_disable_default_guard() -> None:
    image = scene(150)
    engine = GenderLevelEngine(CountingSource(), PixelChangeGuard())
    strict = engine.render(image, "feminine", 5, primary_box=(0, 0, 1, 1))
    relaxed = engine.render(image, "feminine", 5, primary_box=(0, 0, 1, 1), lock_level=1)
    assert strict.guard_called and relaxed.guard_called
    assert change(image, relaxed.image) >= change(image, strict.image)
