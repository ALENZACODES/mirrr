"""Adjust cached provider output locally; no repeated billable calls per slider step.

One full-strength provider preview can be composited with the original at lower
visual levels. This is an ASSUMED interpolation, not a newly generated YouCam
result or a validated physical shade. Author: John Khan.
"""
from __future__ import annotations

import io

from PIL import Image

from .strength import to_legacy, validate_level


def relevel_provider_image(before: bytes, provider: bytes, level: float, *, image_type: str = "image/png") -> bytes:
    """Decode bounded local images and preserve the declared provider encoding."""
    formats = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}
    if image_type not in formats:
        raise ValueError("Unsupported provider preview encoding")
    strength = validate_level(level)
    if not 0 < len(before) <= 24_000_000 or not 0 < len(provider) <= 20_000_000:
        raise ValueError("Preview image is missing or exceeds size bounds")
    with Image.open(io.BytesIO(before)) as raw_before:
        if raw_before.width * raw_before.height > 4_500_000:
            raise ValueError("Photo too large to preview")
        original = raw_before.convert("RGB")
    with Image.open(io.BytesIO(provider)) as raw_after:
        if raw_after.format != formats[image_type]:
            raise ValueError("Provider preview encoding differs from declared type")
        if raw_after.size != original.size:
            raise ValueError("Provider preview does not match the photo dimensions")
        adjusted = raw_after.convert("RGB")
    # Endpoint sends one nominal 100-strength image; all interactive levels are local.
    weight = to_legacy(strength) / 100
    result = Image.blend(original, adjusted, weight)
    dest = io.BytesIO()
    result.save(dest, format=formats[image_type])
    return dest.getvalue()


def preview_resolution(width: int, height: int, phase: str) -> tuple[int, int]:
    """ASSUMED sizing contract: 384 px while dragging, original on release."""
    if type(width) is not int or type(height) is not int or width < 16 or height < 16:
        raise ValueError("Invalid preview dimensions")
    if width * height > 24_000_000:
        raise ValueError("Preview image pixel budget exceeded")
    if phase not in ("interactive", "release"):
        raise ValueError("Unknown preview phase")
    if phase == "release":
        return width, height
    scale = min(1.0, 384.0 / max(width, height))
    return max(1, round(width * scale)), max(1, round(height * scale))
