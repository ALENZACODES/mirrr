"""R18B real-face evidence contract for smile/dental previews. Author: John Khan."""
from __future__ import annotations

import hashlib
from collections.abc import Iterable, Sequence
from dataclasses import dataclass

import numpy as np

from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition
from plumb_api.arena.registry import effective_women_rows_r17b

MODULE_TOKEN = "api/plumb_api/engines/smile"


def registry_feature_ids() -> tuple[str, ...]:
    return tuple(
        str(row["id"])
        for row in effective_women_rows_r17b()
        if row.get("status") == "built" and MODULE_TOKEN in tuple(row.get("modules", ()))
    )


@dataclass(frozen=True)
class SmileCase:
    case_id: str
    feature_id: str
    before: np.ndarray
    after: np.ndarray
    mouth_mask: np.ndarray
    tooth_mask: np.ndarray
    gum_mask: np.ndarray | None = None
    motion_frames: tuple[np.ndarray, ...] = ()
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if self.feature_id not in registry_feature_ids():
            raise ValueError("feature_id is not a built smile feature")
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("images must be uint8")
        if self.before.shape != self.after.shape or self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("image shape mismatch")
        for name, mask in (("mouth_mask", self.mouth_mask), ("tooth_mask", self.tooth_mask), ("gum_mask", self.gum_mask)):
            if mask is None:
                continue
            if mask.shape != self.before.shape[:2]:
                raise ValueError(f"{name} shape mismatch")
            if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError(f"{name} must be finite 0..1")
        for frame in self.motion_frames:
            if frame.dtype != np.uint8 or frame.shape != self.before.shape:
                raise ValueError("motion frame shape/dtype mismatch")


@dataclass(frozen=True)
class SmileMetrics:
    outside_change_fraction: float
    alpha_max_delta: float
    tooth_mean_delta: float
    gum_mean_delta: float
    tooth_texture_retention: float
    motion_max_step: float
    motion_return_error: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_change_fraction": self.outside_change_fraction,
            "alpha_max_delta": self.alpha_max_delta,
            "tooth_mean_delta": self.tooth_mean_delta,
            "gum_mean_delta": self.gum_mean_delta,
            "tooth_texture_retention": self.tooth_texture_retention,
            "motion_max_step": self.motion_max_step,
            "motion_return_error": self.motion_return_error,
        }


def _gray(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def _gradient(gray: np.ndarray) -> np.ndarray:
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) * 0.5
    gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) * 0.5
    return np.hypot(gx, gy)


def _masked_mean(values: np.ndarray, mask: np.ndarray) -> float:
    weights = mask.astype(np.float64)
    total = float(np.sum(weights))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(values * weights) / total)


def _frame_distance(left: np.ndarray, right: np.ndarray, mask: np.ndarray) -> float:
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    delta = np.abs(left[..., :3].astype(np.int16) - right[..., :3].astype(np.int16))
    return float(np.mean(delta[active]))


def measure(case: SmileCase) -> SmileMetrics:
    case.validate()
    before = case.before[..., :3].astype(np.int16)
    after = case.after[..., :3].astype(np.int16)
    delta = np.max(np.abs(after - before), axis=2)
    outside = case.mouth_mask <= 0.01
    outside_fraction = float(np.count_nonzero((delta > 1) & outside)) / float(np.count_nonzero(outside)) if np.any(outside) else 0.0
    alpha_max = 0.0
    if case.before.shape[2] == 4:
        alpha_max = float(np.max(np.abs(case.after[..., 3].astype(np.int16) - case.before[..., 3].astype(np.int16))))
    tooth_mean = _masked_mean(delta.astype(np.float64), case.tooth_mask)
    gum_mean = _masked_mean(delta.astype(np.float64), case.gum_mask) if case.gum_mask is not None else 0.0
    texture_before = _masked_mean(_gradient(_gray(case.before)), case.tooth_mask)
    texture_after = _masked_mean(_gradient(_gray(case.after)), case.tooth_mask)
    texture_retention = 1.0 if texture_before <= 1e-12 else float(texture_after / texture_before)
    max_step = 0.0
    return_error = 0.0
    if case.motion_frames:
        frames = (case.before,) + case.motion_frames
        max_step = max(_frame_distance(left, right, case.mouth_mask) for left, right in zip(frames, frames[1:], strict=False))
        return_error = _frame_distance(case.before, case.motion_frames[-1], case.mouth_mask)
    return SmileMetrics(
        outside_change_fraction=outside_fraction,
        alpha_max_delta=alpha_max,
        tooth_mean_delta=tooth_mean,
        gum_mean_delta=gum_mean,
        tooth_texture_retention=float(np.clip(texture_retention, 0.0, 3.0)),
        motion_max_step=max_step,
        motion_return_error=return_error,
    )


def _rules_for(feature_id: str) -> tuple[MetricRule, ...]:
    common = (
        MetricRule("outside_change_fraction", "max", 0.001, "Pixels outside the checked mouth region remain unchanged."),
        MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
        MetricRule("tooth_texture_retention", "min", 0.55, "Natural tooth texture remains materially present."),
    )
    if feature_id == "W50":
        return common + (MetricRule("gum_mean_delta", "min", 0.01, "The checked gum-area preview changes measurably."),)
    if feature_id in {"W51", "W52", "W53"}:
        return common + (MetricRule("tooth_mean_delta", "min", 0.01, "The requested tooth preview changes measurably."),)
    if feature_id == "W58":
        return common + (
            MetricRule("motion_max_step", "max", 35.0, "Adjacent checked motion frames avoid large discontinuities."),
            MetricRule("motion_return_error", "max", 8.0, "A closed motion sequence returns close to the starting appearance."),
        )
    return common


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    for feature_id in registry_feature_ids():
        required = ["before", "after", "mouth_mask", "tooth_mask"]
        if feature_id in {"W50", "W53"}:
            required.append("gum_mask")
        if feature_id == "W58":
            required.append("motion_frames")
        result.append(
            PassDefinition(
                id=f"r18b.smile.{feature_id.lower()}",
                group="smile",
                title=f"{feature_id} smile real-face acceptance",
                scope="Authorized local smile/dental preview with checked mouth anatomy.",
                rules=_rules_for(feature_id),
                required_evidence=tuple(required),
                notes=(
                    "Dental outputs are visual simulations and not clinical predictions.",
                    "Missing checked evidence remains not_tested.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[str, PassDefinition]:
    return {item.id.split(".")[-1].upper(): item for item in definitions()}


def input_sha256(case: SmileCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.mouth_mask, case.tooth_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    if case.gum_mask is not None:
        raw = np.ascontiguousarray(case.gum_mask).tobytes()
        digest.update(b"gum-mask")
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    for index, frame in enumerate(case.motion_frames):
        raw = np.ascontiguousarray(frame).tobytes()
        digest.update(b"motion-frame")
        digest.update(index.to_bytes(4, "big"))
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.feature_id.encode("ascii"))
    return digest.hexdigest()


def evaluate(case: SmileCase, *, available_evidence: Iterable[str] | None = None) -> EvidenceRecord:
    case.validate()
    definition = definition_map()[case.feature_id]
    available = set(available_evidence or ("before", "after", "mouth_mask", "tooth_mask"))
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


def summarize(records: Sequence[tuple[SmileCase, EvidenceRecord]]) -> dict[str, object]:
    features = registry_feature_ids()
    counts = {feature: {"passed": 0, "failed": 0, "not_tested": 0} for feature in features}
    for case, record in records:
        record.validate()
        counts[case.feature_id][record.status] += 1
    complete = sum(1 for item in counts.values() if item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0)
    return {
        "family": "smile",
        "registry_feature_count": len(features),
        "registry_features": features,
        "cases": len(records),
        "complete_features": complete,
        "per_feature": counts,
        "ready": bool(records) and complete == len(features),
    }
