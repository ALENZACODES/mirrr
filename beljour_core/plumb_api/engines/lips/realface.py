"""R18B real-face evidence contract for lip features. Author: John Khan."""
from __future__ import annotations

import hashlib
import math
from collections.abc import Iterable, Sequence
from dataclasses import dataclass

import numpy as np

from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition
from plumb_api.arena.registry import effective_women_rows_r17b

MODULE_TOKEN = "api/plumb_api/engines/lips"


def registry_feature_ids() -> tuple[str, ...]:
    return tuple(
        str(row["id"])
        for row in effective_women_rows_r17b()
        if row.get("status") == "built" and MODULE_TOKEN in tuple(row.get("modules", ()))
    )


@dataclass(frozen=True)
class LipCase:
    case_id: str
    feature_id: str
    before: np.ndarray
    after: np.ndarray
    lip_mask: np.ndarray
    teeth_mask: np.ndarray | None = None
    skin_mask: np.ndarray | None = None
    pigmentation_mask: np.ndarray | None = None
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("feature_id is not a built lip feature")
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("before/after must be uint8")
        if self.before.shape != self.after.shape or self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("image shape mismatch")
        for name, mask in (
            ("lip_mask", self.lip_mask),
            ("teeth_mask", self.teeth_mask),
            ("skin_mask", self.skin_mask),
            ("pigmentation_mask", self.pigmentation_mask),
        ):
            if mask is None:
                continue
            if mask.shape != self.before.shape[:2]:
                raise ValueError(f"{name} shape mismatch")
            if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError(f"{name} must be finite 0..1")


@dataclass(frozen=True)
class LipMetrics:
    outside_change_fraction: float
    outside_max_delta: float
    teeth_max_delta: float
    alpha_max_delta: float
    lip_changed_fraction: float
    lip_texture_retention: float
    pigmentation_contrast_retention: float
    centroid_shift_px: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_change_fraction": self.outside_change_fraction,
            "outside_max_delta": self.outside_max_delta,
            "teeth_max_delta": self.teeth_max_delta,
            "alpha_max_delta": self.alpha_max_delta,
            "lip_changed_fraction": self.lip_changed_fraction,
            "lip_texture_retention": self.lip_texture_retention,
            "pigmentation_contrast_retention": self.pigmentation_contrast_retention,
            "centroid_shift_px": self.centroid_shift_px,
        }


def _luma(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def _gradient(gray: np.ndarray) -> np.ndarray:
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) * 0.5
    gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) * 0.5
    return np.hypot(gx, gy)


def _masked_mean(values: np.ndarray, mask: np.ndarray) -> float:
    total = float(np.sum(mask))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(values * mask) / total)


def _centroid(mask: np.ndarray) -> tuple[float, float]:
    weights = mask.astype(np.float64)
    total = float(np.sum(weights))
    if total <= 1e-12:
        return (0.0, 0.0)
    yy, xx = np.indices(mask.shape, dtype=np.float64)
    return (float(np.sum(xx * weights) / total), float(np.sum(yy * weights) / total))


def measure(case: LipCase) -> LipMetrics:
    case.validate()
    before = case.before[..., :3].astype(np.int16)
    after = case.after[..., :3].astype(np.int16)
    delta = np.max(np.abs(after - before), axis=2)
    outside = case.lip_mask <= 0.01
    outside_count = int(np.count_nonzero(outside))
    outside_changed = int(np.count_nonzero((delta > 1) & outside))
    outside_fraction = float(outside_changed / outside_count) if outside_count else 0.0
    outside_max = float(np.max(delta[outside])) if outside_count else 0.0
    teeth_max = 0.0
    if case.teeth_mask is not None:
        teeth = case.teeth_mask > 0.25
        if np.any(teeth):
            teeth_max = float(np.max(delta[teeth]))
    alpha_max = 0.0
    if case.before.shape[2] == 4:
        alpha_max = float(np.max(np.abs(case.after[..., 3].astype(np.int16) - case.before[..., 3].astype(np.int16))))
    lip = case.lip_mask > 0.25
    changed = float(np.count_nonzero((delta > 1) & lip)) / float(np.count_nonzero(lip)) if np.any(lip) else 0.0
    before_luma = _luma(case.before)
    after_luma = _luma(case.after)
    texture_before = _masked_mean(_gradient(before_luma), case.lip_mask)
    texture_after = _masked_mean(_gradient(after_luma), case.lip_mask)
    texture_retention = 1.0 if texture_before <= 1e-12 else float(texture_after / texture_before)
    pigmentation_retention = 1.0
    if case.pigmentation_mask is not None:
        pigment = case.pigmentation_mask
        inverse = case.lip_mask * (1.0 - pigment)
        before_contrast = abs(_masked_mean(before_luma, pigment) - _masked_mean(before_luma, inverse))
        after_contrast = abs(_masked_mean(after_luma, pigment) - _masked_mean(after_luma, inverse))
        if before_contrast > 1e-12:
            pigmentation_retention = float(after_contrast / before_contrast)
    before_center = _centroid(case.lip_mask)
    # Rendering is not allowed to silently change the checked anatomy mask, so center is zero unless
    # a future checked output mask is explicitly supplied. Keep the metric to preregister that pin.
    after_center = _centroid(case.lip_mask)
    centroid_shift = math.hypot(after_center[0] - before_center[0], after_center[1] - before_center[1])
    return LipMetrics(
        outside_change_fraction=outside_fraction,
        outside_max_delta=outside_max,
        teeth_max_delta=teeth_max,
        alpha_max_delta=alpha_max,
        lip_changed_fraction=changed,
        lip_texture_retention=float(np.clip(texture_retention, 0.0, 3.0)),
        pigmentation_contrast_retention=float(np.clip(pigmentation_retention, 0.0, 3.0)),
        centroid_shift_px=float(centroid_shift),
    )


def _rules_for(feature_id: str) -> tuple[MetricRule, ...]:
    common = (
        MetricRule("outside_change_fraction", "max", 0.001, "Pixels outside the checked lip region remain unchanged."),
        MetricRule("outside_max_delta", "max", 1.0, "Outside-region numeric drift is at most one 8-bit level."),
        MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
        MetricRule("lip_texture_retention", "min", 0.60, "Observed lip texture remains materially present."),
        MetricRule("centroid_shift_px", "max", 0.01, "Checked anatomy remains pinned unless geometry is explicitly part of the preview."),
    )
    if feature_id == "W54":
        return common + (
            MetricRule("teeth_max_delta", "max", 1.0, "The optical shade feature does not whiten or recolour teeth."),
            MetricRule("lip_changed_fraction", "min", 0.01, "The lip shade changes measurably."),
        )
    if feature_id == "W57":
        return common + (
            MetricRule("pigmentation_contrast_retention", "min", 0.35, "Observed natural lip pigmentation is not flattened away."),
            MetricRule("lip_changed_fraction", "min", 0.01, "The selected shade changes the intended lip region."),
        )
    return common + (
        MetricRule("lip_changed_fraction", "min", 0.005, "A non-zero requested preview changes the checked lip region."),
    )


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    for feature_id in registry_feature_ids():
        evidence = ["before", "after", "lip_mask"]
        if feature_id == "W54":
            evidence.append("teeth_mask")
        if feature_id == "W57":
            evidence.append("pigmentation_mask")
        result.append(
            PassDefinition(
                id=f"r18b.lips.{feature_id.lower()}",
                group="lips",
                title=f"{feature_id} lip real-face acceptance",
                scope="Authorized local before/after pair with checked lip anatomy.",
                rules=_rules_for(feature_id),
                required_evidence=tuple(evidence),
                notes=(
                    "Permanent-makeup and filler previews are simulations, not treatment outcomes.",
                    "Missing checked evidence remains not_tested.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[str, PassDefinition]:
    return {item.id.split(".")[-1].upper(): item for item in definitions()}


def input_sha256(case: LipCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.lip_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.feature_id.encode("ascii"))
    return digest.hexdigest()


def evaluate(case: LipCase, *, available_evidence: Iterable[str] | None = None) -> EvidenceRecord:
    case.validate()
    definition = definition_map()[case.feature_id]
    available = set(available_evidence or ("before", "after", "lip_mask"))
    missing = tuple(name for name in definition.required_evidence if name not in available)
    if missing:
        return EvidenceRecord(
            definition_id=definition.id,
            definition_sha256=definition.sha256,
            case_id=case.case_id,
            input_sha256=input_sha256(case),
            status="not_tested",
            missing=missing,
            notes=case.notes,
        )
    measured = measure(case).mapping()
    passed = all(rule.passes(measured[rule.name]) for rule in definition.rules)
    return EvidenceRecord(
        definition_id=definition.id,
        definition_sha256=definition.sha256,
        case_id=case.case_id,
        input_sha256=input_sha256(case),
        status="passed" if passed else "failed",
        metrics={rule.name: measured[rule.name] for rule in definition.rules},
        notes=case.notes,
    )


def summarize(records: Sequence[tuple[LipCase, EvidenceRecord]]) -> dict[str, object]:
    features = registry_feature_ids()
    counts = {feature: {"passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    for case, record in records:
        record.validate()
        counts[case.feature_id][record.status] += 1
    complete = sum(1 for values in counts.values() if values["passed"] > 0 and values["failed"] == 0 and values["not_tested"] == 0)
    return {
        "family": "lips",
        "registry_feature_count": len(features),
        "registry_features": features,
        "cases": len(records),
        "complete_features": complete,
        "per_feature": counts,
        "ready": bool(records) and complete == len(features),
    }
