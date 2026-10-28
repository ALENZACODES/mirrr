"""Photo intake, metadata stripping, fitting and masks for event cards.

The photo is decoded once, turned upright from its EXIF orientation, then rebuilt from raw
pixels so no EXIF, XMP, ICC, GPS or text chunk survives. Fitting only crops and resamples:
cards never warp, retouch or recolour the person (the identity lock stays on).
Author: John Khan.
"""

from __future__ import annotations

import base64
import io
import math
from dataclasses import dataclass

import numpy as np
from PIL import Image, ImageCms, ImageDraw, ImageOps, UnidentifiedImageError

from .errors import CardPhotoError
from .geometry import Box

MAX_BYTES = 25 * 1024 * 1024
MAX_PIXELS = 40_000_000
MIN_SIDE = 16
# MPO is how Pillow reports the multi-picture JPEGs many phones write; frame 0 is used.
ACCEPTED_FORMATS = frozenset({"JPEG", "MPO", "PNG", "WEBP"})
FIT_MODES = ("cover", "contain")
MASK_SUPERSAMPLE = 2


@dataclass(frozen=True)
class FaceBox:
    """The chosen person's face box in source photo pixels, from the multi-face picker."""

    x: float
    y: float
    w: float
    h: float


def load_photo(data: bytes) -> Image.Image:
    """Decode, orient and strip a photo; returns a clean RGB or RGBA image."""
    if not isinstance(data, bytes | bytearray):
        raise CardPhotoError("photo must be bytes")
    if len(data) == 0:
        raise CardPhotoError("photo is empty")
    if len(data) > MAX_BYTES:
        raise CardPhotoError(f"photo is larger than {MAX_BYTES} bytes")
    try:
        with Image.open(io.BytesIO(bytes(data))) as raw:
            if raw.format not in ACCEPTED_FORMATS:
                raise CardPhotoError(f"unsupported photo format: {raw.format}")
            raw.seek(0)
            return prepare_image(raw)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise CardPhotoError(f"photo cannot be decoded: {exc}") from None


def prepare_image(image: Image.Image) -> Image.Image:
    """Check size, apply EXIF orientation, convert to sRGB and strip all metadata."""
    if image.width * image.height > MAX_PIXELS:
        raise CardPhotoError("photo has too many pixels")
    upright = ImageOps.exif_transpose(image)
    oriented = upright if upright is not None else image
    oriented.load()
    if "transparency" in oriented.info and oriented.mode in ("RGB", "L"):
        # Turn a colour-key transparency into a real alpha channel before colour management,
        # which would otherwise drop the key.
        oriented = oriented.convert("RGBA")
    return strip_metadata(_to_srgb(oriented))


def _to_srgb(image: Image.Image) -> Image.Image:
    # Photos tagged with another colour space (Display P3, Adobe RGB) are converted, so the
    # profile can be dropped without shifting colours.
    icc = image.info.get("icc_profile")
    if not icc or image.mode not in ("RGB", "RGBA"):
        return image
    try:
        source = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        converted = ImageCms.profileToProfile(image, source, ImageCms.createProfile("sRGB"),
                                              outputMode=image.mode)
    except (ImageCms.PyCMSError, OSError, ValueError):
        return image
    return converted if converted is not None else image


def _wide_to_l(image: Image.Image) -> Image.Image:
    # 16-bit and 32-bit greyscale: scale to 8 bits instead of clipping to white.
    values = np.asarray(image, dtype=np.float64)
    peak = float(np.max(values)) if values.size else 0.0
    top = 65535.0 if image.mode.startswith("I;16") or peak > 255 else 255.0
    if image.mode == "F":
        top = max(1.0, peak)
    scaled = np.clip(values * (255.0 / top), 0, 255).round().astype(np.uint8)
    grey = Image.fromarray(scaled, mode="L")
    key = image.info.get("transparency")
    if isinstance(key, int):
        alpha = Image.fromarray(np.where(values == key, 0, 255).astype(np.uint8), mode="L")
        grey = Image.merge("LA", (grey, alpha))
    return grey


def strip_metadata(image: Image.Image) -> Image.Image:
    """Rebuild the image from pixels only; transparency is kept, everything else dropped."""
    if image.width < MIN_SIDE or image.height < MIN_SIDE:
        raise CardPhotoError(f"photo must be at least {MIN_SIDE} pixels on each side")
    if image.mode.startswith("I") or image.mode == "F":
        image = _wide_to_l(image)
    has_alpha = image.mode in ("RGBA", "LA", "PA") or "transparency" in image.info
    mode = "RGBA" if has_alpha else "RGB"
    converted = image.convert(mode)
    return Image.frombytes(mode, converted.size, converted.tobytes())


def _crop_window(src_w: int, src_h: int, aspect: float,
                 face: FaceBox | None) -> tuple[float, float, float, float]:
    # Largest window of the target aspect, centred on the face when one is given.
    if src_w / src_h > aspect:
        cw, ch = src_h * aspect, float(src_h)
    else:
        cw, ch = float(src_w), src_w / aspect
    fx, fy = src_w / 2, src_h / 2
    if face is not None and not all(math.isfinite(v) for v in (face.x, face.y, face.w, face.h)):
        face = None
    if face is not None:
        fx, fy = face.x + face.w / 2, face.y + face.h / 2
        fy -= face.h * 0.1
    x0 = min(max(fx - cw / 2, 0.0), src_w - cw)
    y0 = min(max(fy - ch / 2, 0.0), src_h - ch)
    return (x0, y0, x0 + cw, y0 + ch)


def fit_photo(image: Image.Image, width: int, height: int, mode: str = "cover",
              face: FaceBox | None = None) -> Image.Image:
    """Crop and resample the photo into a width x height RGBA tile; no other change."""
    if mode not in FIT_MODES:
        raise CardPhotoError(f"unknown fit mode: {mode!r}")
    width = max(1, width)
    height = max(1, height)
    src = image.convert("RGBA")
    if mode == "cover":
        window = _crop_window(src.width, src.height, width / height, face)
        if (round(window[2] - window[0]), round(window[3] - window[1])) == (width, height) and \
                window[0] == int(window[0]) and window[1] == int(window[1]):
            box = tuple(int(v) for v in window)
            return src.crop((box[0], box[1], box[2], box[3]))
        return src.resize((width, height), Image.Resampling.LANCZOS, box=window)
    scale = min(width / src.width, height / src.height)
    tw = max(1, round(src.width * scale))
    th = max(1, round(src.height * scale))
    tile = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    resized = src if (tw, th) == src.size else src.resize((tw, th), Image.Resampling.LANCZOS)
    tile.paste(resized, ((width - tw) // 2, (height - th) // 2))
    return tile


def mask_path(shape: str, box: Box, corner: float) -> str:
    """SVG path data for the photo mask; the raster mask draws the same geometry."""
    x, y, w, h = box.x, box.y, box.w, box.h

    def n(v: float) -> str:
        return f"{v:.2f}".rstrip("0").rstrip(".")

    if shape == "rounded":
        r = corner * min(w, h)
        return (f"M{n(x + r)},{n(y)}H{n(x + w - r)}A{n(r)},{n(r)} 0 0 1 {n(x + w)},{n(y + r)}"
                f"V{n(y + h - r)}A{n(r)},{n(r)} 0 0 1 {n(x + w - r)},{n(y + h)}H{n(x + r)}"
                f"A{n(r)},{n(r)} 0 0 1 {n(x)},{n(y + h - r)}V{n(y + r)}"
                f"A{n(r)},{n(r)} 0 0 1 {n(x + r)},{n(y)}Z")
    if shape == "arch":
        r = w / 2
        return (f"M{n(x)},{n(y + h)}V{n(y + r)}A{n(r)},{n(r)} 0 0 1 {n(x + w)},{n(y + r)}"
                f"V{n(y + h)}Z")
    if shape in ("circle", "oval"):
        rx, ry = w / 2, h / 2
        cx, cy = x + rx, y + ry
        return (f"M{n(cx - rx)},{n(cy)}A{n(rx)},{n(ry)} 0 1 0 {n(cx + rx)},{n(cy)}"
                f"A{n(rx)},{n(ry)} 0 1 0 {n(cx - rx)},{n(cy)}Z")
    return f"M{n(x)},{n(y)}H{n(x + w)}V{n(y + h)}H{n(x)}Z"


def mask_image(shape: str, width: int, height: int, corner: float) -> Image.Image:
    """Anti-aliased L-mode mask of a width x height photo tile."""
    if shape == "rect":
        return Image.new("L", (width, height), 255)
    k = MASK_SUPERSAMPLE
    big = Image.new("L", (width * k, height * k), 0)
    draw = ImageDraw.Draw(big)
    w, h = width * k - 1, height * k - 1
    if shape == "rounded":
        radius = int(round(corner * min(width, height) * k))
        draw.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    elif shape == "arch":
        r = (width * k) / 2
        draw.pieslice((0, 0, w, int(math.ceil(2 * r))), 180, 360, fill=255)
        draw.rectangle((0, int(r), w, h), fill=255)
    else:
        draw.ellipse((0, 0, w, h), fill=255)
    return big.resize((width, height), Image.Resampling.LANCZOS)


def is_opaque(image: Image.Image) -> bool:
    """True when the image has no alpha channel or every pixel is fully opaque."""
    if image.mode != "RGBA":
        return True
    low = image.getchannel("A").getextrema()[0]
    return float(low[0] if isinstance(low, tuple) else low) >= 255


def encode_tile(tile: Image.Image) -> str:
    """Lossless PNG data URI of the fitted photo tile (photo pixels are never re-compressed)."""
    buffer = io.BytesIO()
    mode = "RGB" if is_opaque(tile) else "RGBA"
    clean = Image.frombytes(mode, tile.size, tile.convert(mode).tobytes())
    clean.save(buffer, format="PNG", compress_level=6)
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
