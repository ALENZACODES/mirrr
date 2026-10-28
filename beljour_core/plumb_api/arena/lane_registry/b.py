"""Lane B eyes/brows, lip/skin, women and EASY-filter registry extensions.

The numbered entries retain their historical ordering relative to other lanes.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from . import LaneContribution
from .legacy import REGISTRY_PATH, women_rows


# R15 Lane B additive module ownership.
def _eyes_brows_extra_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..eyes_brows_registry import module_entries
    from ..lips_skin_registry import module_entries as r16b_module_entries

    return module_entries() + r16b_module_entries()


def effective_women_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..eyes_brows_registry import effective_women_rows as combined

    return combined(women_rows(path))


# R16 Lane B compatible combined views.
def effective_women_rows_r16b(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..lips_skin_registry import effective_women_rows as r16b_overlay

    return r16b_overlay(effective_women_rows(path))


def extras_r16b_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..lips_skin_registry import module_entries

    return module_entries()


# R18 Lane B preserves the R17B overlay entry and combined view.
def effective_women_rows_r17b(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..r17b_registry import effective_women_rows as r17b_overlay

    return r17b_overlay(effective_women_rows_r16b(path))


def r18_extra_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    from ..r17b_registry import module_entries

    return module_entries()


# --- Lane B r19b-cp3: EASY local filter ownership ---
# Rebased on integration 003b61f. All prior lane blocks above remain unchanged.
# Original local code/art only; no YouCam filter calls or third-party assets.
# Author: John Khan.
_LANE_B_R19B_CP3_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/easy/catalogue.py",
    "api/plumb_api/filters/easy/common.py",
    "api/plumb_api/filters/easy/retro.py",
    "api/plumb_api/filters/easy/eye_colour.py",
    "api/plumb_api/filters/easy/glasses.py",
    "api/plumb_api/filters/easy/fun.py",
    "api/plumb_api/filters/easy/summer.py",
    "api/plumb_api/filters/easy/bridal.py",
    "api/plumb_api/filters/easy/parity.py",
    "api/plumb_api/filters/easy/evaluation.py",
    "web/src/filters/easy/catalogue.ts",
    "web/src/filters/easy/common.ts",
    "web/src/filters/easy/retro.ts",
    "web/src/filters/easy/eye-colour.ts",
    "web/src/filters/easy/glasses.ts",
    "web/src/filters/easy/fun.ts",
    "web/src/filters/easy/summer.ts",
    "web/src/filters/easy/bridal.ts",
    "web/src/filters/easy/index.ts",
    "web/src/filters/easy/evaluation.ts",
)


def r19_extra_rows(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    """R19B EASY-filter ownership, without changing its feature claims."""
    return [
        {
            "id": "r19b-easy-filters",
            "name": "Original local easy filters",
            "owner": "B",
            "status": "Built",
            "tested": "synthetic_only",
            "provider": "local",
            "modules": list(_LANE_B_R19B_CP3_MODULES),
            "tests": [
                "api/tests/r19b/test_easy_filters.py",
                "web/test/r19b-easy-filters.test.mjs",
            ],
            "note": (
                "Rows 14, 20-photo-only, 25, 26-front-view, 27 and 30; "
                "rows 4 and 28 already shipped by Lane A."
            ),
        }
    ]


# Lane B's r21b modules are declared without changing historical feature rows.
# Keeping the registry row additive avoids silently changing the frozen status
# of filters or the existing teeth pass definition. Tests remain proposal-only.
_LANE_B_R21B_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/masks/hue_lock.py",
    "api/plumb_api/filters/strength.py",
    "api/plumb_api/filters/qa/performance.py",
    "api/plumb_api/engines/teeth/preview.py",
    "web/src/filters/masks/hue-lock.ts",
    "web/src/filters/runtime/strength.ts",
    "web/src/engines/teeth/preview.ts",
)


def r21b_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """All newly shipped Lane B engines; only tested with synthetic fixtures."""
    return list(_LANE_B_R21B_MODULES)


# New request-local filters and teeth modules for the face gate.
_GATEFIX_B_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/colour/sample_cache.py",
    "api/plumb_api/engines/teeth/enamel.py",
    "api/plumb_api/engines/teeth/mouth_state.py",
)


def gatefix_b_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Only local numeric tools and optical previews, with no external provider."""
    return list(_GATEFIX_B_MODULES)


CONTRIBUTIONS: tuple[LaneContribution, ...] = (
    LaneContribution(100, "B", _eyes_brows_extra_rows),
    LaneContribution(300, "B", r18_extra_rows),
    LaneContribution(400, "B", r19_extra_rows),
    LaneContribution(450, "B", module_paths=r21b_modules),
)


# Editorial grade, regional finishing and synthetic Cover Test ownership.
# This contribution is additive and does not promote any real-face gate status.
_LANE_B_EDITORIAL_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/spatial/halation.py",
    "api/plumb_api/filters/light/border.py",
    "api/plumb_api/filters/qa/cover.py",
    "web/src/filters/spatial/halation.ts",
    "web/src/filters/light/border.ts",
)


def editorial_filter_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Local originals, with synthetic-only release checks."""
    return list(_LANE_B_EDITORIAL_MODULES)


CONTRIBUTIONS += (LaneContribution(451, "B", module_paths=editorial_filter_modules),)


# Original FX2 microtexture, reviewed independently of legacy defaults.
# Manual activation keeps all previously accepted golden outputs unchanged.
_LANE_B_TEXTURE_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/spatial/grain.py",
    "api/plumb_api/filters/spatial/structure.py",
    "api/plumb_api/filters/qa/texture_parity.py",
    "api/plumb_api/filters/qa/texture_gate.py",
    "web/src/filters/spatial/grain.ts",
    "web/src/filters/spatial/structure.ts",
)


def texture_filter_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Local opt-in finishing kernels; no claim of real-person clearance."""
    return list(_LANE_B_TEXTURE_MODULES)


CONTRIBUTIONS += (LaneContribution(452, "B", module_paths=texture_filter_modules),)


# Cover-grade and latency evidence export, never a real-face release claim.
_LANE_B_PROOF_WALL_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/qa/proof_wall.py",
)


def proof_wall_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Synthetic evidence tables for the BELJOUR Proof Wall."""
    return list(_LANE_B_PROOF_WALL_MODULES)


CONTRIBUTIONS += (LaneContribution(453, "B", module_paths=proof_wall_modules),)


# Studio Play derivative recipes and time-sliced framebuffer scan. Local-only.
_LANE_B_STUDIO_PLAY_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/studio_play.py",
    "api/plumb_api/filters/artistic/time_warp.py",
    "web/src/filters/artistic/time-warp.ts",
)


def studio_play_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Owned procedural filters; quality remains synthetic-only until box gates."""
    return list(_LANE_B_STUDIO_PLAY_MODULES)


CONTRIBUTIONS += (LaneContribution(454, "B", module_paths=studio_play_modules),)


# Named portrait looks (feature 107): texture-kept polish, feature definition and a filter-engine
# grade under one name, plus procedural sparkle for the evening look. Local-only, own recipes.
_LANE_B_PORTRAIT_LOOK_MODULES: tuple[str, ...] = (
    "api/plumb_api/filters/portrait/looks.py",
    "api/plumb_api/filters/portrait/polish.py",
    "api/plumb_api/filters/portrait/sparkle.py",
    "api/plumb_api/filters/portrait/compose.py",
    "api/plumb_api/filters/portrait/vectors.py",
    "web/src/filters/portrait/looks.ts",
    "web/src/filters/portrait/polish.ts",
    "web/src/filters/portrait/sparkle.ts",
    "web/src/filters/portrait/compose.ts",
    "web/src/filters/portrait/layer.ts",
)


def portrait_look_modules(path: Path = REGISTRY_PATH) -> list[str]:
    """Owned portrait-look code; quality remains synthetic-only until an arena run on real faces."""
    return list(_LANE_B_PORTRAIT_LOOK_MODULES)


CONTRIBUTIONS += (LaneContribution(460, "B", module_paths=portrait_look_modules),)
