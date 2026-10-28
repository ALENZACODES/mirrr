"""R19 inclusive hair-concept consultation and short-sides reference comparison.

All profile inputs are explicitly user-selected styling preferences, never inferred
identity, age, ethnicity, sex, health or texture from a face. A recommendation is
an explainable catalogue browsing order, *not* a prediction of which hairstyle
is physically possible or flattering. Photos and provider IDs never enter here.
The TypeScript mirror is `web/src/engines/menshair/consultation.ts`.
"""
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal

from .render import HairRecipe

Texture = Literal["straight", "wavy", "curly", "coily", "any"]
Length = Literal["short", "medium", "long", "any"]
Presentation = Literal["masculine", "feminine", "unisex", "any"]
Fade = Literal["low", "mid", "high", "any"]
Shape = Literal["classic", "skin", "drop", "burst", "temple", "shadow", "any"]

TEXTURES = frozenset({"straight", "wavy", "curly", "coily", "any"})
LENGTHS = frozenset({"short", "medium", "long", "any"})
PRESENTATIONS = frozenset({"masculine", "feminine", "unisex", "any"})
FADES = frozenset({"low", "mid", "high", "any"})
SHAPES = frozenset({"classic", "skin", "drop", "burst", "temple", "shadow", "any"})

FAMILY_COMPATIBILITY: dict[str, frozenset[str]] = {
    "buzz": frozenset({"straight", "wavy", "curly", "coily"}),
    "crop": frozenset({"straight", "wavy", "curly"}),
    "taper": frozenset({"straight", "wavy", "curly", "coily"}),
    "fade": frozenset({"straight", "wavy", "curly", "coily"}),
    "curly-fade": frozenset({"curly", "coily"}),
    "afro": frozenset({"coily", "curly"}),
    "coils": frozenset({"coily", "curly"}),
    "twists": frozenset({"coily", "curly"}),
    "locs": frozenset({"coily", "curly"}),
    "curls": frozenset({"curly", "coily"}),
    "waves": frozenset({"wavy", "curly", "straight"}),
    "braid": frozenset({"wavy", "curly", "coily", "straight"}),
}
SHORT_FAMILIES = frozenset({"buzz", "crew", "crop", "fade", "taper", "undercut",
                             "pixie", "caesar", "ivy", "side-part", "flattop"})
LONG_FAMILIES = frozenset({"layers", "shoulder", "ponytail", "updo", "braid", "locs", "bun"})


@dataclass(frozen=True, slots=True)
class Consultation:
    texture: Texture = "any"
    desired_length: Length = "any"
    fade: Fade = "any"
    fade_shape: Shape = "any"
    presentation: Presentation = "any"
    maintenance_minutes: int = 20
    scalp_visibility: Literal["unspecified", "keep", "reveal"] = "unspecified"
    part: Literal["none", "left", "right", "any"] = "any"
    require_short_sides: bool = False
    prefer_volume: bool = False

    def __post_init__(self) -> None:
        if self.texture not in TEXTURES or self.desired_length not in LENGTHS:
            raise ValueError("Unrecognised hair texture or length preference")
        if self.fade not in FADES or self.fade_shape not in SHAPES:
            raise ValueError("Unrecognised fade preferences")
        if self.presentation not in PRESENTATIONS:
            raise ValueError("Unrecognised catalogue browsing category")
        if type(self.maintenance_minutes) is not int or not 0 <= self.maintenance_minutes <= 180:
            raise ValueError("Maintenance preference must be 0..180 minutes")
        if self.scalp_visibility not in ("unspecified", "keep", "reveal"):
            raise ValueError("Unrecognised scalp visibility preference")
        if self.part not in ("none", "left", "right", "any"):
            raise ValueError("Unrecognised part preference")
        if type(self.require_short_sides) is not bool or type(self.prefer_volume) is not bool:
            raise ValueError("Style preferences must be explicit booleans")

    @classmethod
    def parse(cls, raw: Mapping[str, Any]) -> Consultation:
        allowed = {"texture", "desired_length", "fade", "fade_shape", "presentation",
                   "maintenance_minutes", "scalp_visibility", "part",
                   "require_short_sides", "prefer_volume"}
        if set(raw) - allowed:
            raise ValueError("Unknown styling preference")
        return cls(**dict(raw))

    def public(self) -> dict[str, Any]:
        return {"texture": self.texture, "desired_length": self.desired_length,
                "fade": self.fade, "fade_shape": self.fade_shape,
                "presentation": self.presentation, "maintenance_minutes": self.maintenance_minutes,
                "scalp_visibility": self.scalp_visibility, "part": self.part,
                "require_short_sides": self.require_short_sides,
                "prefer_volume": self.prefer_volume}


@dataclass(frozen=True, slots=True)
class Recommendation:
    style: HairRecipe
    score: int
    reasons: tuple[str, ...]
    cautions: tuple[str, ...]
    consultation_version: str = "r19c/1"

    def public(self) -> dict[str, Any]:
        return {"id": self.style.id, "name": self.style.name, "family": self.style.family,
                "score": self.score, "reasons": list(self.reasons), "cautions": list(self.cautions),
                "source": "local", "simulation": True, "provider_calls": 0,
                "quality_status": "UNPROVEN",
                "notice": "Style exploration only; not a real haircut or personal suitability assessment."}


def _cut_length(style: HairRecipe) -> str:
    if style.family in SHORT_FAMILIES and style.length <= 35:
        return "short"
    if style.family in LONG_FAMILIES and style.length >= 67:
        return "long"
    if style.length <= 35:
        return "short"
    if style.length >= 72:
        return "long"
    return "medium"


def _texture_fit(style: HairRecipe, chosen: str) -> bool:
    if chosen == "any":
        return True
    options = FAMILY_COMPATIBILITY.get(style.family)
    if options is not None:
        return chosen in options
    if style.pattern in ("curl", "braid"):
        return chosen in ("curly", "coily")
    if style.pattern == "wave":
        return chosen in ("wavy", "curly", "straight")
    return True


def _maintenance_minutes(style: HairRecipe) -> int:
    """Illustrative time estimate for a styling concept, not measured salon data."""
    estimate = 6
    estimate += 7 if style.family in ("pompadour", "quiff", "curtain", "updo") else 0
    estimate += 12 if style.family in ("braid", "locs", "twists") else 0
    estimate += 6 if style.pattern in ("curl", "wave", "braid") else 0
    estimate += 5 if style.fringe >= 60 else 0
    estimate += 4 if style.length >= 68 else 0
    estimate += 5 if style.definition >= 80 else 0
    return estimate


def _short_sides(style: HairRecipe) -> bool:
    return style.family in SHORT_FAMILIES or (style.side_bias >= 55 and
                                              style.fade_shape != "classic")


def score_style(style: HairRecipe, preferences: Consultation) -> Recommendation:
    """Stable, explainable weights. Lower fit is not a judgement of appearance."""
    reasons: list[str] = []
    cautions: list[str] = ["Requires your own stylist's assessment; not a haircut outcome"]
    points = 10
    length = _cut_length(style)
    if preferences.desired_length == "any":
        reasons.append("Length unrestricted by your choices")
    elif length == preferences.desired_length:
        points += 24
        reasons.append("Requested length category")
    else:
        points -= 12
        cautions.append("Different length category than requested")
    if preferences.texture == "any":
        reasons.append("No hair texture assumptions")
    elif _texture_fit(style, preferences.texture):
        points += 19
        reasons.append("Compatible editorial texture tag")
    else:
        points -= 10
        cautions.append("Texture compatibility not verified; ask a stylist")
    if preferences.fade != "any":
        if style.fade == preferences.fade:
            points += 15
            reasons.append("Chosen fade height")
        else:
            points -= 5
    if preferences.fade_shape != "any":
        if style.fade_shape == preferences.fade_shape:
            points += 20
            reasons.append("Chosen fade geometry")
        else:
            points -= 6
    if preferences.require_short_sides:
        if _short_sides(style):
            points += 20
            reasons.append("Short-sided concept")
        else:
            points -= 22
    if preferences.presentation != "any":
        if style.presentation in (preferences.presentation, "unisex"):
            points += 7
            reasons.append("Requested browse style label, not wearer identity")
        else:
            points -= 3
    if preferences.part != "any":
        if style.part == preferences.part:
            points += 7
            reasons.append("Part placement")
        else:
            points -= 3
    if preferences.scalp_visibility == "keep":
        if style.side_grade >= 2:
            points += 9
            reasons.append("Relatively less bare short-side guide")
        else:
            points -= 8
            cautions.append("Grade zero is an illustrative skin-fade guide")
    elif preferences.scalp_visibility == "reveal":
        if style.side_grade == 0:
            points += 7
            reasons.append("Grade zero side guide")
    if preferences.prefer_volume:
        if style.top_bias >= 50:
            points += 13
            reasons.append("More top emphasis in tonal illustration")
        else:
            points -= 6
    minutes = _maintenance_minutes(style)
    if minutes <= preferences.maintenance_minutes:
        points += 12
        reasons.append("Fits assumed styling-time preference")
    else:
        points -= min(20, (minutes - preferences.maintenance_minutes) // 3 + 3)
        cautions.append("Estimated styling steps may exceed preferred time")
    # No preference is *rejected* based on gender, face shape, race or medical status.
    # The only known quantities are style parameters and the visitor's choices.
    return Recommendation(style, max(0, min(160, points)), tuple(reasons), tuple(cautions))


def find_concepts(styles: Iterable[HairRecipe], preferences: Consultation, *, limit: int = 12,
                  diversify: bool = True) -> list[Recommendation]:
    if type(limit) is not int or not 1 <= limit <= 48:
        raise ValueError("Choose between 1 and 48 concepts")
    catalogue = list(styles)
    if len(catalogue) > 2048 or len({x.id for x in catalogue}) != len(catalogue):
        raise ValueError("Duplicate or unbounded catalogue")
    ranked = sorted((score_style(item, preferences) for item in catalogue),
                    key=lambda item: (-item.score, item.style.id))
    if not diversify:
        return ranked[:limit]
    selected: list[Recommendation] = []
    family_count: Counter[str] = Counter()
    shape_count: Counter[str] = Counter()
    for cap in (1, 2, 4, 2048):
        for item in ranked:
            if len(selected) >= limit:
                break
            if item in selected:
                continue
            if family_count[item.style.family] >= cap:
                continue
            if shape_count[item.style.fade_shape] >= max(2, cap * 2):
                continue
            selected.append(item)
            family_count[item.style.family] += 1
            shape_count[item.style.fade_shape] += 1
        if len(selected) >= limit:
            break
    return selected


def compare_styles(styles: Sequence[HairRecipe]) -> dict[str, Any]:
    """A synthetic comparison board, not a cosmetic quality score."""
    if not 1 <= len(styles) <= 9 or len({x.id for x in styles}) != len(styles):
        raise ValueError("Compare 1–9 different local concepts")
    tiles: list[dict[str, Any]] = []
    for style in styles:
        tiles.append({"id": style.id, "name": style.name,
                      "fade": style.fade, "shape": style.fade_shape,
                      "side_grade": style.side_grade, "top_grade": style.top_grade,
                      "length_tag": _cut_length(style),
                      "pattern": style.pattern, "family": style.family,
                      "maintenance_assumption_minutes": _maintenance_minutes(style),
                      "source": "local", "simulation": True,
                      "visual_quality_verified": False})
    keys = ("fade", "shape", "side_grade", "top_grade", "length_tag", "pattern", "family")
    changed = [key for key in keys if len({tile[key] for tile in tiles}) > 1]
    return {"tiles": tiles, "differences": changed,
            "provider_calls": 0, "real_face_tested": False,
            "notice": "Concept-board metadata only. Results require masks and human review."}


def stylist_brief(style: HairRecipe, preferences: Consultation) -> dict[str, Any]:
    """Plain consent-neutral conversation starters, no diagnosis or prediction."""
    evidence = score_style(style, preferences)
    steps = [f"Discuss a {style.fade} fade height and {style.fade_shape} short-side guide.",
             f"The local tonal concept uses grades {style.side_grade} to {style.top_grade}.",
             f"Review the {style.top} top, {style.part} part, and {style.pattern} texture suggestion.",
             "Ask whether the existing hair, scalp and desired length support the reference.",
             "Request a physical consultation; the app has not generated new strands."]
    if preferences.scalp_visibility == "keep":
        steps.insert(3, "Discuss how much scalp will remain visible at the shortest areas.")
    if preferences.maintenance_minutes < _maintenance_minutes(style):
        steps.insert(4, "Confirm the realistic styling and maintenance time with your stylist.")
    return {"style_id": style.id, "title": style.name, "questions": steps,
            "reasons": list(evidence.reasons), "cautions": list(evidence.cautions),
            "simulation": True, "quality_status": "UNPROVEN",
            "photo_required": False, "provider_calls": 0,
            "notice": "For discussion only; no hairstyle result is guaranteed."}
