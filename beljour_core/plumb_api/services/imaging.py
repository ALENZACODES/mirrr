"""Small image helpers: the honesty meter and the burned in simulation label."""
from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image, ImageDraw, ImageFont

SIMULATION_LABEL = "Simulation, not medical advice"


def to_array(data: bytes) -> np.ndarray:
    with Image.open(io.BytesIO(data)) as img:
        return np.asarray(img.convert("RGB"), dtype=np.int16)


def to_jpeg(arr: np.ndarray, quality: int = 90) -> bytes:
    out = io.BytesIO()
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(out, "JPEG", quality=quality)
    return out.getvalue()


def data_url(data: bytes, content_type: str = "image/jpeg") -> str:
    return f"data:{content_type};base64," + base64.b64encode(data).decode()


def honesty_meter(before: bytes, after: bytes, threshold: int = 12) -> dict:
    """Share of pixels that changed by more than `threshold` (0..255) in any channel.
    The after image is resized to the before size first, since some APIs resample."""
    a = to_array(before)
    with Image.open(io.BytesIO(after)) as img:
        b = np.asarray(img.convert("RGB").resize((a.shape[1], a.shape[0]), Image.Resampling.BILINEAR), dtype=np.int16)
    diff = np.abs(a - b).max(axis=2)
    changed = diff > threshold
    return {
        "changed_percent": round(float(changed.mean() * 100), 2),
        "mean_change": round(float(diff.mean()), 2),
        "threshold": threshold,
    }


def _font(size: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    for name in ("DejaVuSans.ttf", "Arial.ttf", "LiberationSans-Regular.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def burn_label(data: bytes, text: str = SIMULATION_LABEL) -> bytes:
    """Draw a strip along the bottom edge that can't be toggled off in the UI."""
    with Image.open(io.BytesIO(data)) as opened:
        img = opened.convert("RGB")
        w, h = img.size
        strip = max(22, h // 28)
        draw = ImageDraw.Draw(img, "RGBA")
        draw.rectangle([0, h - strip, w, h], fill=(0, 0, 145, 215))  # --bleu #000091
        font = _font(int(strip * 0.6))
        box = draw.textbbox((0, 0), text, font=font)
        tw, th = box[2] - box[0], box[3] - box[1]
        draw.text(((w - tw) / 2, h - strip + (strip - th) / 2 - box[1]), text, font=font, fill=(255, 255, 255, 255))
        out = io.BytesIO()
        img.save(out, "JPEG", quality=90)
        return out.getvalue()
