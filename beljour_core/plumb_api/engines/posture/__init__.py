"""Posture photo simulations J10-J16, publicly scoped to validated 2D controls.

Always labelled. Requires a face identity guard for edits near the head.
Not a posture assessment or medical advice. Author: John Khan.
"""

from .body_evidence import evaluate_manifest, load_definitions
from .catalogue import SIMULATION_LABEL, PostureFix, PostureRefusal, posture_fixes, require_compatible
from .identity import GuardedPostureResult, IdentityLockUnavailable, guarded_render
from .levels import DEFAULT_LEVEL, LevelMemory, checked_level, level_plan, level_to_strength
from .review import audit_plan, synthetic_group_rows, synthetic_summary
from .session import PostureCache, preview_size

__all__ = [
    "DEFAULT_LEVEL",
    "SIMULATION_LABEL",
    "GuardedPostureResult",
    "IdentityLockUnavailable",
    "LevelMemory",
    "PostureCache",
    "PostureFix",
    "PostureRefusal",
    "audit_plan",
    "checked_level",
    "evaluate_manifest",
    "guarded_render",
    "level_plan",
    "level_to_strength",
    "load_definitions",
    "posture_fixes",
    "preview_size",
    "require_compatible",
    "synthetic_group_rows",
    "synthetic_summary",
]
