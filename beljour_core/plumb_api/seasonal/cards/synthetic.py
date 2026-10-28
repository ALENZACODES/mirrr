"""Procedural portraits drawn in code, for tests, offline demos and speed checks.

No real face is used anywhere: these are flat shapes (backdrop, shoulders, head, hair, eyes,
mouth) drawn with Pillow from a seed. encode_with_metadata writes deliberately dirty files
(EXIF with orientation, artist and GPS tags, PNG text chunks) so stripping can be proven.
Author: John Khan.
"""

from __future__ import annotations

import io
import random

from PIL import Image, ImageDraw, PngImagePlugin

from .photo import FaceBox

SKIN_TONES = ((141, 85, 36), (198, 134, 66), (224, 172, 105), (241, 194, 125),
              (255, 219, 172), (92, 58, 34))
HAIR_TONES = ((30, 24, 20), (84, 52, 30), (170, 120, 60), (60, 60, 64), (120, 40, 30))
EXIF_ORIENTATION = 0x0112
EXIF_ARTIST = 0x013B
EXIF_GPS_IFD = 0x8825


def synthetic_portrait(width: int = 640, height: int = 800, seed: int = 0,
                       people: int = 1, alpha: bool = False) -> tuple[Image.Image, list[FaceBox]]:
    """Draw a portrait with one or more stand-in people; returns the image and face boxes."""
    rng = random.Random(seed)
    mode = "RGBA" if alpha else "RGB"
    top = (rng.randrange(40, 200), rng.randrange(40, 200), rng.randrange(40, 200))
    image = Image.new(mode, (width, height), top + ((0,) if alpha else ()))
    draw = ImageDraw.Draw(image)
    if not alpha:
        for y in range(0, height, 8):
            shade = tuple(max(0, c - y * 60 // height) for c in top)
            draw.rectangle((0, y, width, y + 8), fill=shade)
    faces: list[FaceBox] = []
    slot = width / people
    for index in range(people):
        cx = slot * (index + 0.5)
        scale = min(slot / 640, height / 800) * (1.0 if index == 0 else 0.8)
        skin = rng.choice(SKIN_TONES)
        hair = rng.choice(HAIR_TONES)
        shirt = (rng.randrange(256), rng.randrange(256), rng.randrange(256))
        head_w, head_h = 210 * scale, 270 * scale
        head_top = height * 0.18 + (0 if index == 0 else 60 * scale)
        draw.ellipse((cx - 300 * scale, height * 0.68, cx + 300 * scale, height * 1.3),
                     fill=shirt)
        neck_top = head_top + head_h * 0.8
        draw.rectangle((cx - 45 * scale, neck_top, cx + 45 * scale,
                        max(neck_top, height * 0.72)), fill=skin)
        draw.ellipse((cx - head_w / 2 - 12 * scale, head_top - 30 * scale,
                      cx + head_w / 2 + 12 * scale, head_top + head_h * 0.55), fill=hair)
        draw.ellipse((cx - head_w / 2, head_top, cx + head_w / 2, head_top + head_h), fill=skin)
        eye_y = head_top + head_h * 0.45
        for side in (-1, 1):
            ex = cx + side * head_w * 0.2
            draw.ellipse((ex - 14 * scale, eye_y - 8 * scale, ex + 14 * scale, eye_y + 8 * scale),
                         fill=(250, 250, 250))
            draw.ellipse((ex - 6 * scale, eye_y - 6 * scale, ex + 6 * scale, eye_y + 6 * scale),
                         fill=(40, 30, 25))
        mouth_y = head_top + head_h * 0.75
        draw.arc((cx - 40 * scale, mouth_y - 20 * scale, cx + 40 * scale, mouth_y + 14 * scale),
                 20, 160, fill=(150, 60, 60), width=max(1, int(6 * scale)))
        faces.append(FaceBox(cx - head_w / 2, head_top, head_w, head_h))
    return image, faces


def encode_with_metadata(image: Image.Image, fmt: str = "JPEG", orientation: int = 1) -> bytes:
    """Encode with EXIF orientation, an artist tag, a GPS block and (PNG) text chunks."""
    exif = Image.Exif()
    exif[EXIF_ORIENTATION] = orientation
    exif[EXIF_ARTIST] = "metadata-that-must-not-survive"
    gps = exif.get_ifd(EXIF_GPS_IFD)
    gps[1] = "N"
    gps[2] = (43.0, 39.0, 0.0)
    buffer = io.BytesIO()
    if fmt == "PNG":
        info = PngImagePlugin.PngInfo()
        info.add_text("Comment", "metadata-that-must-not-survive")
        image.save(buffer, format="PNG", pnginfo=info, exif=exif.tobytes())
    elif fmt == "WEBP":
        image.save(buffer, format="WEBP", exif=exif.tobytes(), quality=90)
    else:
        image.convert("RGB").save(buffer, format="JPEG", exif=exif.tobytes(), quality=92)
    return buffer.getvalue()
