"""Preregistered r26e body acceptance: movement, face preservation and artifacts.

These three definitions sit on top of the unchanged r25e body-set definitions.
Every threshold is checked against the committed r25e values and the engine's
own constants, so the r26e files cannot quietly loosen a limit. No photograph,
measurement or baseline is bundled; without a licensed, released adult body set
the status stays NOT_RUN, and a thin or partial set is UNPROVEN, never PASS.

This is a Lane E validator, not Lane A's real-face runner. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from ..warp.fold import Q3_MINIMUM
from .body_evidence import (
    EXPECTED_DEFINITIONS,
    MANIFEST_FORMAT,
    MIN_PER_GROUP,
    MIN_TOTAL_BODIES,
    REPO_ROOT,
    BodyEvidenceError,
    BodyEvidenceState,
    evaluate_manifest,
    load_definitions,
)
from .fixes import CAP_SHARE, LEAN_MAX_DEGREES
from .identity import DEFAULT_IDENTITY_FLOOR, DEFAULT_LOCK_LEVEL

ACCEPTANCE = REPO_ROOT / "tests/realface/pass_definitions_r26e"
ACCEPTANCE_FORMAT = "beljour-posture-body-acceptance/1"
EXPECTED_ACCEPTANCE = ("posture_movement", "posture_identity", "posture_artifacts")
FIX_IDS = tuple(f"J{number}" for number in range(10, 17))
PREREQUISITES = {
    "definitions": "tests/realface/pass_definitions_r25e",
    "ids": list(EXPECTED_DEFINITIONS),
    "face_set": {"id": "body-r25e-1200", "number_of_bodies": MIN_TOTAL_BODIES},
}
MEASUREMENTS: dict[str, tuple[str, ...]] = {
    "posture_movement": ("movement_share", "lean_degrees", "min_jacobian", "reduction", "overshoot"),
    "posture_identity": ("lock_level", "head_changed_pixels", "identity_similarity"),
    "posture_artifacts": ("outside_band_changed_pixels", "simulation_label"),
}


def _committed(r25e: Mapping[str, Mapping[str, Any]]) -> dict[str, dict[str, Any]]:
    """Expected r26e thresholds, derived from r25e and the engine constants."""
    base = dict(r25e["posture_levels"]["threshold"])
    for name in EXPECTED_DEFINITIONS:
        if dict(r25e[name]["threshold"]) != base:
            raise BodyEvidenceError("r25e definitions disagree on thresholds")
    if (base["maximum_movement_share"], base["maximum_lean_degrees"]) != (CAP_SHARE, LEAN_MAX_DEGREES):
        raise BodyEvidenceError("r25e movement limits differ from the engine caps")
    if base["minimum_identity_similarity"] != DEFAULT_IDENTITY_FLOOR:
        raise BodyEvidenceError("r25e identity floor differs from the default identity guard")
    rate = base["minimum_group_pass_rate"]
    return {
        "posture_movement": {
            "maximum_movement_share": base["maximum_movement_share"],
            "maximum_lean_degrees": base["maximum_lean_degrees"],
            "minimum_jacobian": Q3_MINIMUM,
            "minimum_reduction": base["minimum_reduction"],
            "maximum_overshoot": base["maximum_overshoot"],
            "minimum_group_pass_rate": rate,
        },
        "posture_identity": {
            "default_lock_level": DEFAULT_LOCK_LEVEL,
            "maximum_head_changed_pixels": 0,
            "minimum_identity_similarity": base["minimum_identity_similarity"],
            "minimum_group_pass_rate": rate,
        },
        "posture_artifacts": {
            "maximum_outside_band_changed_pixels": 0,
            "outside_band_change": base["outside_band_change"],
            "simulation_label_required": True,
            "minimum_group_pass_rate": rate,
        },
    }


def validate_acceptance(
    data: object, expected_id: str, committed: Mapping[str, Mapping[str, Any]],
) -> dict[str, Any]:
    """Refuse any r26e definition that is not exactly the preregistered contract."""
    if not isinstance(data, dict):
        raise BodyEvidenceError("acceptance definition must be an object")
    if data.get("format") != ACCEPTANCE_FORMAT or data.get("id") != expected_id:
        raise BodyEvidenceError("wrong acceptance id or format")
    if data.get("version") != 1 or data.get("author") != "John Khan":
        raise BodyEvidenceError("version 1 and named author are required")
    if data.get("status") != "awaiting body set":
        raise BodyEvidenceError("unmeasured definitions must remain awaiting body set")
    if data.get("prerequisites") != PREREQUISITES:
        raise BodyEvidenceError("the unchanged r25e body set and definitions are prerequisites")
    if data.get("view") != "all" or data.get("fix_ids") != list(FIX_IDS):
        raise BodyEvidenceError("all seven J10-J16 fixes are required")
    if data.get("measurements") != list(MEASUREMENTS[expected_id]):
        raise BodyEvidenceError("incorrect measurement list")
    if data.get("threshold") != committed[expected_id]:
        raise BodyEvidenceError("committed thresholds must be unchanged")
    if data.get("slices") != ["view", "body_size", "monk", "body_size_monk"]:
        raise BodyEvidenceError("view, size and tone intersection slices are all required")
    if data.get("minimum_slice_bodies") != MIN_PER_GROUP:
        raise BodyEvidenceError("minimum group count must be 20")
    if data.get("regression") != {"required": True, "max_drop": 0.0}:
        raise BodyEvidenceError("no-drop regression rule is required")
    notes = data.get("notes")
    if not isinstance(notes, list) or not any("never PASS" in str(note) for note in notes):
        raise BodyEvidenceError("definitions must state that missing evidence is never PASS")
    return data


def load_acceptance(
    folder: Path = ACCEPTANCE, r25e: Mapping[str, Mapping[str, Any]] | None = None,
) -> dict[str, dict[str, Any]]:
    """Load all three definitions; fail closed if any is absent or altered."""
    committed = _committed(load_definitions() if r25e is None else r25e)
    out: dict[str, dict[str, Any]] = {}
    for name in EXPECTED_ACCEPTANCE:
        path = folder / f"{name}.json"
        try:
            out[name] = validate_acceptance(json.loads(path.read_text(encoding="utf-8")), name, committed)
        except (OSError, ValueError) as exc:
            raise BodyEvidenceError(f"{name}: invalid or missing acceptance definition: {exc}") from exc
    return out


def thresholds(definitions: Mapping[str, Mapping[str, Any]] | None = None) -> dict[str, Any]:
    """One flat view of the committed r26e limits, for measurement checks."""
    loaded = load_acceptance() if definitions is None else definitions
    merged: dict[str, Any] = {}
    for name in EXPECTED_ACCEPTANCE:
        merged.update(loaded[name]["threshold"])
    return merged


def acceptance_state(manifest: Sequence[Mapping[str, Any]]) -> BodyEvidenceState:
    """Manifest coverage only. A complete set is still NOT_RUN until measured."""
    load_acceptance()
    return evaluate_manifest(manifest)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate-definitions", action="store_true")
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args(argv)
    if not args.validate_definitions:
        parser.error("--validate-definitions is required to audit these definitions")
    try:
        for key, data in load_acceptance().items():
            print(f"{key}: awaiting body set; {len(data['fix_ids'])} fixes; NOT_RUN")
        if args.manifest is None:
            print("NOT_RUN: no released body manifest supplied")
            return 0
        raw = json.loads(args.manifest.read_text(encoding="utf-8"))
        if not isinstance(raw, dict) or raw.get("format") != MANIFEST_FORMAT or not isinstance(raw.get("rows"), list):
            raise BodyEvidenceError("invalid body manifest format")
        print(json.dumps(acceptance_state(raw["rows"]).to_json(), sort_keys=True))
        return 0
    except (OSError, ValueError) as exc:
        print(f"UNPROVEN: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
