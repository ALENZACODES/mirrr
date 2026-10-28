"""Write the SYNTHETIC cassettes the YouCam spikes replay until John records real ones.

    python scripts/make_spike_cassettes.py            writes plumb_api/demo/cassettes/

Each cassette follows the reply shapes in the YouCam docs (file upload, create, poll,
download, delete), with placeholder ids. Result images are the illustrated sample face with
a drawn change and a "SAMPLE - not YouCam" tag, so nobody mistakes them for real output.
Every cassette says "synthetic": true, and every spike report built on one says so too.

Replace them with `python scripts/spikes.py --live --spend N --record` on a machine with the
key, then copy the reviewed files from spike-reports/cassettes/.

Run from the api/ folder. Author: John Khan.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import numpy as np  # noqa: E402
from PIL import Image, ImageDraw  # noqa: E402

from lab.python.beljour_lab import CASSETTES, FIXTURES  # noqa: E402
from lab.python.beljour_lab.youcam_spikes import OMBRE, SOLID_COLOUR  # noqa: E402
from plumb_api.providers.replay import Interaction, credit_reply, synthetic_cassette, task_interactions  # noqa: E402

TEMPLATES = [
    ("tpl-low-fade", "Low fade"), ("tpl-mid-fade-crop", "Mid fade crop"), ("tpl-textured-crop", "Textured crop"),
    ("tpl-buzz", "Buzz cut"), ("tpl-undercut", "Undercut"), ("tpl-side-part", "Side part"),
    ("tpl-long-layers", "Long layers"), ("tpl-bob", "Bob"), ("tpl-pixie", "Pixie"),
    ("tpl-curtain", "Curtain bangs"), ("tpl-shag", "Shag"), ("tpl-waves", "Loose waves"),
]


def sample() -> np.ndarray:
    with Image.open(FIXTURES / "sample.jpg") as img:
        return np.asarray(img.convert("RGB")).astype(float)


def hair_mask(arr: np.ndarray) -> np.ndarray:
    """The drawn hair on the illustrated sample: dark brown, in the top half."""
    h = arr.shape[0]
    near = np.abs(arr - np.array([58, 40, 32])).max(axis=2) < 40
    near[int(h * 0.5):] = False
    return near


def tag(arr: np.ndarray) -> bytes:
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.rectangle([8, img.height - 30, 250, img.height - 8], fill=(255, 255, 255))
    d.text((14, img.height - 27), "SAMPLE - not YouCam", fill=(206, 17, 38))
    out = io.BytesIO()
    img.save(out, "JPEG", quality=90)
    return out.getvalue()


def tint(arr: np.ndarray, mask: np.ndarray, hex_: str, alpha: float) -> np.ndarray:
    rgb = np.array([int(hex_[i:i + 2], 16) for i in (1, 3, 5)], dtype=float)
    out = arr.copy()
    out[mask] = out[mask] * (1 - alpha) + rgb * alpha
    return out


def templates_reply() -> Interaction:
    return Interaction("GET", "/s2s/v2.0/task/template/hair-style?page_size=100", "api", 200, json={
        "status": 200, "data": {"templates": [{"id": i, "title": t, "category": "hairstyle"} for i, t in TEMPLATES]}})


def main() -> int:
    CASSETTES.mkdir(parents=True, exist_ok=True)
    base = sample()
    mask = hair_mask(base)
    written = []

    s1 = synthetic_cassette("s1_account", [
        Interaction("GET", "/s2s/v1.0/client/credit", "api", 200, json=credit_reply(1000.0)),
        templates_reply()])
    written.append(s1.save(CASSETTES / "s1_account.json"))

    # S2: shorter sides, drawn by clearing the hair at the outer thirds
    cut = base.copy()
    h, w = mask.shape
    sides = mask.copy()
    sides[:, int(w * 0.3):int(w * 0.7)] = False
    cut[sides] = np.array([236, 238, 242])
    cut = tint(cut, mask & ~sides, "#2A1D17", 0.5)
    s2 = synthetic_cassette("s2_hairstyle", [templates_reply()] + task_interactions(
        "hair-style", result_blob="s2_hairstyle.blob1.jpeg"), {"s2_hairstyle.blob1.jpeg": tag(cut)})
    written.append(s2.save(CASSETTES / "s2_hairstyle.json"))

    # S3: solid copper, then an ombre from dark brown to light blonde down the hair
    solid = tint(base, mask, SOLID_COLOUR, 0.85)
    ombre = base.copy()
    ys = np.nonzero(mask)[0]
    top, bottom = (ys.min(), ys.max()) if ys.size else (0, 1)
    for y in range(int(top), int(bottom) + 1):
        row = mask[y]
        t = (y - top) / max(1, bottom - top)
        c0 = np.array([int(OMBRE[0][i:i + 2], 16) for i in (1, 3, 5)], float)
        c1 = np.array([int(OMBRE[1][i:i + 2], 16) for i in (1, 3, 5)], float)
        ombre[y, row] = ombre[y, row] * 0.2 + (c0 * (1 - t) + c1 * t) * 0.8
    s3 = synthetic_cassette("s3_hair_colour",
                            task_interactions("hair-color", n=1, result_blob="s3_hair_colour.blob1.jpeg")
                            + task_interactions("hair-color", n=2, result_blob="s3_hair_colour.blob2.jpeg"),
                            {"s3_hair_colour.blob1.jpeg": tag(solid), "s3_hair_colour.blob2.jpeg": tag(ombre)})
    written.append(s3.save(CASSETTES / "s3_hair_colour.json"))

    # S4: a light lip tint and warmer skin
    lips = np.abs(base - np.array([165, 82, 88])).max(axis=2) < 30
    skin = np.abs(base - np.array([196, 150, 122])).max(axis=2) < 25
    made = tint(tint(base, lips, "#B04A5A", 0.5), skin, "#C99A80", 0.25)
    s4 = synthetic_cassette("s4_makeup", task_interactions("makeup-vto", result_blob="s4_makeup.blob1.jpeg"),
                            {"s4_makeup.blob1.jpeg": tag(made)})
    written.append(s4.save(CASSETTES / "s4_makeup.json"))

    for path in written:
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
