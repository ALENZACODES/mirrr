"""Shade and lighting engines: W6 Foundation Shade Finder (finder.py) and W98 Lighting
Simulator (lighting.py). Local, numpy only, no models. Author: John Khan."""

from .c18 import C18Snapshot, check_c18_shades, load_c18_shades
from .calibrated_photo import CalibratedPhoto, assess_calibrated_photo
from .calibration import (
    assess_calibration_gap,
    audit_probes,
    audit_synthetic_boundary_vectors,
    probe_reference,
)
from .coverage import audit_reference_grid, compare_point, study_levels
from .distance import delta_e, delta_e_pairs, nearest_shade, rank_shades
from .finder import find_reliable_shade
from .gate_evidence import assess_shade
from .illumination_sensitivity import (
    LightingEstimate,
    SensitivityDecision,
    audit_illumination_sensitivity,
)
from .loaders import (
    ShadeCatalogue,
    ShadeRecord,
    load_base_shades,
    load_hair_shades,
    load_reference_shades,
    load_shade_catalogue,
    load_shades,
    shade_by_id,
)
from .measurement import measure_shade, measure_shade_with_audit
from .neutral_calibration import NeutralDecision, inspect_neutral_card, neutral_photo_options
from .paired_stability import PairDecision, compare_shade_captures
from .readiness import case_from_shade, check_reference_coverage, measure_skn03
from .reading import PatchAudit
from .reference_ambiguity import AmbiguityDecision, inspect_reference_ambiguity
from .reference_study import evaluate_reference_scenario, run_reference_study
from .session import ShadeSession
from .shade_safety import ShadeSafetyReport, assess_shade_safety
from .skin_accuracy import assess_skin_photo, recover_consensus
from .skin_evidence import summarize_accuracy
from .skn03_checkpoint import (
    build_skn03_checkpoint,
    load_skn03_c18_binding,
    pending_checkpoint_note,
    undertone_boundary_vectors,
)

__all__ = [
    "C18Snapshot", "check_c18_shades", "load_c18_shades",
    "assess_calibration_gap", "audit_probes", "audit_synthetic_boundary_vectors", "probe_reference",
    "PatchAudit", "ShadeSession", "assess_shade", "CalibratedPhoto", "assess_calibrated_photo",
    "NeutralDecision", "inspect_neutral_card", "neutral_photo_options",
    "PairDecision", "compare_shade_captures", "audit_reference_grid", "compare_point",
    "find_reliable_shade", "measure_shade", "measure_shade_with_audit", "study_levels",
    "ShadeCatalogue", "ShadeRecord", "delta_e", "delta_e_pairs", "rank_shades", "nearest_shade",
    "load_base_shades", "load_hair_shades", "load_reference_shades", "load_shade_catalogue",
    "load_shades", "shade_by_id", "case_from_shade", "check_reference_coverage", "measure_skn03",
    "assess_skin_photo", "recover_consensus", "summarize_accuracy",
    "evaluate_reference_scenario", "run_reference_study",
    "LightingEstimate", "SensitivityDecision", "audit_illumination_sensitivity",
    "AmbiguityDecision", "inspect_reference_ambiguity",
    "ShadeSafetyReport", "assess_shade_safety",
    "build_skn03_checkpoint", "load_skn03_c18_binding",
    "pending_checkpoint_note", "undertone_boundary_vectors",
]
