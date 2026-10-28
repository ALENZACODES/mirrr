"""Respect-rule audit over every registered pack and the motif library.

One call checks what reviewers otherwise check by eye: every motif id, look
id and accessory style passes the forbidden list; greetings are plain short
English text with no forbidden words; every motif draws, fits its box and
produces a self-contained SVG group; and every look has a renderer of its kind.
Author: John Khan.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass

from .forbidden import FORBIDDEN_TOKENS, forbidden_problems
from .model import SeasonalPack
from .motifs import PackMotifProvider, library_ids, motif_shapes
from .occasions import OCCASION_IDS
from .registry import DEFAULT_REGISTRY, PackRegistry, pack_problems
from .shapes import ShapeKind

GREETING_TEXT = re.compile(r"^[A-Za-z][A-Za-z ,.'!-]*$")
SVG_BANNED = ("<script", "href", "url(", "<text", "<image", "<foreignobject", " on")
BOX_SLACK = 0.02


@dataclass(frozen=True)
class AuditFinding:
    """One problem, tagged with where it was found."""

    where: str
    problem: str

    def __str__(self) -> str:
        return f"{self.where}: {self.problem}"


def greeting_problems(text: str) -> list[str]:
    """A greeting must be short plain text with no forbidden words."""
    problems: list[str] = []
    if not GREETING_TEXT.match(text):
        problems.append(f"greeting {text!r} must be plain letters and simple punctuation")
    words = {word.lower().strip(",.'!-") for word in text.split()}
    banned = sorted(words & FORBIDDEN_TOKENS)
    if banned:
        problems.append(f"greeting {text!r} uses forbidden words {banned}")
    return problems


def ellipse_bounds(
    centre: tuple[float, float], radii: tuple[float, float], angle: float
) -> list[tuple[float, float]]:
    """Corners of the exact bounding box of a rotated ellipse."""
    cos_a, sin_a = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    half_x = math.hypot(radii[0] * cos_a, radii[1] * sin_a)
    half_y = math.hypot(radii[0] * sin_a, radii[1] * cos_a)
    cx, cy = centre
    return [(cx - half_x, cy - half_y), (cx + half_x, cy + half_y)]


def motif_problems(occasion: str, motif_id: str, seeds: int = 4) -> list[str]:
    """Check a motif draws, stays in its unit box and gives a clean SVG group."""
    problems: list[str] = []
    provider = PackMotifProvider()
    for seed in range(seeds):
        shapes = motif_shapes(occasion, motif_id, seed)
        if not shapes:
            problems.append(f"seed {seed} draws nothing")
            continue
        for shape in shapes:
            points = list(shape.points)
            if shape.kind is ShapeKind.ELLIPSE:
                points = ellipse_bounds(shape.centre, shape.radii, shape.angle)
            for x, y in points:
                if not (-BOX_SLACK <= x <= 1 + BOX_SLACK and -BOX_SLACK <= y <= 1 + BOX_SLACK):
                    problems.append(f"seed {seed} leaves the unit box at ({x:.2f}, {y:.2f})")
                    break
        svg = provider.motif_svg(occasion, motif_id, 100.0, seed).lower()
        for banned in SVG_BANNED:
            if banned in svg:
                problems.append(f"seed {seed} SVG contains {banned.strip()!r}")
    return sorted(set(problems))


def pack_audit(pack: SeasonalPack) -> list[AuditFinding]:
    """Every finding for one pack."""
    where = f"pack {pack.occasion}"
    findings = [AuditFinding(where, problem) for problem in pack_problems(pack)]
    names = [look.id for look in pack.looks]
    for look in pack.looks:
        style = look.params.get("style")
        if isinstance(style, str):
            names.append(style)
    findings.extend(AuditFinding(where, problem) for problem in forbidden_problems(names))
    findings.extend(AuditFinding(where, p) for p in greeting_problems(pack.greeting))
    return findings


def audit(registry: PackRegistry | None = None) -> list[AuditFinding]:
    """Findings across the registry and the whole motif library; empty means clean."""
    packs = registry or DEFAULT_REGISTRY
    findings: list[AuditFinding] = []
    for pack in packs.packs():
        findings.extend(pack_audit(pack))
    for occasion in OCCASION_IDS:
        ids = library_ids(occasion)
        findings.extend(AuditFinding(f"motifs {occasion}", p) for p in forbidden_problems(ids))
        for motif_id in ids:
            findings.extend(
                AuditFinding(f"motif {occasion}/{motif_id}", problem)
                for problem in motif_problems(occasion, motif_id)
            )
    return findings
