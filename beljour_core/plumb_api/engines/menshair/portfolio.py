"""The public 48-style men's portfolio and per-render evidence.

The portfolio is a selection from the existing original concepts in presets.json;
nothing new is authored. ASSUMED selection rule (deterministic, source order):

* the first 33 short-sides concepts (families fade, taper, undercut, crew, crop and
  buzz), which spans all six families;
* then the first concept of each other family whose browse label is "masculine",
  in order of first appearance, until 48 are chosen.

Every style renders through the existing render_style_for_face with a 1.0-5.0
strength and the default identity lock. render_evidence() checks the result instead
of trusting it: pixels that really changed, an unmodified source array, no change
outside the clipped hair mask, unchanged alpha and zero provider calls. Level 1.0
returns the original image, which is reported as ``unchanged``, never as a render.
Tonal simulation, not a haircut prediction. Mirrored in
web/src/engines/menshair/portfolio.ts. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal

import numpy as np

from .public_render import RenderRefusal, render_style_for_face
from .render import HairAnchors, HairRecipe, available_presets

SHORT_SIDES = ("fade", "taper", "undercut", "crew", "crop", "buzz")
SHORT_SIDES_COUNT = 33
PORTFOLIO_SIZE = 48
EvidenceStatus = Literal["rendered", "unchanged", "refused"]

__all__ = ["PORTFOLIO_SIZE", "SHORT_SIDES", "PortfolioEvidence", "portfolio", "render_evidence", "select_portfolio"]


def select_portfolio(styles: tuple[HairRecipe, ...]) -> tuple[HairRecipe, ...]:
    """Apply the selection rule to a catalogue in source order."""
    short = [s for s in styles if s.family in SHORT_SIDES][:SHORT_SIDES_COUNT]
    others: list[HairRecipe] = []
    families: set[str] = set()
    for style in styles:
        if len(short) + len(others) == PORTFOLIO_SIZE:
            break
        if style.family not in SHORT_SIDES and style.presentation == "masculine" and style.family not in families:
            families.add(style.family)
            others.append(style)
    chosen = (*short, *others)
    if len(short) != SHORT_SIDES_COUNT or len(chosen) != PORTFOLIO_SIZE:
        raise ValueError("The catalogue cannot supply the 48-style portfolio")
    return chosen


@lru_cache(maxsize=1)
def portfolio() -> tuple[HairRecipe, ...]:
    return select_portfolio(available_presets())


@dataclass(frozen=True, slots=True)
class PortfolioEvidence:
    style_id: str
    level: float
    status: EvidenceStatus
    code: str | None
    changed_pixels: int
    source_unchanged: bool
    outside_unchanged: bool
    alpha_unchanged: bool
    provider_calls: int = 0

    @property
    def verified(self) -> bool:
        """A real, contained render: changed pixels and every integrity check holds."""
        return (self.status == "rendered" and self.source_unchanged and self.outside_unchanged
                and self.alpha_unchanged and self.provider_calls == 0)

    def public(self) -> dict[str, Any]:
        return {"style_id": self.style_id, "level": self.level, "status": self.status, "code": self.code,
                "changed_pixels": self.changed_pixels, "source_unchanged": self.source_unchanged,
                "outside_unchanged": self.outside_unchanged, "alpha_unchanged": self.alpha_unchanged,
                "provider_calls": self.provider_calls, "verified": self.verified, "simulated": True}


def render_evidence(image: np.ndarray, hair_mask: np.ndarray, landmarks: HairAnchors | None, style_id: str,
                    level: float = 3.0, *, primary_box: tuple[int, int, int, int] | None = None) -> PortfolioEvidence:
    """Render one portfolio style and check what actually happened to the pixels."""
    if style_id not in {s.id for s in portfolio()}:
        raise ValueError("Not a portfolio style")
    before = np.array(image, copy=True)
    result = render_style_for_face(image, hair_mask, landmarks, style_id, level, primary_box=primary_box)
    source_unchanged = bool(np.array_equal(before, image))
    if isinstance(result, RenderRefusal):
        return PortfolioEvidence(style_id, float(level), "refused", result.code, 0, source_unchanged, True, True)
    out = result.image
    region = np.asarray(hair_mask) > 0
    if primary_box is not None:
        box = np.zeros(region.shape, dtype=bool)
        box[primary_box[1]:primary_box[3], primary_box[0]:primary_box[2]] = True
        region &= box
    changed = np.any(out[..., :3] != before[..., :3], axis=-1)
    alpha = before.shape[-1] < 4 or bool(np.array_equal(out[..., 3], before[..., 3]))
    count = int(changed.sum())
    return PortfolioEvidence(style_id, result.level, "rendered" if count else "unchanged", None, count,
                             source_unchanged, not bool(np.any(changed & ~region)), alpha, result.provider_calls)
