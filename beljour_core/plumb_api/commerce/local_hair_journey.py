"""One local hair journey: a settings-only recipe in, actual guarded pixels or a coded refusal out.

The recipe (``local_hair_recipe``) chooses one of the existing local engines:

* ``fibre``: ``concealer.CoverSession.render`` on the marked hair region and visible
  scalp, with the planned and the observed effect (``concealer.observed``);
* ``palette``: ``hair_palette.apply_shade``, which keeps lightening an explicit choice;
* ``short-sides``: ``menshair.render_style_for_face``.

Every engine applies its default identity guard and edits only the marked region.
Level 1.0 is recorded as ``unchanged`` and so is a render that changed no pixel; an
engine refusal is ``refused`` with its code. ``summary()`` never includes image
bytes, masks or landmarks. No provider is called. Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, cast

import numpy as np

from ..engines.concealer.cover import CoverGuard, CoverResult, CoverSession, Zone
from ..engines.concealer.observed import observe_cover_result
from ..engines.hair_palette.catalogue import require_shade
from ..engines.hair_palette.preview import PalettePreview, apply_shade
from ..engines.menshair.public_render import StyleRender, render_style_for_face
from .local_hair_recipe import LocalHairRecipe

Status = Literal["rendered", "unchanged", "refused"]


@dataclass(frozen=True)
class JourneyResult:
    kind: str
    level: float
    status: Status
    code: str | None
    image: np.ndarray | None
    changed_pixels: int
    identity_similarity: float | None
    identity_blended: bool | None
    evidence: dict[str, Any] | None

    def summary(self) -> dict[str, Any]:
        """Photo-free record of the outcome."""
        return {"format": "beljour-local-hair-journey/1", "kind": self.kind, "level": self.level,
                "status": self.status, "code": self.code, "changed_pixels": self.changed_pixels,
                "identity_guard": None if self.identity_similarity is None else {
                    "applied": True, "similarity": round(self.identity_similarity, 6),
                    "blended": self.identity_blended, "engine": "pixel_proxy"},
                "evidence": self.evidence, "provider_calls": 0, "simulated": True,
                "real_face_quality": "not_tested"}


def _marked(image: np.ndarray, hair: object, scalp: object) -> np.ndarray:
    shape = image.shape[:2]
    masks = [np.asarray(m) for m in (hair, scalp)]
    if any(m.shape != shape for m in masks):
        return np.zeros(shape, dtype=bool)
    flags = [m >= 128 if m.dtype == np.uint8 else m >= 0.5 for m in masks]
    return np.asarray(flags[0] & flags[1], dtype=np.bool_)


def run_local_hair(recipe: LocalHairRecipe, image: object, hair_mask: object, landmarks: object | None, *,
                   scalp_mask: object | None = None, primary_box: tuple[int, int, int, int] | None = None,
                   guard: CoverGuard | None = None, session: CoverSession | None = None) -> JourneyResult:
    """Run the recipe once on the caller's photo and marks."""
    if not isinstance(recipe, LocalHairRecipe):
        raise ValueError("expected a local hair recipe")
    common = {"primary_box": primary_box, "guard": guard, "lock_level": recipe.lock_level}
    result: object
    evidence: dict[str, Any] | None = None
    if recipe.kind == "fibre":
        if scalp_mask is None:
            return JourneyResult("fibre", recipe.level, "refused", "no_scalp", None, 0, None, None, None)
        pigment = None if recipe.shade_id is None else require_shade(recipe.shade_id).rgb
        result = (CoverSession() if session is None else session).render(
            # LocalHairRecipe has already checked the zone against the three fibre zones.
            image, hair_mask, scalp_mask, zone=cast(Zone, recipe.zone), level=recipe.level,
            landmarks=landmarks, palette_rgb=pigment, **common)  # type: ignore[arg-type]
        if isinstance(result, CoverResult):
            evidence = observe_cover_result(np.asarray(image), result, _marked(np.asarray(image), hair_mask, scalp_mask))
    elif recipe.kind == "palette":
        result = apply_shade(image, hair_mask, landmarks, recipe.shade_id or "", recipe.level,
                             allow_lightening=recipe.allow_lightening, **common)  # type: ignore[arg-type]
    else:
        result = render_style_for_face(image, hair_mask, landmarks, recipe.style_id or "",  # type: ignore[arg-type]
                                       recipe.level, **common)  # type: ignore[arg-type]
    if not isinstance(result, (CoverResult, PalettePreview, StyleRender)):
        return JourneyResult(recipe.kind, recipe.level, "refused", str(getattr(result, "code", "refused")),
                             None, 0, None, None, None)
    changed = result.changed_pixels if not isinstance(result, StyleRender) else result.affected_pixels
    status: Status = "unchanged" if recipe.level == 1.0 or changed == 0 else "rendered"
    return JourneyResult(recipe.kind, recipe.level, status, None, result.image, changed,
                         result.identity_similarity, result.identity_blended, evidence)
