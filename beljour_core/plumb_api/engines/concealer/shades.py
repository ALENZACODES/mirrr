"""LS5 shade card: hair colour from the photo, matched to our generic 14-shade library.

Plan §8.4 "Shade match": hair colour = median Lab of the hair pixels whose L* lies between
the 20th and 80th percentile (drops shine and shadow). Compared by CIEDE2000 with the
library below; the top 3 are shown with their delta E. If the best is above 3, a two-shade
mix is suggested: the two shades are mixed in linear RGB at ratios 10%..90% (5% steps) and
each mix is scored in Lab.

The 14 shades are Lab values we define ourselves: generic names, no brands.
Mirrored in web/src/engines/local/fibre.ts. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import numpy as np

from ..core.colour import ciede2000, lab_to_rgb, rgb_to_lab, srgb_decode, srgb_encode, srgb_to_lab_array
from ..core.filters import quantile

SHADES: tuple[tuple[str, str, tuple[float, float, float]], ...] = (
    ("S01", "Jet black", (14.0, 1.0, 1.0)),
    ("S02", "Soft black", (18.0, 2.0, 3.0)),
    ("S03", "Darkest brown", (22.0, 4.0, 6.0)),
    ("S04", "Dark brown", (27.0, 6.0, 9.0)),
    ("S05", "Medium brown", (33.0, 8.0, 13.0)),
    ("S06", "Chestnut", (36.0, 13.0, 17.0)),
    ("S07", "Light brown", (42.0, 9.0, 18.0)),
    ("S08", "Auburn", (35.0, 20.0, 22.0)),
    ("S09", "Dark blonde", (50.0, 7.0, 21.0)),
    ("S10", "Medium blonde", (58.0, 6.0, 24.0)),
    ("S11", "Light blonde", (68.0, 4.0, 24.0)),
    ("S12", "Strawberry blonde", (60.0, 14.0, 26.0)),
    ("S13", "Grey", (58.0, 0.0, 2.0)),
    ("S14", "Silver", (75.0, 0.0, 1.0)),
)
MIX_RATIOS = tuple(round(0.1 + 0.05 * k, 2) for k in range(17))
MIX_ABOVE = 3.0
SHADE_BY_ID = {sid: (name, lab) for sid, name, lab in SHADES}


def shade_lab(shade_id: str) -> tuple[float, float, float]:
    if shade_id not in SHADE_BY_ID:
        raise ValueError(f"unknown shade {shade_id!r}")
    return SHADE_BY_ID[shade_id][1]


def hair_colour(image: np.ndarray, hair: np.ndarray) -> tuple[float, float, float]:
    """Median Lab of hair pixels with L* between its 20th and 80th percentile."""
    on = np.asarray(hair, dtype=bool)
    if on.sum() < 5:
        raise ValueError("too few hair pixels to read a colour")
    lab = srgb_to_lab_array(np.asarray(image)[..., :3])[on]
    lo, hi = quantile(lab[:, 0], 0.2), quantile(lab[:, 0], 0.8)
    keep = lab[(lab[:, 0] >= lo) & (lab[:, 0] <= hi)]
    if len(keep) == 0:
        keep = lab
    return (quantile(keep[:, 0], 0.5), quantile(keep[:, 1], 0.5), quantile(keep[:, 2], 0.5))


def linear_of(lab: Sequence[float]) -> tuple[float, float, float]:
    """Linear-light RGB (0..1) of a Lab colour, clipped to the sRGB gamut."""
    rgb = lab_to_rgb(lab)
    r, g, b = (srgb_decode(min(max(v / 255.0, 0.0), 1.0)) for v in rgb)
    return (r, g, b)


def lab_of_linear(lin: Sequence[float]) -> tuple[float, float, float]:
    return rgb_to_lab([srgb_encode(min(max(v, 0.0), 1.0)) * 255.0 for v in lin])


def match(hair_lab: Sequence[float], top: int = 3) -> list[dict[str, Any]]:
    rows = [{"id": sid, "name": name, "lab": list(lab), "delta_e": ciede2000(hair_lab, lab)} for sid, name, lab in SHADES]
    rows.sort(key=lambda r: (r["delta_e"], r["id"]))
    return rows[:top]


def best_mix(hair_lab: Sequence[float]) -> dict[str, Any]:
    """Best two-shade mix (linear RGB, scored in Lab) over every pair and ratio."""
    lins = [linear_of(lab) for _, _, lab in SHADES]
    best: dict[str, Any] | None = None
    for i in range(len(SHADES)):
        for j in range(i + 1, len(SHADES)):
            for t in MIX_RATIOS:
                mix = [(1 - t) * lins[i][c] + t * lins[j][c] for c in range(3)]
                lab = lab_of_linear(mix)
                de = ciede2000(hair_lab, lab)
                if best is None or de < best["delta_e"] - 1e-12:
                    best = {"first": SHADES[i][0], "second": SHADES[j][0], "second_share": t,
                            "lab": [round(v, 3) for v in lab], "delta_e": de}
    assert best is not None
    return best


def shade_card(hair_lab: Sequence[float]) -> dict[str, Any]:
    """Top 3 shades with delta E, plus a two-shade mix when the best is above 3."""
    top = match(hair_lab)
    card: dict[str, Any] = {"hair_lab": [round(v, 3) for v in hair_lab],
                            "top": [{**r, "delta_e": round(r["delta_e"], 3)} for r in top], "mix": None}
    if top[0]["delta_e"] > MIX_ABOVE:
        mix = best_mix(hair_lab)
        card["mix"] = {**mix, "delta_e": round(mix["delta_e"], 3)}
    return card
