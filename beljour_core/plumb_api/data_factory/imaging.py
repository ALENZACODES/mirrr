"""Safe image decoding, input limits and metadata stripping on ingest.

Images are checked before their pixels are decoded: byte size, format, mode,
bit depth and dimensions. Corrupted files, CMYK, 16-bit and oversized images
are rejected with a reason code instead of an exception. Stripping re-encodes
the pixels as PNG so no EXIF, GPS, camera or text metadata survives.
Author: John Khan.
"""

from __future__ import annotations

import io
import warnings
from dataclasses import dataclass
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
ACCEPTED_MODES = frozenset({"RGB", "RGBA", "L", "LA", "P", "PA"})

REASON_EMPTY = "image-empty"
REASON_TOO_LARGE_BYTES = "image-bytes-over-limit"
REASON_UNREADABLE = "image-unreadable"
REASON_FORMAT = "image-format-not-allowed"
REASON_CMYK = "image-cmyk"
REASON_DEEP = "image-high-bit-depth"
REASON_MODE = "image-mode-not-supported"
REASON_TOO_LARGE_DIM = "image-dimensions-over-limit"
REASON_TOO_SMALL_DIM = "image-dimensions-under-limit"
REASON_CORRUPT = "image-corrupted"
REASON_ANIMATED = "image-animated"

RGBArray = NDArray[np.uint8]


@dataclass(frozen=True)
class DecodeLimits:
    """Hard limits applied before and during decoding."""

    max_bytes: int = 64 * 1024 * 1024
    max_pixels: int = 40_000_000
    max_side: int = 12_000
    min_side: int = 16

    def to_dict(self) -> dict[str, int]:
        """Plain form for config hashing."""
        return {"max_bytes": self.max_bytes, "max_pixels": self.max_pixels,
                "max_side": self.max_side, "min_side": self.min_side}


@dataclass(frozen=True)
class DecodeFailure:
    """Why an image was rejected before use."""

    reason: str
    detail: str


@dataclass(frozen=True)
class DecodedImage:
    """An accepted image as 8-bit RGB pixels."""

    rgb: RGBArray
    width: int
    height: int
    source_format: str
    source_mode: str


def _raw_mode(image: Image.Image) -> str:
    tile = getattr(image, "tile", None) or []
    if not tile:
        return ""
    args: Any = getattr(tile[0], "args", None)
    if isinstance(args, tuple):
        args = args[0] if args else ""
    return str(args or "")


def _is_high_depth(image: Image.Image) -> bool:
    if image.mode.startswith(("I", "F")) or ";16" in image.mode:
        return True
    return ";16" in _raw_mode(image)


def inspect(data: bytes, limits: DecodeLimits) -> DecodeFailure | None:
    """Header-level checks; None when the image may be decoded."""
    if not data:
        return DecodeFailure(REASON_EMPTY, "no bytes")
    if len(data) > limits.max_bytes:
        return DecodeFailure(REASON_TOO_LARGE_BYTES,
                             f"{len(data)} bytes is over {limits.max_bytes}")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as image:
                return _inspect_open(image, limits)
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError) as exc:
        return DecodeFailure(REASON_UNREADABLE, type(exc).__name__)
    except Image.DecompressionBombError:
        return DecodeFailure(REASON_TOO_LARGE_DIM, "decompression bomb limit")


def _inspect_open(image: Image.Image, limits: DecodeLimits) -> DecodeFailure | None:
    fmt = image.format or "unknown"
    if fmt not in ALLOWED_FORMATS:
        return DecodeFailure(REASON_FORMAT, f"format {fmt} is not accepted")
    if image.mode == "CMYK":
        return DecodeFailure(REASON_CMYK, "CMYK images are not accepted; convert to sRGB")
    if _is_high_depth(image):
        return DecodeFailure(REASON_DEEP, f"mode {image.mode} is more than 8 bits per channel")
    if image.mode not in ACCEPTED_MODES:
        return DecodeFailure(REASON_MODE, f"mode {image.mode} is not accepted")
    if getattr(image, "n_frames", 1) > 1:
        return DecodeFailure(REASON_ANIMATED, "animated images are not accepted")
    width, height = image.size
    if max(width, height) > limits.max_side or width * height > limits.max_pixels:
        return DecodeFailure(REASON_TOO_LARGE_DIM,
                             f"{width}x{height} is over the size limit")
    if min(width, height) < limits.min_side:
        return DecodeFailure(REASON_TOO_SMALL_DIM,
                             f"{width}x{height} is under {limits.min_side} px")
    return None


def _to_rgb(image: Image.Image) -> Image.Image:
    if image.mode == "RGB":
        return image
    if image.mode in {"RGBA", "LA", "PA"} or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        canvas = Image.new("RGB", rgba.size, (255, 255, 255))
        canvas.paste(rgba, mask=rgba.getchannel("A"))
        return canvas
    return image.convert("RGB")


def decode(data: bytes, limits: DecodeLimits | None = None
           ) -> DecodedImage | DecodeFailure:
    """Decode to RGB after all checks; EXIF orientation is applied first."""
    active = limits or DecodeLimits()
    failure = inspect(data, active)
    if failure is not None:
        return failure
    try:
        with Image.open(io.BytesIO(data)) as image:
            fmt, mode = image.format or "unknown", image.mode
            image.load()
            upright = ImageOps.exif_transpose(image)
            rgb = _to_rgb(upright)
            pixels = np.asarray(rgb, dtype=np.uint8).copy()
    except (OSError, ValueError, SyntaxError) as exc:
        return DecodeFailure(REASON_CORRUPT, f"decoding failed: {type(exc).__name__}")
    height, width = int(pixels.shape[0]), int(pixels.shape[1])
    return DecodedImage(pixels, width, height, fmt, mode)


def encode_png(rgb: RGBArray) -> bytes:
    """Lossless PNG with no metadata chunks; output is deterministic."""
    image = Image.fromarray(rgb, mode="RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=False, compress_level=6)
    return buffer.getvalue()


def strip_metadata(decoded: DecodedImage) -> bytes:
    """Clean PNG bytes of an already decoded image."""
    return encode_png(decoded.rgb)


def metadata_keys(data: bytes) -> list[str]:
    """Names of metadata fields an encoded image still carries (EXIF tags and info).

    Used to prove that cleaned output carries nothing. Returns sorted names.
    """
    with Image.open(io.BytesIO(data)) as image:
        names = {f"info:{key}" for key in image.info if key not in {"dpi"}}
        exif = image.getexif()
        names.update(f"exif:{tag}" for tag in exif)
        for ifd in (0x8825, 0x8769):
            try:
                names.update(f"exif-ifd:{ifd}:{tag}" for tag in exif.get_ifd(ifd))
            except (KeyError, ValueError):
                continue
    return sorted(names)
