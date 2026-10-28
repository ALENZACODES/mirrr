"""Design-space size per occasion, counted from the grammar's own definitions.

Two designs count as distinct when the uniqueness engine would accept both: they differ in a
discrete choice (look, layout, mask, pattern family, palette order, ornament set, frame
style, case) or by at least NEAR_PARAM in some continuous dimension. The count is therefore
the sum over discrete combinations of the product, over continuous dimensions, of
ceil(range / NEAR_PARAM). Pattern, frame and type ranges come straight from their specs;
layout cells are counted from sampled build_layout output, and palette orders from the
arrangement seeds, so both are lower bounds. The result is reported as log10 and is a lower
bound on the true count.
Author: John Khan.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass
from itertools import combinations

from .fingerprint import NEAR_PARAM
from .grammar import CARD_H, CARD_W, FRAME_STYLES, arrange_palette, build_layout
from .occasions import OCCASIONS, Look
from .patterns import PATTERN_SPECS

LAYOUT_SAMPLES = 4000
PALETTE_SAMPLES = 400
ORNAMENT_COUNTS = 8
MASKS_BY_LAYOUT = {"full_bleed": 1, "arch_window": 1, "circle_badge": 1}


@dataclass(frozen=True)
class SpaceEstimate:
    """log10 of the number of near-distinct designs for one occasion, with its parts."""

    occasion: str
    log10_designs: float
    looks: int
    log10_by_look: dict[str, float]


def _cells(span: float) -> int:
    return max(1, math.ceil(span / NEAR_PARAM - 1e-9))


def layout_cells(layout_id: str, samples: int = LAYOUT_SAMPLES) -> int:
    """Distinct near-match cells of one layout seen in a sample (a lower bound).

    Layout dimensions are correlated (the photo box decides where the text can go), so the
    count is taken from observed quantised vectors rather than a product of ranges.
    """
    cells: set[tuple[int, ...]] = set()
    for seed in range(samples):
        spec = build_layout(layout_id, random.Random(seed))
        pb, tb = spec.photo_box, spec.text_box
        dims = (pb.x / CARD_W, pb.y / CARD_H, pb.w / CARD_W, pb.h / CARD_H, tb.x / CARD_W,
                tb.y / CARD_H, tb.w / CARD_W, tb.h / CARD_H, spec.margin / CARD_W, spec.corner)
        cells.add(tuple(int(v / NEAR_PARAM) for v in dims))
    return len(cells)


def pattern_cells(family: str) -> int:
    """Each pattern parameter spans its whole normalised range (0..1)."""
    return math.prod([_cells(1.0)] * len(PATTERN_SPECS[family]))


def palette_orders(look: Look, samples: int = PALETTE_SAMPLES) -> int:
    """Distinct palette arrangements the grammar actually produces for a look."""
    return len({arrange_palette(look, random.Random(seed)).order for seed in range(samples)})


def motif_sets(look: Look) -> int:
    """Distinct ornament id sets: two to four ids from the look's motifs."""
    n = len(look.motifs)
    return sum(len(list(combinations(range(n), k))) for k in range(min(2, n), min(4, n) + 1))


def look_log10(look: Look, layout_cache: dict[str, int]) -> float:
    """log10 of the near-distinct designs of one look."""
    fixed = palette_orders(look) * motif_sets(look) * len(FRAME_STYLES) * 2 * ORNAMENT_COUNTS
    # Frame inset, frame width and headline scale each span their full range.
    fixed *= math.prod([_cells(1.0)] * 3)
    total = 0
    for layout_id in look.layouts:
        if layout_id not in layout_cache:
            layout_cache[layout_id] = layout_cells(layout_id)
        masks = MASKS_BY_LAYOUT.get(layout_id, 2)
        for family in look.patterns:
            total += masks * layout_cache[layout_id] * pattern_cells(family)
    return math.log10(total * fixed)


def estimate(occasion_id: str, layout_cache: dict[str, int] | None = None) -> SpaceEstimate:
    """Design-space estimate for one occasion."""
    cache = {} if layout_cache is None else layout_cache
    occasion = OCCASIONS[occasion_id]
    by_look = {look.id: round(look_log10(look, cache), 2) for look in occasion.looks}
    total = math.log10(sum(10 ** v for v in by_look.values()))
    return SpaceEstimate(occasion_id, round(total, 2), len(occasion.looks), by_look)


def all_estimates() -> list[SpaceEstimate]:
    """Estimates for every occasion, sharing one layout measurement cache."""
    cache: dict[str, int] = {}
    return [estimate(occasion_id, cache) for occasion_id in OCCASIONS]
