"""Lane E professional editor reference API (validated, side-effect free)."""

from .cache import CacheStats, PhotoEditCache, ResourceKind
from .compare import Split, split_plan
from .contracts import (
    ASPECTS,
    PRESETS,
    Crop,
    CurvePoint,
    ExportPreset,
    Recipe,
    ToneCurves,
    validate_points,
)
from .curves import apply_rgba, channel_luts, evaluate, make_lut
from .export import ExportPlan, export_plan, safe_name
from .geometry import Geometry, inverse_point, plan, within_crop
from .history import RecipeHistory
from .identity import FaceIdentityGuard, GuardDecision, GuardedEdit, IdentityLockUnavailable, guarded_rgba
from .masks import Brush, Linear, Mask, Point, Radial, coverage_at, masked_rgba, sample_mask, validate_masks
from .preview import DRAG_MAX_EDGE, FULL_MAX_PIXELS, PreviewJob, ProgressivePreview, plan_resolution
from .serialization import decode_recipe, encode_recipe
from .strength import (
    DEFAULT_LEVEL,
    DEFAULT_LOCK_LEVEL,
    EFFECTS,
    MAX_LEVEL,
    MIN_LEVEL,
    StrengthLevels,
    StrengthSnapshot,
    from_legacy_amount,
    legacy_amount,
    nudge,
    validate_level,
)
from .tiles import AffineSampler, TilePlan, TileResult, affine_sampler, assemble_tiles, render_tiles, tile_plan

__all__ = [
    "ASPECTS", "PRESETS", "Crop", "CurvePoint", "ExportPreset", "Recipe", "ToneCurves",
    "validate_points", "apply_rgba", "channel_luts", "evaluate", "make_lut",
    "ExportPlan", "export_plan", "safe_name", "Geometry", "inverse_point", "plan", "within_crop",
    "decode_recipe", "encode_recipe", "Brush", "Linear", "Mask", "Point", "Radial",
    "coverage_at", "masked_rgba", "sample_mask", "validate_masks", "RecipeHistory", "Split", "split_plan",
    "AffineSampler", "TilePlan", "TileResult", "affine_sampler", "assemble_tiles",
    "render_tiles", "tile_plan",
    "CacheStats", "PhotoEditCache", "ResourceKind", "FaceIdentityGuard", "GuardDecision", "GuardedEdit",
    "IdentityLockUnavailable", "guarded_rgba", "DEFAULT_LOCK_LEVEL", "DEFAULT_LEVEL",
    "EFFECTS", "MAX_LEVEL", "MIN_LEVEL", "StrengthLevels", "StrengthSnapshot",
    "from_legacy_amount", "legacy_amount", "nudge", "validate_level",
    "DRAG_MAX_EDGE", "FULL_MAX_PIXELS", "PreviewJob", "ProgressivePreview", "plan_resolution",
]
