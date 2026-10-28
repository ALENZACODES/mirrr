"""Every engine op a recipe may name, in one registry (filters-plan.md §3.3).

Importing this module registers the pointwise colour ops (colour/ops.py), the highlight glow
(spatial/glow.py) and the position light (light/position.py) under their shared names; the
TypeScript registry (web/src/filters/colour/ops.ts plus its spatial and light modules) has
the same names. `FAMILY_ORDER` is the fixed pipeline order: colour ops fuse into one LUT,
then spatial ops, then light, then the mask blend (guard, Protect skin, Background only).
Author: John Khan.
"""
from __future__ import annotations

from .colour.ops import OPS, Op
from .light import border as _border  # noqa: F401  (registers light.border)
from .light import position as _position  # noqa: F401  (registers light.*)
from .spatial import glow as _glow  # noqa: F401  (registers spatial.glow)
from .spatial import grain as _grain  # noqa: F401  (registers spatial.grain)
from .spatial import halation as _halation  # noqa: F401  (registers spatial.halation)
from .spatial import structure as _structure  # noqa: F401  (registers spatial.structure)

FAMILY_ORDER = ("colour", "spatial", "light")


def op(name: str) -> Op:
    found = OPS.get(name)
    if found is None:
        raise KeyError(f"unknown filter op {name!r}")
    return found


def names(family: str | None = None) -> list[str]:
    return sorted(n for n, o in OPS.items() if family is None or o.family == family)
