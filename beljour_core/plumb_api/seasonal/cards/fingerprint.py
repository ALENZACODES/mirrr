"""Design fingerprints and perceptual hashes for the uniqueness engine.

Three views of a design are compared:
- exact fingerprint: SHA-256 of every decision quantised (positions to 1/1000 of the card,
  pattern parameters to 1/1000 of their range). Equal fingerprints mean the same card.
- parameter distance: designs sharing the same discrete choices (look, layout, mask, pattern
  family, palette order, ornament set, frame, case) are compared on their normalised
  continuous parameters with the L-infinity norm. Below NEAR_PARAM (0.04, 4 percent of every
  range at once) the two are a near match.
- perceptual hash: a 64-bit DCT hash of a 108 x 135 render without photo or text. A Hamming
  distance at most NEAR_HAMMING (4 of 64 bits) is a near duplicate.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from PIL import Image

from .compose import compose
from .grammar import HEADLINE_MIN, HEADLINE_SPAN, CardDesign
from .patterns import normalised
from .provider import MotifProvider
from .render_raster import render_raster
from .text import CardText

NEAR_PARAM = 0.04
NEAR_HAMMING = 4
HASH_RENDER_WIDTH = 108
_EMPTY_TEXT = CardText("", "", "", "")


@dataclass(frozen=True)
class DesignKey:
    """Everything the store needs to detect exact and near repeats of a design."""

    fingerprint: str
    bucket: str
    vector: tuple[float, ...]


def discrete_key(design: CardDesign) -> tuple[object, ...]:
    """The categorical choices; near matches are only searched among equal keys."""
    layout = design.layout
    motifs = tuple(sorted({o.motif_id for o in design.ornaments}))
    return (design.version, design.width, design.height, design.occasion, design.look,
            layout.layout_id, layout.photo_shape,
            layout.align, design.pattern.family, design.palette.order, motifs,
            design.frame.style, design.text_style.upper)


def design_vector(design: CardDesign) -> tuple[float, ...]:
    """Continuous choices normalised to roughly 0..1."""
    w, h = design.width, design.height
    layout = design.layout
    pb, tb = layout.photo_box, layout.text_box
    # Choices that cannot be seen count as zero, so they cannot fake a distance.
    corner = layout.corner if layout.photo_shape == "rounded" else 0.0
    values = [pb.x / w, pb.y / h, pb.w / w, pb.h / h, tb.x / w, tb.y / h, tb.w / w, tb.h / h,
              layout.margin / w, corner]
    values += list(normalised(design.pattern.family, design.pattern.as_dict()))
    framed = design.frame.style != "none"
    values += [(design.frame.inset - 14) / 20 if framed else 0.0,
               (design.frame.width - 2) / 5 if framed else 0.0,
               (design.text_style.headline_scale - HEADLINE_MIN) / HEADLINE_SPAN,
               len(design.ornaments) / 9]
    return tuple(round(v, 4) for v in values)


def _quantised(design: CardDesign) -> dict[str, object]:
    w, h = design.width, design.height
    return {
        "key": [list(k) if isinstance(k, tuple) else k for k in discrete_key(design)],
        "vector": [round(v * 1000) for v in design_vector(design)],
        "ornaments": [[o.motif_id, round(o.cx / w * 1000), round(o.cy / h * 1000),
                       round(o.size / w * 1000), round(o.rotation), o.swap]
                      for o in design.ornaments],
        "scatter": design.pattern.seed % 1_000_003,
    }


def design_key(design: CardDesign) -> DesignKey:
    """Fingerprint, near-match bucket and parameter vector of a design."""
    canonical = json.dumps(_quantised(design), sort_keys=True, separators=(",", ":"))
    fingerprint = hashlib.sha256(canonical.encode()).hexdigest()[:32]
    bucket_text = json.dumps([list(k) if isinstance(k, tuple) else k
                              for k in discrete_key(design)], separators=(",", ":"))
    bucket = hashlib.sha256(bucket_text.encode()).hexdigest()[:24]
    return DesignKey(fingerprint, bucket, design_vector(design))


def param_distance(a: tuple[float, ...], b: tuple[float, ...]) -> float:
    """L-infinity distance between two design vectors of the same bucket."""
    if len(a) != len(b):
        return float("inf")
    return max((abs(x - y) for x, y in zip(a, b, strict=True)), default=0.0)


def _dct_matrix(n: int) -> NDArray[np.float64]:
    k = np.arange(n)[:, None]
    i = np.arange(n)[None, :]
    m: NDArray[np.float64] = np.cos(np.pi * (2 * i + 1) * k / (2 * n)) * np.sqrt(2.0 / n)
    m[0, :] = np.sqrt(1.0 / n)
    return m


_DCT32 = _dct_matrix(32)


def phash64(image: Image.Image) -> int:
    """64-bit DCT perceptual hash: 8 x 8 low frequencies of a 32 x 32 grey image vs median."""
    grey = np.asarray(image.convert("L").resize((32, 32), Image.Resampling.BILINEAR),
                      dtype=np.float64)
    coeffs = _DCT32 @ grey @ _DCT32.T
    low = coeffs[:8, :8].flatten()
    median = float(np.median(low[1:]))
    bits = 0
    for value in low:
        bits = (bits << 1) | (1 if value > median else 0)
    return bits


def hamming(a: int, b: int) -> int:
    """Number of differing bits between two 64-bit hashes."""
    return (a ^ b).bit_count()


def perceptual_scope(design: CardDesign) -> str:
    """Designs are compared perceptually only within one look and one card size."""
    return f"{design.look}@{int(design.width)}x{int(design.height)}"


def design_render(design: CardDesign, provider: MotifProvider | None = None,
                  width: int = HASH_RENDER_WIDTH) -> Image.Image:
    """Low-resolution render of a design with a grey photo stand-in and no text."""
    comp = compose(design, _EMPTY_TEXT, provider, include_text=False)
    return render_raster(comp, None, width)


def design_phash(design: CardDesign, provider: MotifProvider | None = None) -> int:
    """Perceptual hash of the design alone (no photo, no text)."""
    return phash64(design_render(design, provider))
