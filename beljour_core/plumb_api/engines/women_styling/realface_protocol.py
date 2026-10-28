"""R21c Lane C preregistered *unrun* real-face acceptance protocol.

This file owns no photographs and does not read, select, classify or annotate
any person's face. A separately authorized, consented evaluator must supply
only aggregate-safe metrics. The frozen dataset is independent of these tests
and needs an immutable manifest in the Lane A runner (which this module never
edits). This code cannot mark a feature released using synthetic fixtures.

Author: John Khan.
"""
from __future__ import annotations

import json
from collections import Counter
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .specs import FEATURE_SPECS, FeatureSpec

Domain = Literal["women", "menshair", "commerce"]
GateState = Literal["UNPROVEN", "FAIL", "PASS"]
GenderGroup = Literal["female", "male", "nonbinary", "self_described", "withheld"]
AgeGroup = Literal["10-19", "20-29", "30-39", "40-59", "60+"]

FROZEN_FACE_COUNT = 100_000
MIN_GROUP_FACES = 20
MIN_HUMAN_AGREEMENT = 0.95
MIN_SUCCESS_RATE = 0.95
MAX_OUTSIDE_CHANGED = 0
MAX_ALPHA_CHANGED = 0


@dataclass(frozen=True, slots=True)
class FeatureGate:
    """Immutable acceptance definition with an auditable domain and owner."""

    id: str
    domain: Domain
    name: str
    owner: str
    required_mask: tuple[str, ...]
    must_change: str
    must_not_change: str
    max_channel_delta: int
    outside_mask_pixels: int = MAX_OUTSIDE_CHANGED
    alpha_changed_pixels: int = MAX_ALPHA_CHANGED
    require_visible_change: bool = True
    human_comparison_required: bool = True
    real_face_status: GateState = "UNPROVEN"

    def validate(self) -> None:
        if not self.id or not self.name or self.owner != "John Khan":
            raise ValueError("An owned, named feature is required")
        if not self.required_mask or len(self.required_mask) != len(set(self.required_mask)):
            raise ValueError("Gate requires distinct explicit mask regions")
        if not 0 <= self.max_channel_delta <= 255:
            raise ValueError("Invalid channel-delta limit")
        if self.outside_mask_pixels != 0 or self.alpha_changed_pixels != 0:
            raise ValueError("Mask and alpha exceptions cannot be authorized")
        if self.real_face_status != "UNPROVEN":
            raise ValueError("Unrun real-face gate must be UNPROVEN")


@dataclass(frozen=True, slots=True)
class PixelEvidence:
    """Image-free record from a separate evaluator; never an image or identity."""

    feature_id: str
    mask_pixel_count: int
    edited_pixel_count: int
    outside_mask_changed: int
    alpha_pixels_changed: int
    max_channel_delta: int
    original_preserved: bool
    simulation_disclosed: bool
    provider_calls: int
    face_consented: bool
    synthetic: bool
    human_accepted: bool | None

    def validate(self) -> None:
        numeric = (
            self.mask_pixel_count,
            self.edited_pixel_count,
            self.outside_mask_changed,
            self.alpha_pixels_changed,
            self.max_channel_delta,
            self.provider_calls,
        )
        if any(type(v) is not int or v < 0 for v in numeric):
            raise ValueError("Pixel statistics must be nonnegative integers")
        for value in (
            self.original_preserved,
            self.simulation_disclosed,
            self.face_consented,
            self.synthetic,
        ):
            if type(value) is not bool:
                raise ValueError("Status flags must be booleans")
        if self.human_accepted is not None and type(self.human_accepted) is not bool:
            raise ValueError("Human-review flag must be an explicit boolean")


@dataclass(frozen=True, slots=True)
class PixelVerdict:
    feature_id: str
    technical_pass: bool
    human_pass: bool | None
    faults: tuple[str, ...]
    evidence_kind: str


def score_pixel_evidence(gate: FeatureGate, row: PixelEvidence) -> PixelVerdict:
    """Use only validated numbers; no blurred or cropped mask exception."""
    gate.validate()
    row.validate()
    if row.feature_id != gate.id:
        raise ValueError("Pixel evidence refers to a different feature")
    faults: list[str] = []
    if row.mask_pixel_count <= 0:
        faults.append("MISSING_REGION_MASK")
    if gate.require_visible_change and row.edited_pixel_count <= 0:
        faults.append("NO_VISIBLE_EFFECT")
    if row.outside_mask_changed > gate.outside_mask_pixels:
        faults.append("OUTSIDE_MASK_EDIT")
    if row.alpha_pixels_changed > gate.alpha_changed_pixels:
        faults.append("ALPHA_EDIT")
    if row.max_channel_delta > gate.max_channel_delta:
        faults.append("CHANNEL_LIMIT")
    if not row.original_preserved:
        faults.append("ORIGINAL_BUFFER_CHANGED")
    if not row.simulation_disclosed:
        faults.append("DISCLOSURE_MISSING")
    if row.provider_calls > 0 and gate.domain != "commerce":
        faults.append("UNAUTHORIZED_PROVIDER")
    if not row.synthetic and not row.face_consented:
        faults.append("CONSENT_MISSING")
    return PixelVerdict(
        feature_id=gate.id,
        technical_pass=not faults,
        human_pass=row.human_accepted,
        faults=tuple(faults),
        evidence_kind="SYNTHETIC" if row.synthetic else "REAL_FACE_MEASUREMENT",
    )


@dataclass(frozen=True, slots=True)
class SliceLabel:
    """Metadata is recorded by a consented evaluator, never inferred here."""

    monk_tone: int
    gender: GenderGroup
    age: AgeGroup

    def validate(self) -> None:
        if type(self.monk_tone) is not int or not 1 <= self.monk_tone <= 10:
            raise ValueError("All ten numerical tone groups must be represented")
        if self.gender not in ("female", "male", "nonbinary", "self_described", "withheld"):
            raise ValueError("Unsupported voluntary gender stratum")
        if self.age not in ("10-19", "20-29", "30-39", "40-59", "60+"):
            raise ValueError("Unsupported age stratum")

    def key(self) -> str:
        self.validate()
        return f"tone-{self.monk_tone}/{self.gender}/{self.age}"


@dataclass(frozen=True, slots=True)
class RealFaceObservation:
    """No image, filename, hash, email, identifier, landmarks or measurements."""

    group: SliceLabel
    row: PixelEvidence


@dataclass(frozen=True, slots=True)
class GateSummary:
    feature_id: str
    state: GateState
    total_real_faces: int
    overall_success_rate: float | None
    slice_rates: Mapping[str, float]
    failures: tuple[str, ...]


def evaluate_real_face_gate(
    gate: FeatureGate,
    observations: Iterable[RealFaceObservation],
    *,
    expected_frozen_sha256: str | None,
    reviewed_real_face_manifest: bool,
) -> GateSummary:
    """Never pass synthetic samples, incomplete coverage or unfrozen images.

    Group coverage means every nonempty tone/gender/age slice is reported,
    with at least MIN_GROUP_FACES each. This is a technical baseline, not a
    demographic fairness certification, and it cannot replace human review.
    """
    gate.validate()
    if (
        expected_frozen_sha256 is None
        or len(expected_frozen_sha256) != 64
        or not all(ch in "0123456789abcdef" for ch in expected_frozen_sha256)
        or not reviewed_real_face_manifest
    ):
        return GateSummary(gate.id, "UNPROVEN", 0, None, {}, ("FROZEN_SET_UNAVAILABLE",))

    counts: Counter[str] = Counter()
    successes: Counter[str] = Counter()
    accepted = 0
    total = 0
    reasons: set[str] = set()
    for observation in observations:
        observation.group.validate()
        if observation.row.feature_id != gate.id:
            raise ValueError("Mixed feature observations cannot be evaluated together")
        if observation.row.synthetic:
            reasons.add("SYNTHETIC_NOT_REAL_FACE")
            continue
        verdict = score_pixel_evidence(gate, observation.row)
        label = observation.group.key()
        total += 1
        counts[label] += 1
        if verdict.technical_pass and verdict.human_pass is True:
            accepted += 1
            successes[label] += 1
        if verdict.human_pass is None:
            reasons.add("HUMAN_REVIEW_REQUIRED")
        reasons.update(verdict.faults)
    if total < FROZEN_FACE_COUNT:
        reasons.add("INSUFFICIENT_FROZEN_FACES")
    rates = {label: successes[label] / count for label, count in sorted(counts.items())}
    if not rates:
        reasons.add("NO_REAL_FACE_SLICES")
    if any(count < MIN_GROUP_FACES for count in counts.values()):
        reasons.add("SLICE_UNDERSAMPLED")
    if len({int(k.split('/')[0][5:]) for k in counts}) != 10:
        reasons.add("MISSING_TONE_GROUPS")
    if any(rate < MIN_SUCCESS_RATE for rate in rates.values()):
        reasons.add("SLICE_QUALITY_BELOW_THRESHOLD")
    fraction = accepted / total if total else None
    if fraction is None or fraction < MIN_SUCCESS_RATE:
        reasons.add("OVERALL_QUALITY_BELOW_THRESHOLD")
    if accepted == 0:
        reasons.add("HUMAN_ACCEPTANCE_MISSING")
    state: GateState = "PASS" if not reasons else "FAIL"
    return GateSummary(gate.id, state, total, fraction, rates, tuple(sorted(reasons)))


def women_gates() -> tuple[FeatureGate, ...]:
    """One contract per W feature, preserving its independently bounded delta."""
    return tuple(_gate_for_women(spec) for spec in FEATURE_SPECS)


def _gate_for_women(spec: FeatureSpec) -> FeatureGate:
    return FeatureGate(
        id=spec.id,
        domain="women",
        name=spec.name,
        owner="John Khan",
        required_mask=spec.regions,
        must_change=spec.promise,
        must_not_change=spec.non_promise + " All alpha/outside-mask pixels unchanged.",
        max_channel_delta=spec.max_channel_delta,
    )


def menshair_gates() -> tuple[FeatureGate, ...]:
    """One reference contract per authored preset; no generated parity dump."""
    path = Path(__file__).resolve().parents[1] / "menshair" / "presets.json"
    raw: object = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or not isinstance(raw.get("styles"), list):
        raise ValueError("Missing authored menshair preset catalogue")
    styles: list[object] = raw["styles"]
    gates: list[FeatureGate] = []
    for item in styles:
        if not isinstance(item, dict):
            raise ValueError("Malformed hairstyle registry entry")
        style_id = item.get("id")
        name = item.get("name")
        if not isinstance(style_id, str) or not style_id.startswith("local-"):
            raise ValueError("Unregistered hairstyle identifier")
        if not isinstance(name, str) or not name:
            raise ValueError("Unlabelled hairstyle")
        gates.append(FeatureGate(
            id=f"menshair:{style_id}",
            domain="menshair",
            name=name,
            owner="John Khan",
            required_mask=("hair", "scalp"),
            must_change="Tonal short-side or length appearance inside approved hair pixels.",
            must_not_change="No generated strands, face edits, alpha edits or photo uploads.",
            max_channel_delta=255,
        ))
    if len(gates) != len({gate.id for gate in gates}):
        raise ValueError("Duplicated published hairstyle identifiers")
    return tuple(gates)


def commerce_gates() -> tuple[FeatureGate, ...]:
    """Matching, composite preview and sample shortlist are distinct flows."""
    return (
        FeatureGate(
            id="commerce:match",
            domain="commerce",
            name="Cosmetic sample shade matching",
            owner="John Khan",
            required_mask=("selected-swatch",),
            must_change="Reproducible mock product ranking from approved local signals.",
            must_not_change="No real brand equivalence or inferred medical condition.",
            max_channel_delta=0,
            require_visible_change=False,
        ),
        FeatureGate(
            id="commerce:composite",
            domain="commerce",
            name="Three-item cosmetic composite preview",
            owner="John Khan",
            required_mask=("face", "lips", "cheek"),
            must_change="Local display RGB only, consent-gated network through one provider.",
            must_not_change="No image upload without affirmative, fresh consent.",
            max_channel_delta=255,
        ),
        FeatureGate(
            id="commerce:shortlist",
            domain="commerce",
            name="Fictional eCommerce sample shortlist",
            owner="John Khan",
            required_mask=("selected-swatch",),
            must_change="Deterministic budget/category/shade ranking; no checkout.",
            must_not_change="No hidden vendor call, invented availability or real price claim.",
            max_channel_delta=0,
            require_visible_change=False,
        ),
    )


def all_lane_c_gates() -> tuple[FeatureGate, ...]:
    """Ordered, immutable, duplicate-free audit across every Lane C feature."""
    items = (*women_gates(), *menshair_gates(), *commerce_gates())
    if len(items) != len({gate.id for gate in items}):
        raise ValueError("Duplicate Lane C feature gate")
    for gate in items:
        gate.validate()
    return items
