"""Where a block of pixels sits in the whole photo, for ops that depend on position or size.

A filter can run on the whole photo, on a 128 px thumbnail or on one tile of a large photo.
Position light (vignette, centre light, graded tint) and blur radii are defined on the whole
photo, so every op gets a Frame: the full width and height, the block's top-left corner and,
when landmarks exist, the face centre. Pixel (x, y) of the block is at (x0 + x + 0.5,
y0 + y + 0.5) in whole-photo coordinates. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


@dataclass(frozen=True)
class Frame:
    width: int
    height: int
    x0: int = 0
    y0: int = 0
    face_centre: tuple[float, float] | None = None

    def __post_init__(self) -> None:
        if self.width < 1 or self.height < 1 or self.x0 < 0 or self.y0 < 0:
            raise ValueError("a frame needs a positive size and a non-negative offset")

    @property
    def short_side(self) -> int:
        return min(self.width, self.height)

    def grid(self, h: int, w: int) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Whole-photo pixel-centre coordinates (x, y) of an h x w block at this frame's offset."""
        ys = np.arange(h, dtype=np.float64) + self.y0 + 0.5
        xs = np.arange(w, dtype=np.float64) + self.x0 + 0.5
        return np.meshgrid(xs, ys)


def whole(image: np.ndarray, face_centre: tuple[float, float] | None = None) -> Frame:
    h, w = np.asarray(image).shape[:2]
    return Frame(int(w), int(h), 0, 0, face_centre)
