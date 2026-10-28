"""One public entry that renders all five hair strength stops with the real engines.

Fibre cover, in-house hair colour and the men's short-sides guide each run at
1.0, 2.0, 3.0, 4.0 and 5.0 through their production render functions, with
the identity guard applied at every stop. Evidence is measured from the final
pixels; unchanged and refused stops stay in the five-case denominator. Every
board uses a fresh fibre session, so a new photo can never reuse an earlier
render. The board is memory-only and capped at 1,048,576 source pixels. Local
simulation; no provider call, no image persistence.
Mirrored in web/src/commerce/level-board.ts.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from ..engines.concealer.cover import (
    CoverDecision,
    CoverGuard,
    CoverRefusal,
    CoverResult,
    CoverSession,
    DefaultCoverGuard,
    Zone,
)
from ..engines.hair_palette.catalogue import require_shade
from ..engines.hair_palette.preview import PalettePreview, PaletteRefusal, apply_shade
from ..engines.menshair.public_render import RenderRefusal, StyleRender, render_style_for_face
from ..engines.menshair.render import HairAnchors
from .level_evidence import (
    FIVE_LEVELS,
    FrameEvidence,
    FrameEvidenceError,
    LevelTotals,
    frame_evidence,
    refused_evidence,
    totals,
)
from .strength import DEFAULT_LOCK, validate_level

Kind = Literal["fibre", "palette", "short-sides"]
KINDS: tuple[Kind, ...] = ("fibre", "palette", "short-sides")
MAX_BOARD_PIXELS = 1_048_576
BOARD_LABEL = "Local simulation board: five strengths of one edit on your photo. Not a product or real-face result."
U8 = NDArray[np.uint8]


class BoardRefusal(ValueError):
    """The whole board cannot be built, for example because the photo is too large."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


class _CountingGuard:
    """Passes every call to the real guard and records that it ran."""

    def __init__(self, inner: CoverGuard) -> None:
        self.inner = inner
        self.calls = 0

    def guard(self, before: U8, after: U8, lock_level: float) -> CoverDecision:
        self.calls += 1
        return self.inner.guard(before, after, lock_level)


@dataclass(frozen=True)
class ComparisonTile:
    level: float
    image: U8
    evidence: FrameEvidence


@dataclass(frozen=True)
class HairComparison:
    """The original and five tiles; refused or unchanged tiles show the original."""

    kind: Kind
    choice: dict[str, object]
    original: U8
    tiles: tuple[ComparisonTile, ...]

    @property
    def totals(self) -> LevelTotals:
        return totals(tuple(tile.evidence for tile in self.tiles))

    def public(self) -> dict[str, object]:
        """Photo-free report: settings, numeric evidence and fixed labels only."""
        height, width = self.original.shape[:2]
        return {
            "kind": self.kind, "choice": dict(self.choice), "width": int(width), "height": int(height),
            "levels": [tile.evidence.public() for tile in self.tiles],
            "totals": self.totals.public(), "simulated": True, "provider_calls": 0,
            "real_face_status": "not_tested", "label": BOARD_LABEL,
        }


def _region(mask: object, shape: tuple[int, int], box: tuple[int, int, int, int] | None,
            kind: Kind) -> NDArray[np.bool_] | None:
    """The pixels each engine is allowed to edit, using that engine's own mask rule."""
    values = np.asarray(mask)
    if values.shape != shape or values.dtype not in (np.bool_, np.uint8, np.float32, np.float64):
        return None
    if values.dtype == np.bool_:
        allowed = values.copy()
    elif values.dtype == np.uint8:
        allowed = values > 0 if kind == "short-sides" else values >= 128
    else:
        if not np.all(np.isfinite(values)) or bool(np.any(values < 0)) or bool(np.any(values > 1)):
            return None
        if kind == "short-sides":
            allowed = np.floor(values.astype(np.float64) * 255.0 + 0.5) > 0
        else:
            allowed = values >= 0.5
    if box is not None:
        clip = np.zeros(shape, dtype=bool)
        clip[box[1]:box[3], box[0]:box[2]] = True
        allowed &= clip
    return allowed


def _source(image: object) -> U8:
    pixels = np.asarray(image)
    if pixels.dtype != np.uint8 or pixels.ndim != 3 or pixels.shape[2] not in (3, 4):
        raise BoardRefusal("invalid_image", "Expected an RGB or RGBA photo")
    if pixels.shape[0] * pixels.shape[1] > MAX_BOARD_PIXELS:
        raise BoardRefusal("too_large", "The five-strength board is limited to 1,048,576 pixels")
    return pixels.copy()


def compare_levels(image: object, hair_mask: object, landmarks: HairAnchors | None, kind: Kind, *,
                   scalp_mask: object | None = None, zone: Zone = "crown",
                   shade_id: str | None = None, style_id: str | None = None,
                   allow_lightening: bool = False,
                   primary_box: tuple[int, int, int, int] | None = None,
                   guard: CoverGuard | None = None,
                   lock_level: object = DEFAULT_LOCK) -> HairComparison:
    """Render 1.0 to 5.0 for one edit; every stop is real engine output or a coded refusal."""
    if kind not in KINDS:
        raise ValueError("Unknown hair comparison kind")
    if type(allow_lightening) is not bool:
        raise ValueError("Lightening permission must be a boolean")
    locked = validate_level(lock_level)
    source = _source(image)
    shape = (int(source.shape[0]), int(source.shape[1]))
    counting = _CountingGuard(DefaultCoverGuard() if guard is None else guard)
    session = CoverSession(capacity=1)
    if kind == "fibre":
        choice: dict[str, object] = {"zone": zone, "shade_id": shade_id}
        if zone not in ("crown", "parting", "hairline"):
            raise ValueError("Unknown fibre zone")
    elif kind == "palette":
        if not isinstance(shade_id, str):
            raise ValueError("A hair-colour board needs a shade")
        choice = {"shade_id": shade_id, "allow_lightening": allow_lightening}
    else:
        if not isinstance(style_id, str):
            raise ValueError("A short-sides board needs a style")
        choice = {"style_id": style_id}
    region = _region(hair_mask, shape, primary_box, kind)
    region_pixels = 0 if region is None else int(region.sum())
    tiles: list[ComparisonTile] = []
    for level in FIVE_LEVELS:
        before_calls = counting.calls
        result = _render_one(kind, source, hair_mask, scalp_mask, landmarks, level, session,
                             zone=zone, shade_id=shade_id, style_id=style_id,
                             allow_lightening=allow_lightening, primary_box=primary_box,
                             guard=counting, lock_level=locked)
        if isinstance(result, (CoverRefusal, PaletteRefusal, RenderRefusal)):
            tiles.append(ComparisonTile(level, source.copy(), refused_evidence(level, result.code,
                                                                               region_pixels)))
            continue
        assert region is not None  # an engine only renders after accepting the same mask
        try:
            evidence = frame_evidence(source, result.image, region, level,
                                      similarity=result.identity_similarity,
                                      blended=result.identity_blended,
                                      guard_applied=counting.calls > before_calls)
        except FrameEvidenceError as error:
            tiles.append(ComparisonTile(level, source.copy(),
                                        refused_evidence(level, error.code, region_pixels)))
            continue
        tiles.append(ComparisonTile(level, result.image.copy(), evidence))
    session.clear()
    return HairComparison(kind, choice, source, tuple(tiles))


def _render_one(kind: Kind, source: U8, hair_mask: object, scalp_mask: object | None,
                landmarks: HairAnchors | None, level: float, session: CoverSession, *,
                zone: Zone, shade_id: str | None, style_id: str | None, allow_lightening: bool,
                primary_box: tuple[int, int, int, int] | None, guard: CoverGuard,
                lock_level: float) -> CoverResult | CoverRefusal | PalettePreview | PaletteRefusal | \
        StyleRender | RenderRefusal:
    if kind == "fibre":
        if scalp_mask is None:
            return CoverRefusal("no_scalp", "Mark visible scalp for a fibre board")
        rgb = None if shade_id is None else require_shade(shade_id).rgb
        return session.render(source, hair_mask, scalp_mask, zone=zone, level=level,
                              landmarks=landmarks, primary_box=primary_box, palette_rgb=rgb,
                              guard=guard, lock_level=lock_level)
    if kind == "palette":
        assert shade_id is not None
        return apply_shade(source, hair_mask, landmarks, shade_id, level, primary_box=primary_box,
                           allow_lightening=allow_lightening, guard=guard, lock_level=lock_level)
    assert style_id is not None
    return render_style_for_face(source, hair_mask, landmarks, style_id, level,
                                 primary_box=primary_box, guard=guard, lock_level=lock_level)
