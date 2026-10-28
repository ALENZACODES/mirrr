"""Immutable metadata-only schedule for an external Pro real-face evaluation.

This is not a substitute for the frozen-set runner, its lock verification,
independent human review, or the product release gate. It records no images,
individual identifiers, filenames, label values, or executable model assets.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Literal

from .errors import CommandValidationError

PRO_COMMANDS: tuple[str, ...] = (
    "identitylock", "cleanup", "upscale", "studioquality", "poseonly",
)
_PROTOCOL = "beljour-pro-frozen-schedule/1"
_RECEIPT_PROTOCOL = "beljour-pro-shard-receipt/1"
_STATE_PROTOCOL = "beljour-pro-frozen-state/1"
_SHA = re.compile(r"^[a-f0-9]{64}$")
_IDENTIFIER = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$")
_MAX_SHARDS = 4096
_MAX_RECEIPT_BYTES = 2 * 1024 * 1024


def _invalid(reason: str) -> CommandValidationError:
    return CommandValidationError("invalid_frozen_schedule", reason)


def _identifier(value: str, label: str) -> None:
    if not isinstance(value, str) or _IDENTIFIER.fullmatch(value) is None:
        raise _invalid(f"{label} must be a bounded identifier.")


def _sha(value: str, label: str) -> None:
    if not isinstance(value, str) or _SHA.fullmatch(value) is None:
        raise _invalid(f"{label} must be a lowercase SHA-256 digest.")


def _integer(value: int, label: str, start: int, stop: int) -> None:
    if type(value) is not int or not start <= value <= stop:
        raise _invalid(f"{label} is outside its allowed bounds.")


def _boolean(value: bool, label: str) -> None:
    if type(value) is not bool:
        raise _invalid(f"{label} must be a boolean.")


def _json_digest(data: dict[str, object]) -> str:
    payload = json.dumps(data, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _unique_json_pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
    decoded: dict[str, object] = {}
    for key, value in pairs:
        if key in decoded:
            raise _invalid("Duplicate keys are not permitted in frozen metadata.")
        decoded[key] = value
    return decoded


def _reject_json_constant(value: str) -> object:
    raise _invalid("Nonfinite frozen metadata values are forbidden.")


def decode_frozen_metadata_json(payload: str) -> object:
    """Decode strict JSON without duplicate keys or nonfinite constants."""
    if not isinstance(payload, str):
        raise _invalid("Frozen metadata must be UTF-8 text.")
    try:
        return json.loads(
            payload,
            object_pairs_hook=_unique_json_pairs,
            parse_constant=_reject_json_constant,
        )
    except (TypeError, ValueError, OverflowError, RecursionError) as exc:
        raise _invalid("Frozen metadata is not valid strict JSON.") from exc


@dataclass(frozen=True, slots=True)
class FrozenRunSpecification:
    """Approved-by-box input identifiers, never guessed or derived from pixels."""

    set_id: str
    run_id: str
    build_commit: str
    recipe_sha256: str
    face_count: int
    shards: int
    manifest_sha256: str
    definitions_sha256: str
    model_sha256: str
    baseline_commit: str
    commands: tuple[str, ...] = PRO_COMMANDS

    def __post_init__(self) -> None:
        _identifier(self.set_id, "set_id")
        _identifier(self.run_id, "run_id")
        _identifier(self.build_commit, "build_commit")
        _sha(self.recipe_sha256, "recipe_sha256")
        _integer(self.face_count, "face_count", 100_000, 10_000_000)
        _integer(self.shards, "shards", 1, _MAX_SHARDS)
        if self.shards > self.face_count:
            raise _invalid("Every shard must contain at least one planned case.")
        _sha(self.manifest_sha256, "manifest_sha256")
        _sha(self.definitions_sha256, "definitions_sha256")
        _sha(self.model_sha256, "model_sha256")
        _identifier(self.baseline_commit, "baseline_commit")
        if not isinstance(self.commands, tuple) or self.commands != PRO_COMMANDS:
            raise _invalid("All five Pro Commands must be accounted for in stable order.")

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": _PROTOCOL,
            "set_id": self.set_id,
            "run_id": self.run_id,
            "build_commit": self.build_commit,
            "recipe_sha256": self.recipe_sha256,
            "face_count": self.face_count,
            "shards": self.shards,
            "manifest_sha256": self.manifest_sha256,
            "definitions_sha256": self.definitions_sha256,
            "model_sha256": self.model_sha256,
            "baseline_commit": self.baseline_commit,
            "commands": list(self.commands),
            "external_runner_required": True,
            "release_qualified": False,
        }

    @property
    def fingerprint(self) -> str:
        return _json_digest(self.public_metadata())


@dataclass(frozen=True, slots=True)
class FrozenShardTicket:
    """Zero-based half-open ordinal range, not a list of private face IDs."""

    schedule_sha256: str
    shard_index: int
    shard_count: int
    first_ordinal: int
    stop_ordinal: int
    command: str

    def __post_init__(self) -> None:
        _sha(self.schedule_sha256, "schedule_sha256")
        _integer(self.shard_count, "shard_count", 1, _MAX_SHARDS)
        _integer(self.shard_index, "shard_index", 0, self.shard_count - 1)
        _integer(self.first_ordinal, "first_ordinal", 0, 10_000_000)
        _integer(self.stop_ordinal, "stop_ordinal", 1, 10_000_000)
        if self.stop_ordinal <= self.first_ordinal or self.command not in PRO_COMMANDS:
            raise _invalid("Shard range or command is invalid.")

    @property
    def expected(self) -> int:
        return self.stop_ordinal - self.first_ordinal

    @property
    def receipt_key(self) -> str:
        return f"{self.command}:{self.shard_index}"

    def public_metadata(self) -> dict[str, object]:
        return {
            "schedule_sha256": self.schedule_sha256,
            "shard_index": self.shard_index,
            "shard_count": self.shard_count,
            "first_ordinal": self.first_ordinal,
            "stop_ordinal": self.stop_ordinal,
            "command": self.command,
            "expected": self.expected,
        }


def planned_range(specification: FrozenRunSpecification, shard: int) -> tuple[int, int]:
    if not isinstance(specification, FrozenRunSpecification):
        raise _invalid("Frozen specification is required.")
    _integer(shard, "shard", 0, specification.shards - 1)
    base, remainder = divmod(specification.face_count, specification.shards)
    first = shard * base + min(shard, remainder)
    stop = first + base + int(shard < remainder)
    return first, stop


def ticket_for(specification: FrozenRunSpecification, command: str, shard: int) -> FrozenShardTicket:
    if command not in PRO_COMMANDS:
        raise _invalid("Unknown Pro command for frozen evaluation.")
    first, stop = planned_range(specification, shard)
    return FrozenShardTicket(
        specification.fingerprint, shard, specification.shards, first, stop, command,
    )


def make_tickets(specification: FrozenRunSpecification) -> tuple[FrozenShardTicket, ...]:
    """Deterministic enumeration; the box maps ordinal ranges to its locked manifest."""
    return tuple(
        ticket_for(specification, command, shard)
        for command in specification.commands
        for shard in range(specification.shards)
    )


@dataclass(frozen=True, slots=True)
class FrozenShardReceipt:
    """Counters supplied by an independent runner, not self-declared acceptance."""

    ticket: FrozenShardTicket
    processed: int
    eligible: int
    failed_render: int
    identity_checked: int
    identity_failed: int
    metrics_failed: int
    checked_labels: bool
    preregistered_rules: bool
    independent_run: bool
    synthetic_only: bool

    def __post_init__(self) -> None:
        if not isinstance(self.ticket, FrozenShardTicket):
            raise _invalid("Receipt needs a valid shard ticket.")
        for label in (
            "processed", "eligible", "failed_render", "identity_checked",
            "identity_failed", "metrics_failed",
        ):
            _integer(getattr(self, label), label, 0, self.ticket.expected)
        for label in (
            "checked_labels", "preregistered_rules", "independent_run", "synthetic_only",
        ):
            _boolean(getattr(self, label), label)
        if self.eligible + self.failed_render > self.processed:
            raise _invalid("Eligible and failed cases exceed processed cases.")
        if self.identity_checked > self.eligible or self.identity_failed > self.identity_checked:
            raise _invalid("Identity counts are inconsistent.")
        if self.metrics_failed > self.eligible:
            raise _invalid("Metric failures exceed eligible cases.")

    @property
    def complete(self) -> bool:
        return self.processed == self.ticket.expected

    @property
    def clean(self) -> bool:
        return (
            self.complete and self.failed_render == 0 and self.eligible == self.processed
            and self.identity_checked == self.eligible and self.identity_failed == 0
            and self.metrics_failed == 0 and self.checked_labels and self.preregistered_rules
            and self.independent_run and not self.synthetic_only
        )

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": _RECEIPT_PROTOCOL,
            "ticket": self.ticket.public_metadata(),
            "processed": self.processed,
            "eligible": self.eligible,
            "failed_render": self.failed_render,
            "identity_checked": self.identity_checked,
            "identity_failed": self.identity_failed,
            "metrics_failed": self.metrics_failed,
            "checked_labels": self.checked_labels,
            "preregistered_rules": self.preregistered_rules,
            "independent_run": self.independent_run,
            "synthetic_only": self.synthetic_only,
            "release_qualified": False,
        }


@dataclass(frozen=True, slots=True)
class FrozenScheduleStatus:
    """Readiness to submit evidence to the independently owned release gate."""

    status: Literal["failed", "unproven", "ready_for_external_gate"]
    schedule_sha256: str
    received: int
    expected: int
    processed: int
    required_faces: int
    missing: tuple[str, ...]
    failures: tuple[str, ...]

    def public_metadata(self) -> dict[str, object]:
        return {
            "version": _STATE_PROTOCOL,
            "status": self.status,
            "schedule_sha256": self.schedule_sha256,
            "received": self.received,
            "expected": self.expected,
            "processed": self.processed,
            "required_faces": self.required_faces,
            "missing": list(self.missing),
            "failures": list(self.failures),
            "independently_approved": False,
            "release_qualified": False,
        }


class FrozenScheduleLedger:
    """Bounded resume ledger with idempotent receipts and no photo persistence."""

    def __init__(self, specification: FrozenRunSpecification) -> None:
        if not isinstance(specification, FrozenRunSpecification):
            raise _invalid("Frozen specification is required.")
        self._specification = specification
        self._receipts: dict[str, FrozenShardReceipt] = {}

    @property
    def specification(self) -> FrozenRunSpecification:
        return self._specification

    def record(self, receipt: FrozenShardReceipt) -> bool:
        if not isinstance(receipt, FrozenShardReceipt):
            raise _invalid("Typed aggregate receipt is required.")
        expected = ticket_for(
            self._specification, receipt.ticket.command, receipt.ticket.shard_index,
        )
        if receipt.ticket != expected:
            raise _invalid("Receipt does not belong to the frozen schedule.")
        key = receipt.ticket.receipt_key
        previous = self._receipts.get(key)
        if previous is not None:
            if previous != receipt:
                raise _invalid("Conflicting receipt for the same command and shard.")
            return False
        self._receipts[key] = receipt
        return True

    @property
    def received(self) -> tuple[FrozenShardReceipt, ...]:
        return tuple(
            self._receipts[key]
            for key in sorted(self._receipts, key=lambda value: (
                PRO_COMMANDS.index(value.split(":")[0]), int(value.split(":")[1]),
            ))
        )

    def status(self) -> FrozenScheduleStatus:
        missing: list[str] = []
        failures: list[str] = []
        processed = 0
        for ticket in make_tickets(self._specification):
            receipt = self._receipts.get(ticket.receipt_key)
            if receipt is None:
                missing.append(ticket.receipt_key)
                continue
            processed += receipt.processed
            if not receipt.complete:
                missing.append(f"{ticket.receipt_key}:partial")
            if receipt.failed_render > 0:
                failures.append(f"{ticket.receipt_key}:render")
            if receipt.identity_failed > 0:
                failures.append(f"{ticket.receipt_key}:identity")
            if receipt.metrics_failed > 0:
                failures.append(f"{ticket.receipt_key}:metrics")
            if receipt.identity_checked < receipt.eligible:
                missing.append(f"{ticket.receipt_key}:identity_evidence")
            if receipt.eligible != receipt.processed - receipt.failed_render:
                missing.append(f"{ticket.receipt_key}:eligibility")
            if not receipt.checked_labels:
                missing.append(f"{ticket.receipt_key}:labels")
            if not receipt.preregistered_rules:
                failures.append(f"{ticket.receipt_key}:rules_not_preregistered")
            if not receipt.independent_run or receipt.synthetic_only:
                missing.append(f"{ticket.receipt_key}:independent_realface_evidence")
        state: Literal["failed", "unproven", "ready_for_external_gate"] = "unproven"
        if failures:
            state = "failed"
        elif not missing:
            state = "ready_for_external_gate"
        return FrozenScheduleStatus(
            state, self._specification.fingerprint, len(self._receipts),
            self._specification.shards * len(self._specification.commands),
            processed, self._specification.face_count, tuple(missing), tuple(failures),
        )

    def snapshot(self) -> dict[str, object]:
        """Photo-free JSON-ready snapshot. Caller owns durable checkpoint storage."""
        return {
            "version": _STATE_PROTOCOL,
            "specification": self._specification.public_metadata(),
            "schedule_sha256": self._specification.fingerprint,
            "receipts": [receipt.public_metadata() for receipt in self.received],
            "release_qualified": False,
        }


def _checked_mapping(value: object, fields: frozenset[str]) -> dict[str, object]:
    if not isinstance(value, dict) or set(value) != fields or any(
        not isinstance(key, str) for key in value
    ):
        raise _invalid("Unknown or missing frozen checkpoint fields.")
    return value


def _from_specification(raw: object) -> FrozenRunSpecification:
    spec = _checked_mapping(raw, frozenset({
        "version", "set_id", "run_id", "build_commit", "recipe_sha256",
        "face_count", "shards", "manifest_sha256",
        "definitions_sha256", "model_sha256", "baseline_commit", "commands",
        "external_runner_required", "release_qualified",
    }))
    if spec["version"] != _PROTOCOL or spec["external_runner_required"] is not True or (
        spec["release_qualified"] is not False
    ):
        raise _invalid("Frozen checkpoint carries an incompatible release declaration.")
    commands = spec["commands"]
    if not isinstance(commands, list) or any(not isinstance(name, str) for name in commands):
        raise _invalid("Invalid frozen command list.")
    return FrozenRunSpecification(
        set_id=_assert_string(spec["set_id"]),
        run_id=_assert_string(spec["run_id"]),
        build_commit=_assert_string(spec["build_commit"]),
        recipe_sha256=_assert_string(spec["recipe_sha256"]),
        face_count=_assert_int(spec["face_count"]),
        shards=_assert_int(spec["shards"]),
        manifest_sha256=_assert_string(spec["manifest_sha256"]),
        definitions_sha256=_assert_string(spec["definitions_sha256"]),
        model_sha256=_assert_string(spec["model_sha256"]),
        baseline_commit=_assert_string(spec["baseline_commit"]),
        commands=tuple(commands),
    )


def _assert_int(value: object) -> int:
    if type(value) is not int:
        raise _invalid("Frozen checkpoint counter has an invalid type.")
    return value


def _assert_string(value: object) -> str:
    if not isinstance(value, str):
        raise _invalid("Frozen checkpoint identifier has an invalid type.")
    return value


def _from_receipt(raw: object) -> FrozenShardReceipt:
    receipt = _checked_mapping(raw, frozenset({
        "version", "ticket", "processed", "eligible", "failed_render",
        "identity_checked", "identity_failed", "metrics_failed", "checked_labels",
        "preregistered_rules", "independent_run", "synthetic_only", "release_qualified",
    }))
    if receipt["version"] != _RECEIPT_PROTOCOL or receipt["release_qualified"] is not False:
        raise _invalid("Receipt version or release declaration is invalid.")
    ticket = _checked_mapping(receipt["ticket"], frozenset({
        "schedule_sha256", "shard_index", "shard_count", "first_ordinal",
        "stop_ordinal", "command", "expected",
    }))
    parsed = FrozenShardTicket(
        schedule_sha256=_assert_string(ticket["schedule_sha256"]),
        shard_index=_assert_int(ticket["shard_index"]),
        shard_count=_assert_int(ticket["shard_count"]),
        first_ordinal=_assert_int(ticket["first_ordinal"]),
        stop_ordinal=_assert_int(ticket["stop_ordinal"]),
        command=_assert_string(ticket["command"]),
    )
    if ticket["expected"] != parsed.expected:
        raise _invalid("Receipt ordinal range does not match its expected count.")
    return FrozenShardReceipt(
        ticket=parsed,
        processed=_assert_int(receipt["processed"]),
        eligible=_assert_int(receipt["eligible"]),
        failed_render=_assert_int(receipt["failed_render"]),
        identity_checked=_assert_int(receipt["identity_checked"]),
        identity_failed=_assert_int(receipt["identity_failed"]),
        metrics_failed=_assert_int(receipt["metrics_failed"]),
        checked_labels=_assert_bool(receipt["checked_labels"]),
        preregistered_rules=_assert_bool(receipt["preregistered_rules"]),
        independent_run=_assert_bool(receipt["independent_run"]),
        synthetic_only=_assert_bool(receipt["synthetic_only"]),
    )


def _assert_bool(value: object) -> bool:
    if type(value) is not bool:
        raise _invalid("Frozen checkpoint flag has an invalid type.")
    return value


def restore_frozen_schedule(
    snapshot: str,
    specification: FrozenRunSpecification,
) -> FrozenScheduleLedger:
    """Restore only identical immutable run metadata; refuse silent rebase."""
    if not isinstance(snapshot, str) or len(snapshot.encode("utf-8")) > _MAX_RECEIPT_BYTES:
        raise _invalid("Frozen checkpoint exceeds the metadata limit.")
    decoded = decode_frozen_metadata_json(snapshot)
    data = _checked_mapping(decoded, frozenset({
        "version", "specification", "schedule_sha256", "receipts", "release_qualified",
    }))
    if data["version"] != _STATE_PROTOCOL or data["release_qualified"] is not False:
        raise _invalid("Frozen checkpoint version or release status is invalid.")
    restored = _from_specification(data["specification"])
    if restored != specification or data["schedule_sha256"] != specification.fingerprint:
        raise _invalid("Frozen manifest or schedule changed after checkpoint creation.")
    rows = data["receipts"]
    if not isinstance(rows, list) or len(rows) > specification.shards * len(PRO_COMMANDS):
        raise _invalid("Frozen checkpoint has too many receipts.")
    ledger = FrozenScheduleLedger(specification)
    for row in rows:
        if not ledger.record(_from_receipt(row)):
            raise _invalid("Duplicate receipt appears in a frozen checkpoint.")
    return ledger
