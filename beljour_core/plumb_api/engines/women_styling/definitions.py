"""Preregistered R20c real-face evaluator contracts, owned by Lane C.

No runner, private image, demographic classifier or quality metric in Lane A
is modified. These contracts can later be called by an approved runner on a
consented, frozen sample set; passing synthetic fixtures is not face quality.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from .engine import PreviewEvidence
from .geometry import authorized_support, checked_frame, checked_masks
from .specs import FEATURE_SPECS


@dataclass(frozen=True, slots=True)
class PassDefinition:
    id: str
    feature_name: str
    target_regions: tuple[str, ...]
    should_change: str
    must_not_change: str
    outside_mask_changed_limit: int
    max_rgb_channel_delta: int
    max_alpha_changed: int
    provider_call_limit: int
    claimed_scope: str
    real_face_status: str


def definitions() -> tuple[PassDefinition, ...]:
    """Exactly one versioned definition for each published R20c W ID."""
    return tuple(
        PassDefinition(
            id=spec.id,
            feature_name=spec.name,
            target_regions=spec.regions,
            should_change=spec.promise,
            must_not_change=(
                "Pixels outside authorized supplied masks; alpha; image geometry; "
                "source buffers; private photo transmission. " + spec.non_promise
            ),
            outside_mask_changed_limit=0,
            max_rgb_channel_delta=spec.max_channel_delta,
            max_alpha_changed=0,
            provider_call_limit=0,
            claimed_scope=spec.reason,
            real_face_status="UNPROVEN; requires preregistered frozen real-face gate",
        )
        for spec in FEATURE_SPECS
    )


PASS_DEFINITIONS = definitions()
BY_FEATURE = {d.id: d for d in PASS_DEFINITIONS}
assert len(PASS_DEFINITIONS) == len(BY_FEATURE)


@dataclass(frozen=True, slots=True)
class Evaluation:
    feature_id: str
    accepted: bool
    failures: tuple[str, ...]
    support_pixels: int
    changed_pixels: int
    outside_changed: int
    max_channel_delta: int
    alpha_changed: int
    status: str = "SYNTHETIC_ONLY"


def evaluate_frame(
    feature_id: str,
    before: NDArray[np.uint8],
    after: NDArray[np.uint8],
    masks: Mapping[str, object],
    evidence: PreviewEvidence | None = None,
    *,
    require_effect: bool = True,
) -> Evaluation:
    """Recompute numerical invariants from pixels; never trust submitted metrics."""
    try:
        definition = BY_FEATURE[feature_id]
    except KeyError as exc:
        raise ValueError("Unregistered R20c evaluation feature") from exc
    spec = next(s for s in FEATURE_SPECS if s.id == feature_id)
    reference = checked_frame(before)
    output = checked_frame(after)
    if reference.shape != output.shape:
        raise ValueError("Reference and output dimensions differ")
    approved = checked_masks(masks, reference, spec)
    support = authorized_support(approved, spec)
    diff = output[..., :3].astype(np.int16) - reference[..., :3].astype(np.int16)
    changed = np.any(diff != 0, axis=2)
    max_delta = int(np.max(np.abs(diff)))
    outside = int(np.count_nonzero(changed & ~support))
    alpha = int(np.count_nonzero(output[..., 3] != reference[..., 3])) if reference.shape[2] == 4 else 0
    affected = int(np.count_nonzero(changed))
    failures: list[str] = []
    if outside > definition.outside_mask_changed_limit:
        failures.append("OUTSIDE_MASK_EDIT")
    if max_delta > definition.max_rgb_channel_delta:
        failures.append("CHANNEL_DELTA_EXCEEDED")
    if alpha > definition.max_alpha_changed:
        failures.append("ALPHA_MODIFIED")
    if require_effect and affected == 0:
        failures.append("NO_VISIBLE_EFFECT")
    if evidence is not None:
        if evidence.provider_calls > definition.provider_call_limit:
            failures.append("UNEXPECTED_PROVIDER_USE")
        if evidence.outside_mask_changed != outside or evidence.changed_pixels != affected:
            failures.append("EVIDENCE_MISMATCH")
        if not evidence.simulated:
            failures.append("SIMULATION_DISCLOSURE_MISSING")
    return Evaluation(
        feature_id=feature_id,
        accepted=not failures,
        failures=tuple(failures),
        support_pixels=int(np.count_nonzero(support)),
        changed_pixels=affected,
        outside_changed=outside,
        max_channel_delta=max_delta,
        alpha_changed=alpha,
    )
