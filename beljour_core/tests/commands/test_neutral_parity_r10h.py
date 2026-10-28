"""Reference-resizer parity vectors are independently generated in Python.

Browser tests check matching SHA-256 bytes. No photograph is committed.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from plumb_api.commands.frames import ImageFrame, resize_reference
from plumb_api.commands.neutral_resize import resize_neutral_tiled

VECTORS = Path(__file__).with_name("fixtures") / "neutral_upscale_parity_r10h.json"


def source(width: int, height: int, channels: int) -> ImageFrame:
    pixels = bytearray(width * height * channels)
    for y in range(height):
        for x in range(width):
            offset = (y * width + x) * channels
            pixels[offset] = (x * 13 + y * 29 + 41) % 256
            pixels[offset + 1] = (x * 41 + y * 11 + 17) % 256
            pixels[offset + 2] = (x * 37 + y * 23 + 59) % 256
            if channels == 4:
                pixels[offset + 3] = (x * 7 + y * 31 + 83) % 256
    if channels == 4:
        pixels[:4] = bytes((255, 4, 250, 0))
    return ImageFrame(width, height, channels, bytes(pixels))


def test_reference_digest_and_tiled_bytes_match_all_vectors() -> None:
    payload = json.loads(VECTORS.read_text(encoding="utf-8"))
    assert payload["version"] == "beljour-neutral-upscale-parity/1"
    assert payload["author"] == "John Khan"
    assert len(payload["cases"]) == 16
    keys: set[tuple[int, int, int, int]] = set()
    for case in payload["cases"]:
        width = case["width"]
        height = case["height"]
        channels = case["channels"]
        scale = case["scale"]
        name = (width, height, channels, scale)
        assert name not in keys
        keys.add(name)
        photo = source(width, height, channels)
        before = photo.pixels
        independent = resize_reference(photo, width * scale, height * scale)
        actual = resize_neutral_tiled(photo, scale=scale, tile_size=16).image
        assert actual.identical(independent)
        assert hashlib.sha256(actual.pixels).hexdigest() == case["sha256"]
        assert photo.pixels == before
