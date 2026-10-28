"""R18B real-face evidence contract for women's hair features. Author: John Khan.

The module evaluates already-rendered local images. It never discovers a face,
opens the network, or changes the shared real-face runner. Missing masks or
labels become ``not_tested`` evidence rather than an inferred pass.
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

HairSlice = Literal["straight", "wavy", "curly", "coily", "unknown"]
ToneSlice = Literal["light", "medium", "deep", "unknown"]

MODULE_TOKEN = "api/plumb_api/engines/hair_women"
COLOUR_IDS = ("W28", "W39")


def registry_feature_ids() -> tuple[str, ...]:
    """Return hair features from the effective registry, not a hand-maintained count."""

    rows = effective_women_rows_r17b()
    owned = [
        str(row["id"])
        for row in rows
        if row.get("status") == "built" and MODULE_TOKEN in tuple(row.get("modules", ()))
    ]
    colour = [
        str(row["id"])
        for row in rows
        if str(row.get("id")) in COLOUR_IDS and row.get("status") == "built"
    ]
    return tuple(sorted((*owned, *colour), key=lambda value: int(value[1:])))


@dataclass(frozen=True)
class HairCase:
    """One authorized local before/after pair plus checked evaluation regions."""

    case_id: str
    before: np.ndarray
    after: np.ndarray
    hair_mask: np.ndarray
    scalp_mask: np.ndarray | None = None
    feature_id: str = "W19"
    hair_slice: HairSlice = "unknown"
    tone_slice: ToneSlice = "unknown"
    curl_reference: np.ndarray | None = None
    timeline_values: tuple[float, ...] = ()
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        ids = registry_feature_ids()
        if self.feature_id not in ids:
            raise ValueError("feature_id is not a built Lane-B hair feature")
        if not self.case_id.strip():
            raise ValueError("case_id is required")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("before/after must be uint8")
        if self.before.shape != self.after.shape:
            raise ValueError("before/after shape mismatch")
        if self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("images must be RGB or RGBA")
        if self.hair_mask.shape != self.before.shape[:2]:
            raise ValueError("hair mask shape mismatch")
        if not np.all(np.isfinite(self.hair_mask)):
            raise ValueError("hair mask must be finite")
        if np.any(self.hair_mask < 0) or np.any(self.hair_mask > 1):
            raise ValueError("hair mask must stay in 0..1")
        if self.scalp_mask is not None:
            if self.scalp_mask.shape != self.before.shape[:2]:
                raise ValueError("scalp mask shape mismatch")
            if not np.all(np.isfinite(self.scalp_mask)):
                raise ValueError("scalp mask must be finite")
            if np.any(self.scalp_mask < 0) or np.any(self.scalp_mask > 1):
                raise ValueError("scalp mask must stay in 0..1")
        if self.curl_reference is not None and self.curl_reference.shape != self.before.shape[:2]:
            raise ValueError("curl reference shape mismatch")
        if self.hair_slice not in {"straight", "wavy", "curly", "coily", "unknown"}:
            raise ValueError("unsupported hair slice")
        if self.tone_slice not in {"light", "medium", "deep", "unknown"}:
            raise ValueError("unsupported tone slice")
        if self.timeline_values and any(not math.isfinite(value) for value in self.timeline_values):
            raise ValueError("timeline values must be finite")


@dataclass(frozen=True)
class HairMetrics:
    outside_change_fraction: float
    outside_max_delta: float
    hair_mean_delta: float
    alpha_max_delta: float
    edge_retention: float
    texture_retention: float
    curl_retention: float
    grey_timeline_monotone: bool
    changed_hair_fraction: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_change_fraction": self.outside_change_fraction,
            "outside_max_delta": self.outside_max_delta,
            "hair_mean_delta": self.hair_mean_delta,
            "alpha_max_delta": self.alpha_max_delta,
            "edge_retention": self.edge_retention,
            "texture_retention": self.texture_retention,
            "curl_retention": self.curl_retention,
            "grey_timeline_monotone": self.grey_timeline_monotone,
            "changed_hair_fraction": self.changed_hair_fraction,
        }


def _gray(image: np.ndarray) -> np.ndarray:
    rgb = image[..., :3].astype(np.float64)
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def _gradient(image: np.ndarray) -> np.ndarray:
    gray = _gray(image)
    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:-1] = (gray[:, 2:] - gray[:, :-2]) * 0.5
    gy[1:-1, :] = (gray[2:, :] - gray[:-2, :]) * 0.5
    return np.hypot(gx, gy)


def _safe_ratio(numerator: float, denominator: float, *, empty: float = 1.0) -> float:
    if denominator <= 1e-12:
        return empty
    return float(numerator / denominator)


def _masked_mean(values: np.ndarray, mask: np.ndarray) -> float:
    weights = np.asarray(mask, dtype=np.float64)
    total = float(np.sum(weights))
    if total <= 1e-12:
        return 0.0
    return float(np.sum(values * weights) / total)


def _texture_energy(image: np.ndarray, mask: np.ndarray) -> float:
    gradient = _gradient(image)
    return _masked_mean(gradient, mask)


def _curl_similarity(before: np.ndarray, after: np.ndarray, reference: np.ndarray | None, mask: np.ndarray) -> float:
    before_grad = _gradient(before)
    after_grad = _gradient(after)
    active = mask > 0.25
    if reference is not None:
        active &= reference > 0
    if int(np.count_nonzero(active)) < 8:
        return 1.0
    left = before_grad[active]
    right = after_grad[active]
    left_centered = left - float(np.mean(left))
    right_centered = right - float(np.mean(right))
    denom = float(np.linalg.norm(left_centered) * np.linalg.norm(right_centered))
    if denom <= 1e-12:
        return 1.0 if np.allclose(left, right) else 0.0
    return float(np.clip(np.dot(left_centered, right_centered) / denom, -1.0, 1.0))


def _timeline_monotone(values: Sequence[float]) -> bool:
    if len(values) < 2:
        return True
    return all(right + 1e-12 >= left for left, right in zip(values, values[1:], strict=False))


def measure(case: HairCase) -> HairMetrics:
    """Measure localization, alpha, texture, curl and timeline behavior."""

    case.validate()
    before = case.before.astype(np.int16)
    after = case.after.astype(np.int16)
    rgb_delta = np.max(np.abs(after[..., :3] - before[..., :3]), axis=2).astype(np.float64)
    outside = case.hair_mask <= 0.01
    outside_count = int(np.count_nonzero(outside))
    outside_changed = int(np.count_nonzero((rgb_delta > 1) & outside))
    outside_fraction = _safe_ratio(float(outside_changed), float(outside_count), empty=0.0)
    outside_max = float(np.max(rgb_delta[outside])) if outside_count else 0.0
    hair = case.hair_mask > 0.25
    hair_count = int(np.count_nonzero(hair))
    hair_mean = float(np.mean(rgb_delta[hair])) if hair_count else 0.0
    changed_hair = _safe_ratio(float(np.count_nonzero((rgb_delta > 1) & hair)), float(hair_count), empty=0.0)
    if case.before.shape[2] == 4:
        alpha_delta = np.abs(after[..., 3] - before[..., 3])
        alpha_max = float(np.max(alpha_delta))
    else:
        alpha_max = 0.0
    edge_before = _texture_energy(case.before, case.hair_mask)
    edge_after = _texture_energy(case.after, case.hair_mask)
    edge_retention = float(np.clip(_safe_ratio(edge_after, edge_before), 0.0, 2.0))
    # High-frequency residual around a 3x3 box mean is a second, independent texture check.
    gray_before = _gray(case.before)
    gray_after = _gray(case.after)
    padded_before = np.pad(gray_before, 1, mode="edge")
    padded_after = np.pad(gray_after, 1, mode="edge")
    blur_before = sum(
        padded_before[dy : dy + gray_before.shape[0], dx : dx + gray_before.shape[1]]
        for dy in range(3)
        for dx in range(3)
    ) / 9.0
    blur_after = sum(
        padded_after[dy : dy + gray_after.shape[0], dx : dx + gray_after.shape[1]]
        for dy in range(3)
        for dx in range(3)
    ) / 9.0
    residual_before = np.abs(gray_before - blur_before)
    residual_after = np.abs(gray_after - blur_after)
    texture_before = _masked_mean(residual_before, case.hair_mask)
    texture_after = _masked_mean(residual_after, case.hair_mask)
    texture_retention = float(np.clip(_safe_ratio(texture_after, texture_before), 0.0, 2.0))
    curl_retention = _curl_similarity(case.before, case.after, case.curl_reference, case.hair_mask)
    return HairMetrics(
        outside_change_fraction=outside_fraction,
        outside_max_delta=outside_max,
        hair_mean_delta=hair_mean,
        alpha_max_delta=alpha_max,
        edge_retention=edge_retention,
        texture_retention=texture_retention,
        curl_retention=curl_retention,
        grey_timeline_monotone=_timeline_monotone(case.timeline_values),
        changed_hair_fraction=changed_hair,
    )


def _rules_for(feature_id: str) -> tuple[MetricRule, ...]:
    common = (
        MetricRule("outside_change_fraction", "max", 0.001, "Pixels outside the checked hair/scalp region remain unchanged."),
        MetricRule("outside_max_delta", "max", 1.0, "Any allowed outside-region numeric drift is at most one 8-bit level."),
        MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
        MetricRule("edge_retention", "min", 0.70, "Observed hair-edge energy is substantially retained."),
        MetricRule("texture_retention", "min", 0.65, "Observed local strand texture is substantially retained."),
    )
    if feature_id in {"W26", "W28", "W29", "W30", "W31", "W32", "W34", "W35", "W36", "W39"}:
        return common + (
            MetricRule("changed_hair_fraction", "min", 0.01, "A non-zero share of the intended hair region visibly changes."),
            MetricRule("curl_retention", "min", 0.70, "Curl/strand-frequency structure remains correlated with the source."),
        )
    if feature_id == "W33":
        return common + (
            MetricRule("grey_timeline_monotone", "eq", True, "The declared grey-transition timeline is monotone."),
        )
    if feature_id in {"W40", "W43", "W44"}:
        return common + (
            MetricRule("curl_retention", "min", 0.72, "Texture styling retains source curl-frequency structure."),
        )
    return common


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    for feature_id in registry_feature_ids():
        result.append(
            PassDefinition(
                id=f"r18b.hair.{feature_id.lower()}",
                group="hair_women",
                title=f"{feature_id} women's hair real-face acceptance",
                scope="Authorized local before/after pair with checked hair mask; no cloud upload.",
                rules=_rules_for(feature_id),
                required_evidence=("before", "after", "hair_mask"),
                notes=(
                    "Synthetic tests do not satisfy this definition.",
                    "Missing checked evidence remains not_tested.",
                    "W28/W39 are evaluated read-only through the colour-engine outputs; this module does not edit haircolour.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[str, PassDefinition]:
    return {definition.id.split(".")[-1].upper(): definition for definition in definitions()}


def input_sha256(case: HairCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.hair_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.feature_id.encode("ascii"))
    digest.update(case.hair_slice.encode("ascii"))
    digest.update(case.tone_slice.encode("ascii"))
    return digest.hexdigest()


def evaluate(case: HairCase, *, available_evidence: Iterable[str] = ("before", "after", "hair_mask")) -> EvidenceRecord:
    case.validate()
    definition = definition_map()[case.feature_id]
    available = set(available_evidence)
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


def slice_key(case: HairCase) -> str:
    return f"hair={case.hair_slice}|tone={case.tone_slice}"


def summarize(records: Sequence[tuple[HairCase, EvidenceRecord]]) -> dict[str, object]:
    expected = registry_feature_ids()
    per_feature: dict[str, dict[str, int]] = {
        feature_id: {"total": 0, "passed": 0, "failed": 0, "not_tested": 0} for feature_id in expected
    }
    per_slice: dict[str, dict[str, int]] = {}
    for case, record in records:
        record.validate()
        feature = case.feature_id
        per_feature[feature]["total"] += 1
        per_feature[feature][record.status] += 1
        key = slice_key(case)
        bucket = per_slice.setdefault(key, {"total": 0, "passed": 0, "failed": 0, "not_tested": 0})
        bucket["total"] += 1
        bucket[record.status] += 1
    tested_features = sum(1 for value in per_feature.values() if value["passed"] + value["failed"] > 0)
    ready = bool(records) and tested_features == len(expected) and all(
        value["failed"] == 0 and value["not_tested"] == 0 and value["passed"] > 0 for value in per_feature.values()
    )
    return {
        "family": "hair_women",
        "registry_feature_count": len(expected),
        "registry_features": expected,
        "cases": len(records),
        "tested_features": tested_features,
        "per_feature": per_feature,
        "per_slice": per_slice,
        "ready": ready,
    }
