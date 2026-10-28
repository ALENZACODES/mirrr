"""Adaptive, image-local candidate selection within an observed open mouth.

Candidate selection is deliberately conservative: bright tongue and lip colours
are not assumed to be enamel. Darkness is measured against the same mouth, not
against an absolute camera exposure. A false positive must be treated as an
unavailable optical preview, never as a valid change.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Evidence:
    """Non-identifying aggregate diagnostics, never an image or mouth outline."""

    candidate_pixels: int
    opening_pixels: int
    lightness_contrast: float
    lightness_floor: float
    corrected_chroma_ceiling: float
    observed_lip_lightness: float | None

    @property
    def visible(self) -> bool:
        return self.candidate_pixels >= max(8, int(np.ceil(self.opening_pixels * 0.018)))


def _ring(inside: np.ndarray, radius: int = 3) -> np.ndarray:
    """Small, bounded neighbourhood without a new image-processing dependency."""
    extended = np.pad(inside, radius, mode="constant")
    height, width = inside.shape
    union = np.zeros(inside.shape, dtype=np.bool_)
    for y in range(2 * radius + 1):
        for x in range(2 * radius + 1):
            if x * x + y * y <= radius * radius:
                union |= extended[y:y + height, x:x + width]
    return union & ~inside


# ASSUMED: Lab distance within which an opening pixel matches a colour seen just outside the
# mouth. Tight, so teeth (never the colour of the skin or lips around them) do not match.
OCCLUDER_DE = 4.0


def oral_tissue(image: np.ndarray, lab: np.ndarray) -> np.ndarray:
    """Red-dominant tongue and inner-lip colour, protected and never taken for an occluder."""
    red_excess = image[..., 0].astype(np.int16) - image[..., 1].astype(np.int16)
    return (lab[..., 1] - lab[..., 2] > 12.0) & (red_excess > np.maximum(18.0, image[..., 0].astype(np.float64) * 0.29))


def _grow4(mask: np.ndarray) -> np.ndarray:
    """The mask plus its four direct neighbours (up, down, left, right)."""
    out = mask.copy()
    out[1:, :] |= mask[:-1, :]
    out[:-1, :] |= mask[1:, :]
    out[:, 1:] |= mask[:, :-1]
    out[:, :-1] |= mask[:, 1:]
    return out


def occluder(lab: np.ndarray, valid: np.ndarray, oral: np.ndarray | None = None) -> tuple[np.ndarray, np.ndarray]:
    """Pixels inside the opening that belong to something crossing the mouth's edge: a hand,
    finger or hair of a colour seen just outside the opening (the lip ring), reached from the
    opening's edge through pixels of that colour (4-neighbour). Teeth stop at the lips, so they
    are never reached; red oral tissue (`oral`) is never taken for an occluder. The rule compares
    colours with the photo's own surroundings, so it behaves the same on every skin tone.
    Returns (occluder inside the opening, lip-ring pixels of an occluder's colour)."""
    ring = _ring(valid)
    none = np.zeros(valid.shape, dtype=np.bool_)
    if not np.any(ring) or not np.any(valid):
        return none, none
    ring_lab = lab[ring]
    inside = np.flatnonzero(valid)
    flat = lab.reshape(-1, 3)
    near_flat = np.zeros(valid.size, dtype=np.bool_)
    for start in range(0, inside.size, 256):
        block = flat[inside[start:start + 256]]
        d2 = ((block[:, None, :] - ring_lab[None, :, :]) ** 2).sum(-1).min(axis=1)
        near_flat[inside[start:start + 256]] = d2 <= OCCLUDER_DE ** 2
    near = near_flat.reshape(valid.shape)
    if oral is not None:
        near &= ~oral
    reached = near & _grow4(~valid)
    while True:
        grown = near & _grow4(reached)
        if np.array_equal(grown, reached):
            break
        reached = grown
    if not np.any(reached):
        return none, none
    colours = lab[reached]
    d2 = ((ring_lab[:, None, :] - colours[None, :, :]) ** 2).sum(-1).min(axis=1)
    ring_match = np.zeros(valid.shape, dtype=np.bool_)
    ring_match[ring] = d2 <= OCCLUDER_DE ** 2
    return reached, ring_match


def find_enamel(image: np.ndarray, lab: np.ndarray,
                opening: np.ndarray) -> tuple[np.ndarray, Evidence]:
    """Conservative enamel candidates from local illumination and oral contrast.

    A minimum bright/dark mouth contrast is necessary to distinguish teeth
    from a tongue-only mouth. A local percentile estimates relative exposure,
    while colour is assessed after a capped grey-world correction inferred
    from the brightest pixels in this mouth. Strongly red candidates remain
    excluded after correction: this avoids colouring visible tongue tissue.
    No pixels outside the supplied interior are ever selected, and pixels of anything covering
    the mouth from outside it (see `occluder`) are neither measured nor selected.
    """
    valid = np.asarray(opening) >= 0.5
    covered, covered_ring = occluder(lab, valid, oral_tissue(image, lab))
    rim = _ring(valid)
    valid = valid & ~covered
    count = int(np.count_nonzero(valid))
    blank = np.zeros(valid.shape, dtype=np.bool_)
    empty = Evidence(0, count, 0.0, 0.0, 0.0, None)
    if count < 8:
        return blank, empty
    lightness = lab[..., 0]
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    l20, l35, l85 = (float(v) for v in np.percentile(lightness[valid], (20, 35, 85)))
    contrast = l85 - l20
    # The lip estimate uses the mouth's own rim, without the part an occluder covers.
    lip = rim & ~covered_ring
    lip_light = float(np.median(lightness[lip])) if np.any(lip) else None
    # ASSUMED: 5 Lab lightness units is the minimum observable mouth contrast.
    if contrast < 5.0:
        return blank, Evidence(0, count, contrast, 0.0, 0.0, lip_light)
    floor = l35 + max(4.0, 0.17 * contrast)
    if lip_light is not None:
        floor = max(floor, lip_light + 1.0)
    rows = np.nonzero(valid)[0]
    upper_end = int(rows[0] + 0.82 * (rows[-1] - rows[0] + 1))
    upper = np.indices(valid.shape)[0] < upper_end
    bright = valid & upper & (lightness >= floor)
    if not np.any(bright):
        return blank, Evidence(0, count, contrast, floor, 0.0, lip_light)
    # A clipped correction avoids turning a deep-red tongue into neutral white.
    bright_ab = lab[bright][:, 1:3]
    reference = np.clip(np.median(bright_ab, axis=0), -16.0, 16.0)
    corrected = np.hypot(lab[..., 1] - reference[0], lab[..., 2] - reference[1])
    candidate_chroma = chroma[bright]
    mouth_chroma = chroma[valid]
    chroma_limit = float(max(13.0, min(52.0,
                                      np.percentile(mouth_chroma, 35) + 23.0,
                                      np.percentile(candidate_chroma, 65) + 12.0)))
    # Red-dominant oral tissue remains protected, even under a strong warm cast.
    tongue_like = oral_tissue(image, lab)
    candidate = bright & (corrected <= chroma_limit) & ~tongue_like
    share = int(np.count_nonzero(candidate))
    evidence = Evidence(share, count, contrast, floor, chroma_limit, lip_light)
    if not evidence.visible:
        return blank, Evidence(0, count, contrast, floor, chroma_limit, lip_light)
    return candidate, evidence
