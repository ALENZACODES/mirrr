"""Generate ephemeral synthetic Python W28/W39 vectors for browser parity.

No input photographs or generated vector dumps are committed.
Author: John Khan.
"""

from __future__ import annotations

import json
import numpy as np

from plumb_api.engines.haircolour.consultation import Choice, HairColourSession
from plumb_api.engines.haircolour.consultation_audit import audit_pixels


def scene(channels: int, tone: int, texture: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    height = 28
    width = 34
    image = np.empty((height, width, channels), dtype=np.uint8)
    mask = np.zeros((height, width), dtype=np.float64)
    placement = np.zeros((height, width), dtype=np.float64)
    for y in range(height):
        for x in range(width):
            ripple = ((x + y * texture) % 7) * 4
            base = max(0, min(255, tone + ripple))
            image[y, x, 0] = base
            image[y, x, 1] = max(0, min(255, base - 8))
            image[y, x, 2] = max(0, min(255, base - 16))
            if channels == 4:
                image[y, x, 3] = (x * 11 + y * 3) % 255
            if 4 <= y < 24 and 5 <= x < 28:
                mask[y, x] = 1.0
                if x == 5 or y == 4:
                    mask[y, x] = 0.8
                placement[y, x] = 1.0 if x >= 14 else 0.0
            if x == 3 and 7 < y < 19:
                mask[y, x] = 0.35
    return image, mask, placement


def vectors() -> list[dict[str, object]]:
    out: list[dict[str, object]] = []
    cases = (
        ("W39", "copper", 2.0, 45, 1, 3),
        ("W39", "ash", 3.5, 90, 2, 4),
        ("W39", "deep", 5.0, 150, 3, 3),
        ("W39", "gold", 1.0, 200, 1, 4),
        ("W28", "chestnut", 2.5, 55, 2, 3),
        ("W28", "gold", 4.0, 100, 3, 4),
        ("W28", "copper", 5.0, 155, 1, 4),
    )
    for mode, shade, level, tone, texture, channels in cases:
        image, mask, strokes = scene(channels, tone, texture)
        session = HairColourSession(image, mask)
        choice = Choice(
            mode=mode, level=level, shade=shade, base_level=4,
            target_level=7, softness=1,
        )
        result = session.render(choice, strokes=strokes if mode == "W28" else None)
        evidence = audit_pixels(
            image, result.image, mask, guard_invoked=result.lock_applied,
            simulation_disclosed=True,
        )
        out.append({
            "mode": mode, "shade": shade, "level": level, "tone": tone,
            "texture": texture, "channels": channels, "width": image.shape[1],
            "height": image.shape[0], "original": image.flatten().tolist(),
            "hair_mask": mask.flatten().tolist(), "strokes": strokes.flatten().tolist(),
            "rendered": result.image.flatten().tolist(),
            "changed_share": result.changed_share,
            "mean_delta": result.mean_delta,
            "similarity_proxy": result.similarity_proxy,
            "limited": result.lock_limited,
            "audit": evidence.count_only(),
        })
    return out


if __name__ == "__main__":
    print(json.dumps(vectors(), separators=(",", ":")))
