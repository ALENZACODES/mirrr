"""R18B real-face evidence for gender full-look normal/extra/hyper. Author: John Khan."""
from __future__ import annotations

import hashlib
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from typing import Literal, cast

import numpy as np

from plumb_api.arena.r17b_evidence import EvidenceRecord, MetricRule, PassDefinition

Level = Literal["normal", "extra", "hyper"]
Direction = Literal["feminine", "masculine", "neutral"]
LEVELS: tuple[Level, ...] = ("normal", "extra", "hyper")


@dataclass(frozen=True)
class GenderCase:
    case_id: str
    level: Level
    direction: Direction
    before: np.ndarray
    after: np.ndarray
    face_mask: np.ndarray
    cheek_mask: np.ndarray
    identity_pin_mask: np.ndarray
    brow_mask: np.ndarray | None = None
    stubble_mask: np.ndarray | None = None
    notes: tuple[str, ...] = ()

    def validate(self) -> None:
        if not self.case_id.strip():
            raise ValueError("case_id required")
        if self.level not in LEVELS:
            raise ValueError("unsupported level")
        if self.direction not in {"feminine", "masculine", "neutral"}:
            raise ValueError("unsupported direction")
        if self.before.dtype != np.uint8 or self.after.dtype != np.uint8:
            raise ValueError("images must be uint8")
        if self.before.shape != self.after.shape or self.before.ndim != 3 or self.before.shape[2] not in (3, 4):
            raise ValueError("image shape mismatch")
        for name, mask in (
            ("face_mask", self.face_mask),
            ("cheek_mask", self.cheek_mask),
            ("identity_pin_mask", self.identity_pin_mask),
            ("brow_mask", self.brow_mask),
            ("stubble_mask", self.stubble_mask),
        ):
            if mask is None:
                continue
            if mask.shape != self.before.shape[:2]:
                raise ValueError(f"{name} shape mismatch")
            if not np.all(np.isfinite(mask)) or np.any(mask < 0) or np.any(mask > 1):
                raise ValueError(f"{name} must be finite 0..1")


@dataclass(frozen=True)
class GenderMetrics:
    outside_face_change_fraction: float
    identity_pin_max_delta: float
    cheek_delta_e_proxy: float
    alpha_max_delta: float
    brow_mean_delta: float
    stubble_mean_delta: float
    changed_face_fraction: float

    def mapping(self) -> dict[str, float | bool]:
        return {
            "outside_face_change_fraction": self.outside_face_change_fraction,
            "identity_pin_max_delta": self.identity_pin_max_delta,
            "cheek_delta_e_proxy": self.cheek_delta_e_proxy,
            "alpha_max_delta": self.alpha_max_delta,
            "brow_mean_delta": self.brow_mean_delta,
            "stubble_mean_delta": self.stubble_mean_delta,
            "changed_face_fraction": self.changed_face_fraction,
        }


def _mean_rgb_distance(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    active = mask > 0.25
    if not np.any(active):
        return 0.0
    left = before[..., :3][active].astype(np.float64).mean(axis=0)
    right = after[..., :3][active].astype(np.float64).mean(axis=0)
    return float(np.linalg.norm(right - left) / np.sqrt(3.0))


def _mean_delta(delta: np.ndarray, mask: np.ndarray | None) -> float:
    if mask is None:
        return 0.0
    active = mask > 0.25
    return float(np.mean(delta[active])) if np.any(active) else 0.0


def measure(case: GenderCase) -> GenderMetrics:
    case.validate()
    before = case.before[..., :3].astype(np.int16)
    after = case.after[..., :3].astype(np.int16)
    delta = np.max(np.abs(after - before), axis=2)
    outside = case.face_mask <= 0.01
    outside_fraction = float(np.count_nonzero((delta > 1) & outside)) / float(np.count_nonzero(outside)) if np.any(outside) else 0.0
    pin = case.identity_pin_mask > 0.25
    pin_max = float(np.max(delta[pin])) if np.any(pin) else 0.0
    alpha_max = 0.0
    if case.before.shape[2] == 4:
        alpha_max = float(np.max(np.abs(case.after[..., 3].astype(np.int16) - case.before[..., 3].astype(np.int16))))
    face = case.face_mask > 0.25
    changed_face = float(np.count_nonzero((delta > 1) & face)) / float(np.count_nonzero(face)) if np.any(face) else 0.0
    return GenderMetrics(
        outside_face_change_fraction=outside_fraction,
        identity_pin_max_delta=pin_max,
        cheek_delta_e_proxy=_mean_rgb_distance(case.before, case.after, case.cheek_mask),
        alpha_max_delta=alpha_max,
        brow_mean_delta=_mean_delta(delta, case.brow_mask),
        stubble_mean_delta=_mean_delta(delta, case.stubble_mask),
        changed_face_fraction=changed_face,
    )


def definitions() -> tuple[PassDefinition, ...]:
    result: list[PassDefinition] = []
    minimum_change = {"normal": 0.002, "extra": 0.004, "hyper": 0.006}
    for level in LEVELS:
        result.append(
            PassDefinition(
                id=f"r18b.gender.{level}",
                group="gender_look",
                title=f"Gender full-look {level} real-face acceptance",
                scope="Authorized local before/after pair with checked face, cheek and identity-pin masks.",
                rules=(
                    MetricRule("outside_face_change_fraction", "max", 0.001, "Pixels outside the checked face region remain unchanged."),
                    MetricRule("identity_pin_max_delta", "max", 1.0, "Identity-pinned pixels remain unchanged to one 8-bit level."),
                    MetricRule("cheek_delta_e_proxy", "max", 4.0, "Cheek colour remains within the declared <=4 proxy bound."),
                    MetricRule("alpha_max_delta", "max", 0.0, "Alpha is preserved exactly."),
                    MetricRule(
                        "changed_face_fraction",
                        "min",
                        minimum_change[level],
                        "A non-zero look changes a measurable part of the intended face region.",
                    ),
                ),
                required_evidence=("before", "after", "face_mask", "cheek_mask", "identity_pin_mask"),
                notes=(
                    "Direction is a styling control, not a claim about the person's gender identity.",
                    "Missing checked evidence remains not_tested.",
                ),
            )
        )
    return tuple(result)


def definition_map() -> dict[Level, PassDefinition]:
    return cast(dict[Level, PassDefinition], {item.id.rsplit(".", 1)[-1]: item for item in definitions()})


def input_sha256(case: GenderCase) -> str:
    case.validate()
    digest = hashlib.sha256()
    for array in (case.before, case.after, case.face_mask, case.cheek_mask, case.identity_pin_mask):
        raw = np.ascontiguousarray(array).tobytes()
        digest.update(len(raw).to_bytes(8, "big"))
        digest.update(raw)
    digest.update(case.level.encode("ascii"))
    digest.update(case.direction.encode("ascii"))
    return digest.hexdigest()


def evaluate(case: GenderCase, *, available_evidence: Iterable[str] | None = None) -> EvidenceRecord:
    case.validate()
    definition = next(item for item in definitions() if item.id.endswith(case.level))
    available = set(available_evidence or definition.required_evidence)
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


def summarize(records: Sequence[tuple[GenderCase, EvidenceRecord]]) -> dict[str, object]:
    counts = {level: {"passed": 0, "failed": 0, "not_tested": 0} for level in LEVELS}
    by_direction = {direction: {"passed": 0, "failed": 0, "not_tested": 0} for direction in ("feminine", "masculine", "neutral")}
    for case, record in records:
        record.validate()
        counts[case.level][record.status] += 1
        by_direction[case.direction][record.status] += 1
    complete = sum(1 for item in counts.values() if item["passed"] > 0 and item["failed"] == 0 and item["not_tested"] == 0)
    return {
        "family": "gender_look",
        "registry_feature_count": len(LEVELS),
        "registry_features": LEVELS,
        "cases": len(records),
        "complete_levels": complete,
        "per_level": counts,
        "per_direction": by_direction,
        "ready": bool(records) and complete == len(LEVELS),
    }
