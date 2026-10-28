"""Duplicate audit: exact hash and 64-bit dHash near pairs across sources.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io

import numpy as np
import pytest
from PIL import Image

from lab.facescale import dedupe as DD
from lab.facescale.loaders import BytesOpener, FaceItem
from lab.facescale.synthetic import draw_face


def _item(source: str, data: bytes, key: str = "k") -> FaceItem:
    return FaceItem(source, key, hashlib.sha256(data).hexdigest(), {}, BytesOpener(data))


def _blocks(seed: int, side: int = 256) -> bytes:
    """Random 8x8 colour blocks scaled up: drawn images with unrelated structure."""
    rng = np.random.default_rng(seed)
    small = Image.fromarray(rng.integers(0, 255, (8, 8, 3), dtype=np.uint8))
    out = io.BytesIO()
    small.resize((side, side), Image.Resampling.NEAREST).save(out, format="JPEG", quality=90)
    return out.getvalue()


def _resized(data: bytes, side: int) -> bytes:
    with Image.open(io.BytesIO(data)) as image:
        out = io.BytesIO()
        image.convert("RGB").resize((side, side)).save(out, format="JPEG", quality=80)
        return out.getvalue()


def test_dhash_is_stable_under_resize_and_differs_across_images() -> None:
    a = draw_face(1, 256)
    assert DD.hamming(DD.dhash(a), DD.dhash(_resized(a, 128))) <= 3
    assert DD.hamming(DD.dhash(a), DD.dhash(draw_face(2, 256))) > 3
    flat = io.BytesIO()
    Image.fromarray(np.full((20, 20, 3), 128, np.uint8)).save(flat, format="PNG")
    assert DD.dhash(flat.getvalue()) == 0


def test_audit_counts_exact_and_near_pairs_between_sources() -> None:
    faces = [_blocks(n) for n in range(4)]
    items = [_item("S07", f, f"{n}") for n, f in enumerate(faces)]
    items.append(_item("S08", faces[0], "copy"))
    items.append(_item("S08", _resized(faces[1], 128), "small"))
    items.append(_item("S08", b"not an image", "bad"))
    result = DD.audit(items)
    assert result.exact == {"S07-S08": 1}
    assert result.near == {"S07-S08": 1}
    assert result.unreadable == 1
    assert result.sizes == {"S07": 4, "S08": 3}
    assert "1 exact, 1 near" in DD.overlap_line(result, "S07", "S08")
    assert len(result.examples[0][0]) == 16
    assert result.as_dict()["exact_pairs"] == {"S07-S08": 1}


def test_near_pairs_bands_find_every_pair_within_three_bits() -> None:
    rng = np.random.default_rng(4)
    base = [int(v) for v in rng.integers(0, 2**63, 50)]
    hashed = [DD.Hashed("S01", f"{i:064x}", v) for i, v in enumerate(base)]
    flipped = base[7] ^ (1 << 3) ^ (1 << 20) ^ (1 << 40)
    hashed.append(DD.Hashed("S02", "f" * 64, flipped))
    assert (7, 50) in DD.near_pairs(hashed, 3)
    with pytest.raises(ValueError):
        DD.near_pairs(hashed, 4)
