"""W69-W74 local brow simulations and measurement tools. Author: John Khan."""

from .assessment import compare_brow_photos, photo_measurements, shape_options
from .contracts import FEATURES, LABEL, VERSION, BrowEvidence, BrowResult
from .engine import render_brows
from .evidence import observe_brows
from .geometry import brow_frames
from .progress import diary_trend, progress_series, validate_diary
from .trial import (
    SIMULATION_LABEL,
    BrowObservation,
    BrowTrialResult,
    BrowTrialSession,
    PixelGuard,
    checked_level,
)
from .trial_board import BrowBoard, BrowChoice, compare_brow_styles, parse_brow_recipe
from .trial_evidence import (
    BrowPixelEvidence,
    BrowSideEvidence,
    aggregate_brow_evidence,
    audit_brow_trial,
    brow_side_evidence,
)

__all__ = [
    "FEATURES", "LABEL", "VERSION", "BrowEvidence", "BrowResult", "render_brows",
    "observe_brows", "brow_frames", "diary_trend", "progress_series", "validate_diary",
    "compare_brow_photos", "photo_measurements", "shape_options", "SIMULATION_LABEL",
    "BrowObservation", "BrowTrialResult", "BrowTrialSession", "PixelGuard", "checked_level",
    "BrowBoard", "BrowChoice", "compare_brow_styles", "parse_brow_recipe",
    "BrowPixelEvidence", "BrowSideEvidence", "aggregate_brow_evidence",
    "audit_brow_trial", "brow_side_evidence",
]
