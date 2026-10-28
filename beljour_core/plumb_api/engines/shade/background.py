"""Background mask for the shade finder's grey-world white balance, measured from the mesh.

find_shade() and find_reliable_shade() accept a background mask; without one
they cannot correct the light at all ("none", the lowest lighting factor).
The photo area well outside the face is a usable grey-world reference. This
module returns the pixels outside the face oval grown by a quarter of the face
width on each side, minus a hair band above the face (0.6 face heights) and
the neck and clothes column below the chin. No colour or pixel is read here;
the mask is geometry only. Too small a background returns None.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np

from plumb_api.engines.core import regions

SIDE_MARGIN = 0.25
HAIR_BAND = 0.6
CHIN_MARGIN = 0.25
# Share of the photo the background must cover to be used (ASSUMED).
MINIMUM_SHARE = 0.08


def background_from_mesh(points: object, height: int, width: int) -> np.ndarray | None:
    """Float 0/1 mask of background pixels, or None when too little is left."""
    oval = regions.region_mask("face_oval", points, height, width, normalized=False) > 0
    if not oval.any():
        return None
    rows, cols = np.nonzero(oval)
    top, bottom = float(np.min(rows)), float(np.max(rows))
    left, right = float(np.min(cols)), float(np.max(cols))
    face_w, face_h = right - left + 1, bottom - top + 1
    yy, xx = np.mgrid[:height, :width]
    head = ((xx >= left - SIDE_MARGIN * face_w) & (xx <= right + SIDE_MARGIN * face_w)
            & (yy >= top - HAIR_BAND * face_h) & (yy <= bottom + CHIN_MARGIN * face_h))
    body = (xx >= left) & (xx <= right) & (yy > bottom)
    background = ~(head | body)
    if float(np.mean(background)) < MINIMUM_SHARE:
        return None
    mask: np.ndarray = background.astype(np.float64)
    return mask
