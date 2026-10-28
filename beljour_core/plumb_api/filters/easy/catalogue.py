"""Typed catalogue for the six R19B Lane B easy filters. Author: John Khan."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from . import bridal, eye_colour, fun, glasses, retro, summer
from .evaluation import FilterId

IdentityPolicy = Literal["preserve_iris_and_marks", "change_iris_preserve_marks"]


@dataclass(frozen=True)
class FilterSpec:
    filter_id: FilterId
    gap_row: int
    name: str
    label: str
    provider: Literal["local"]
    adult_only: bool
    identity_policy: IdentityPolicy
    required_inputs: tuple[str, ...]
    scope_note: str


@dataclass(frozen=True)
class SkippedGapRow:
    gap_row: int
    name: str
    reason: str
    owner: str


FILTERS: tuple[FilterSpec, ...] = (
    FilterSpec(
        "playful_paws",
        14,
        "Playful Paws",
        fun.LABEL,
        "local",
        True,
        "preserve_iris_and_marks",
        ("left_eye", "right_eye", "nose", "mouth", "mouth_open"),
        "Still-photo original artwork only; tongue is conditional on mouth openness.",
    ),
    FilterSpec(
        "archive_flash",
        20,
        "Archive Flash",
        retro.LABEL,
        "local",
        True,
        "preserve_iris_and_marks",
        ("photo", "optional_background_mask"),
        "Photo treatment only: no generated clothing or branded yearbook template.",
    ),
    FilterSpec(
        "iris_tint",
        25,
        "Iris Tint",
        eye_colour.LABEL,
        "local",
        True,
        "change_iris_preserve_marks",
        ("iris_mask", "pupil_mask", "highlight_mask"),
        "Local iris colour only; pupil, limbal edge treatment and specular highlight remain protected.",
    ),
    FilterSpec(
        "atelier_frames",
        26,
        "Atelier Frames",
        glasses.LABEL,
        "local",
        True,
        "preserve_iris_and_marks",
        ("left_eye", "right_eye"),
        "Front-view v1 with original procedural frame geometry; no brand frames or logos.",
    ),
    FilterSpec(
        "sunlit_skin",
        27,
        "Sunlit Skin",
        summer.LABEL,
        "local",
        True,
        "preserve_iris_and_marks",
        ("skin_mask", "undertone", "optional_cheek_nose_mask"),
        "Additive warmth only by default; no tan-removal or skin-lightening control.",
    ),
    FilterSpec(
        "ceremony_light_check",
        30,
        "Ceremony Light Check",
        bridal.LABEL,
        "local",
        True,
        "preserve_iris_and_marks",
        ("skin_mask", "lip_mask", "eye_makeup_mask", "cheek_mask"),
        "Local ceremony makeup bundle plus daylight, venue and camera-flash drift report; no gown generation.",
    ),
)

SKIPPED: tuple[SkippedGapRow, ...] = (
    SkippedGapRow(4, "Closed-mouth smile with eye crinkle", "Already shipped in Lane A EASY-filter scope.", "A"),
    SkippedGapRow(28, "Warm teeth whitening", "Already shipped in Lane A EASY-filter scope.", "A"),
)


def by_id(filter_id: FilterId) -> FilterSpec:
    for spec in FILTERS:
        if spec.filter_id == filter_id:
            return spec
    raise ValueError(f"unknown R19B filter {filter_id}")


def by_gap_row(gap_row: int) -> FilterSpec:
    for spec in FILTERS:
        if spec.gap_row == gap_row:
            return spec
    raise ValueError(f"gap row {gap_row} is not built by Lane B r19b")


def validate_catalogue() -> tuple[str, ...]:
    problems: list[str] = []
    ids = [spec.filter_id for spec in FILTERS]
    rows = [spec.gap_row for spec in FILTERS]
    names = [spec.name for spec in FILTERS]
    if len(set(ids)) != len(ids):
        problems.append("duplicate filter id")
    if len(set(rows)) != len(rows):
        problems.append("duplicate gap row")
    if len(set(names)) != len(names):
        problems.append("duplicate filter name")
    if set(rows) != {14, 20, 25, 26, 27, 30}:
        problems.append("built gap rows differ from the approved R19B six")
    if {item.gap_row for item in SKIPPED} != {4, 28}:
        problems.append("skip rows must be exactly 4 and 28")
    approved_names = {"Playful Paws", "Archive Flash", "Iris Tint", "Atelier Frames", "Sunlit Skin", "Ceremony Light Check"}
    if set(names) != approved_names:
        problems.append("filter names differ from the approved original-name set")
    for spec in FILTERS:
        if spec.provider != "local":
            problems.append(f"{spec.filter_id}: provider must stay local")
        if not spec.adult_only:
            problems.append(f"{spec.filter_id}: adults-only flag missing")
        if "\n" in spec.label:
            problems.append(f"{spec.filter_id}: label must be one line")
    return tuple(problems)
