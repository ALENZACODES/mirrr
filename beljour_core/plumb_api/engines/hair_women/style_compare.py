"""Original-first, local women's hairstyle consultation comparisons. Author: John Khan.

A board is several independent masked renders from ONE unmodified source. This
module never ranks appearance, stores photos, or claims salon equivalence.
"""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from itertools import islice

import numpy as np
from numpy.typing import NDArray

from plumb_api.engines.gender_look.levels import DEFAULT_LOCK_LEVEL, IdentityGuard, checked_level

from .contracts import HairGeometry, validate_photo
from .style_guides import SIMULATION_LABEL, StyleKey, TextureKey, definition
from .style_preview import PrimaryBox, StyleGuideSession, StylePreview, render_style_guide

ByteImage = NDArray[np.uint8]
FloatPlane = NDArray[np.float64]


@dataclass(frozen=True)
class StyleChoice:
    style: StyleKey
    level: float
    texture: TextureKey


@dataclass(frozen=True)
class ComparisonPanel:
    index: int
    name: str
    original: bool
    image: ByteImage
    rendered: bool
    changed_pixel_share: float
    status: str


@dataclass(frozen=True)
class Comparison:
    panels: tuple[ComparisonPanel, ...]
    distinct_styles: int
    processed: int
    refused: int
    guard_calls: int
    simulation_label: str = SIMULATION_LABEL


def checked_choices(value: Iterable[StyleChoice]) -> tuple[StyleChoice, ...]:
    """No duplicate style IDs, ambiguous levels or arbitrary caller metadata."""
    choices = tuple(islice(value, 5))
    if not 1 <= len(choices) <= 4:
        raise ValueError("choose between one and four hairstyles")
    keys: set[str] = set()
    for item in choices:
        if not isinstance(item, StyleChoice):
            raise ValueError("a typed hairstyle selection is required")
        definition(item.style)
        checked_level(item.level)
        if item.texture not in ("straight", "wavy", "curly", "coily"):
            raise ValueError("unknown hair texture")
        if item.style in keys:
            raise ValueError("a hairstyle appears twice in the comparison")
        keys.add(item.style)
    return choices


def comparison(
    photo: ByteImage,
    hair_mask: FloatPlane,
    geometry: HairGeometry | None,
    choices: Iterable[StyleChoice],
    *,
    primary_box: PrimaryBox | None,
    side_mask: FloatPlane | None = None,
    protected_mask: FloatPlane | None = None,
    lock_level: float = DEFAULT_LOCK_LEVEL,
    identity_guard: IdentityGuard | None = None,
    session: StyleGuideSession | None = None,
) -> Comparison:
    """Render each choice from original bytes; comparison never applies recursively."""
    checked = checked_choices(choices)
    source = validate_photo(photo).copy()
    lock = checked_level(lock_level)
    items: list[ComparisonPanel] = [ComparisonPanel(0, "Original", True, source, True, 0.0, "original")]
    results: list[StylePreview] = []
    for index, item in enumerate(checked, 1):
        if session is None:
            result = render_style_guide(
                source, hair_mask, geometry, item.style, item.level, texture=item.texture,
                primary_box=primary_box, side_mask=side_mask, protected_mask=protected_mask,
                lock_level=lock, identity_guard=identity_guard,
            )
        else:
            result = session.render(
                source, hair_mask, geometry, item.style, item.level, texture=item.texture,
                primary_box=primary_box, side_mask=side_mask, protected_mask=protected_mask,
                lock_level=lock, identity_guard=identity_guard,
            )
        results.append(result)
        items.append(ComparisonPanel(index, definition(item.style).title, False, result.image.copy(),
                                     result.rendered, result.changed_pixel_share, result.status))
    return Comparison(tuple(items), len(checked), sum(result.rendered for result in results),
                      sum(not result.rendered for result in results), sum(result.guard_called for result in results))


def safe_recipe(comparison_result: Comparison, choices: Iterable[StyleChoice]) -> dict[str, object]:
    """Export option settings only, with no photo, landmarks, masks or hashes."""
    selected = checked_choices(choices)
    if comparison_result.distinct_styles != len(selected):
        raise ValueError("comparison and recipe length differ")
    return {
        "format": "beljour-women-style-choices/1",
        "simulation": True,
        "choices": [
            {"style": item.style, "level": checked_level(item.level), "texture": item.texture}
            for item in selected
        ],
    }
