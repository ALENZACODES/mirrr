"""Deterministic masked-patch geometry for the offline reference trainer.

An image of ``image_size`` pixels per side is cut into square, non-overlapping
patches of ``patch_edge`` pixels. Inside every patch a fixed share of pixels is
hidden. The hidden set depends only on the plan seed, the split phase, the
approved image's SHA-256 and the patch number, so a given image always receives
the same training mask and, separately, the same heldout mask. Nothing here
reads files or keeps image bytes. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from typing import NamedTuple

import numpy as np
from numpy.typing import NDArray

PATCH_SCHEMA = "beljour-masked-patches/1"
PHASES = ("train", "eval")
_SHA = frozenset("0123456789abcdef")


class MaskedTargets(NamedTuple):
    """Full patch values plus a 0/1 weight that is 1 only on hidden values."""

    values: NDArray[np.float32]
    weights: NDArray[np.float32]


@dataclass(frozen=True)
class PatchPlan:
    image_size: int = 32
    patch_edge: int = 4
    hidden_dim: int = 32
    masked_fraction: float = 0.5
    seed: int = 2026

    def validate(self) -> None:
        if self.image_size not in (32, 64, 128):
            raise ValueError("Unsupported patch image size")
        if self.patch_edge not in (2, 4, 8) or self.image_size % self.patch_edge:
            raise ValueError("Unsupported patch edge")
        # ASSUMED bounds: wide enough for the reference, small enough that the
        # four float32 members stay far below the checkpoint guard's limits.
        if not 4 <= self.hidden_dim <= 512:
            raise ValueError("Unsupported hidden width")
        fraction = self.masked_fraction
        if isinstance(fraction, bool) or not isinstance(fraction, (int, float)):
            raise ValueError("Invalid masked fraction")
        if not np.isfinite(fraction) or not 0.1 <= fraction <= 0.9:
            raise ValueError("Invalid masked fraction")
        if not 0 <= self.seed <= 2**32 - 1:
            raise ValueError("Invalid patch seed")

    @property
    def patch_pixels(self) -> int:
        return self.patch_edge * self.patch_edge

    @property
    def patch_width(self) -> int:
        """Values per patch: RGB for every pixel."""
        return self.patch_pixels * 3

    @property
    def patches_per_image(self) -> int:
        side = self.image_size // self.patch_edge
        return side * side

    @property
    def hidden_pixels(self) -> int:
        """Hidden pixels per patch, always leaving at least one visible."""
        count = int(round(self.masked_fraction * self.patch_pixels))
        return min(self.patch_pixels - 1, max(1, count))

    def sha256(self) -> str:
        self.validate()
        document = {"schema": PATCH_SCHEMA, **asdict(self)}
        return hashlib.sha256(json.dumps(document, sort_keys=True).encode()).hexdigest()


def _checked_digest(image_sha256: str) -> bytes:
    if len(image_sha256) != 64 or any(letter not in _SHA for letter in image_sha256):
        raise ValueError("Invalid image digest for patch mask")
    return bytes.fromhex(image_sha256)


def patch_masks(image_sha256: str, plan: PatchPlan, *, phase: str) -> NDArray[np.bool_]:
    """Return a (patches, pixels) array that is True where a pixel is hidden."""
    plan.validate()
    if phase not in PHASES:
        raise ValueError("Unknown mask phase")
    raw = _checked_digest(image_sha256)
    seed = hashlib.sha256(
        b"beljour-patch-mask/1\x00" + phase.encode() + b"\x00"
        + plan.seed.to_bytes(4, "big") + raw
    ).digest()
    rng = np.random.default_rng(np.frombuffer(seed, dtype=np.uint32))
    scores = rng.random((plan.patches_per_image, plan.patch_pixels))
    order = np.argsort(scores, axis=1, kind="stable")
    hidden = np.zeros((plan.patches_per_image, plan.patch_pixels), dtype=bool)
    np.put_along_axis(hidden, order[:, :plan.hidden_pixels], True, axis=1)
    return hidden


def image_patches(pixels: NDArray[np.float32], plan: PatchPlan) -> NDArray[np.float32]:
    """Cut a flat RGB image (rows, columns, channel order) into patch rows."""
    plan.validate()
    size, edge = plan.image_size, plan.patch_edge
    if pixels.shape != (size * size * 3,) or not np.all(np.isfinite(pixels)):
        raise ValueError("Unexpected image tensor for patching")
    side = size // edge
    grid = pixels.astype(np.float32, copy=False).reshape(side, edge, side, edge, 3)
    return np.ascontiguousarray(grid.transpose(0, 2, 1, 3, 4)).reshape(
        plan.patches_per_image, plan.patch_width,
    )


def patch_positions(plan: PatchPlan) -> NDArray[np.float32]:
    """Patch centre (row, column) on a 0..1 scale, one row per patch."""
    side = plan.image_size // plan.patch_edge
    rows, cols = np.divmod(np.arange(plan.patches_per_image), side)
    return np.stack(((rows + 0.5) / side, (cols + 0.5) / side), axis=1).astype(np.float32)


def masked_example(
    pixels: NDArray[np.float32], image_sha256: str, plan: PatchPlan, *, phase: str,
) -> tuple[NDArray[np.float32], MaskedTargets]:
    """Model inputs and full-patch targets weighted to score hidden values only.

    Inputs hold the visible values, with each hidden value replaced by the mean
    of the visible pixels of its patch and channel, followed by the patch centre
    position. The model predicts a correction on top of that filled patch.
    """
    patches = image_patches(pixels, plan)
    count = patches.shape[0]
    hidden = np.repeat(patch_masks(image_sha256, plan, phase=phase), 3, axis=1)
    shown = (~hidden).reshape(count, plan.patch_pixels, 3)
    grid = patches.reshape(count, plan.patch_pixels, 3)
    means = (grid * shown).sum(axis=1) / shown.sum(axis=1)
    filled = np.where(shown, grid, means[:, None, :]).reshape(count, plan.patch_width)
    inputs = np.concatenate((filled.astype(np.float32), patch_positions(plan)), axis=1)
    return inputs, MaskedTargets(patches, hidden.astype(np.float32))


def visible_context_baseline(targets: MaskedTargets, plan: PatchPlan) -> NDArray[np.float32]:
    """Predict every hidden value as the mean of the visible pixels of the same
    patch and channel, computed from the targets alone. This is the reference
    the model must beat; it does not reuse the model's filled inputs."""
    count = targets.values.shape[0]
    grid = targets.values.reshape(count, plan.patch_pixels, 3)
    shown = (1.0 - targets.weights).reshape(count, plan.patch_pixels, 3)
    means = (grid * shown).sum(axis=1) / np.maximum(shown.sum(axis=1), 1.0)
    guess = np.broadcast_to(means[:, None, :], grid.shape).reshape(count, plan.patch_width)
    return np.where(targets.weights > 0, guess, targets.values).astype(np.float32)
