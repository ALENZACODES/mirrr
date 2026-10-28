"""Public feature registry; stable loader for independent lane contributions.

All core definitions live in lane_registry.legacy; lane-owned extensions live
in lane_registry/a.py through g.py. New lane changes leave this loader unchanged.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, TypeAlias

from .lane_registry import LANE_FILE_OWNERS as _LANE_FILE_OWNERS
from .lane_registry import LaneContribution, a, b, c, d, e, f, g, legacy

LANE_FILE_OWNERS = _LANE_FILE_OWNERS
REGISTRY_PATH = legacy.REGISTRY_PATH
REPO_ROOT = legacy.REPO_ROOT
STATUSES = legacy.STATUSES
PLAN_STATES = legacy.PLAN_STATES
PROVIDERS = legacy.PROVIDERS
GROUPS = legacy.GROUPS
YOUCAM_ALLOWED = legacy.YOUCAM_ALLOWED
HERO = legacy.HERO
CORE_PRIORITY = legacy.CORE_PRIORITY
MODULE_ROOTS = legacy.MODULE_ROOTS
MODULE_FILES = legacy.MODULE_FILES
MODULE_DIRS = legacy.MODULE_DIRS
FILTER_FIELDS = legacy.FILTER_FIELDS
SCORE_KEYS = legacy.SCORE_KEYS
STATE_WORDS = legacy.STATE_WORDS
Feature: TypeAlias = legacy.Feature
Row: TypeAlias = legacy.Row
LANE_A_R16A_MODULES = a.LANE_A_R16A_MODULES
LANE_C_MODULE_OWNERS = c.LANE_C_MODULE_OWNERS
LANE_D_R21D_MODULES = d.LANE_D_R21D_MODULES
LANE_D_R22D_MODULES = d.LANE_D_R22D_MODULES
LANE_D_R22D_CP3_MODULES = d.LANE_D_R22D_CP3_MODULES
LANE_E_OWNER = e.LANE_E_OWNER
LANE_E_FEATURE_IDS = e.LANE_E_FEATURE_IDS
LANE_E_MODULES = e.LANE_E_MODULES
LANE_E_TESTS = e.LANE_E_TESTS
_LANE_B_R19B_CP3_MODULES = b._LANE_B_R19B_CP3_MODULES

load = legacy.load
validate = legacy.validate
women_rows = legacy.women_rows
filter_rows = legacy.filter_rows
validate_filters = legacy.validate_filters
filter_checklist = legacy.filter_checklist
feature_rows = legacy.feature_rows
mapping_markdown = legacy.mapping_markdown
to_json = legacy.to_json
lane_a_r16a_ownership = a.lane_a_r16a_ownership
lane_d_r21d_ownership = d.lane_d_r21d_ownership
lane_d_r22d_ownership = d.lane_d_r22d_ownership
lane_d_r22d_cp3_ownership = d.lane_d_r22d_cp3_ownership
lane_e_ownership = e.lane_e_ownership
effective_women_rows = b.effective_women_rows
effective_women_rows_r16b = b.effective_women_rows_r16b
effective_women_rows_r17b = b.effective_women_rows_r17b

# The historical interleaving is B15, E21, B18, B19. New independent
# additions use their own order numbers without changing this loader.
def lane_contributions() -> tuple[LaneContribution, ...]:
    """Compose independent lane files in stable historical order."""
    groups: tuple[tuple[str, tuple[LaneContribution, ...]], ...] = (
        ("A", a.CONTRIBUTIONS),
        ("B", b.CONTRIBUTIONS),
        ("C", c.CONTRIBUTIONS),
        ("D", d.CONTRIBUTIONS),
        ("E", e.CONTRIBUTIONS),
        ("F", f.CONTRIBUTIONS),
        ("G", g.CONTRIBUTIONS),
    )
    entries: list[LaneContribution] = []
    for owner, contributions in groups:
        for entry in contributions:
            if entry.owner != owner:
                raise ValueError("lane registry owner mismatch")
            entries.append(entry)
    entries.sort(key=lambda item: item.order)
    orders: set[int] = set()
    for entry in entries:
        if entry.order in orders:
            raise ValueError("duplicate lane registry order")
        orders.add(entry.order)
    return tuple(entries)


def _extras_until(path: Path, through: int | None) -> list[dict[str, Any]]:
    rows = legacy.extras(path)
    for entry in lane_contributions():
        if through is not None and entry.order > through:
            break
        if entry.extra_rows is not None:
            rows.extend(entry.extra_rows(path))
    return rows


def extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return _extras_until(path, None)


def _eyes_brows_extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return _extras_until(path, 100)


def lane_e_extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return _extras_until(path, 200)


def lane_b_r18b_extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return _extras_until(path, 300)


def lane_b_r19b_cp3_extras(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return extras(path)


def extras_r16b(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return extras(path) + b.extras_r16b_rows(path)


def extras_r17b(path: Path = REGISTRY_PATH) -> list[dict[str, Any]]:
    return extras_r16b(path) + b.r18_extra_rows(path)


def module_universe(root: Path = REPO_ROOT) -> list[str]:
    modules = legacy.module_universe(root)
    for entry in lane_contributions():
        if entry.module_paths is not None:
            modules = sorted(set(modules) | set(entry.module_paths(root)))
    return modules


def lane_e_module_universe(root: Path = REPO_ROOT) -> list[str]:
    return sorted(set(legacy.module_universe(root)) | set(e.lane_e_module_universe(root)))


def unowned_modules(
    features: Sequence[Feature],
    infrastructure: Mapping[str, str],
    root: Path = REPO_ROOT,
    extra: Sequence[Mapping[str, Any]] | None = None,
) -> list[str]:
    return legacy.unowned_modules(
        features,
        infrastructure,
        root,
        extra,
        extras_provider=extras,
        universe_provider=module_universe,
    )
