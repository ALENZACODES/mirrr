'Manual checked-reference look extraction, no face parsing model. Author: John Khan.'
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np

from .palette import extract_palette


def checked_reference(reference: np.ndarray, masks: Mapping[str, np.ndarray]) -> dict[str, Any]:
    required = {'eye', 'cheek', 'lip'}
    if set(masks) != required:
        raise ValueError('checked reference requires eye, cheek and lip masks')
    result: dict[str, Any] = {'source': 'user_checked_reference', 'automatic_face_parsing': False}
    for name in sorted(required):
        result[name] = extract_palette(reference, masks[name], 2)
    return result

def original_look(name: str) -> dict[str, tuple[int, int, int] | str]:
    looks = {'gallery_glow': {'eye': (92, 61, 57), 'cheek': (146, 83, 76), 'lip': (118, 55, 62)}, 'midnight_line': {'eye': (45, 42, 51), 'cheek': (123, 77, 69), 'lip': (103, 46, 58)}, 'soft_flash': {'eye': (121, 89, 78), 'cheek': (164, 97, 84), 'lip': (141, 72, 82)}, 'velvet_evening': {'eye': (79, 52, 63), 'cheek': (133, 71, 75), 'lip': (96, 38, 52)}}
    if name not in looks:
        raise ValueError('unknown original look')
    return {**looks[name], 'name': name}
