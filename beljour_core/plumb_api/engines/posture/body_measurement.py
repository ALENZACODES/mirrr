"""Scalar full-level body measurements, checked against the committed r26e limits.

One record describes one job: one frozen body and one fix of its view, run externally
at the declared full strength (5.0) with the default identity lock (5.0). A record is
either `measured` (scalar values only) or an explicit `refused` with a reason code.
A refusal is never a pass; absent, malformed or out-of-range evidence never becomes one.
Face similarity must be supplied separately by an independent evaluator for the three
face-adjacent fixes; it is never inferred here. No pixels or per-person values leave
this module except in the operator's private ledger. Author: John Khan.
"""
from __future__ import annotations

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .body_acceptance import thresholds
from .catalogue import SIMULATION_LABEL, posture_fixes
from .identity import FACE_MOVING

MEASUREMENT_FORMAT = "beljour-posture-body-measurement/1"
FULL_STRENGTH = 5.0
FACE_FIX_IDS = frozenset(entry.id for entry in posture_fixes() if entry.fix in FACE_MOVING)
LEAN_FIX_ID = next(entry.id for entry in posture_fixes() if entry.fix == "lean")
FIX_VIEWS = {entry.id: entry.view for entry in posture_fixes()}
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_REFUSAL = re.compile(r"[a-z][a-z0-9_]{0,47}\Z")
_COMMON = frozenset({"format", "run", "shard", "photo_sha256", "fix", "view", "status"})
_MEASURED = _COMMON | frozenset({
    "strength_level", "lock_level", "head_changed_pixels", "outside_band_changed_pixels",
    "movement_share", "lean_degrees", "min_jacobian", "reduction", "overshoot",
    "simulation_label", "identity_similarity",
})
_REFUSED = _COMMON | frozenset({"refusal"})


class MeasurementError(ValueError):
    """A malformed measurement record; the message is a code, never the record."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class Measurement:
    run: str
    shard: int
    photo_sha256: str
    fix: str
    view: str
    status: str
    values: tuple[tuple[str, Any], ...] = ()
    refusal: str = ""

    @property
    def job(self) -> str:
        return f"{self.photo_sha256}:{self.fix}"

    def value(self, name: str) -> Any:
        return dict(self.values).get(name)


def _number(value: object, *, optional: bool = False) -> float | None:
    if value is None and optional:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise MeasurementError("invalid_measurement_value")
    return float(value)


def _count(value: object) -> int:
    if type(value) is not int or value < 0:
        raise MeasurementError("invalid_measurement_value")
    return value


def parse_measurement(raw: object) -> Measurement:
    """Strict schema: exact keys per status, finite scalars, known fix and matching view."""
    if not isinstance(raw, Mapping) or raw.get("format") != MEASUREMENT_FORMAT:
        raise MeasurementError("invalid_measurement_format")
    status = raw.get("status")
    expected = _MEASURED if status == "measured" else _REFUSED if status == "refused" else None
    if expected is None or set(raw) != expected:
        raise MeasurementError("invalid_measurement_schema")
    run, shard, digest, fix, view = raw["run"], raw["shard"], raw["photo_sha256"], raw["fix"], raw["view"]
    if not isinstance(run, str) or _SHA.fullmatch(run) is None or type(shard) is not int or shard < 0:
        raise MeasurementError("invalid_measurement_binding")
    if not isinstance(digest, str) or _SHA.fullmatch(digest) is None:
        raise MeasurementError("invalid_measurement_binding")
    if fix not in FIX_VIEWS or view != FIX_VIEWS[fix]:
        raise MeasurementError("wrong_view_measurement")
    if status == "refused":
        refusal = raw["refusal"]
        if not isinstance(refusal, str) or _REFUSAL.fullmatch(refusal) is None:
            raise MeasurementError("invalid_refusal_code")
        return Measurement(run, shard, digest, fix, view, "refused", (), refusal)
    label = raw["simulation_label"]
    if not isinstance(label, str):
        raise MeasurementError("invalid_measurement_value")
    values = (
        ("strength_level", _number(raw["strength_level"])),
        ("lock_level", _number(raw["lock_level"])),
        ("head_changed_pixels", _count(raw["head_changed_pixels"])),
        ("outside_band_changed_pixels", _count(raw["outside_band_changed_pixels"])),
        ("movement_share", _number(raw["movement_share"])),
        ("lean_degrees", _number(raw["lean_degrees"], optional=True)),
        ("min_jacobian", _number(raw["min_jacobian"])),
        ("reduction", _number(raw["reduction"])),
        ("overshoot", _number(raw["overshoot"])),
        ("simulation_label", label),
        ("identity_similarity", _number(raw["identity_similarity"], optional=True)),
    )
    return Measurement(run, shard, digest, fix, view, "measured", values)


def check_measurement(item: Measurement, limits: Mapping[str, Any] | None = None) -> tuple[bool, tuple[str, ...]]:
    """(passed, reason codes) against the committed limits. Refusals never pass."""
    if item.status == "refused":
        return False, (f"refused:{item.refusal}",)
    rules = thresholds() if limits is None else limits
    v = item.value
    reasons: list[str] = []
    if v("strength_level") != FULL_STRENGTH:
        reasons.append("not_full_strength")
    if v("lock_level") != rules["default_lock_level"]:
        reasons.append("not_default_lock")
    if v("head_changed_pixels") > rules["maximum_head_changed_pixels"]:
        reasons.append("protected_head_changed")
    if v("outside_band_changed_pixels") > rules["maximum_outside_band_changed_pixels"]:
        reasons.append("outside_band_changed")
    if not 0 <= v("movement_share") <= rules["maximum_movement_share"]:
        reasons.append("movement_over_cap")
    lean = v("lean_degrees")
    if item.fix == LEAN_FIX_ID and (lean is None or abs(lean) > rules["maximum_lean_degrees"]):
        reasons.append("lean_over_cap")
    if v("min_jacobian") < rules["minimum_jacobian"]:
        reasons.append("fold_guard_below_floor")
    if v("reduction") < rules["minimum_reduction"]:
        reasons.append("insufficient_reduction")
    if v("overshoot") > rules["maximum_overshoot"]:
        reasons.append("overshot_neutral")
    if v("simulation_label") != SIMULATION_LABEL:
        reasons.append("simulation_label_missing")
    similarity = v("identity_similarity")
    if item.fix in FACE_FIX_IDS:
        if similarity is None:
            reasons.append("identity_not_measured")
        elif not similarity >= rules["minimum_identity_similarity"] or similarity > 1:
            reasons.append("identity_below_floor")
    elif similarity is not None and not 0 <= similarity <= 1:
        reasons.append("identity_out_of_range")
    return not reasons, tuple(reasons)


def measurement_record(run: str, shard: int, photo_sha256: str, fix: str, **overrides: Any) -> dict[str, Any]:
    """The exact `measured` record an external evaluator emits, at full strength and lock.

    Defaults describe a run inside every limit; callers override fields with what they
    actually measured. Face similarity defaults to None (not measured).
    """
    record: dict[str, Any] = {
        "format": MEASUREMENT_FORMAT, "run": run, "shard": shard, "photo_sha256": photo_sha256,
        "fix": fix, "view": FIX_VIEWS[fix], "status": "measured",
        "strength_level": FULL_STRENGTH, "lock_level": 5.0, "head_changed_pixels": 0,
        "outside_band_changed_pixels": 0, "movement_share": 0.04,
        "lean_degrees": 3.0 if fix == LEAN_FIX_ID else None, "min_jacobian": 0.6, "reduction": 0.4,
        "overshoot": 0.0, "simulation_label": SIMULATION_LABEL, "identity_similarity": None,
    }
    record.update(overrides)
    return record
