"""Conservative, local *simulation* when no YouCam styling call is permitted.

The local mask is only an approximate hand-coded face zone, not face segmentation,
3D makeup VTO, skin diagnosis or a product-specific rendering. It does not brighten or
change the original outside the selected region; optional landmarks are intentionally
not inferred from photos. The source JPEG remains unchanged in PhotoStore.
Author: John Khan.
"""
from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from ..services import imaging
from .catalogue import Product

MAX_SIMULATION_PIXELS = 4_500_000


def _ellipse_mask(width: int, height: int, category: str) -> Image.Image:
    """Create a mask in synthetic centred-photo coordinates; no face is detected."""
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    if category == "complexion":
        draw.ellipse((round(width * 0.31), round(height * 0.22),
                      round(width * 0.69), round(height * 0.77)), fill=255)
        for cx in (0.43, 0.57):
            draw.ellipse((round(width * (cx - 0.045)), round(height * 0.39),
                          round(width * (cx + 0.045)), round(height * 0.45)), fill=0)
        draw.ellipse((round(width * 0.44), round(height * 0.61),
                      round(width * 0.56), round(height * 0.68)), fill=0)
    elif category == "cheek":
        for cx in (0.405, 0.595):
            draw.ellipse((round(width * (cx - 0.058)), round(height * 0.49),
                          round(width * (cx + 0.058)), round(height * 0.57)), fill=255)
    elif category == "lip":
        draw.ellipse((round(width * 0.445), round(height * 0.624),
                      round(width * 0.555), round(height * 0.654)), fill=255)
    else:
        return mask
    # Soft masks are still zero outside their bounding support; strictly bounded on resize.
    return mask.filter(ImageFilter.GaussianBlur(radius=max(0.5, min(width, height) * 0.003)))


def preview_local(data: bytes, product: Product, strength: int = 45) -> tuple[bytes, dict[str, Any]]:
    if type(strength) is not int or not 0 <= strength <= 100:
        raise ValueError("intensity must be an integer 0..100")
    if not product.vto:
        raise ValueError("sample item has no visual try-on")
    with Image.open(io.BytesIO(data)) as opened:
        if opened.width * opened.height > MAX_SIMULATION_PIXELS:
            raise ValueError("photo too large for local simulation")
        original = opened.convert("RGB")
    width, height = original.size
    if min(width, height) < 16:
        raise ValueError("photo too small")
    rgb = tuple(int(product.swatch[i:i + 2], 16) for i in (1, 3, 5))
    weight = (strength / 100.0) * (0.38 if product.category == "complexion" else 0.55)
    mask = np.asarray(_ellipse_mask(width, height, product.category), dtype=np.float64) / 255.0
    alpha = np.asarray(mask * weight, dtype=np.float64)[..., None]
    arr = np.asarray(original, dtype=np.float64)
    # Preserve local detail: alpha blending a subtle swatch, not a flat opaque overlay.
    result = np.clip(np.rint(arr * (1.0 - alpha) + np.array(rgb) * alpha), 0, 255).astype(np.uint8)
    dest = Image.fromarray(result, "RGB")
    out = io.BytesIO()
    dest.save(out, "JPEG", quality=91)
    evidence = {"source": "local", "simulation": True, "mask": "centred-photo approximate region",
                "not_detected": True, "notice": "Approximate cosmetic simulation; not a measured skin match or actual product try-on.",
                "changed_percent_estimate": round(float((mask > 0).mean() * 100), 2)}
    return out.getvalue(), evidence


def public_preview(data: bytes, product: Product, strength: int) -> dict[str, Any]:
    image, evidence = preview_local(data, product, strength)
    return {"image": imaging.data_url(image), "image_type": "image/jpeg", **evidence,
            "product": product.to_json(), "provider_calls": 0,
            "units_spent": 0, "cached": False, "label": "Local simulation — approximate placement"}
