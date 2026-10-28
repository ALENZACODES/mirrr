"""Shared art contract (MotifProvider) and the cards' built-in provider.

The protocol is frozen and shared with the packs session. motif_svg returns one self-contained
SVG <g> element drawn to fit a size x size box at the origin, with no script, no external
reference and no text. audit_provider checks any provider against those rules and the
forbidden-motif list.
Author: John Khan.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from typing import Protocol, runtime_checkable

from .errors import MotifError
from .motifs import BUILTIN_MOTIFS, draw_motif
from .occasions import OCCASION_IDS, get_occasion, is_forbidden_motif
from .shapes import Shape, place, shapes_svg


class MotifProvider(Protocol):
    def motif_ids(self, occasion: str) -> tuple[str, ...]: ...
    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str: ...


@runtime_checkable
class ShapeMotifProvider(Protocol):
    """Optional extension: providers that can also return primitives for raster output."""

    def motif_shapes(self, occasion: str, motif_id: str, seed: int) -> list[Shape]: ...


_UNSAFE = re.compile(
    r"<\s*(script|text|tspan|textPath|foreignObject|image|use|a|iframe|style|animate|set)\b"
    r"|\bhref\s*=|\bon[a-z]+\s*=|javascript:|url\s*\(|@import|<!ENTITY|<!DOCTYPE"
    r"|<\s*/?\s*[\w.-]+\s*:|xmlns|script|foreignobject|<!\[CDATA\[|<\?",
    re.IGNORECASE,
)
# Only plain drawing elements may appear; anything else is refused.
_ALLOWED_TAGS = frozenset({"g", "circle", "ellipse", "rect", "polygon", "polyline", "path",
                           "line"})
_TAG = re.compile(r"<\s*/?\s*([A-Za-z][\w.-]*)")


def default_roles(occasion: str) -> dict[str, str]:
    """Palette roles for stand-alone motif SVG: the occasion's first look, natural order."""
    palette = get_occasion(occasion).looks[0].palette
    return {"background": palette[0], "pattern": palette[1], "accent": palette[2],
            "ornament": palette[3], "ink": palette[4], "plate": palette[0]}


def check_motif_svg(svg: str) -> None:
    """Raise MotifError unless svg is a single safe, self-contained <g> element."""
    text = svg.strip()
    if not text.startswith("<g") or not text.endswith("</g>"):
        raise MotifError("motif SVG must be one <g> element")
    match = _UNSAFE.search(text)
    if match is not None:
        raise MotifError(f"motif SVG contains a forbidden construct: {match.group(0)!r}")
    unknown = {tag.lower() for tag in _TAG.findall(text)} - _ALLOWED_TAGS
    if unknown:
        raise MotifError(f"motif SVG uses elements outside the drawing set: {sorted(unknown)}")
    if text.count("<g") != text.count("</g>"):
        raise MotifError("motif SVG has unbalanced <g> elements")


class BuiltinMotifProvider:
    """The cards' own ornament set, drawn from primitives in motifs.py."""

    def motif_ids(self, occasion: str) -> tuple[str, ...]:
        return get_occasion(occasion).motifs

    def _check(self, occasion: str, motif_id: str) -> None:
        if motif_id not in self.motif_ids(occasion):
            raise MotifError(f"{occasion} has no built-in motif {motif_id!r}")

    def motif_shapes(self, occasion: str, motif_id: str, seed: int) -> list[Shape]:
        self._check(occasion, motif_id)
        return draw_motif(motif_id, seed)

    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str:
        shapes = place(self.motif_shapes(occasion, motif_id, seed), size / 2, size / 2, size)
        body = shapes_svg(shapes, default_roles(occasion))
        return f'<g data-motif="{motif_id}">{body}</g>'


def audit_provider(provider: MotifProvider, occasions: Iterable[str] = OCCASION_IDS,
                   seeds: Iterable[int] = (0, 1, 2)) -> list[str]:
    """List every problem found in a provider: forbidden ids and unsafe or empty SVG."""
    problems: list[str] = []
    seed_list = tuple(seeds)
    for occasion in occasions:
        for motif_id in provider.motif_ids(occasion):
            if is_forbidden_motif(motif_id):
                problems.append(f"{occasion}/{motif_id}: forbidden motif id")
                continue
            for seed in seed_list:
                svg = provider.motif_svg(occasion, motif_id, 100.0, seed)
                try:
                    check_motif_svg(svg)
                except MotifError as exc:
                    problems.append(f"{occasion}/{motif_id}/seed {seed}: {exc}")
                    break
                if len(svg) < 40:
                    problems.append(f"{occasion}/{motif_id}/seed {seed}: empty drawing")
                    break
    return problems


def builtin_ids() -> tuple[str, ...]:
    """Every motif id the built-in library can draw."""
    return tuple(sorted(BUILTIN_MOTIFS))
