"""Local women's hair engines and bounded hairstyle consultations. Author: John Khan."""

from .contracts import FEATURES, HairRequest, HairResult
from .engine import render
from .short_sides import HairStyleSession, ShortSidesResult, render_style
from .style_compare import Comparison, StyleChoice, comparison, safe_recipe
from .style_guides import DEFINITIONS, SIMULATION_LABEL, STYLE_KEYS, TEXTURES, StyleDefinition, definition, fields
from .style_preview import StyleGuideSession, StylePreview, render_style_guide
from .style_quality import StylePixelEvidence, audit_style, count_groups, monotone_coverage

__all__ = [
    "Comparison",
    "DEFINITIONS",
    "FEATURES",
    "HairRequest",
    "HairResult",
    "HairStyleSession",
    "SIMULATION_LABEL",
    "STYLE_KEYS",
    "ShortSidesResult",
    "StyleChoice",
    "StyleDefinition",
    "StyleGuideSession",
    "StylePixelEvidence",
    "StylePreview",
    "TEXTURES",
    "audit_style",
    "comparison",
    "count_groups",
    "definition",
    "fields",
    "monotone_coverage",
    "render",
    "render_style",
    "render_style_guide",
    "safe_recipe",
]
