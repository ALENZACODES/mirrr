"""Perceptual hashes (pHash and dHash) as 64-bit integers.

pHash: grey 32x32, 2-D DCT-II, the 8x8 lowest frequencies compared with their
median (DC term excluded from the median). dHash: grey 9x8, each pixel
compared with its right neighbour. Both survive resizing, re-encoding, small
crops and brightness shifts, so close copies land within a few bits.
Author: John Khan.
"""

from __future__ import annotations

from functools import lru_cache

import numpy as np
from numpy.typing import NDArray
from PIL import Image

HASH_BITS = 64
PHASH_SIZE = 32
PHASH_LOW = 8
GREY_WEIGHTS = np.array([0.299, 0.587, 0.114], dtype=np.float64)

FloatArray = NDArray[np.float64]
UIntArray = NDArray[np.uint64]


def to_grey(rgb: NDArray[np.uint8]) -> NDArray[np.uint8]:
    """ITU-R 601 luma as 8-bit grey."""
    if rgb.ndim == 2:
        return rgb.astype(np.uint8)
    grey = rgb[..., :3].astype(np.float64) @ GREY_WEIGHTS
    return np.clip(np.rint(grey), 0, 255).astype(np.uint8)


def _resize(grey: NDArray[np.uint8], width: int, height: int) -> FloatArray:
    image = Image.fromarray(grey, mode="L")
    small = image.resize((width, height), Image.Resampling.BOX, reducing_gap=None)
    return np.asarray(small, dtype=np.float64)


@lru_cache(maxsize=4)
def dct_matrix(size: int) -> FloatArray:
    """Orthonormal DCT-II matrix of the given size."""
    index = np.arange(size, dtype=np.float64)
    matrix = np.cos(np.pi * (2.0 * index[None, :] + 1.0) * index[:, None] / (2.0 * size))
    matrix *= np.sqrt(2.0 / size)
    matrix[0, :] /= np.sqrt(2.0)
    matrix.setflags(write=False)
    return matrix


def bits_to_int(bits: NDArray[np.bool_]) -> int:
    """Pack a flat boolean array (most significant first) into an integer."""
    value = 0
    for bit in bits.ravel().tolist():
        value = (value << 1) | int(bit)
    return value


def phash(rgb: NDArray[np.uint8]) -> int:
    """64-bit DCT perceptual hash."""
    grey = _resize(to_grey(rgb), PHASH_SIZE, PHASH_SIZE)
    matrix = dct_matrix(PHASH_SIZE)
    coefficients = matrix @ grey @ matrix.T
    low = coefficients[:PHASH_LOW, :PHASH_LOW].ravel()
    median = float(np.median(low[1:]))
    return bits_to_int(low > median)


def dhash(rgb: NDArray[np.uint8]) -> int:
    """64-bit horizontal difference hash."""
    grey = _resize(to_grey(rgb), 9, 8)
    return bits_to_int(grey[:, 1:] > grey[:, :-1])


def hamming(left: int, right: int) -> int:
    """Number of differing bits between two hashes."""
    return (left ^ right).bit_count()


def to_hex(value: int) -> str:
    """Fixed 16-digit hex form used in manifests."""
    if value < 0 or value >= 1 << HASH_BITS:
        raise ValueError("hash must fit in 64 unsigned bits")
    return f"{value:016x}"


def from_hex(text: str) -> int:
    """Parse a 16-digit hex hash."""
    if len(text) != 16:
        raise ValueError("perceptual hash must be 16 hex digits")
    return int(text, 16)


def hamming_many(value: int, others: UIntArray) -> NDArray[np.int64]:
    """Vectorised Hamming distance from one hash to many."""
    xor = np.bitwise_xor(others, np.uint64(value))
    return np.bitwise_count(xor).astype(np.int64)
