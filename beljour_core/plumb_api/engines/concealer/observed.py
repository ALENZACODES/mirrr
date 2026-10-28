"""Observed fibre effect from the final, identity-guarded pixels.

The renderer's ``after_share`` is a projection from the planned opacity. This module
measures what the shown pixels actually did, inside the marked visible scalp only:

* for each marked pixel, ``t`` is how far the shown colour moved from the original
  towards the fibre pigment, projected on that line and clipped to [0, 1];
* ``observed_effect_fraction`` is the mean ``t`` over marked pixels whose original
  colour differs from the pigment by at least ``MIN_CONTRAST`` (RGB units);
* a guard that restores the original gives exactly 0.

Coded refusals instead of a number: ``invalid_mask`` (wrong shape or nothing marked),
``alpha_changed``, ``leaked_pixels`` (any colour change outside the marked scalp),
``unrelated_colour_movement`` (a marked pixel moved more than ``MAX_RESIDUAL`` off
the original-to-pigment line) and ``insufficient_contrast`` (fewer than
``MIN_CONTRAST_PIXELS`` pixels, or under half of the marked scalp, differ enough from
the pigment to measure). The thresholds are ASSUMED engineering bounds.

No physical scalp coverage is inferred; this is on-screen pixel evidence only. The
same definition is in web/src/commerce/observed-cover.ts and is checked against
parity/cover-observation-r28f.json (18 invented RGB blocks). Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import numpy as np

from .cover import CoverResult

MIN_CONTRAST = 12.0
MAX_RESIDUAL = 4.0
MIN_CONTRAST_PIXELS = 16
RefusalCode = Literal["invalid_mask", "alpha_changed", "leaked_pixels", "unrelated_colour_movement",
                      "insufficient_contrast"]
PARITY = Path(__file__).resolve().parents[4] / "parity" / "cover-observation-r28f.json"


@dataclass(frozen=True, slots=True)
class CoverObservation:
    code: RefusalCode | None
    marked_pixels: int
    contrast_pixels: int
    changed_pixels: int
    observed_effect_fraction: float | None
    max_residual: float

    @property
    def refused(self) -> bool:
        return self.code is not None

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-cover-observation/1", "refused": self.refused, "code": self.code,
                "marked_pixels": self.marked_pixels, "contrast_pixels": self.contrast_pixels,
                "changed_pixels": self.changed_pixels,
                "observed_effect_fraction": (None if self.observed_effect_fraction is None
                                             else round(self.observed_effect_fraction, 6)),
                "max_residual": round(self.max_residual, 6), "physical_coverage_inferred": False}


def _mask(value: object, shape: tuple[int, int]) -> np.ndarray | None:
    data = np.asarray(value)
    if data.shape != shape:
        return None
    if data.dtype == np.bool_:
        return data.copy()
    if data.dtype == np.uint8:
        return data >= 128
    if data.dtype.kind == "f" and np.all(np.isfinite(data)) and data.min() >= 0 and data.max() <= 1:
        return data >= 0.5
    return None


def observe_cover(before: object, after: object, marked_scalp: object,
                  pigment_rgb: tuple[int, int, int]) -> CoverObservation:
    """Measure the shown fibre effect inside the marked scalp, or refuse with a code."""
    old, new = np.asarray(before), np.asarray(after)
    if (old.dtype != np.uint8 or new.dtype != np.uint8 or old.ndim != 3 or old.shape != new.shape
            or old.shape[2] not in (3, 4)):
        raise ValueError("before and after must be same-size uint8 RGB or RGBA images")
    if len(pigment_rgb) != 3 or any(type(c) is not int or not 0 <= c <= 255 for c in pigment_rgb):
        raise ValueError("pigment must be three RGB bytes")
    marked = _mask(marked_scalp, (int(old.shape[0]), int(old.shape[1])))
    if marked is None or not bool(marked.any()):
        return CoverObservation("invalid_mask", 0, 0, 0, None, 0.0)
    count = int(marked.sum())
    if old.shape[2] == 4 and bool(np.any(old[..., 3] != new[..., 3])):
        return CoverObservation("alpha_changed", count, 0, 0, None, 0.0)
    moved = np.any(old[..., :3] != new[..., :3], axis=-1)
    changed = int(np.count_nonzero(moved & marked))
    if bool(np.any(moved & ~marked)):
        return CoverObservation("leaked_pixels", count, 0, changed, None, 0.0)
    b = old[..., :3][marked].astype(np.float64)
    step = new[..., :3][marked].astype(np.float64) - b
    line = np.asarray(pigment_rgb, dtype=np.float64)[None, :] - b
    length2 = np.sum(line * line, axis=1)
    contrast = length2 >= MIN_CONTRAST ** 2
    raw = np.where(length2 > 0, np.sum(step * line, axis=1) / np.where(length2 > 0, length2, 1.0), 0.0)
    off_line = step - raw[:, None] * line
    residual = np.sqrt(np.sum(off_line * off_line, axis=1))
    worst = float(residual.max()) if residual.size else 0.0
    if worst > MAX_RESIDUAL:
        return CoverObservation("unrelated_colour_movement", count, int(contrast.sum()), changed, None, worst)
    usable = int(contrast.sum())
    if usable < MIN_CONTRAST_PIXELS or 2 * usable < count:
        return CoverObservation("insufficient_contrast", count, usable, changed, None, worst)
    effect = float(np.clip(raw[contrast], 0.0, 1.0).mean())
    return CoverObservation(None, count, usable, changed, effect, worst)


def planned_effect_fraction(result: CoverResult) -> float:
    """The renderer's projected share of visible scalp covered (its historical estimate)."""
    if result.before_share <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - result.after_share / result.before_share))


def observe_cover_result(before: object, result: CoverResult, marked_scalp: object) -> dict[str, Any]:
    """Planned versus observed evidence for one rendered (full-resolution) fibre preview."""
    observation = observe_cover(before, result.image, marked_scalp, result.measured_hair_rgb)
    return {"planned_effect_fraction": round(planned_effect_fraction(result), 6),
            "observation": observation.public(), "level": result.level, "provider_calls": 0}


def _block(seed: int, size: int = 6) -> np.ndarray:
    """Invented RGB block from an integer hash; values 30..225."""
    idx = np.arange(size * size, dtype=np.int64)
    h = (idx * 2654435761 + seed * 40503) & 0xFFFFFFFF
    channels = [((h >> shift) & 0xFF) % 196 + 30 for shift in (0, 8, 16)]
    return np.stack(channels, axis=-1).reshape(size, size, 3).astype(np.uint8)


def _toward(before: np.ndarray, pigment: tuple[int, int, int], share: float, mask: np.ndarray) -> np.ndarray:
    after = before.copy()
    mixed = before.astype(np.float64) * (1 - share) + np.asarray(pigment, dtype=np.float64) * share
    after[mask] = np.clip(np.floor(mixed[mask] + 0.5), 0, 255).astype(np.uint8)
    return after


def parity_vectors() -> list[dict[str, Any]]:
    """Eighteen invented 6x6 blocks covering every outcome of observe_cover."""
    full = np.ones((6, 6), dtype=bool)
    half = np.zeros((6, 6), dtype=bool)
    half[:, :3] = True
    cases: list[tuple[str, np.ndarray, np.ndarray, np.ndarray, tuple[int, int, int]]] = []
    for k, share in enumerate((0.0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1.0)):
        before = _block(k + 1)
        pigment = (40 + 20 * k, 30 + 10 * k, 25 + 5 * k)
        cases.append((f"toward-{int(share * 100):03d}", before, _toward(before, pigment, share, full), full, pigment))
    before = _block(20)
    cases.append(("half-mask", before, _toward(before, (60, 45, 35), 0.5, half), half, (60, 45, 35)))
    cases.append(("restored-by-guard", before, before.copy(), full, (60, 45, 35)))
    leaked = _toward(before, (60, 45, 35), 0.5, half)
    leaked[0, 5] = (0, 0, 0)
    cases.append(("leaked", before, leaked, half, (60, 45, 35)))
    sideways = before.copy()
    sideways[..., 1] = np.clip(sideways[..., 1].astype(int) + 40, 0, 255).astype(np.uint8)
    cases.append(("unrelated", before, sideways, full, (60, 45, 35)))
    flat = np.full((6, 6, 3), 61, dtype=np.uint8)
    cases.append(("low-contrast", flat, _toward(flat, (64, 60, 58), 0.5, full), full, (64, 60, 58)))
    cases.append(("empty-mask", before, before.copy(), np.zeros((6, 6), dtype=bool), (60, 45, 35)))
    away = _toward(before, (60, 45, 35), -0.2, full)
    cases.append(("moved-away", before, away, full, (60, 45, 35)))
    beyond = _toward(before, (60, 45, 35), 1.0, full)
    cases.append(("exact-pigment", before, beyond, full, (60, 45, 35)))
    dark = _block(30)
    cases.append(("dark-pigment", dark, _toward(dark, (10, 8, 6), 0.3, full), full, (10, 8, 6)))
    out = []
    for name, old, new, mask, pigment in cases:
        found = observe_cover(old, new, mask, pigment)
        out.append({"id": name, "before": old.reshape(-1, 3).tolist(), "after": new.reshape(-1, 3).tolist(),
                    "mask": mask.reshape(-1).astype(int).tolist(), "pigment": list(pigment),
                    "expected": found.public()})
    return out


def parity_payload() -> dict[str, Any]:
    return {"format": "beljour-cover-observation-parity/1", "author": "John Khan", "synthetic": True,
            "width": 6, "height": 6, "tolerance": 1e-6, "vectors": parity_vectors()}


def parity_in_sync(path: Path = PARITY) -> bool:
    return bool(json.loads(path.read_text(encoding="utf-8")) == parity_payload())


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        if not parity_in_sync():
            raise SystemExit("cover observation parity is stale; run without --check")
        print("Cover observation parity in sync")
    else:
        PARITY.write_text(json.dumps(parity_payload(), separators=(",", ":")) + "\n", encoding="utf-8")
        print(f"Wrote {PARITY}")
