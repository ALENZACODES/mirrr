"""Lane C ownership extension. Author: John Khan."""

from __future__ import annotations

from collections.abc import Mapping

from . import LaneContribution

# --- Lane C: original local women-styling simulations (R21c) ---
# Owner C. These two reviewed packages are independent of the generated
# W1-W100 status table; registry ownership alone never marks a feature passed.
LANE_C_MODULE_OWNERS: Mapping[str, str] = {
    "api/plumb_api/engines/skin": "C",
    "api/plumb_api/engines/teeth": "C",
    "api/plumb_api/engines/women_styling": "C",
    "web/src/engines/beauty": "C",
    "web/src/engines/skin": "C",
    "web/src/engines/teeth": "C",
    "web/src/engines/women_styling": "C",
}

CONTRIBUTIONS: tuple[LaneContribution, ...] = ()

# Lane C r25c: a8 presentation levels and a1 women's short-side hair renderers.
# Folder registrations claim every new Python/TypeScript child with owner C.
LANE_C_R25C_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/gender_look": "C",
    "api/plumb_api/engines/hair_women": "C",
    "web/src/engines/gender_look": "C",
    "web/src/engines/hair_women": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_R25C_MODULES}
LANE_C_R25C_FEATURE_IDS: Mapping[str, tuple[str, ...]] = {
    "api/plumb_api/engines/gender_look": ("a8",),
    "api/plumb_api/engines/hair_women": ("a1", "W26", "W37"),
    "web/src/engines/gender_look": ("a8",),
    "web/src/engines/hair_women": ("a1", "W26", "W37"),
}

# --- Lane C r25c-cp2: women hair style guides and local consultation board ---
# Additional source children are registered explicitly. Synthetic evidence
# does not change W-series or real-face quality-pass status.
LANE_C_R25C_CP2_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/hair_women/style_guides.py": "C",
    "api/plumb_api/engines/hair_women/style_preview.py": "C",
    "api/plumb_api/engines/hair_women/style_quality.py": "C",
    "api/plumb_api/engines/hair_women/style_compare.py": "C",
    "web/src/engines/hair_women/style-guides.ts": "C",
    "web/src/engines/hair_women/style-preview.ts": "C",
    "web/src/engines/hair_women/style-audit.ts": "C",
    "web/src/engines/hair_women/style-compare.ts": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_R25C_CP2_MODULES}
LANE_C_R25C_CP2_FEATURE_IDS: Mapping[str, tuple[str, ...]] = {
    module: ("a1", "W26", "W37") for module in LANE_C_R25C_CP2_MODULES
}

# --- Lane C gatefix-c: observed turn visibility for eye, brow and iris regions ---
# The module operates only on supplied landmark coordinates.
LANE_C_GATEFIX_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/eyes/turn_audit.py": "C",
    "api/plumb_api/engines/eyes/turn_visibility.py": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_GATEFIX_MODULES}

# --- Lane C r27c: observed hair-colour consultation and independent evidence ---
# W28/W39 simulation code; registration is not a measured quality pass.
LANE_C_R27C_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/haircolour": "C",
    "web/src/engines/haircolour": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_R27C_MODULES}
LANE_C_R27C_FEATURE_IDS: Mapping[str, tuple[str, ...]] = {
    path: ("W28", "W39") for path in LANE_C_R27C_MODULES
}

# Lane C r26c: consent-local observed iris trial and count-only audits.
# Every module is owned by C. Existing lane ownership is preserved.
LANE_C_R26C_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/eyes/iris_quality.py": "C",
    "api/plumb_api/engines/eyes/iris_trial.py": "C",
    "api/plumb_api/engines/eyes/iris_trial_evidence.py": "C",
    "web/src/engines/eyes/iris-evidence.ts": "C",
    "web/src/engines/eyes/iris-quality.ts": "C",
    "web/src/engines/eyes/iris-trial.ts": "C",
    "web/src/engines/eyes/visible-iris.ts": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_R26C_MODULES}
LANE_C_R26C_FEATURE_IDS: Mapping[str, tuple[str, ...]] = {
    path: ("42",) for path in LANE_C_R26C_MODULES
}

# Lane C r28c: observed brow simulations and independently measured pixels.
# Package roots remain owned by C; this block lists every new module explicitly.
LANE_C_R28C_MODULES: Mapping[str, str] = {
    "api/plumb_api/engines/brows/trial.py": "C",
    "api/plumb_api/engines/brows/trial_board.py": "C",
    "api/plumb_api/engines/brows/trial_evidence.py": "C",
    "web/src/engines/brows/brow-trial.ts": "C",
    "web/src/engines/brows/brow-board.ts": "C",
    "web/src/engines/brows/brow-evidence.ts": "C",
}
LANE_C_MODULE_OWNERS = {**LANE_C_MODULE_OWNERS, **LANE_C_R28C_MODULES}
LANE_C_R28C_FEATURE_IDS: Mapping[str, tuple[str, ...]] = {
    module: ("W69", "W70", "W72") for module in LANE_C_R28C_MODULES
}
