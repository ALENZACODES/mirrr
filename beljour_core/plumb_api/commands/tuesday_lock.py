"""Portable Tuesday five-command technical lock dossier, not a release pass.

The packet has exactly 205 named rows, retains every missing or failed
observation, and excludes images, face hashes, embeddings and filesystem paths.
A checksum detects accidental packet corruption; it is not a signature.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
from dataclasses import dataclass
from typing import Literal, cast

from .errors import CommandValidationError
from .lock_matrix import COMMANDS, LEVELS, LockMatrixReport, LockObservation, evaluate_command_locks
from .types import CommandName

PACKET_VERSION = "beljour-tuesday-command-lock/1"
LockRowStatus = Literal["missing", "failed_safety", "over_budget", "synthetic_checked", "device_checked"]
_RUN_ID = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$")
_HEX = re.compile(r"^[a-f0-9]{64}$")


@dataclass(frozen=True, slots=True)
class TuesdayRow:
    command: CommandName
    level_tenths: int
    status: LockRowStatus
    preview_ms: float | None
    export_ms: float | None
    identity_applied: bool | None
    alpha_unchanged: bool | None
    protected_unchanged: bool | None
    neutral_correct: bool | None
    skin_lift_l: float | None
    pose_minimum_jacobian: float | None
    pose_retention: float | None
    measured_device: bool | None

    def public_metadata(self) -> dict[str, object]:
        return {
            "command": self.command.value,
            "level_tenths": self.level_tenths,
            "status": self.status,
            "preview_ms": self.preview_ms,
            "export_ms": self.export_ms,
            "identity_applied": self.identity_applied,
            "alpha_unchanged": self.alpha_unchanged,
            "protected_unchanged": self.protected_unchanged,
            "neutral_correct": self.neutral_correct,
            "skin_lift_l": self.skin_lift_l,
            "pose_minimum_jacobian": self.pose_minimum_jacobian,
            "pose_retention": self.pose_retention,
            "measured_device": self.measured_device,
        }


@dataclass(frozen=True, slots=True)
class TuesdayLockPacket:
    """Immutable evidence summary with no user-submitted strings except run ids."""

    run_id: str
    renderer_build: str
    matrix: LockMatrixReport
    rows: tuple[TuesdayRow, ...]
    blockers: tuple[str, ...]

    @property
    def technical_status(self) -> str:
        if any(row.status in ("failed_safety", "over_budget") for row in self.rows):
            return "blocked"
        if any(row.status == "missing" for row in self.rows):
            return "incomplete"
        return "technical_review_required"

    def payload(self) -> dict[str, object]:
        return {
            "version": PACKET_VERSION,
            "run_id": self.run_id,
            "renderer_build": self.renderer_build,
            "level_count": len(LEVELS),
            "command_count": len(COMMANDS),
            "total_slots": len(COMMANDS) * len(LEVELS),
            "technical_status": self.technical_status,
            "matrix": self.matrix.public_metadata(),
            "rows": [row.public_metadata() for row in self.rows],
            "blockers": list(self.blockers),
            "independent_realface_result": "NOT_RUN",
            "production_identity_qualified": False,
            "release_qualified": False,
        }

    def to_json(self) -> str:
        content = self.payload()
        content["sha256"] = _digest(content)
        return _canonical(content)


def _canonical(payload: dict[str, object]) -> str:
    return json.dumps(payload, sort_keys=True, ensure_ascii=True, allow_nan=False, separators=(",", ":"))


def _digest(payload: dict[str, object]) -> str:
    return hashlib.sha256(_canonical(payload).encode("utf-8")).hexdigest()


def _identifier(value: str) -> str:
    if not isinstance(value, str) or _RUN_ID.fullmatch(value) is None:
        raise CommandValidationError(
            "invalid_lock_packet",
            "Only short, non-sensitive run identifiers are accepted.",
        )
    return value


def _observation_status(
    observation: LockObservation | None,
    failed: bool,
    timing_failed: bool,
) -> LockRowStatus:
    if observation is None:
        return "missing"
    if failed:
        return "failed_safety"
    if timing_failed:
        return "over_budget"
    return "device_checked" if observation.measured_device else "synthetic_checked"


def _row(
    command: CommandName,
    level: int,
    observation: LockObservation | None,
    failed: bool,
    timing_failed: bool,
) -> TuesdayRow:
    return TuesdayRow(
        command,
        level,
        _observation_status(observation, failed, timing_failed),
        None if observation is None else observation.preview_ms,
        None if observation is None else observation.export_ms,
        None if observation is None else observation.identity_applied,
        None if observation is None else observation.alpha_unchanged,
        None if observation is None else observation.protected_unchanged,
        None if observation is None else observation.neutral_correct,
        None if observation is None else observation.skin_lift_l,
        None if observation is None else observation.pose_minimum_jacobian,
        None if observation is None else observation.pose_retention,
        None if observation is None else observation.measured_device,
    )


def build_tuesday_lock_packet(
    observations: tuple[LockObservation, ...],
    *,
    run_id: str,
    renderer_build: str,
    preview_budget_ms: float = 100.0,
    export_budget_ms: float = 2000.0,
) -> TuesdayLockPacket:
    """Never fills missing levels, and never treats technical results as release."""
    _identifier(run_id)
    _identifier(renderer_build)
    report = evaluate_command_locks(
        observations,
        preview_budget_ms=preview_budget_ms,
        export_budget_ms=export_budget_ms,
    )
    lookup = {(row.command, row.level_tenths): row for row in observations}
    if len(lookup) != len(observations):
        raise CommandValidationError(
            "duplicate_lock_evidence",
            "Tuesday packet refuses duplicate evidence rows.",
        )
    rows: list[TuesdayRow] = []
    blockers: list[str] = []
    for finding in report.findings:
        command = finding.command
        failed = set(finding.failed_levels)
        slow = set(finding.timing_limited_levels)
        missing = set(finding.missing_levels)
        if missing:
            blockers.append(f"{command.value}:missing:{len(missing)}")
        if failed:
            blockers.append(f"{command.value}:safety:{len(failed)}")
        if slow:
            blockers.append(f"{command.value}:timing:{len(slow)}")
        for level in LEVELS:
            rows.append(
                _row(command, level, lookup.get((command, level)),
                     level in failed, level in slow)
            )
    if len(rows) != 205:
        raise CommandValidationError("invalid_lock_packet", "Exactly 205 slots must be represented.")
    return TuesdayLockPacket(run_id, renderer_build, report, tuple(rows), tuple(blockers))


def _dict(value: object, *, keys: frozenset[str]) -> dict[str, object]:
    if not isinstance(value, dict) or any(not isinstance(key, str) for key in value):
        raise CommandValidationError("invalid_lock_packet", "Lock packet must be a JSON object.")
    typed = cast(dict[str, object], value)
    if frozenset(typed) != keys:
        raise CommandValidationError("invalid_lock_packet", "Lock packet has missing or unknown fields.")
    return typed


def _numeric(value: object) -> float:
    if type(value) not in (int, float) or not math.isfinite(cast(float, value)):
        raise CommandValidationError(
            "invalid_lock_packet",
            "Nonfinite or nonnumeric measurement is refused.",
        )
    return float(cast(float, value))


def verify_tuesday_lock_json(contents: str) -> dict[str, object]:
    """Reject damaged/unexpected packets before a reviewer sees any score.

    SHA-256 detects corruption. This method is not cryptographic attestation and
    cannot prove that observations were made on real people or devices.
    """
    if not isinstance(contents, str) or len(contents) > 250_000:
        raise CommandValidationError("invalid_lock_packet", "Lock packet is absent or too large.")
    try:
        parsed = json.loads(contents)
    except (ValueError, TypeError) as exc:
        raise CommandValidationError("invalid_lock_packet", "Lock packet JSON is malformed.") from exc
    expected = frozenset({
        "version", "run_id", "renderer_build", "level_count", "command_count",
        "total_slots", "technical_status", "matrix", "rows", "blockers",
        "independent_realface_result", "production_identity_qualified",
        "release_qualified", "sha256",
    })
    record = _dict(parsed, keys=expected)
    signature = record.pop("sha256")
    if (
        not isinstance(signature, str)
        or _HEX.fullmatch(signature) is None
        or signature != _digest(record)
    ):
        raise CommandValidationError("invalid_lock_packet", "Lock packet checksum mismatch.")
    if (record["version"] != PACKET_VERSION or record["level_count"] != 41
            or record["command_count"] != 5 or record["total_slots"] != 205
            or record["release_qualified"] is not False
            or record["production_identity_qualified"] is not False
            or record["independent_realface_result"] != "NOT_RUN"):
        raise CommandValidationError(
            "invalid_lock_packet", "Lock packet cannot declare release clearance."
        )
    _identifier(cast(str, record["run_id"]))
    _identifier(cast(str, record["renderer_build"]))
    rows = record["rows"]
    if not isinstance(rows, list) or len(rows) != 205:
        raise CommandValidationError("invalid_lock_packet", "Expected exactly 205 ordered lock rows.")
    allowed_statuses = frozenset({
        "missing", "failed_safety", "over_budget", "synthetic_checked", "device_checked"
    })
    keys = frozenset({
        "command", "level_tenths", "status", "preview_ms", "export_ms",
        "identity_applied", "alpha_unchanged", "protected_unchanged", "neutral_correct",
        "skin_lift_l", "pose_minimum_jacobian", "pose_retention", "measured_device",
    })
    missing = 0
    failures = 0
    reconstructed: list[LockObservation] = []
    for index, value in enumerate(rows):
        row = _dict(value, keys=keys)
        expected_command = COMMANDS[index // len(LEVELS)]
        expected_level = LEVELS[index % len(LEVELS)]
        if row["command"] != expected_command.value or row["level_tenths"] != expected_level:
            raise CommandValidationError(
                "invalid_lock_packet", "Lock row order or decimal strength changed."
            )
        if not isinstance(row["status"], str) or row["status"] not in allowed_statuses:
            raise CommandValidationError("invalid_lock_packet", "Invalid lock row status.")
        is_missing = row["status"] == "missing"
        missing += int(is_missing)
        failures += int(row["status"] in ("failed_safety", "over_budget"))
        for field in (
            "preview_ms", "export_ms", "skin_lift_l",
            "pose_minimum_jacobian", "pose_retention",
        ):
            number = row[field]
            if number is not None and _numeric(number) < 0.0 and field in (
                "preview_ms", "export_ms"
            ):
                raise CommandValidationError("invalid_lock_packet", "Lock timing cannot be negative.")
        for field in ("identity_applied", "alpha_unchanged", "protected_unchanged",
                      "neutral_correct", "measured_device"):
            if row[field] is not None and type(row[field]) is not bool:
                raise CommandValidationError(
                    "invalid_lock_packet", "Lock flags must be checked booleans."
                )
        if is_missing and any(row[field] is not None for field in keys if field not in (
            "command", "level_tenths", "status",
        )):
            raise CommandValidationError(
                "invalid_lock_packet", "Missing evidence may not invent observations."
            )
        if not is_missing and any(row[field] is None for field in (
            "preview_ms", "export_ms", "identity_applied", "alpha_unchanged",
            "protected_unchanged", "neutral_correct", "measured_device",
        )):
            raise CommandValidationError(
                "invalid_lock_packet", "Observed row lacks required measurements."
            )
        if not is_missing:
            reconstructed.append(LockObservation(
                expected_command,
                expected_level,
                _numeric(row["preview_ms"]),
                _numeric(row["export_ms"]),
                cast(bool, row["identity_applied"]),
                cast(bool, row["alpha_unchanged"]),
                cast(bool, row["protected_unchanged"]),
                cast(bool, row["neutral_correct"]),
                None if row["skin_lift_l"] is None else _numeric(row["skin_lift_l"]),
                None if row["pose_minimum_jacobian"] is None
                else _numeric(row["pose_minimum_jacobian"]),
                None if row["pose_retention"] is None else _numeric(row["pose_retention"]),
                cast(bool, row["measured_device"]),
            ))
    expected_status = "blocked" if failures else "incomplete" if missing else "technical_review_required"
    if record["technical_status"] != expected_status:
        raise CommandValidationError("invalid_lock_packet", "Technical status contradicts row evidence.")
    matrix = record["matrix"]
    if not isinstance(matrix, dict) or matrix.get("release_qualified") is not False:
        raise CommandValidationError(
            "invalid_lock_packet", "Matrix release clearance must remain false."
        )
    computed = evaluate_command_locks(
        tuple(reconstructed),
        preview_budget_ms=_numeric(matrix.get("preview_budget_ms")),
        export_budget_ms=_numeric(matrix.get("export_budget_ms")),
    )
    if matrix != computed.public_metadata():
        raise CommandValidationError(
            "invalid_lock_packet", "The matrix contradicts observed row measurements."
        )
    actual_blockers: list[str] = []
    for finding in computed.findings:
        if finding.missing_levels:
            actual_blockers.append(f"{finding.command.value}:missing:{len(finding.missing_levels)}")
        if finding.failed_levels:
            actual_blockers.append(f"{finding.command.value}:safety:{len(finding.failed_levels)}")
        if finding.timing_limited_levels:
            actual_blockers.append(
                f"{finding.command.value}:timing:{len(finding.timing_limited_levels)}"
            )
    if record["blockers"] != actual_blockers:
        raise CommandValidationError(
            "invalid_lock_packet", "Lock blockers contradict the evidence matrix."
        )
    return record
