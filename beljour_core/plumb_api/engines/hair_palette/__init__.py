"""Original hair colour palette; local-only, product-independent public API."""
from __future__ import annotations

from .catalogue import HairShade, catalogue, require_shade
from .matching import ShadeSuggestion, checked_lab, measured_level, suggest
from .preview import PalettePreview, PaletteRefusal, apply_shade

__all__ = [
    "HairShade", "PalettePreview", "PaletteRefusal", "ShadeSuggestion", "apply_shade",
    "catalogue", "require_shade", "checked_lab", "measured_level", "suggest",
]
