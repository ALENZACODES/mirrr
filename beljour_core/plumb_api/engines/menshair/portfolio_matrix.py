"""The 48-style portfolio rendered on eight drawn head cases, plus a missing-mesh case.

Drawn inputs only (no photographs): a head ellipse on one of two backgrounds, with a
hair cap in one of four textures (flat, strand stripes, integer-hash grain, curl
waves), 2 x 4 = 8 cases. Each case renders all 48 styles at one strength through
portfolio.render_evidence; a case without landmarks must refuse all 48 with
``no_mesh``. Every attempt stays in the denominator. Synthetic only, not a quality
or likeness result. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import numpy as np

from .portfolio import PortfolioEvidence, portfolio, render_evidence
from .render import HairAnchors

HEIGHT, WIDTH = 56, 48
BACKGROUNDS: dict[str, tuple[int, int, int]] = {"light": (214, 210, 204), "dark": (46, 52, 60)}
TEXTURES = ("flat", "stripes", "grain", "curls")
SKIN = (196, 150, 124)
HAIR = (62, 44, 34)
ANCHORS = HairAnchors.parse({
    "left_temple": (0.30, 0.38), "right_temple": (0.70, 0.38), "crown": (0.50, 0.12),
    "left_ear": (0.26, 0.56), "right_ear": (0.74, 0.56), "nape": (0.50, 0.82),
})

__all__ = ["ANCHORS", "BACKGROUNDS", "TEXTURES", "MatrixReport", "drawn_case", "run_matrix"]


def _texture(name: str, yy: np.ndarray, xx: np.ndarray) -> np.ndarray:
    if name == "flat":
        return np.zeros_like(yy)
    if name == "stripes":
        return np.where(xx % 4 < 2, 10, -10)
    if name == "grain":
        return (yy * 7 + xx * 13) % 23 - 11
    return np.rint(12 * np.sin(xx / 2.0) * np.cos(yy / 3.0)).astype(np.int64)


def drawn_case(background: str, texture: str) -> tuple[np.ndarray, np.ndarray]:
    """(RGB uint8 image, uint8 hair mask) for one drawn head."""
    if background not in BACKGROUNDS or texture not in TEXTURES:
        raise ValueError("Unknown drawn case")
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]
    head = ((xx - WIDTH / 2) / (WIDTH * 0.30)) ** 2 + ((yy - HEIGHT * 0.47) / (HEIGHT * 0.38)) ** 2 <= 1
    sides = (np.abs(xx - WIDTH / 2) > WIDTH * 0.2) & (yy < HEIGHT * 0.66)
    hair = head & ((yy < HEIGHT * 0.42) | sides)
    image = np.empty((HEIGHT, WIDTH, 3), dtype=np.int64)
    image[:] = BACKGROUNDS[background]
    image[head] = SKIN
    shade = np.asarray(HAIR)[None, :] + _texture(texture, yy[hair], xx[hair])[:, None]
    image[hair] = shade
    return np.clip(image, 0, 255).astype(np.uint8), (hair * 255).astype(np.uint8)


@dataclass(frozen=True, slots=True)
class MatrixReport:
    level: float
    evidence: tuple[tuple[str, PortfolioEvidence], ...]

    def count(self, status: str) -> int:
        return sum(1 for _, e in self.evidence if e.status == status)

    @property
    def verified(self) -> int:
        return sum(1 for _, e in self.evidence if e.verified)

    def public(self) -> dict[str, Any]:
        cases: dict[str, dict[str, int]] = {}
        for case, e in self.evidence:
            row = cases.setdefault(case, {"attempted": 0, "verified": 0, "unchanged": 0, "refused": 0})
            row["attempted"] += 1
            row["verified"] += e.verified
            row["unchanged"] += e.status == "unchanged"
            row["refused"] += e.status == "refused"
        return {"format": "beljour-menshair-portfolio-matrix/1", "level": self.level,
                "attempted": len(self.evidence), "verified": self.verified,
                "unchanged": self.count("unchanged"), "refused": self.count("refused"), "cases": cases,
                "kind": "drawn_synthetic_cases", "provider_calls": 0}


@lru_cache(maxsize=4)
def run_matrix(level: float = 3.0) -> MatrixReport:
    """8 drawn cases x 48 styles, then the same 48 with no landmarks (all must refuse)."""
    rows: list[tuple[str, PortfolioEvidence]] = []
    styles = [s.id for s in portfolio()]
    for background in BACKGROUNDS:
        for texture in TEXTURES:
            image, mask = drawn_case(background, texture)
            rows.extend((f"{background}-{texture}", render_evidence(image, mask, ANCHORS, sid, level))
                        for sid in styles)
    image, mask = drawn_case("light", "flat")
    rows.extend(("no-mesh", render_evidence(image, mask, None, sid, level)) for sid in styles)
    return MatrixReport(float(level), tuple(rows))
