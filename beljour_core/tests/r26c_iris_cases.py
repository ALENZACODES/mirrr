"""Synthetic two-eye scenes and executable Python references. Author: John Khan.

No file or generated fixture is committed by running this module. The JSON
printed in CLI mode contains artificial pixel values only.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

import numpy as np

from plumb_api.engines.eyes.iris_trial import IdentityDecision, IrisObservation, IrisTrialEngine

HEIGHT = 48
WIDTH = 80


def scene(
    background: int = 98, *, hidden: str | None = None,
    channels: int = 3, soft: bool = False,
) -> tuple[np.ndarray, IrisObservation]:
    photo = np.zeros((HEIGHT, WIDTH, channels), dtype=np.uint8)
    photo[..., :3] = (background, max(0, background - 8), min(255, background + 4))
    if channels == 4:
        photo[..., 3] = np.uint8(191)
    yy, xx = np.ogrid[:HEIGHT, :WIDTH]
    mask_right = np.zeros((HEIGHT, WIDTH), dtype=np.float64)
    mask_left = np.zeros_like(mask_right)
    right = (xx - 21) ** 2 + (yy - 20) ** 2 < 7 ** 2
    left = (xx - 59) ** 2 + (yy - 20) ** 2 < 7 ** 2
    mask_right[right] = 1.0
    mask_left[left] = 1.0
    if soft:
        mask_right[right & (xx % 5 == 0)] = 0.49
        mask_left[left & (xx % 5 == 0)] = 0.49
    photo[right, :3] = (43, 36, 32)
    photo[left, :3] = (68, 58, 49)
    photo[17, 20, :3] = (252, 252, 252)
    photo[17, 58, :3] = (252, 252, 252)
    states = {"right_iris": "visible", "left_iris": "visible"}
    if hidden == "right":
        mask_right.fill(0)
        states["right_iris"] = "not_visible:hidden_by_turn"
    if hidden == "left":
        mask_left.fill(0)
        states["left_iris"] = "not_visible:closed"
    masks = {"right_iris": mask_right, "left_iris": mask_left}
    return photo, IrisObservation(masks=masks, states=states)


class Observed:
    def __init__(self, observation: IrisObservation) -> None:
        self.observation = observation
        self.calls = 0

    def observe(self, image_digest: str, photo: np.ndarray) -> IrisObservation:
        self.calls += 1
        return self.observation


class SpyGuard:
    def __init__(self, guard: Callable[[np.ndarray, np.ndarray], np.ndarray] | None = None) -> None:
        self.calls = 0
        self._guard = guard

    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> Any:
        self.calls += 1
        edited = after if self._guard is None else self._guard(before, after)
        return IdentityDecision(edited.copy(), 0.98, False)


def vectors() -> list[dict[str, object]]:
    """Byte-array parity cases cover direction, tone, guard and channel count."""
    cases: list[dict[str, object]] = []
    for background in (26, 93, 168, 226):
        for hidden in (None, "right", "left"):
            for level in (1.0, 3.5, 5.0):
                photo, observed = scene(background, hidden=hidden, soft=bool(hidden))
                engine = IrisTrialEngine(Observed(observed), SpyGuard())
                result = engine.render(photo, box=(0.02, 0.04, 0.98, 0.97), level=level)
                sample_points: list[list[int]] = []
                yy, xx = np.indices((HEIGHT, WIDTH))
                around = ((xx - 21) ** 2 + (yy - 20) ** 2 <= 8 ** 2) | (
                    (xx - 59) ** 2 + (yy - 20) ** 2 <= 8 ** 2
                )
                for y, x in zip(*np.nonzero(around), strict=True):
                    rgb = result.image[y, x, :3]
                    sample_points.append([int(x), int(y), int(rgb[0]), int(rgb[1]), int(rgb[2])])
                cases.append({
                    "background": background,
                    "hidden": hidden,
                    "level": level,
                    "states": dict(observed.states),
                    "samples": sample_points,
                    "status": result.status,
                    "changed": result.changed_pixels,
                    "visible": result.visible_irises,
                    "guard_called": result.guard_called,
                })
    return cases


if __name__ == "__main__":
    print(json.dumps({"width": WIDTH, "height": HEIGHT, "cases": vectors()}, separators=(",", ":")))
