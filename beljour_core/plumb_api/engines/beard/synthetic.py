"""LS7 synthetic face photo: a drawn, clean-shaven face from a 478-point mesh (no person).

Background gradient, a neck, the face oval in a skin tone with fine hash-noise texture,
lips, brows and eyes from the R4 region masks. Used until released photos arrive; the
web mirror (web/src/engines/local/beard.ts) draws the same picture from the same points.
Inspiration: MediaPipe Face Landmarker mesh topology (runtime data) and face-parsing.PyTorch
region classes; concept only, no code copied.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
from numpy.typing import NDArray

from ...quality.harness import hash_noise
from ..core.regions import region_mask
from ..posture.synthetic import capsule
from ..proportions.synthetic import symmetric_face
from ..shape.geometry import frame

SKIN = (198.0, 156.0, 132.0)
LIPS = (168.0, 92.0, 96.0)
BROWS = (70.0, 52.0, 42.0)
EYES = (236.0, 236.0, 232.0)
HAIR_LAB = (24.0, 6.0, 9.0)      # the drawn person's (made-up) hair colour, for auto match
U8 = NDArray[np.uint8]


def face_points(width: int = 360, height: int = 400) -> np.ndarray:
    return symmetric_face(width, height, face_width=0.56 * width, face_length=0.68 * height)


def face_photo(points: np.ndarray, width: int, height: int, seed: int = 1) -> U8:
    yy, xx = np.mgrid[0:height, 0:width].astype(np.float64)
    img = np.stack([150 + 30 * yy / height, 170 + 20 * xx / width, 190 - 20 * yy / height], -1)
    noise = hash_noise(seed, height, width)
    f = frame(points)
    chin = points[152]
    neck = capsule(height, width, (float(chin[0]), float(chin[1])), (float(chin[0]), float(height + 10)), 0.22 * f.length)
    layers = [(neck, SKIN), (region_mask("face_oval", points, height, width, normalized=False), SKIN),
              (region_mask("lips", points, height, width, normalized=False), LIPS),
              (region_mask("brows", points, height, width, normalized=False), BROWS),
              (region_mask("eyes", points, height, width, normalized=False), EYES)]
    for mask, tone in layers:
        m = mask.astype(np.float32)
        colour = np.array(tone)[None, None, :] + 8.0 * noise[..., None]
        img = img * (1 - m[..., None]) + colour * m[..., None]
    return np.clip(np.rint(img), 0, 255).astype(np.uint8)
