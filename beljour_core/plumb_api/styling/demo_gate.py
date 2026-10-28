"""Small public bridge between local hairstyle output and pixel evidence.

Its result does not replace the separate human, demographic or frozen-face
gates; it proves whether the observed render really changed the image.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from ..commerce.strength import DEFAULT_LOCK, validate_level
from ..engines.concealer.cover import CoverGuard
from .evidence import BatchEvidence, RenderEvidence, analyse_demo, summarise_evidence
from .local_demo import DemoRefusal, DemoRender, demo_catalogue, render_demo_style


@dataclass(frozen=True)
class CheckedDemo:
    preview: DemoRender | DemoRefusal
    evidence: RenderEvidence
    quality_status: str = "UNPROVEN"

    @property
    def rendered(self) -> bool:
        return (
            isinstance(self.preview, DemoRender)
            and self.evidence.valid
            and self.preview.rendered
        )

    def public(self) -> dict[str, Any]:
        return {
            "rendered": self.rendered,
            "render": self.preview.public(),
            "pixel_evidence": self.evidence.public(),
            "quality_status": self.quality_status,
            "reason": None if self.rendered else self.evidence.status,
        }


def checked_demo(
    image: object,
    mesh: object,
    style_id: str,
    *,
    level: float = 3.0,
    lock_level: float = DEFAULT_LOCK,
    primary_box: tuple[int, int, int, int] | None = None,
    guard: CoverGuard | None = None,
) -> CheckedDemo:
    """A directly callable real-image render hook; no provider or judge is called."""
    level = validate_level(level)
    output = render_demo_style(
        image,
        mesh,
        style_id,
        level,
        lock_level=lock_level,
        primary_box=primary_box,
        guard=guard,
    )
    measured = analyse_demo(image, output)
    return CheckedDemo(output, measured)


def checked_demo_batch(
    image: object,
    mesh: object,
    *,
    style_ids: Iterable[str] | None = None,
    level: float = 3.0,
    primary_box: tuple[int, int, int, int] | None = None,
) -> BatchEvidence:
    """Check at most twelve selected demos without storing any output images.

    This is useful when validating a local build or running a drawn-only test.
    It deliberately does not report a real-face release pass.
    """
    level = validate_level(level)
    selected = tuple(row.id for row in demo_catalogue()) if style_ids is None else tuple(style_ids)
    if not selected or len(selected) > 12 or len(set(selected)) != len(selected):
        raise ValueError("Choose one to twelve distinct local demo styles")
    records: list[RenderEvidence] = []
    for style in selected:
        observation = checked_demo(
            image,
            mesh,
            style,
            level=level,
            primary_box=primary_box,
        )
        records.append(observation.evidence)
    return summarise_evidence(records)
