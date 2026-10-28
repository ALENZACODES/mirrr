"""Public, view-scoped catalogue for seven *photo* posture simulations.

J10-J16 describe 2D contour edits, not clinical posture measurements.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .fixes import FIXES
from .points import Controls

SIMULATION_LABEL = "Simulation. Photo edit only, not medical advice."
VIEW_REQUIRED = "view_required"
FIX_UNAVAILABLE = "fix_unavailable"


class PostureRefusal(ValueError):
    """A user-facing refusal with a stable reason code."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class PostureFix:
    id: str
    fix: str
    name: str
    view: Literal["front", "side"]
    moves: tuple[str, ...]
    pins: tuple[str, ...]
    label: str = SIMULATION_LABEL
    available: bool = True
    reason: str = ""

    def to_json(self) -> dict[str, object]:
        return {
            "id": self.id,
            "fix": self.fix,
            "name": self.name,
            "view": self.view,
            "moves": list(self.moves),
            "pins": list(self.pins),
            "label": self.label,
            "available": self.available,
            "reason": self.reason,
        }


NAMES: dict[str, str] = {
    "lean": "Straighten lean",
    "uneven_shoulders": "Level shoulders",
    "rounded_shoulders": "Open rounded shoulders",
    "forward_head": "Head back over shoulders",
    "slouch": "Lift slouch",
    "swayback": "Ease swayback",
    "pelvic_tilt": "Ease pelvic tilt",
}

# The last entry is an expressly approximate contour edit, not a pelvic angle estimate.
WARNINGS: dict[str, str] = {
    "pelvic_tilt": "Illustrative lower-body contour only; pelvic angle cannot be inferred from this view.",
    "swayback": "Side-view outline estimate; depth and spinal curvature are not measured.",
}


def posture_fixes() -> tuple[PostureFix, ...]:
    """Exactly the current runnable J10-J16 engine catalogue, in ID order."""
    out: list[PostureFix] = []
    for fix, engine in FIXES.items():
        view = str(engine["view"])
        if view not in ("front", "side"):
            raise ValueError("invalid registered view")
        typed_view: Literal["front", "side"] = "front" if view == "front" else "side"
        out.append(PostureFix(
            id=str(engine["id"]),
            fix=fix,
            name=NAMES[fix],
            view=typed_view,
            moves=tuple(str(n) for n in engine["moves"]),
            pins=tuple(str(n) for n in engine["pins"]),
            reason=WARNINGS.get(fix, ""),
        ))
    return tuple(out)


def require_compatible(controls: Controls, fix: str) -> PostureFix:
    """Reject mismatched views instead of fabricating inaccessible control points."""
    entry = next((entry for entry in posture_fixes() if entry.fix == fix), None)
    if entry is None or not entry.available:
        raise PostureRefusal(FIX_UNAVAILABLE, "This edit is not available with the current controls.")
    if entry.view != controls.view:
        raise PostureRefusal(VIEW_REQUIRED, f"{entry.name} needs a {entry.view} photo.")
    return entry


def posture_catalogue_json() -> list[dict[str, object]]:
    return [entry.to_json() for entry in posture_fixes()]
