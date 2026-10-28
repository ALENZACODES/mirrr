"""R20c original, offline, masked cosmetic screen simulations.

Every W feature is distinct, registered by ID, and refused without an explicit
region mask. No paid or licensed model is packaged. Author: John Khan.
"""
from .definitions import BY_FEATURE, PASS_DEFINITIONS, evaluate_frame
from .engine import PreviewEvidence, PreviewResult, apply_preview
from .palette import SWATCHES, ScreenSwatch, suggested_palette
from .requests import PreviewRequest
from .specs import BY_ID, FEATURE_SPECS
from .tiled import apply_preview_tiled

__all__ = [
    "BY_FEATURE", "BY_ID", "FEATURE_SPECS", "PASS_DEFINITIONS", "PreviewEvidence",
    "PreviewRequest", "PreviewResult", "SWATCHES", "ScreenSwatch", "apply_preview",
    "evaluate_frame", "suggested_palette", "apply_preview_tiled",
]
