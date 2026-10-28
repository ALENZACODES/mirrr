"""Original, fictional digital colour selections for local W4/W5/W13/W15/W18.

There is deliberately no scraped product catalogue, brand match, price, or
assertion that a screen RGB predicts an on-skin shade. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TypeAlias

RGB: TypeAlias = tuple[int, int, int]


@dataclass(frozen=True, slots=True)
class ScreenSwatch:
    key: str
    name: str
    rgb: RGB
    family: str
    depth: str


SWATCHES: tuple[ScreenSwatch, ...] = (
    ScreenSwatch("sand", "Soft Sand", (190, 142, 118), "warm", "medium"),
    ScreenSwatch("petal", "Rose Petal", (192, 113, 135), "cool", "light"),
    ScreenSwatch("berry", "Dusky Berry", (126, 70, 110), "cool", "deep"),
    ScreenSwatch("clay", "Warm Clay", (171, 100, 83), "warm", "medium"),
    ScreenSwatch("orchid", "Muted Orchid", (155, 116, 159), "cool", "medium"),
    ScreenSwatch("cocoa", "Cocoa Veil", (115, 77, 65), "neutral", "deep"),
    ScreenSwatch("taupe", "Quiet Taupe", (140, 121, 119), "neutral", "medium"),
    ScreenSwatch("coral", "Coral Cloud", (206, 130, 115), "warm", "light"),
    ScreenSwatch("rosewood", "Rosewood", (151, 85, 94), "neutral", "medium"),
    ScreenSwatch("fig", "Fig", (117, 75, 100), "cool", "deep"),
    ScreenSwatch("gold", "Muted Gold", (171, 137, 88), "warm", "medium"),
    ScreenSwatch("plum", "Plum Shadow", (99, 69, 111), "cool", "deep"),
    ScreenSwatch("peach", "Peach Wash", (219, 166, 137), "warm", "light"),
    ScreenSwatch("lavender", "Lavender Mist", (172, 153, 190), "cool", "light"),
    ScreenSwatch("moss", "Moss Hint", (122, 144, 111), "neutral", "medium"),
    ScreenSwatch("umber", "Warm Umber", (112, 79, 64), "warm", "deep"),
    ScreenSwatch("neutral", "Neutral Veil", (169, 135, 126), "neutral", "medium"),
    ScreenSwatch("slate", "Soft Slate", (119, 130, 154), "cool", "medium"),
)
SWATCH_BY_KEY = {s.key: s for s in SWATCHES}
assert len(SWATCH_BY_KEY) == len(SWATCHES)


def checked_rgb(value: object, *, name: str) -> RGB:
    """Use explicit integral RGB so TS/Python blend bytes have identical inputs."""
    if not isinstance(value, (tuple, list)) or len(value) != 3:
        raise ValueError(f"{name} must contain three RGB integers")
    if not all(type(x) is int and 0 <= x <= 255 for x in value):
        raise ValueError(f"{name} must contain integers in the 0..255 range")
    return (value[0], value[1], value[2])


def mix_rgb(a: RGB, b: RGB, percent: int) -> RGB:
    if type(percent) is not int or not 0 <= percent <= 100:
        raise ValueError("mix percent must be 0..100")
    return tuple((a[i] * (100 - percent) + b[i] * percent + 50) // 100 for i in range(3))  # type: ignore[return-value]


def reference_from_outfit(outfit: RGB, mode: str) -> RGB:
    """Deterministic colour harmony examples, not personal attractiveness scoring."""
    if mode == "complement":
        inv = (255 - outfit[0], 255 - outfit[1], 255 - outfit[2])
        return mix_rgb((156, 118, 130), inv, 45)
    if mode == "analogous":
        return (outfit[1], outfit[2], outfit[0])
    if mode == "muted":
        return mix_rgb(outfit, (137, 125, 124), 60)
    raise ValueError(f"Unknown outfit palette mode {mode!r}")


def pick_swatch(family: str, *, depth: str = "medium") -> ScreenSwatch:
    """Fixed-order screen-palette selection; never inferred from a visitor face."""
    if family not in {"warm", "cool", "neutral"}:
        raise ValueError("Select a display undertone family")
    if depth not in {"light", "medium", "deep"}:
        raise ValueError("Select a display depth")
    candidates = [s for s in SWATCHES if s.family == family]
    return next((s for s in candidates if s.depth == depth), candidates[0])


def suggested_palette(family: str, outfit: RGB | None = None) -> tuple[ScreenSwatch, ...]:
    """Stable original palette, no matching against real makeup brands."""
    first = pick_swatch(family)
    target = outfit if outfit is not None else first.rgb
    ranked = sorted(
        SWATCHES,
        key=lambda s: (
            s.family != family,
            sum(abs(s.rgb[k] - target[k]) for k in range(3)),
            s.key,
        ),
    )
    return tuple(ranked[:4])
