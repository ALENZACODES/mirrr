"""Tuesday supplement: 41 decimal levels for each BELJOUR output tier.

These 82 rows extend, not replace, the frozen 205-slot five-command matrix.
No missing row is inferred, and measured preview/export times are required
separately for each tier. Checksum means integrity, not independent approval.
Author: John Khan.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import re
from dataclasses import dataclass
from typing import Literal, cast

from .errors import CommandValidationError
from .frames import MAX_IMAGE_PIXELS
from .quality_tiers import TIER_LONG_EDGES, QualityTier, QualityTierRun, checked_tier
from .tuesday_lock import verify_tuesday_lock_json

TIER_MATRIX_VERSION = "beljour-tuesday-quality-tiers/1"
TierRowStatus = Literal[
    "missing", "failed_safety", "over_budget", "synthetic_checked", "device_checked",
]
_RUN_ID = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$")
_DIGEST = re.compile(r"^[a-f0-9]{64}$")
_TIERS: tuple[QualityTier, ...] = ("1080", "4k")
_LEVELS = range(10, 51)


def _reject(message: str) -> None:
    raise CommandValidationError("invalid_tier_evidence", message)


def _finite_time(value: object) -> float:
    if type(value) not in (float, int):
        _reject("Tier latency must be an actual numeric measurement.")
    numeric = cast(float | int, value)
    converted = float(numeric)
    if not math.isfinite(converted) or converted < 0:
        _reject("Tier latency must be finite and nonnegative.")
    return converted


@dataclass(frozen=True, slots=True)
class TierLockObservation:
    tier: QualityTier
    level_tenths: int
    source_width: int
    source_height: int
    output_width: int
    output_height: int
    factor: int
    preview_ms: float
    export_ms: float
    cleanup_first: bool
    identity_lock_on: bool
    guarded_preview_steps: int
    guarded_export_steps: int
    neutral_reference_exact: bool
    measured_device: bool = False

    def __post_init__(self) -> None:
        checked_tier(self.tier)
        if type(self.level_tenths) is not int or self.level_tenths not in _LEVELS:
            _reject("Tier evidence level must be 1.0 to 5.0 in 0.1 steps.")
        sizes = (
            self.source_width, self.source_height, self.output_width, self.output_height,
        )
        if any(type(value) is not int or value < 1 for value in sizes):
            _reject("Tier evidence dimensions are invalid.")
        if type(self.factor) is not int or self.factor not in (2, 4):
            _reject("Tier evidence scale must be the actual 2x or 4x engine.")
        preview_is_integer = type(self.guarded_preview_steps) is int
        export_is_integer = type(self.guarded_export_steps) is int
        if not preview_is_integer or not export_is_integer:
            _reject("Identity guard counts must be integers.")
        if min(self.guarded_preview_steps, self.guarded_export_steps) < 0:
            _reject("Identity guard counts must not be negative.")
        flags = (
            self.cleanup_first, self.identity_lock_on, self.neutral_reference_exact,
            self.measured_device,
        )
        if any(type(flag) is not bool for flag in flags):
            _reject("Tier evidence flags must be boolean.")
        _finite_time(self.preview_ms)
        _finite_time(self.export_ms)

    def safety_findings(self) -> tuple[str, ...]:
        problems: list[str] = []
        if not self.cleanup_first:
            problems.append("cleanup_missing")
        if not self.identity_lock_on or min(
            self.guarded_preview_steps, self.guarded_export_steps,
        ) < 2:
            problems.append("identity_not_proved")
        if self.output_width != self.source_width * self.factor:
            problems.append("scale_mismatch")
        if self.output_height != self.source_height * self.factor:
            problems.append("scale_mismatch")
        if self.output_width * self.source_height != self.output_height * self.source_width:
            problems.append("aspect_mismatch")
        if max(self.output_width, self.output_height) < TIER_LONG_EDGES[self.tier]:
            problems.append("tier_shortfall")
        if self.output_width * self.output_height > MAX_IMAGE_PIXELS:
            problems.append("capacity_exceeded")
        if self.level_tenths == 10 and not self.neutral_reference_exact:
            problems.append("neutral_reference_mismatch")
        return tuple(dict.fromkeys(problems))

    def public_metadata(
        self, *, preview_budget_ms: float, export_budget_ms: float,
    ) -> dict[str, object]:
        findings = list(self.safety_findings())
        too_slow = self.preview_ms > preview_budget_ms or self.export_ms > export_budget_ms
        status: TierRowStatus = (
            "failed_safety" if findings else "over_budget" if too_slow
            else "device_checked" if self.measured_device else "synthetic_checked"
        )
        return {
            "tier": self.tier,
            "level_tenths": self.level_tenths,
            "status": status,
            "source_width": self.source_width,
            "source_height": self.source_height,
            "output_width": self.output_width,
            "output_height": self.output_height,
            "scale": self.factor,
            "minimum_long_edge": TIER_LONG_EDGES[self.tier],
            "preview_ms": self.preview_ms,
            "export_ms": self.export_ms,
            "cleanup_first": self.cleanup_first,
            "identity_lock_on": self.identity_lock_on,
            "guarded_preview_steps": self.guarded_preview_steps,
            "guarded_export_steps": self.guarded_export_steps,
            "neutral_reference_exact": self.neutral_reference_exact,
            "measured_device": self.measured_device,
            "findings": findings,
        }


def observation_from_runs(
    preview: QualityTierRun,
    export: QualityTierRun,
    *,
    neutral_reference_exact: bool,
    measured_device: bool = False,
) -> TierLockObservation:
    """Record two actual executions, never a timer supplied as a guess."""
    if preview.quality != "preview" or export.quality != "export":
        _reject("Both actual preview and export runs are required.")
    if preview.plan.pro_plan.fingerprint() != export.plan.pro_plan.fingerprint():
        _reject("The tier preview and export must use the identical recipe.")
    p = preview.plan
    if (p.source_width, p.source_height) != (
        export.plan.source_width, export.plan.source_height,
    ):
        _reject("Preview/export must use the same source geometry.")
    for run in (preview, export):
        if run.guarded_step_count != len(run.plan.pro_plan.steps):
            _reject("A tier run cannot omit identity decisions.")
    return TierLockObservation(
        tier=p.recipe.tier,
        level_tenths=p.recipe.upscale_level.tenths,
        source_width=p.source_width,
        source_height=p.source_height,
        output_width=export.result.image.width,
        output_height=export.result.image.height,
        factor=p.upscale_factor,
        preview_ms=preview.elapsed_ms,
        export_ms=export.elapsed_ms,
        cleanup_first=p.pro_plan.steps[0].name.value == "cleanup",
        identity_lock_on=p.pro_plan.identity.enabled,
        guarded_preview_steps=preview.guarded_step_count,
        guarded_export_steps=export.guarded_step_count,
        neutral_reference_exact=neutral_reference_exact,
        measured_device=measured_device,
    )


def _canonical(document: dict[str, object]) -> str:
    return json.dumps(
        document, ensure_ascii=True, allow_nan=False,
        sort_keys=True, separators=(",", ":"),
    )


def _hash(document: dict[str, object]) -> str:
    return hashlib.sha256(_canonical(document).encode("utf-8")).hexdigest()


def _checked_id(value: str) -> str:
    if not isinstance(value, str) or _RUN_ID.fullmatch(value) is None:
        _reject("Only short non-sensitive run/build identifiers are accepted.")
    return value


def _missing_row(tier: QualityTier, level_tenths: int) -> dict[str, object]:
    return {
        "tier": tier,
        "level_tenths": level_tenths,
        "status": "missing",
        "minimum_long_edge": TIER_LONG_EDGES[tier],
        "source_width": None,
        "source_height": None,
        "output_width": None,
        "output_height": None,
        "scale": None,
        "preview_ms": None,
        "export_ms": None,
        "cleanup_first": None,
        "identity_lock_on": None,
        "guarded_preview_steps": None,
        "guarded_export_steps": None,
        "neutral_reference_exact": None,
        "measured_device": None,
        "findings": ["evidence_missing"],
    }


def build_tier_matrix(
    observations: tuple[TierLockObservation, ...],
    *,
    original_tuesday_json: str,
    run_id: str,
    renderer_build: str,
    preview_budget_ms: float = 100.0,
    export_budget_ms: float = 2000.0,
) -> str:
    """Bind 82 new rows to the unchanged, validated 205-slot Tuesday packet."""
    _checked_id(run_id)
    _checked_id(renderer_build)
    original = verify_tuesday_lock_json(original_tuesday_json)
    if original["run_id"] != run_id or original["renderer_build"] != renderer_build:
        _reject("Tier evidence must belong to the exact Tuesday run and renderer build.")
    preview_limit = _finite_time(preview_budget_ms)
    export_limit = _finite_time(export_budget_ms)
    if preview_limit <= 0 or export_limit <= 0:
        _reject("Tier timing budgets must be positive.")
    found: dict[tuple[QualityTier, int], TierLockObservation] = {}
    for item in observations:
        if not isinstance(item, TierLockObservation):
            _reject("Tier observations must be fully validated.")
        key = (item.tier, item.level_tenths)
        if key in found:
            _reject("Duplicate tier/strength evidence is not allowed.")
        found[key] = item
    rows: list[dict[str, object]] = []
    for tier in _TIERS:
        for step in _LEVELS:
            observation = found.get((tier, step))
            if observation is None:
                rows.append(_missing_row(tier, step))
            else:
                rows.append(observation.public_metadata(
                    preview_budget_ms=preview_limit,
                    export_budget_ms=export_limit,
                ))
    statuses = {str(row["status"]) for row in rows}
    status = (
        "blocked" if "failed_safety" in statuses or "over_budget" in statuses
        else "incomplete" if "missing" in statuses else "technical_review_required"
    )
    content: dict[str, object] = {
        "version": TIER_MATRIX_VERSION,
        "run_id": run_id,
        "renderer_build": renderer_build,
        "original_tuesday_sha256": json.loads(original_tuesday_json)["sha256"],
        "tier_count": 2,
        "levels_per_tier": 41,
        "supplemental_slots": 82,
        "original_command_slots_unchanged": 205,
        "preview_budget_ms": preview_limit,
        "export_budget_ms": export_limit,
        "status": status,
        "rows": rows,
        "independent_realface_result": "NOT_RUN",
        "production_identity_qualified": False,
        "release_qualified": False,
    }
    content["sha256"] = _hash(content)
    return _canonical(content)


def verify_tier_matrix(text: str, *, original_tuesday_json: str) -> dict[str, object]:
    """Recompute every status and checksum; never trust embedded verdicts."""
    if not isinstance(text, str) or len(text) > 120_000:
        _reject("Tier packet is missing or too large.")
    try:
        raw = json.loads(text)
    except (ValueError, TypeError):
        _reject("Tier packet is not valid JSON.")
    if not isinstance(raw, dict):
        _reject("Tier packet must be an object.")
    expected_keys = {
        "version", "run_id", "renderer_build", "original_tuesday_sha256",
        "tier_count", "levels_per_tier", "supplemental_slots",
        "original_command_slots_unchanged", "preview_budget_ms", "export_budget_ms",
        "status", "rows", "independent_realface_result",
        "production_identity_qualified", "release_qualified", "sha256",
    }
    if set(raw) != expected_keys or raw.get("version") != TIER_MATRIX_VERSION:
        _reject("Tier packet schema is invalid.")
    supplied_sha = raw.pop("sha256")
    if not isinstance(supplied_sha, str) or _DIGEST.fullmatch(supplied_sha) is None:
        _reject("Tier packet checksum is invalid.")
    if _hash(cast(dict[str, object], raw)) != supplied_sha:
        _reject("Tier packet checksum does not match content.")
    original = verify_tuesday_lock_json(original_tuesday_json)
    if raw["original_tuesday_sha256"] != json.loads(original_tuesday_json)["sha256"]:
        _reject("Tier packet does not match the bound five-command lock matrix.")
    if raw["run_id"] != original["run_id"] or raw["renderer_build"] != original["renderer_build"]:
        _reject("Tier packet run/build differs from the original lock matrix.")
    if raw["tier_count"] != 2 or raw["levels_per_tier"] != 41:
        _reject("Tier packet coverage was changed.")
    if raw["supplemental_slots"] != 82 or raw["original_command_slots_unchanged"] != 205:
        _reject("Tier packet must retain all 82 supplemental and 205 original slots.")
    if raw["independent_realface_result"] != "NOT_RUN":
        _reject("Tier packet cannot approve real-face qualification.")
    if raw["release_qualified"] is not False or raw["production_identity_qualified"] is not False:
        _reject("Tier packet cannot approve release or production identity.")
    rows = raw.get("rows")
    if not isinstance(rows, list) or len(rows) != 82:
        _reject("Tier evidence must have exactly 82 ordered rows.")
    observations: list[TierLockObservation] = []
    for index, value in enumerate(rows):
        if not isinstance(value, dict):
            _reject("Tier row must be an object.")
        tier = _TIERS[index // 41]
        level = 10 + index % 41
        if value.get("tier") != tier or value.get("level_tenths") != level:
            _reject("Tier row order cannot be changed.")
        if value.get("status") == "missing":
            if value != _missing_row(tier, level):
                _reject("Missing evidence must not contain measurements.")
            continue
        try:
            observation = TierLockObservation(
                tier=tier,
                level_tenths=level,
                source_width=value["source_width"],
                source_height=value["source_height"],
                output_width=value["output_width"],
                output_height=value["output_height"],
                factor=value["scale"],
                preview_ms=value["preview_ms"],
                export_ms=value["export_ms"],
                cleanup_first=value["cleanup_first"],
                identity_lock_on=value["identity_lock_on"],
                guarded_preview_steps=value["guarded_preview_steps"],
                guarded_export_steps=value["guarded_export_steps"],
                neutral_reference_exact=value["neutral_reference_exact"],
                measured_device=value["measured_device"],
            )
        except (KeyError, TypeError, ValueError):
            _reject("Tier row contains invalid measurement fields.")
        if value != observation.public_metadata(
            preview_budget_ms=_finite_time(raw["preview_budget_ms"]),
            export_budget_ms=_finite_time(raw["export_budget_ms"]),
        ):
            _reject("Tier row status or measurements were forged.")
        observations.append(observation)
    # Comparing to a newly constructed packet validates status, completeness,
    # every safety check and the exact canonical representation.
    canonical = build_tier_matrix(
        tuple(observations), original_tuesday_json=original_tuesday_json,
        run_id=cast(str, raw["run_id"]),
        renderer_build=cast(str, raw["renderer_build"]),
        preview_budget_ms=_finite_time(raw["preview_budget_ms"]),
        export_budget_ms=_finite_time(raw["export_budget_ms"]),
    )
    if canonical != text:
        _reject("Tier packet content diverged from recalculated evidence.")
    raw["sha256"] = supplied_sha
    return cast(dict[str, object], raw)


def tier_matrix_csv(tier_json: str, *, original_tuesday_json: str) -> str:
    """Strictly validated, photo-free supplemental CSV for Tuesday reviewers."""
    document = verify_tier_matrix(tier_json, original_tuesday_json=original_tuesday_json)
    rows = cast(list[dict[str, object]], document["rows"])
    output = io.StringIO(newline="")
    fields = (
        "tier", "level_tenths", "status", "minimum_long_edge", "output_width",
        "output_height", "scale", "preview_ms", "export_ms", "cleanup_first",
        "identity_lock_on", "guarded_preview_steps", "guarded_export_steps",
        "neutral_reference_exact", "measured_device", "findings",
    )
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(fields)
    for row in rows:
        writer.writerow([
            "" if row[key] is None else ";".join(cast(list[str], row[key]))
            if key == "findings" else str(row[key]).lower() if type(row[key]) is bool else row[key]
            for key in fields
        ])
    return output.getvalue()
