"""R18B real-face evidence contract for Skin & More features. Author: John Khan."""
from __future__ import annotations

import hashlib
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Literal

import numpy as np

from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition
from plumb_api.arena.registry import effective_women_rows_r17b

DepthSlice = Literal["light", "medium", "deep", "unknown"]
MODULE_TOKEN = "api/plumb_api/engines/skin_more"


def registry_feature_ids() -> tuple[str, ...]:
    return tuple(
        str(row["id"])
        for row in effective_women_rows_r17b()
        if row.get("status") == "built" and MODULE_TOKEN in tuple(row.get("modules", ()))
    )


@dataclass(frozen=True)
class SkinCase:
    case_id: str
    feature_id: str
    before: np.ndarray
    after: np.ndarray
    effect_mask: np.ndarray
    face_mask: np.ndarray
    protected_mask: np.ndarray | None = None
    neck_mask: np.ndarray | None = None
    chest_mask: np.ndarray | None = None
    freckle_mask: np.ndarray | None = None
    depth_slice: DepthSlice = "unknown"
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("feature_id is not a built Skin & More feature")
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("before/after must be uint8")
        if self.before.shape != self.after.shape or self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("image shape mismatch")
        for name, mask in (
            ("effect_mask", self.effect_mask),
            ("face_mask", self.face_mask),
            ("protected_mask", self.protected_mask),
            ("neck_mask", self.neck_mask),
            ("chest_mask", self.chest_mask),
            ("freckle_mask", self.freckle_mask),
        ):
            if mask is None:
                continue
            if mask.shape != self.before.shape[:2]:
                raise ValueError(f"{name} shape mismatch")
            if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError(f"{name} must be finite 0..1")
        if self.depth_slice not in {"light", "medium", "deep", "unknown"}:
            raise ValueError("unsupported depth slice")


@dataclass(frozen=True)
class SkinMetrics:
    outside_change_fraction: float
    protected_max_delta: float
    alpha_max_delta: float
    face_lightening_delta: float
    texture_retention: float
    freckle_contrast_retention: float
    face_neck_gap: float
    neck_chest_gap: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_change_fraction": self.outside_change_fraction,
            "protected_max_delta": self.protected_max_delta,
            "alpha_max_delta": self.alpha_max_delta,
            "face_lightening_delta": self.face_lightening_delta,
            "texture_retention": self.texture_retention,
            "freckle_contrast_retention": self.freckle_contrast_retention,
            "face_neck_gap": self.face_neck_gap,
            "neck_chest_gap": self.neck_chest_gap,
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


def _mean(values: np.ndarray, mask: np.ndarray | None) -> float:
    if mask is None:
        return 0.0
    weights = mask.astype(np.float64)
    total = float(np.sum(weights))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(values * weights) / total)


def measure(case: SkinCase) -> SkinMetrics:
    case.validate()
    before_rgb = case.before[..., :3].astype(np.int16)
    after_rgb = case.after[..., :3].astype(np.int16)
    delta = np.max(np.abs(after_rgb - before_rgb), axis=2)
    outside = case.effect_mask <= 0.01
    outside_fraction = float(np.count_nonzero((delta > 1) & outside)) / float(np.count_nonzero(outside)) if np.any(outside) else 0.0
    protected_max = 0.0
    if case.protected_mask is not None:
        active = case.protected_mask > 0.25
        if np.any(active):
            protected_max = float(np.max(delta[active]))
    alpha_max = 0.0
    if case.before.shape[2] == 4:
        alpha_max = float(np.max(np.abs(case.after[..., 3].astype(np.int16) - case.before[..., 3].astype(np.int16))))
    before_luma = _luma(case.before)
    after_luma = _luma(case.after)
    face_lightening = _mean(after_luma - before_luma, case.face_mask)
    texture_before = _mean(_gradient(before_luma), case.face_mask)
    texture_after = _mean(_gradient(after_luma), case.face_mask)
    texture_retention = 1.0 if texture_before <= 1e-12 else float(texture_after / texture_before)
    freckle_retention = 1.0
    if case.freckle_mask is not None:
        non_freckle = case.face_mask * (1.0 - case.freckle_mask)
        before_contrast = abs(_mean(before_luma, case.freckle_mask) - _mean(before_luma, non_freckle))
        after_contrast = abs(_mean(after_luma, case.freckle_mask) - _mean(after_luma, non_freckle))
        if before_contrast > 1e-12:
            freckle_retention = float(after_contrast / before_contrast)
    face_neck = abs(_mean(after_luma, case.face_mask) - _mean(after_luma, case.neck_mask)) if case.neck_mask is not None else 0.0
    neck_chest = (
        abs(_mean(after_luma, case.neck_mask) - _mean(after_luma, case.chest_mask))
        if case.neck_mask is not None and case.chest_mask is not None
        else 0.0
    )
    return SkinMetrics(
        outside_change_fraction=outside_fraction,
        protected_max_delta=protected_max,
        alpha_max_delta=alpha_max,
        face_lightening_delta=face_lightening,
        texture_retention=float(np.clip(texture_retention, 0.0, 3.0)),
        freckle_contrast_retention=float(np.clip(freckle_retention, 0.0, 3.0)),
        face_neck_gap=face_neck,
        neck_chest_gap=neck_chest,
    )


def _rules_for(feature_id: str) -> tuple[MetricRule, ...]:
    common = (
        MetricRule("outside_change_fraction", "max", 0.001, "Pixels outside the checked effect region remain unchanged."),
        MetricRule("protected_max_delta", "max", 1.0, "Checked protected pixels remain unchanged to one 8-bit level."),
        MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
        MetricRule("face_lightening_delta", "max", 2.0, "The feature does not globally lighten the face."),
        MetricRule("texture_retention", "min", 0.65, "Observed skin texture remains materially present."),
    )
    if feature_id == "W90":
        return common + (
            MetricRule(
                "freckle_contrast_retention",
                "min",
                0.40,
                "Observed freckles remain visible unless faux-freckle mode is explicitly requested.",
            ),
        )
    if feature_id == "W91":
        return common + (
            MetricRule("face_neck_gap", "max", 24.0, "Face and neck remain within the preregistered luminance continuity bound."),
            MetricRule("neck_chest_gap", "max", 24.0, "Neck and chest remain within the preregistered luminance continuity bound."),
        )
    if feature_id in {"W84", "W92"}:
        without_texture = tuple(rule for rule in common if rule.name != "texture_retention")
        return without_texture + (MetricRule("texture_retention", "min", 0.72, "Texture-first modes retain a stronger texture floor."),)
    return common


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    for feature_id in registry_feature_ids():
        evidence = ["before", "after", "effect_mask", "face_mask"]
        if feature_id == "W90":
            evidence.append("freckle_mask")
        if feature_id == "W91":
            evidence.extend(("neck_mask", "chest_mask"))
        result.append(
            PassDefinition(
                id=f"r18b.skin.{feature_id.lower()}",
                group="skin_more",
                title=f"{feature_id} Skin & More real-face acceptance",
                scope="Authorized local image with checked effect and anatomy masks.",
                rules=_rules_for(feature_id),
                required_evidence=tuple(evidence),
                notes=(
                    "Appearance checks are cosmetic and not medical advice.",
                    "Missing checked evidence remains not_tested.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[str, PassDefinition]:
    return {item.id.split(".")[-1].upper(): item for item in definitions()}


def input_sha256(case: SkinCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.effect_mask, case.face_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.feature_id.encode("ascii"))
    digest.update(case.depth_slice.encode("ascii"))
    return digest.hexdigest()


def evaluate(case: SkinCase, *, available_evidence: Iterable[str] | None = None) -> EvidenceRecord:
    case.validate()
    definition = definition_map()[case.feature_id]
    available = set(available_evidence or ("before", "after", "effect_mask", "face_mask"))
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


def summarize(records: Sequence[tuple[SkinCase, EvidenceRecord]]) -> dict[str, object]:
    features = registry_feature_ids()
    counts = {feature: {"passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    slices: dict[str, dict[str, int]] = {}
    for case, record in records:
        record.validate()
        counts[case.feature_id][record.status] += 1
        bucket = slices.setdefault(case.depth_slice, {"passed": 0, "failed": 0, "not_tested": 0})
        bucket[record.status] += 1
    complete = sum(1 for item in counts.values() if item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0)
    return {
        "family": "skin_more",
        "registry_feature_count": len(features),
        "registry_features": features,
        "cases": len(records),
        "complete_features": complete,
        "per_feature": counts,
        "per_depth_slice": slices,
        "ready": bool(records) and complete == len(features),
    }
