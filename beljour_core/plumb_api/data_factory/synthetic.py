"""Procedural test images and records drawn in code (no photos, no downloads).

Portraits are cartoon figures made of ellipses and gradients with a seeded
layout, so different seeds give visibly different images. Transforms produce
the near copies the dedup stage must catch. Records are made-up metadata for
scale tests. Nothing here resembles or depicts a real person.
Author: John Khan.
"""

from __future__ import annotations

import io
import random
from collections.abc import Iterator

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageDraw, ImageEnhance

from .hashing import sha256_text
from .records import AGE_BANDS, LIGHTING, POSE_BUCKETS, SKIN_TONE_GROUPS, ImageRecord

RGB = tuple[int, int, int]
TONES: tuple[RGB, ...] = (
    (247, 224, 205), (236, 204, 178), (222, 184, 150), (204, 160, 120), (184, 136, 98),
    (160, 112, 80), (136, 92, 64), (110, 74, 52), (88, 58, 42), (66, 44, 32),
)


def _colour(rng: random.Random) -> RGB:
    return (rng.randrange(256), rng.randrange(256), rng.randrange(256))


def portrait(seed: int, size: int = 256) -> NDArray[np.uint8]:
    """A seeded cartoon portrait as an RGB array of shape (size, size, 3)."""
    rng = random.Random(seed)
    top, bottom = _colour(rng), _colour(rng)
    ramp = np.linspace(0.0, 1.0, size)[:, None, None]
    background = (1 - ramp) * np.array(top) + ramp * np.array(bottom)
    canvas = np.broadcast_to(background, (size, size, 3)).astype(np.uint8)
    image = Image.fromarray(np.ascontiguousarray(canvas), mode="RGB")
    draw = ImageDraw.Draw(image)
    for _ in range(rng.randint(3, 7)):
        x, y = rng.randrange(size), rng.randrange(size)
        radius = rng.randint(size // 10, size // 3)
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=_colour(rng))
    cx = size // 2 + rng.randint(-size // 8, size // 8)
    cy = size // 2 + rng.randint(-size // 10, size // 10)
    face_w = rng.randint(size // 5, size // 3)
    face_h = int(face_w * rng.uniform(1.15, 1.45))
    hair = _colour(rng)
    draw.ellipse((cx - face_w - 8, cy - face_h - 14, cx + face_w + 8, cy + face_h // 3), fill=hair)
    draw.ellipse((cx - face_w, cy - face_h, cx + face_w, cy + face_h), fill=rng.choice(TONES))
    eye_y = cy - face_h // 4
    eye_dx = face_w // 2
    eye_r = max(3, face_w // 8)
    for side in (-1, 1):
        ex = cx + side * eye_dx
        draw.ellipse((ex - eye_r * 2, eye_y - eye_r, ex + eye_r * 2, eye_y + eye_r),
                     fill=(250, 250, 250))
        draw.ellipse((ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r), fill=_colour(rng))
    mouth_y = cy + face_h // 2
    draw.chord((cx - face_w // 2, mouth_y - face_h // 6, cx + face_w // 2, mouth_y + face_h // 6),
               0, 180, fill=(rng.randint(120, 220), rng.randint(20, 90), rng.randint(40, 110)))
    return np.asarray(image, dtype=np.uint8).copy()


def to_png(rgb: NDArray[np.uint8]) -> bytes:
    """PNG bytes of an RGB array."""
    buffer = io.BytesIO()
    Image.fromarray(rgb, mode="RGB").save(buffer, format="PNG")
    return buffer.getvalue()


def to_jpeg(rgb: NDArray[np.uint8], quality: int = 85, exif: bytes | None = None) -> bytes:
    """JPEG bytes of an RGB array, optionally with an EXIF block."""
    buffer = io.BytesIO()
    image = Image.fromarray(rgb, mode="RGB")
    if exif is None:
        image.save(buffer, format="JPEG", quality=quality)
    else:
        image.save(buffer, format="JPEG", quality=quality, exif=exif)
    return buffer.getvalue()


def from_bytes(data: bytes) -> NDArray[np.uint8]:
    """Decode bytes to an RGB array (test helper; no limits applied)."""
    with Image.open(io.BytesIO(data)) as image:
        return np.asarray(image.convert("RGB"), dtype=np.uint8).copy()


def resized(rgb: NDArray[np.uint8], scale: float) -> NDArray[np.uint8]:
    """Uniformly rescaled copy."""
    height, width = rgb.shape[:2]
    size = (max(1, round(width * scale)), max(1, round(height * scale)))
    image = Image.fromarray(rgb, mode="RGB").resize(size, Image.Resampling.LANCZOS)
    return np.asarray(image, dtype=np.uint8).copy()


def cropped(rgb: NDArray[np.uint8], fraction: float) -> NDArray[np.uint8]:
    """Copy with `fraction` of each side trimmed away."""
    height, width = rgb.shape[:2]
    dy, dx = int(height * fraction), int(width * fraction)
    return rgb[dy:height - dy, dx:width - dx].copy()


def brightened(rgb: NDArray[np.uint8], factor: float) -> NDArray[np.uint8]:
    """Copy with brightness scaled by factor."""
    image = ImageEnhance.Brightness(Image.fromarray(rgb, mode="RGB")).enhance(factor)
    return np.asarray(image, dtype=np.uint8).copy()


def jpeg_roundtrip(rgb: NDArray[np.uint8], quality: int = 70) -> NDArray[np.uint8]:
    """Copy after one lossy JPEG encode and decode."""
    return from_bytes(to_jpeg(rgb, quality))


def blurred(rgb: NDArray[np.uint8], passes: int = 6) -> NDArray[np.uint8]:
    """Box-blurred copy (each pass averages a 3x3 neighbourhood)."""
    work = rgb.astype(np.float64)
    for _ in range(passes):
        padded = np.pad(work, ((1, 1), (1, 1), (0, 0)), mode="edge")
        total = np.zeros_like(work)
        for dy in range(3):
            for dx in range(3):
                total += padded[dy:dy + work.shape[0], dx:dx + work.shape[1]]
        work = total / 9.0
    return np.clip(np.rint(work), 0, 255).astype(np.uint8)


def noisy(rgb: NDArray[np.uint8], sigma: float, seed: int = 0) -> NDArray[np.uint8]:
    """Copy with Gaussian noise of the given standard deviation."""
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, sigma, rgb.shape)
    return np.clip(rgb.astype(np.float64) + noise, 0, 255).astype(np.uint8)


def fake_hash(index: int, salt: str = "synthetic") -> str:
    """Content-hash-shaped identifier for metadata-only scale tests."""
    return sha256_text(f"{salt}:{index}")


def fake_records(count: int, seed: int = 7, *, source: str = "studio-sample",
                 licence: str = "CC0-1.0", declared_share: float = 0.9
                 ) -> Iterator[ImageRecord]:
    """Made-up records with declared attributes on a share of them."""
    rng = random.Random(seed)
    for index in range(count):
        declared = rng.random() < declared_share
        yield ImageRecord(
            content_sha256=fake_hash(index, f"{source}:{seed}"),
            source=source,
            licence=licence,
            attribution="",
            commercial_use=True,
            consent=True,
            path=f"img/{index:07d}.png",
            width=512,
            height=512,
            age_band=rng.choice(AGE_BANDS) if declared else None,
            skin_tone_group=rng.choice(SKIN_TONE_GROUPS) if declared else None,
            lighting=rng.choice(LIGHTING) if declared else None,
            pose_bucket=rng.choice(POSE_BUCKETS) if declared else None,
        )
