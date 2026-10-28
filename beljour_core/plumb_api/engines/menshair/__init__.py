"""Original local short-sides tonal-simulation engine. Author: John Khan.

This is not a generative haircut or a YouCam result. A cleared hair mask and head
landmarks must be provided by the caller; no real face recognition is included.
"""
from __future__ import annotations

from .public_render import RenderRefusal, StyleRender, render_style_for_face
from .render import (
    HairAnchors,
    HairRecipe,
    available_presets,
    effect_field,
    fade_coverage,
    render_style,
    require_preset,
)

__all__ = ["HairAnchors", "HairRecipe", "available_presets", "render_style",
           "effect_field", "fade_coverage", "require_preset", "RenderRefusal", "StyleRender", "render_style_for_face"]
