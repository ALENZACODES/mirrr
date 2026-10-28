"""Landmark-input preparation: luminance-only CLAHE, used for the mesh input only.

R12's region masks passed on 78.9% of Black faces against a 95% gate, and the
masks are pure geometry, so the likely cause is landmark drift on low-contrast faces
(ASSUMED; not yet measured). This module offers one option for the box to test:
contrast-limited adaptive histogram equalisation on the L channel of CIELAB, with a
and b untouched. The prepared copy is fed to the landmarker only; it is never shown,
saved or used as an edit input. It is off unless a run plan names it, so results
with and without it are never mixed.
Concept: Zuiderveld (1994) CLAHE, as implemented by OpenCV (Apache-2.0, a Bucket A
runtime already used here). Author: John Khan.
"""
from __future__ import annotations

import numpy as np

CLAHE_CLIP = 2.0
CLAHE_TILES = 8
MODES = ("none", "clahe-l")


def luminance_clahe(rgb: np.ndarray, *, clip: float = CLAHE_CLIP, tiles: int = CLAHE_TILES) -> np.ndarray:
    """A uint8 RGB copy whose L* is equalised locally; a* and b* are unchanged."""
    import cv2

    image = np.asarray(rgb)
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] != 3 or min(image.shape[:2]) < 2:
        raise ValueError("landmark input must be uint8 RGB, at least 2 by 2")
    if not (0 < clip <= 40) or isinstance(tiles, bool) or not isinstance(tiles, int) or not 1 <= tiles <= 64:
        raise ValueError("clip must be in (0, 40] and tiles an integer from 1 to 64")
    lab = cv2.cvtColor(np.ascontiguousarray(image), cv2.COLOR_RGB2LAB)
    clahe = cv2.createCLAHE(clipLimit=float(clip), tileGridSize=(tiles, tiles))
    lab[:, :, 0] = clahe.apply(np.ascontiguousarray(lab[:, :, 0]))
    out: np.ndarray = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return out


def prepare(rgb: np.ndarray, mode: str) -> np.ndarray:
    if mode not in MODES:
        raise ValueError(f"landmark input mode must be one of {', '.join(MODES)}")
    return np.asarray(rgb) if mode == "none" else luminance_clahe(rgb)
