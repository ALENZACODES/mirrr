"""Frozen Pro scheduling and resume tests using anonymous synthetic counters.

No image, private dataset, real-person label or model file is required.
Author: John Khan.
"""

from __future__ import annotations

import copy
import hashlib
import json
from dataclasses import replace

import pytest

from plumb_api.commands.errors import CommandValidationError
from plumb_api.commands.frozen_schedule import (
    PRO_COMMANDS,
    FrozenRunSpecification,
    FrozenScheduleLedger,
    FrozenShardReceipt,
    make_tickets,
    planned_range,
    restore_frozen_schedule,
    ticket_for,
)

DIGEST_A = hashlib.sha256(b"manifest synthetic metadata").hexdigest()
DIGEST_B = hashlib.sha256(b"definitions synthetic metadata").hexdigest()
DIGEST_C = hashlib.sha256(b"model synthetic metadata").hexdigest()


def schedule(face_count: int = 100_000, shards: int = 11) -> FrozenRunSpecification:
    return FrozenRunSpecification(
        "frozen-pro-2026", "run-2026-01", "build-389cb26",
        hashlib.sha256(b"frozen planned levels").hexdigest(),
        face_count, shards,
        DIGEST_A, DIGEST_B, DIGEST_C, "test-baseline-r1",
    )


def complete_receipt(
    spec: FrozenRunSpecification, command: str, shard: int,
) -> FrozenShardReceipt:
    ticket = ticket_for(spec, command, shard)
    return FrozenShardReceipt(
        ticket=ticket,
        processed=ticket.expected,
        eligible=ticket.expected,
        failed_render=0,
        identity_checked=ticket.expected,
        identity_failed=0,
        metrics_failed=0,
        checked_labels=True,
        preregistered_rules=True,
        independent_run=True,
        synthetic_only=False,
    )


def rejects(action: object) -> None:
    assert callable(action)
    with pytest.raises(CommandValidationError):
        action()


def test_specification_and_tickets_are_deterministic_and_private() -> None:
    left = schedule()
    right = schedule()
    assert left == right
    assert left.fingerprint == right.fingerprint
    assert len(left.fingerprint) == 64
    assert left.public_metadata()["release_qualified"] is False
    assert left.public_metadata()["external_runner_required"] is True
    assert tuple(left.commands) == PRO_COMMANDS
    all_tickets = make_tickets(left)
    assert len(all_tickets) == 55
    assert all(item.schedule_sha256 == left.fingerprint for item in all_tickets)
    assert len({item.receipt_key for item in all_tickets}) == len(all_tickets)
    encoded = json.dumps([item.public_metadata() for item in all_tickets])
    assert "release_qualified" not in encoded
    assert "/workspace" not in encoded
    assert "filename" not in encoded
    assert "photo" not in encoded


@pytest.mark.parametrize("face_count,shards", [
    (100_000, 1),
    (100_000, 2),
    (100_000, 7),
    (100_000, 128),
    (100_000, 4096),
    (100_003, 37),
    (1_000_000, 128),
])
def test_ranges_are_gapless_without_duplicate_case_ordinals(face_count: int, shards: int) -> None:
    spec = schedule(face_count, shards)
    boundaries = [planned_range(spec, index) for index in range(shards)]
    assert boundaries[0][0] == 0
    assert boundaries[-1][1] == face_count
    assert all(stop > start for start, stop in boundaries)
    assert all(
        first[1] == second[0]
        for first, second in zip(boundaries[:-1], boundaries[1:], strict=True)
    )
    assert sum(stop - start for start, stop in boundaries) == face_count
    assert max(stop - start for start, stop in boundaries) - min(
        stop - start for start, stop in boundaries
    ) <= 1


@pytest.mark.parametrize("bad", [
    {"set_id": "../outside"},
    {"set_id": ""},
    {"run_id": "../elsewhere"},
    {"run_id": ""},
    {"build_commit": "not/a/commit"},
    {"recipe_sha256": "unknown"},
    {"set_id": "x" * 90},
    {"face_count": 99_999},
    {"face_count": 10_000_001},
    {"face_count": True},
    {"shards": 0},
    {"shards": 4097},
    {"shards": 1.5},
    {"manifest_sha256": "wrong"},
    {"definitions_sha256": DIGEST_B.upper()},
    {"model_sha256": "0" * 63},
    {"baseline_commit": "/some/path"},
    {"commands": PRO_COMMANDS[:-1]},
    {"commands": tuple(reversed(PRO_COMMANDS))},
])
def test_frozen_inputs_refuse_bad_schedules(bad: dict[str, object]) -> None:
    rejects(lambda: replace(schedule(), **bad))


@pytest.mark.parametrize("shard", [-1, 11, 1.5, True])
def test_bad_shard_identifier_is_refused(shard: object) -> None:
    rejects(lambda: planned_range(schedule(), shard))
    rejects(lambda: ticket_for(schedule(), "cleanup", shard))


def test_unknown_command_refused() -> None:
    rejects(lambda: ticket_for(schedule(), "not-a-command", 0))


def test_complete_resumable_schedule_is_still_not_release_approval() -> None:
    spec = schedule(100_000, 7)
    ledger = FrozenScheduleLedger(spec)
    for command in spec.commands:
        for index in range(spec.shards):
            assert ledger.record(complete_receipt(spec, command, index))
    result = ledger.status()
    assert result.status == "ready_for_external_gate"
    assert result.received == 35
    assert result.expected == 35
    assert result.processed == 500_000
    assert result.required_faces == 100_000
    assert result.missing == () and result.failures == ()
    assert result.public_metadata()["release_qualified"] is False
    assert result.public_metadata()["independently_approved"] is False
    assert ledger.record(complete_receipt(spec, "cleanup", 2)) is False
    assert ledger.status() == result


def test_missing_receipts_and_partials_never_look_ready() -> None:
    spec = schedule(100_000, 7)
    ledger = FrozenScheduleLedger(spec)
    assert ledger.status().status == "unproven"
    receipt = complete_receipt(spec, "cleanup", 0)
    assert ledger.record(replace(receipt, processed=3, eligible=3, identity_checked=3))
    report = ledger.status()
    assert report.status == "unproven"
    assert "cleanup:0:partial" in report.missing
    assert "identitylock:0" in report.missing
    assert "upscale:3" in report.missing


@pytest.mark.parametrize("attribute,value,expected", [
    ("failed_render", 1, "render"),
    ("identity_failed", 1, "identity"),
    ("metrics_failed", 1, "metrics"),
    ("preregistered_rules", False, "rules_not_preregistered"),
])
def test_failed_evidence_is_never_silently_dropped(
    attribute: str, value: object, expected: str,
) -> None:
    receipt = complete_receipt(schedule(), "studioquality", 1)
    if attribute == "failed_render":
        altered = replace(
            receipt, failed_render=1, eligible=receipt.eligible - 1,
            identity_checked=receipt.identity_checked - 1,
        )
    else:
        altered = replace(receipt, **{attribute: value})
    ledger = FrozenScheduleLedger(schedule())
    ledger.record(altered)
    report = ledger.status()
    assert report.status == "failed"
    assert f"studioquality:1:{expected}" in report.failures


@pytest.mark.parametrize("field", [
    "checked_labels", "independent_run", "synthetic_only",
])
def test_missing_independent_evidence_remains_unproven(field: str) -> None:
    receipt = complete_receipt(schedule(), "poseonly", 5)
    new_value = field == "synthetic_only"
    ledger = FrozenScheduleLedger(schedule())
    ledger.record(replace(receipt, **{field: new_value}))
    state = ledger.status()
    assert state.status == "unproven"
    assert any(issue.startswith("poseonly:5:") for issue in state.missing)


def test_identity_not_checked_and_unknown_eligibility_block_readiness() -> None:
    receipt = complete_receipt(schedule(), "upscale", 4)
    ledger = FrozenScheduleLedger(schedule())
    ledger.record(replace(receipt, identity_checked=receipt.identity_checked - 1))
    assert "upscale:4:identity_evidence" in ledger.status().missing
    next_ledger = FrozenScheduleLedger(schedule())
    next_ledger.record(replace(
        receipt, eligible=receipt.eligible - 1,
        identity_checked=receipt.identity_checked - 1,
    ))
    assert "upscale:4:eligibility" in next_ledger.status().missing


def test_conflicting_and_foreign_receipts_fail_atomically() -> None:
    spec = schedule()
    ledger = FrozenScheduleLedger(spec)
    first = complete_receipt(spec, "identitylock", 0)
    ledger.record(first)
    before = ledger.snapshot()
    rejects(lambda: ledger.record(replace(first, metrics_failed=1)))
    wrong = complete_receipt(replace(spec, model_sha256=DIGEST_A), "identitylock", 0)
    rejects(lambda: ledger.record(wrong))
    wrong_run = complete_receipt(schedule(shards=5), "identitylock", 0)
    rejects(lambda: ledger.record(wrong_run))
    assert ledger.snapshot() == before


@pytest.mark.parametrize("field,value", [
    ("processed", -1),
    ("processed", 200_000),
    ("processed", True),
    ("eligible", -1),
    ("eligible", 100_000),
    ("failed_render", 100_000),
    ("identity_checked", 100_000),
    ("identity_failed", 100_000),
    ("metrics_failed", 100_000),
    ("checked_labels", 1),
    ("preregistered_rules", "yes"),
    ("independent_run", None),
    ("synthetic_only", 0),
])
def test_receipt_value_validation(field: str, value: object) -> None:
    receipt = complete_receipt(schedule(), "cleanup", 3)
    rejects(lambda: replace(receipt, **{field: value}))


def test_serialization_round_trip_and_shuffled_receive_order() -> None:
    spec = schedule(shards=3)
    ledger = FrozenScheduleLedger(spec)
    tickets = list(make_tickets(spec))
    for ticket in reversed(tickets):
        ledger.record(complete_receipt(spec, ticket.command, ticket.shard_index))
    encoded = json.dumps(ledger.snapshot(), sort_keys=True)
    recovered = restore_frozen_schedule(encoded, spec)
    assert recovered.status() == ledger.status()
    assert recovered.snapshot() == ledger.snapshot()
    assert tuple(item.ticket.receipt_key for item in recovered.received) == tuple(
        item.receipt_key for item in tickets
    )


def test_partial_restore_resume_is_stable_and_idempotent() -> None:
    spec = schedule(shards=13)
    ledger = FrozenScheduleLedger(spec)
    tickets = make_tickets(spec)
    for ticket in tickets[:7]:
        ledger.record(complete_receipt(spec, ticket.command, ticket.shard_index))
    snapshot = json.dumps(ledger.snapshot())
    resume = restore_frozen_schedule(snapshot, spec)
    assert resume.record(complete_receipt(spec, "identitylock", 6)) is False
    for ticket in tickets[7:]:
        resume.record(complete_receipt(spec, ticket.command, ticket.shard_index))
    assert resume.status().status == "ready_for_external_gate"
    assert ledger.status().status == "unproven"


@pytest.mark.parametrize("mutation", [
    ("release_qualified", True),
    ("version", "wrong"),
    ("schedule_sha256", DIGEST_A),
    ("unknown", "payload"),
])
def test_snapshot_root_tampering_is_refused(mutation: tuple[str, object]) -> None:
    spec = schedule()
    data = FrozenScheduleLedger(spec).snapshot()
    data[mutation[0]] = mutation[1]
    rejects(lambda: restore_frozen_schedule(json.dumps(data), spec))


def test_checkpoint_rejects_changed_manifest_or_model() -> None:
    spec = schedule()
    checkpoint = json.dumps(FrozenScheduleLedger(spec).snapshot())
    for changed in (
        replace(spec, model_sha256=DIGEST_A),
        replace(spec, manifest_sha256=DIGEST_B),
        replace(spec, definitions_sha256=DIGEST_A),
        replace(spec, shards=12),
        replace(spec, baseline_commit="other-commit"),
        replace(spec, run_id="run-2026-02"),
        replace(spec, build_commit="new-build-xyz"),
        replace(spec, recipe_sha256=DIGEST_A),
    ):
        rejects(lambda: restore_frozen_schedule(checkpoint, changed))


def test_checkpoint_refuses_unknown_ticket_fields_and_private_payload() -> None:
    spec = schedule()
    ledger = FrozenScheduleLedger(spec)
    ledger.record(complete_receipt(spec, "cleanup", 1))
    for key in ("pixels", "file_path", "embedding", "filename", "person_id"):
        data = copy.deepcopy(ledger.snapshot())
        rows = data["receipts"]
        assert isinstance(rows, list)
        record = rows[0]
        assert isinstance(record, dict)
        record[key] = "private-data"
        rejects(lambda: restore_frozen_schedule(json.dumps(data), spec))


def test_checkpoint_refuses_modified_ticket_and_unknown_receipts() -> None:
    spec = schedule()
    ledger = FrozenScheduleLedger(spec)
    ledger.record(complete_receipt(spec, "cleanup", 1))
    for path, value in (
        ("first_ordinal", 0),
        ("stop_ordinal", 9999),
        ("schedule_sha256", DIGEST_A),
        ("shard_index", 7),
        ("shard_count", 9),
        ("command", "wrong"),
        ("expected", 3),
    ):
        data = copy.deepcopy(ledger.snapshot())
        rows = data["receipts"]
        assert isinstance(rows, list)
        record = rows[0]
        assert isinstance(record, dict)
        ticket = record["ticket"]
        assert isinstance(ticket, dict)
        ticket[path] = value
        rejects(lambda: restore_frozen_schedule(json.dumps(data), spec))


def test_duplicate_and_oversized_snapshots_fail_closed() -> None:
    spec = schedule(shards=3)
    ledger = FrozenScheduleLedger(spec)
    ledger.record(complete_receipt(spec, "cleanup", 1))
    state = ledger.snapshot()
    rows = state["receipts"]
    assert isinstance(rows, list)
    rows.append(rows[0])
    rejects(lambda: restore_frozen_schedule(json.dumps(state), spec))
    rejects(lambda: restore_frozen_schedule(" " * (2 * 1024 * 1024 + 1), spec))
    rejects(lambda: restore_frozen_schedule("{", spec))
    rejects(lambda: restore_frozen_schedule("[]", spec))


def test_hundred_thousand_face_shards_are_only_ordinal_metadata() -> None:
    spec = schedule(shards=128)
    tickets = make_tickets(spec)
    assert all(ticket.expected in (781, 782) for ticket in tickets)
    assert sum(ticket.expected for ticket in tickets if ticket.command == "cleanup") == 100_000
    ledger = FrozenScheduleLedger(spec)
    for item in tickets:
        ledger.record(complete_receipt(spec, item.command, item.shard_index))
    public = ledger.status().public_metadata()
    assert public["status"] == "ready_for_external_gate"
    assert public["release_qualified"] is False
    assert "face_id" not in json.dumps(public)


def test_checkpoint_rejects_duplicate_keys_and_nonfinite_json() -> None:
    spec = schedule()
    snapshot = json.dumps(FrozenScheduleLedger(spec).snapshot())
    rejects(lambda: restore_frozen_schedule(snapshot.replace(
        '"release_qualified": false',
        '"release_qualified": true, "release_qualified": false',
        1,
    ), spec))
    rejects(lambda: restore_frozen_schedule(snapshot.replace(
        '"face_count": 100000', '"face_count": NaN', 1,
    ), spec))
    rejects(lambda: restore_frozen_schedule(snapshot.replace(
        '"face_count": 100000', '"face_count": Infinity', 1,
    ), spec))
