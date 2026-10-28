"""R17B release-evidence ledger; consumes results but never runs Lane A gates. Author: John Khan.

This module intentionally does not implement the frozen real-face runner, quality
metrics, locks, or release infrastructure owned by Lane A. It records externally
supplied gate outcomes and makes conservative decisions: missing evidence is a
block, synthetic evidence is never promoted to real-face evidence, and the
100,000-face requirement can only be represented as satisfied when the supplied
count and pass count both meet that exact minimum.
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from dataclasses import asdict, dataclass
from typing import Literal

from .r17b_definitions import DEFINITIONS
from .r17b_evidence import GroupSummary, definitions_fingerprint

GateStatus = Literal["passed", "failed", "unavailable"]
Decision = Literal["blocked", "development_verified", "release_candidate"]
_REQUIRED_STATIC_GATES = ("mypy", "ruff", "api", "web", "parity", "browser_acceptance")
_REQUIRED_GROUPS = ("hair_women", "makeup_w", "workflow_w", "upscale", "gender_look", "shave")
_FROZEN_MINIMUM = 100_000


def _clean_text(value: str, name: str, *, allow_empty: bool = False) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{name} must be text")
    text = value.strip()
    if not allow_empty and not text:
        raise ValueError(f"{name} cannot be empty")
    if len(text) > 240 or any(ord(char) < 32 and char not in "\t\n" for char in text):
        raise ValueError(f"{name} is unsafe")
    return text


def _hash(value: str, name: str) -> str:
    if len(value) != 64 or any(char not in "0123456789abcdef" for char in value):
        raise ValueError(f"{name} must be lowercase sha256")
    return value


@dataclass(frozen=True)
class GateResult:
    name: str
    status: GateStatus
    detail: str = ""

    def validate(self) -> None:
        _clean_text(self.name, "gate name")
        _clean_text(self.detail, "gate detail", allow_empty=True)
        if self.status not in {"passed", "failed", "unavailable"}:
            raise ValueError("invalid gate status")


@dataclass(frozen=True)
class FrozenEvidence:
    cases: int
    passed: int
    failed: int
    locked: bool
    lock_sha256: str | None = None

    def validate(self) -> None:
        if self.cases < 0 or self.passed < 0 or self.failed < 0:
            raise ValueError("frozen evidence counts must be non-negative")
        if self.passed + self.failed != self.cases:
            raise ValueError("frozen evidence counts do not add up")
        if self.locked:
            if self.lock_sha256 is None:
                raise ValueError("locked frozen evidence requires lock hash")
            _hash(self.lock_sha256, "frozen lock hash")
        elif self.lock_sha256 is not None:
            raise ValueError("unlocked evidence cannot claim a lock hash")

    @property
    def ready(self) -> bool:
        self.validate()
        return self.locked and self.cases >= _FROZEN_MINIMUM and self.failed == 0 and self.passed == self.cases


@dataclass(frozen=True)
class ParityEvidence:
    max_byte_error: int
    vectors: int
    engines: tuple[str, ...]

    def validate(self) -> None:
        if not 0 <= self.max_byte_error <= 255:
            raise ValueError("parity byte error must be in 0..255")
        if self.vectors < 1:
            raise ValueError("parity requires at least one vector")
        if not self.engines or len(set(self.engines)) != len(self.engines):
            raise ValueError("parity engine names must be non-empty and unique")
        for engine in self.engines:
            _clean_text(engine, "parity engine")

    @property
    def passed(self) -> bool:
        self.validate()
        return self.max_byte_error <= 1


@dataclass(frozen=True)
class ReleaseAssessment:
    decision: Decision
    static_ready: bool
    parity_ready: bool
    group_evidence_ready: bool
    frozen_ready: bool
    blockers: tuple[str, ...]
    definitions_sha256: str
    audit_sha256: str

    def validate(self) -> None:
        if self.decision not in {"blocked", "development_verified", "release_candidate"}:
            raise ValueError("invalid release decision")
        _hash(self.definitions_sha256, "definitions hash")
        _hash(self.audit_sha256, "audit hash")
        if self.decision == "release_candidate" and not all(
            (self.static_ready, self.parity_ready, self.group_evidence_ready, self.frozen_ready)
        ):
            raise ValueError("release candidate requires every release condition")
        if self.decision == "development_verified" and not (self.static_ready and self.parity_ready):
            raise ValueError("development verification requires static and parity gates")
        if self.decision != "blocked" and any(blocker.startswith("static:") for blocker in self.blockers):
            raise ValueError("non-blocked decision cannot retain static blocker")


def _gate_map(gates: Sequence[GateResult]) -> dict[str, GateResult]:
    result: dict[str, GateResult] = {}
    for gate in gates:
        gate.validate()
        if gate.name in result:
            raise ValueError(f"duplicate gate: {gate.name}")
        result[gate.name] = gate
    return result


def _group_map(groups: Sequence[GroupSummary]) -> dict[str, GroupSummary]:
    result: dict[str, GroupSummary] = {}
    for group in groups:
        group.validate()
        if group.group in result:
            raise ValueError(f"duplicate group summary: {group.group}")
        result[group.group] = group
    return result


def assess_release(
    *,
    gates: Sequence[GateResult],
    parity: ParityEvidence,
    groups: Sequence[GroupSummary],
    frozen: FrozenEvidence,
    definitions_sha256: str | None = None,
) -> ReleaseAssessment:
    """Conservatively combine externally measured R17B evidence.

    `release_candidate` is deliberately only a bookkeeping state. It does not
    publish, unlock, deploy, or replace the Lane A release decision.
    """

    expected_definitions = definitions_fingerprint(DEFINITIONS)
    supplied_definitions = expected_definitions if definitions_sha256 is None else _hash(definitions_sha256, "definitions hash")
    gate_map = _gate_map(gates)
    group_map = _group_map(groups)
    parity.validate()
    frozen.validate()

    blockers: list[str] = []
    for name in _REQUIRED_STATIC_GATES:
        result = gate_map.get(name)
        if result is None:
            blockers.append(f"static:{name}:missing")
        elif result.status != "passed":
            blockers.append(f"static:{name}:{result.status}")
    static_ready = not any(item.startswith("static:") for item in blockers)

    parity_ready = parity.passed
    if not parity_ready:
        blockers.append(f"parity:max_byte_error={parity.max_byte_error}")

    if supplied_definitions != expected_definitions:
        blockers.append("definitions:fingerprint_mismatch")

    for name in _REQUIRED_GROUPS:
        summary = group_map.get(name)
        if summary is None:
            blockers.append(f"evidence:{name}:missing")
        elif not summary.ready:
            blockers.append(f"evidence:{name}:not_ready")
    group_ready = not any(item.startswith("evidence:") for item in blockers)

    frozen_ready = frozen.ready
    if not frozen_ready:
        if not frozen.locked:
            blockers.append("frozen:not_locked")
        if frozen.cases < _FROZEN_MINIMUM:
            blockers.append(f"frozen:cases={frozen.cases}<{_FROZEN_MINIMUM}")
        if frozen.failed:
            blockers.append(f"frozen:failed={frozen.failed}")

    if static_ready and parity_ready and group_ready and frozen_ready and supplied_definitions == expected_definitions:
        decision: Decision = "release_candidate"
    elif static_ready and parity_ready and supplied_definitions == expected_definitions:
        decision = "development_verified"
    else:
        decision = "blocked"

    audit_payload = {
        "decision": decision,
        "static_ready": static_ready,
        "parity_ready": parity_ready,
        "group_evidence_ready": group_ready,
        "frozen_ready": frozen_ready,
        "blockers": blockers,
        "definitions_sha256": supplied_definitions,
        "gates": [asdict(gate_map[key]) for key in sorted(gate_map)],
        "parity": asdict(parity),
        "groups": [asdict(group_map[key]) for key in sorted(group_map)],
        "frozen": asdict(frozen),
        "author": "John Khan",
        "claim": "bookkeeping only; no release or superiority claim",
    }
    canonical = json.dumps(audit_payload, sort_keys=True, separators=(",", ":"))
    assessment = ReleaseAssessment(
        decision=decision,
        static_ready=static_ready,
        parity_ready=parity_ready,
        group_evidence_ready=group_ready,
        frozen_ready=frozen_ready,
        blockers=tuple(blockers),
        definitions_sha256=supplied_definitions,
        audit_sha256=hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
    )
    assessment.validate()
    return assessment


def synthetic_development_assessment() -> ReleaseAssessment:
    """Return an explicitly non-release synthetic example for local diagnostics."""

    gates = [GateResult(name, "passed", "synthetic/local gate example") for name in _REQUIRED_STATIC_GATES]
    parity = ParityEvidence(1, 1, tuple(_REQUIRED_GROUPS))
    groups = [
        GroupSummary(name, 1, 0, 0, 0, 1, False, (definitions_fingerprint(DEFINITIONS),))
        for name in _REQUIRED_GROUPS
    ]
    frozen = FrozenEvidence(0, 0, 0, False)
    return assess_release(gates=gates, parity=parity, groups=groups, frozen=frozen)
