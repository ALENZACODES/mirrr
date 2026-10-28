"""Card export: share-size PNG bytes and the virtual-card JSON payload.

Nothing here opens a network connection or sends anything; the user shares the file from
their own device. PNG text chunks name only the author and the app. The payload carries the
SVG, the text and the design fingerprint, and never the face box or photo metadata.
Author: John Khan.
"""

from __future__ import annotations

import base64
import io
import json
import re
from typing import Any

from PIL import Image, PngImagePlugin

AUTHOR = "John Khan"
APP = "BELJOUR"
PAYLOAD_KIND = "beljour.event_card"
PAYLOAD_VERSION = 1
SHARE_WIDTH = 1080
SHARE_HEIGHT = 1350


def png_bytes(image: Image.Image) -> bytes:
    """Encode an image as PNG whose only metadata is the author and the app."""
    info = PngImagePlugin.PngInfo()
    info.add_text("Author", AUTHOR)
    info.add_text("Software", APP)
    clean = Image.frombytes(image.mode, image.size, image.tobytes())
    buffer = io.BytesIO()
    clean.save(buffer, format="PNG", pnginfo=info, compress_level=6)
    return buffer.getvalue()


def build_payload(*, occasion: str, look: str, svg: str, to: str, sender: str, message: str,
                  greeting: str, fingerprint: str, seed: int, width: float,
                  height: float) -> dict[str, Any]:
    """The virtual-card payload as a plain dict (JSON-ready)."""
    return {
        "kind": PAYLOAD_KIND,
        "version": PAYLOAD_VERSION,
        "occasion": occasion,
        "look": look,
        "size": {"width": width, "height": height},
        "svg": svg,
        "text": {"to": to, "from": sender, "message": message, "greeting": greeting},
        "design": {"fingerprint": fingerprint, "seed": seed},
        "author": AUTHOR,
        "app": APP,
    }


def payload_json(payload: dict[str, Any]) -> str:
    """Deterministic JSON text for a payload."""
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


ALLOWED_PAYLOAD_KEYS = frozenset({"kind", "version", "occasion", "look", "size", "svg", "text",
                                  "design", "author", "app"})


_DATA_URI = re.compile(r"data:image/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)")
_TEXT_NODE = re.compile(r"<text[^>]*>.*?</text>", re.DOTALL)
_SAFE_INFO = frozenset({"jfif", "jfif_version", "jfif_unit", "jfif_density", "dpi",
                        "progressive", "progression"})


def embedded_images(svg: str) -> list[Image.Image]:
    """Decode every data-URI image embedded in an SVG string."""
    images: list[Image.Image] = []
    for match in _DATA_URI.finditer(svg):
        with Image.open(io.BytesIO(base64.b64decode(match.group(1)))) as image:
            image.load()
            images.append(image)
    return images


def check_payload(payload: dict[str, Any]) -> list[str]:
    """Problems with a payload: unknown keys, wrong author, or face or photo data present."""
    problems: list[str] = []
    extra = set(payload) - ALLOWED_PAYLOAD_KEYS
    if extra:
        problems.append(f"unexpected keys: {sorted(extra)}")
    if payload.get("author") != AUTHOR:
        problems.append("author must be John Khan")
    svg = str(payload.get("svg", ""))
    for image in embedded_images(svg):
        leaked = set(image.info) - _SAFE_INFO
        if leaked or len(image.getexif()) > 0:
            problems.append(f"embedded photo keeps metadata: {sorted(leaked) or ['exif']}")
    # User-typed text is allowed to say anything; only markup is scanned.
    markup = _TEXT_NODE.sub("<text/>", _DATA_URI.sub("data:", svg))
    markup = markup.replace("http://www.w3.org/2000/svg", "")
    for marker in ("exif", "gps", "xmp", "landmark", "face_box", "<script", "http:", "https:"):
        if marker in markup.lower():
            problems.append(f"svg contains {marker!r}")
    return problems
