"""In-package, reviewable registration overlay for original W4–W18 engines.

The canonical women registry is generated from a file outside Lane C's
ownership. This overlay makes new engines discoverable without rewriting its
compiled rows; integration into the host requires an explicitly reviewed
registry hook and a regeneration of the owned source-of-truth file.

Neither an unrun quality gate nor synthetic parity marks a feature released.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .specs import FEATURE_SPECS


@dataclass(frozen=True, slots=True)
class Registration:
    id: str
    name: str
    owner: str
    python_module: str
    browser_module: str
    python_test: str
    browser_test: str
    stage: str
    claims: str


def registrations() -> tuple[Registration, ...]:
    """Single local registration per genuinely implemented W identifier."""
    return tuple(
        Registration(
            id=spec.id,
            name=spec.name,
            owner="John Khan",
            python_module="plumb_api.engines.women_styling",
            browser_module="web/src/engines/women_styling/index.ts",
            python_test="api/tests/test_women_r20c_engine.py",
            browser_test="web/test/women_r20c_parity.test.mjs",
            stage="implemented-synthetic-tests-only",
            claims=spec.non_promise,
        )
        for spec in FEATURE_SPECS
    )


def registration_for(id: str) -> Registration:
    for item in registrations():
        if item.id == id:
            return item
    raise ValueError(f"No reviewed R20c registration for {id!r}")


def advertised_capabilities() -> tuple[dict[str, str], ...]:
    """Safe package export: no claims of production or real-face validation."""
    return tuple({
        "id": item.id,
        "name": item.name,
        "owner": item.owner,
        "availability": "local-simulation-only",
        "release_gate": "UNPROVEN",
        "server": item.python_module,
        "client": item.browser_module,
    } for item in registrations())


def inspect_canonical_registry(value: object) -> tuple[str, ...]:
    """Report absent or misidentified W rows, without mutating shared input.

    The report is useful at integration time on the complete checkout. It is
    intentionally read-only: generated registries must be regenerated from
    their source rather than patched by a dependency's import side effect.
    """
    if not isinstance(value, dict):
        raise ValueError("Registry must be a JSON object")
    women = value.get("women")
    if not isinstance(women, dict):
        raise ValueError("Registry has no women section")
    rows = women.get("rows")
    if not isinstance(rows, list):
        raise ValueError("Registry women section has no rows")
    by_id: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Registry contains a malformed row")
        id = row.get("id")
        if not isinstance(id, str):
            raise ValueError("Registry row has no string id")
        if id in by_id:
            raise ValueError(f"Duplicated registry row {id!r}")
        by_id[id] = row
    for protected in ("W3", "W14"):
        row = by_id.get(protected)
        if row is not None and row.get("status") != "blocked":
            raise ValueError(f"Rights-blocked feature {protected} was unexpectedly enabled")
    missing = tuple(r.id for r in registrations() if r.id not in by_id)
    return missing


def preview_overlay_rows(registry: dict[str, Any]) -> tuple[dict[str, str], ...]:
    """An ephemeral integration preview; leaves generated manifest unchanged.

    Returns only fresh rows to be merged by the canonical registry owner.
    Duplicate W IDs are rejected by ``inspect_canonical_registry``. Runtime
    capability stage stays simulation-only until the frozen 100k face gate.
    """
    missing = inspect_canonical_registry(registry)
    if missing:
        raise ValueError(f"The upstream women registry is missing: {missing}")
    return advertised_capabilities()
