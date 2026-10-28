"""Original drawn pixels and corresponding points for local HTTP tests. Author: John Khan."""
from __future__ import annotations

import io
import numpy as np
from PIL import Image
from plumb_api.engines.core import regions
from plumb_api.engines.proportions.synthetic import symmetric_face
from plumb_api.engines.shade import colourspace


def drawn_photo(width: int = 480, height: int = 512) -> tuple[bytes, list[list[float]]]:
    points = symmetric_face(width, height, face_width=width * .55, face_length=height * .66)
    oval = regions.region_mask("face_oval", points, height, width, normalized=False) > .5
    image = np.full((height, width, 3), 128, dtype=np.uint8)
    colour = colourspace.lab_to_srgb([58, 13, 18])
    rng = np.random.default_rng(14)
    image[oval] = np.clip(colour + rng.normal(0, 1, (int(oval.sum()), 3)), 0, 255).astype(np.uint8)
    output = io.BytesIO()
    Image.fromarray(image).save(output, "PNG")
    return output.getvalue(), (points / [width, height]).tolist()
