"""A drawn studio scene for tests and samples: the drawn face (arena/synthetic.py) with
drawn shoulders in front of a drawn, textured wall, and its exact person area. No photo.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from plumb_api.arena.synthetic import drawn_face
from plumb_api.engines.core import regions


@dataclass(frozen=True)
class StudioScene:
    image: NDArray[np.uint8]
    person: NDArray[np.float64]      # exact 0/1 area of face and shoulders as drawn
    points: NDArray[np.float64]
    tone: str


def studio_scene(tone: str = "medium", *, width: int = 160, height: int = 200, seed: int = 3) -> StudioScene:
    face = drawn_face(tone, seed=seed, width=width, height=height, freckles=6)
    yy, xx = np.mgrid[:height, :width].astype(np.float64)
    oval = regions.region_mask("face_oval", face.points, height, width, normalized=False, supersample=2) > 0.5
    chin = float(face.points[:, 1].max())
    neck = (np.abs(xx - width / 2) < width * 0.09) & (yy > chin - height * 0.05) & (yy < chin + height * 0.08)
    shoulders = (((xx - width / 2) / (width * 0.46)) ** 2 + ((yy - height * 1.02) / (height * 0.22)) ** 2) <= 1
    person = (oval | neck | shoulders).astype(np.float64)
    img = face.image.astype(np.float64)
    wall = np.stack([150 + 30 * np.sin(xx / 7.0), 140 + 25 * np.cos(yy / 5.0), 120 + 20 * np.sin((xx + yy) / 9.0)], -1)
    shirt = np.stack([40 + 0 * xx, 60 + 0.1 * yy, 90 + 0 * xx], -1)
    skin = np.array(face.image[int(chin) - 2, width // 2], dtype=np.float64)
    img = np.where(oval[..., None], img, np.where(neck[..., None], skin, np.where(shoulders[..., None], shirt, wall)))
    return StudioScene(np.clip(np.rint(img), 0, 255).astype(np.uint8), person, face.points, tone)
