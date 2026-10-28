"""R18B real-face evidence contract for women's makeup. Author: John Khan.

Evaluation is local and mask-driven. The module deliberately separates measured
pixel properties from subjective styling preferences and never infers skin tone,
medical conditions, or product suitability from an image alone.
"""
from __future__ import annotations

import hashlib
import math
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Literal

import numpy as np

from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition
from plumb_api.arena.registry import effective_women_rows_r17b

DepthSlice = Literal["light", "medium", "deep", "unknown"]
UndertoneSlice = Literal["warm", "cool", "neutral", "olive", "unknown"]
MODULE_TOKEN = "api/plumb_api/engines/makeup_w"


def registry_feature_ids() -> tuple[str, ...]:
    rows = effective_women_rows_r17b()
    return tuple(
        str(row["id"])
        for row in rows
        if row.get("status") == "built" and MODULE_TOKEN in tuple(row.get("modules", ()))
    )


@dataclass(frozen=True)
class MakeupCase:
    case_id: str
    feature_id: str
    before: np.ndarray
    after: np.ndarray
    skin_mask: np.ndarray
    effect_mask: np.ndarray
    protected_mask: np.ndarray | None = None
    reference_rgb: tuple[int, int, int] | None = None
    depth_slice: DepthSlice = "unknown"
    undertone_slice: UndertoneSlice = "unknown"
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("feature_id is not a built Lane-B makeup feature")
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("before/after must be uint8")
        if self.before.shape != self.after.shape:
            raise ValueError("before/after shape mismatch")
        if self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("images must be RGB or RGBA")
        for name, mask in (("skin_mask", self.skin_mask), ("effect_mask", self.effect_mask)):
            if mask.shape != self.before.shape[:2]:
                raise ValueError(f"{name} shape mismatch")
            if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError(f"{name} must be finite 0..1")
        if self.protected_mask is not None:
            if self.protected_mask.shape != self.before.shape[:2]:
                raise ValueError("protected_mask shape mismatch")
            if not np.all(np.isfinite(self.protected_mask)):
                raise ValueError("protected_mask must be finite")
        if self.reference_rgb is not None and any(channel < 0 or channel > 255 for channel in self.reference_rgb):
            raise ValueError("reference_rgb must be 8-bit")
        if self.depth_slice not in {"light", "medium", "deep", "unknown"}:
            raise ValueError("unsupported depth slice")
        if self.undertone_slice not in {"warm", "cool", "neutral", "olive", "unknown"}:
            raise ValueError("unsupported undertone slice")


@dataclass(frozen=True)
class MakeupMetrics:
    outside_change_fraction: float
    protected_max_delta: float
    alpha_max_delta: float
    skin_lightening_delta: float
    skin_chroma_retention: float
    deep_skin_chroma_retention: float
    texture_retention: float
    effect_changed_fraction: float
    reference_distance: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_change_fraction": self.outside_change_fraction,
            "protected_max_delta": self.protected_max_delta,
            "alpha_max_delta": self.alpha_max_delta,
            "skin_lightening_delta": self.skin_lightening_delta,
            "skin_chroma_retention": self.skin_chroma_retention,
            "deep_skin_chroma_retention": self.deep_skin_chroma_retention,
            "texture_retention": self.texture_retention,
            "effect_changed_fraction": self.effect_changed_fraction,
            "reference_distance": self.reference_distance,
        }


def _luma(rgb: np.ndarray) -> np.ndarray:
    values = rgb.astype(np.float64)
    return values[..., 0] * 0.2126 + values[..., 1] * 0.7152 + values[..., 2] * 0.0722


def _chroma(rgb: np.ndarray) -> np.ndarray:
    values = rgb.astype(np.float64)
    return np.max(values, axis=2) - np.min(values, axis=2)


def _gradient(gray: np.ndarray) -> np.ndarray:
    gx = np.zeros_like(gray, dtype=np.float64)
    gy = np.zeros_like(gray, dtype=np.float64)
    gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) * 0.5
    gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) * 0.5
    return np.hypot(gx, gy)


def _weighted_mean(values: np.ndarray, mask: np.ndarray) -> float:
    weights = mask.astype(np.float64)
    total = float(np.sum(weights))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(values * weights) / total)


def _fraction(mask: np.ndarray) -> float:
    return float(np.count_nonzero(mask) / mask.size) if mask.size else 0.0


def _reference_distance(after: np.ndarray, effect_mask: np.ndarray, reference: tuple[int, int, int] | None) -> float:
    if reference is None:
        return 0.0
    active = effect_mask > 0.25
    if not np.any(active):
        return 255.0
    mean = after[..., :3][active].astype(np.float64).mean(axis=0)
    target = np.asarray(reference, dtype=np.float64)
    return float(np.linalg.norm(mean - target) / math.sqrt(3.0))


def measure(case: MakeupCase) -> MakeupMetrics:
    case.validate()
    before_rgb = case.before[..., :3]
    after_rgb = case.after[..., :3]
    delta = np.max(np.abs(after_rgb.astype(np.int16) - before_rgb.astype(np.int16)), axis=2)
    effect = case.effect_mask > 0.01
    outside = ~effect
    outside_change = _fraction((delta > 1) & outside)
    protected_max = 0.0
    if case.protected_mask is not None:
        protected = case.protected_mask > 0.25
        if np.any(protected):
            protected_max = float(np.max(delta[protected]))
    alpha_max = 0.0
    if case.before.shape[2] == 4:
        alpha_max = float(np.max(np.abs(case.after[..., 3].astype(np.int16) - case.before[..., 3].astype(np.int16))))
    skin = case.skin_mask > 0.25
    before_luma = _luma(before_rgb)
    after_luma = _luma(after_rgb)
    lightening = 0.0
    if np.any(skin):
        lightening = float(np.mean(after_luma[skin] - before_luma[skin]))
    before_chroma = _chroma(before_rgb)
    after_chroma = _chroma(after_rgb)
    chroma_before = _weighted_mean(before_chroma, case.skin_mask)
    chroma_after = _weighted_mean(after_chroma, case.skin_mask)
    chroma_retention = 1.0 if chroma_before <= 1e-9 else float(chroma_after / chroma_before)
    deep_retention = chroma_retention if case.depth_slice == "deep" else 1.0
    gradient_before = _gradient(before_luma)
    gradient_after = _gradient(after_luma)
    texture_before = _weighted_mean(gradient_before, case.skin_mask)
    texture_after = _weighted_mean(gradient_after, case.skin_mask)
    texture_retention = 1.0 if texture_before <= 1e-9 else float(texture_after / texture_before)
    effect_changed = 0.0
    active_effect = case.effect_mask > 0.25
    if np.any(active_effect):
        effect_changed = float(np.count_nonzero((delta > 1) & active_effect)) / float(np.count_nonzero(active_effect))
    return MakeupMetrics(
        outside_change_fraction=outside_change,
        protected_max_delta=protected_max,
        alpha_max_delta=alpha_max,
        skin_lightening_delta=lightening,
        skin_chroma_retention=float(np.clip(chroma_retention, 0.0, 3.0)),
        deep_skin_chroma_retention=float(np.clip(deep_retention, 0.0, 3.0)),
        texture_retention=float(np.clip(texture_retention, 0.0, 3.0)),
        effect_changed_fraction=effect_changed,
        reference_distance=_reference_distance(case.after, case.effect_mask, case.reference_rgb),
    )


def _common_rules() -> tuple[MetricRule, ...]:
    return (
        MetricRule("outside_change_fraction", "max", 0.001, "Pixels outside the requested effect region remain unchanged."),
        MetricRule("protected_max_delta", "max", 1.0, "Checked protected pixels remain unchanged to within one 8-bit level."),
        MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
        MetricRule("skin_lightening_delta", "max", 2.0, "The engine does not lighten skin globally to make a shade work."),
        MetricRule(
            "deep_skin_chroma_retention",
            "min",
            0.72,
            "Deep-skin cases retain source chroma rather than being greyed or washed out.",
        ),
        MetricRule("texture_retention", "min", 0.62, "Skin texture remains materially present after rendering."),
    )


def _rules_for(feature_id: str) -> tuple[MetricRule, ...]:
    common = _common_rules()
    if feature_id in {"W1", "W2", "W4", "W5", "W7", "W8", "W13", "W14", "W17", "W18"}:
        return common + (
            MetricRule("effect_changed_fraction", "min", 0.01, "The intended region changes measurably at a non-zero setting."),
        )
    if feature_id in {"W9", "W10", "W16"}:
        without_texture = tuple(rule for rule in common if rule.name != "texture_retention")
        return without_texture + (
            MetricRule("texture_retention", "min", 0.70, "Finish simulation keeps a stronger texture floor."),
        )
    if feature_id in {"W11", "W12"}:
        return common + (
            MetricRule("effect_changed_fraction", "min", 0.005, "Placement-map rendering is visible without geometry reshaping."),
        )
    return common


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    for feature_id in registry_feature_ids():
        required = ["before", "after", "skin_mask", "effect_mask"]
        if feature_id == "W13":
            required.append("checked_reference_regions")
        result.append(
            PassDefinition(
                id=f"r18b.makeup.{feature_id.lower()}",
                group="makeup_w",
                title=f"{feature_id} makeup real-face acceptance",
                scope="Authorized local before/after pair with checked skin/effect masks.",
                rules=_rules_for(feature_id),
                required_evidence=tuple(required),
                notes=(
                    "No product, diagnosis, or attractiveness claim is inferred from the image.",
                    "Synthetic fixtures do not count as real-face evidence.",
                    "Missing checked regions remain not_tested.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[str, PassDefinition]:
    return {definition.id.split(".")[-1].upper(): definition for definition in definitions()}


def input_sha256(case: MakeupCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.skin_mask, case.effect_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.feature_id.encode("ascii"))
    digest.update(case.depth_slice.encode("ascii"))
    digest.update(case.undertone_slice.encode("ascii"))
    if case.reference_rgb is not None:
        digest.update(bytes(case.reference_rgb))
    return digest.hexdigest()


def evaluate(case: MakeupCase, *, available_evidence: Iterable[str] | None = None) -> EvidenceRecord:
    case.validate()
    definition = definition_map()[case.feature_id]
    available = set(available_evidence or ("before", "after", "skin_mask", "effect_mask"))
    missing = tuple(item for item in definition.required_evidence if item not in available)
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


def slice_key(case: MakeupCase) -> str:
    return f"depth={case.depth_slice}|undertone={case.undertone_slice}"


def summarize(records: Sequence[tuple[MakeupCase, EvidenceRecord]]) -> dict[str, object]:
    features = registry_feature_ids()
    per_feature = {feature: {"passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    per_slice: dict[str, dict[str, int]] = {}
    for case, record in records:
        record.validate()
        per_feature[case.feature_id][record.status] += 1
        bucket = per_slice.setdefault(slice_key(case), {"passed": 0, "failed": 0, "not_tested": 0})
        bucket[record.status] += 1
    complete_features = sum(
        1
        for counts in per_feature.values()
        if counts["passed"] > 0 and counts["failed"] == 0 and counts["not_tested"] == 0
    )
    ready = bool(records) and complete_features == len(features)
    return {
        "family": "makeup_w",
        "registry_feature_count": len(features),
        "registry_features": features,
        "cases": len(records),
        "complete_features": complete_features,
        "per_feature": per_feature,
        "per_slice": per_slice,
        "ready": ready,
    }
