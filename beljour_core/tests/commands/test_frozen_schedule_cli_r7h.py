"""Local frozen schedule CLI tests with photo-free metadata files.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from plumb_api.commands.frozen_schedule import (
    FrozenRunSpecification,
    FrozenScheduleLedger,
    FrozenShardReceipt,
    ticket_for,
)
from plumb_api.commands.frozen_schedule_cli import main


def schedule(shards: int = 4) -> FrozenRunSpecification:
    return FrozenRunSpecification(
        "frozen-pro-2026", "run-2026-01", "build-389cb26",
        hashlib.sha256(b"frozen planned levels").hexdigest(),
        100_000, shards,
        hashlib.sha256(b"manifest synthetic metadata").hexdigest(),
        hashlib.sha256(b"definitions synthetic metadata").hexdigest(),
        hashlib.sha256(b"model synthetic metadata").hexdigest(),
        "test-baseline-r1",
    )


def complete_receipt(
    spec: FrozenRunSpecification, command: str, shard: int,
) -> FrozenShardReceipt:
    ticket = ticket_for(spec, command, shard)
    return FrozenShardReceipt(
        ticket, ticket.expected, ticket.expected, 0, ticket.expected, 0, 0,
        True, True, True, False,
    )


def create_spec(path: Path) -> None:
    item = schedule(shards=4)
    data = item.public_metadata()
    for key in ("version", "commands", "external_runner_required", "release_qualified"):
        data.pop(key)
    path.write_text(json.dumps(data), encoding="utf-8")


def invoke(*args: str) -> tuple[int, str, str]:
    out = io.StringIO()
    err = io.StringIO()
    code = main(list(args), out=out, err=err)
    return code, out.getvalue(), err.getvalue()


def test_cli_plan_and_ticket_rows_are_safe(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    create_spec(source)
    code, output, errors = invoke("--spec", str(source), "--tickets")
    assert code == 0 and errors == ""
    metadata = json.loads(output)
    assert metadata["release_qualified"] is False
    assert metadata["evidence"]["status"] == "unproven"
    assert metadata["schedule"]["face_count"] == 100_000
    assert len(metadata["tickets"]) == 20
    assert metadata["tickets"][0]["command"] == "identitylock"
    assert "pixels" not in output
    assert "filename" not in output
    assert str(tmp_path) not in output


def test_cli_no_ticket_mode_stays_compact(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    create_spec(source)
    code, output, errors = invoke("--spec", str(source))
    assert code == 0 and errors == ""
    obj = json.loads(output)
    assert obj["tickets"] == []
    assert obj["schedule_sha256"] == schedule(shards=4).fingerprint


def test_cli_restores_partial_and_reports_unproven(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    state = tmp_path / "state.json"
    create_spec(source)
    spec = schedule(shards=4)
    ledger = FrozenScheduleLedger(spec)
    ledger.record(complete_receipt(spec, "cleanup", 1))
    state.write_text(json.dumps(ledger.snapshot()), encoding="utf-8")
    code, output, errors = invoke("--spec", str(source), "--state", str(state))
    assert code == 3 and errors == ""
    assert json.loads(output)["evidence"]["status"] == "unproven"
    assert "cleanup:0" in output


def test_cli_all_counter_receipts_are_still_not_release_qualified(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    state = tmp_path / "state.json"
    create_spec(source)
    spec = schedule(shards=4)
    ledger = FrozenScheduleLedger(spec)
    for command in spec.commands:
        for shard in range(spec.shards):
            ledger.record(complete_receipt(spec, command, shard))
    state.write_text(json.dumps(ledger.snapshot()), encoding="utf-8")
    code, output, errors = invoke("--spec", str(source), "--state", str(state))
    assert code == 0 and errors == ""
    result = json.loads(output)
    assert result["evidence"]["status"] == "ready_for_external_gate"
    assert result["release_qualified"] is False
    assert result["evidence"]["independently_approved"] is False


def test_cli_refuses_unknown_fields_without_reading_photo_data(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    create_spec(source)
    data = json.loads(source.read_text(encoding="utf-8"))
    data["photo_path"] = str(tmp_path / "private.png")
    source.write_text(json.dumps(data), encoding="utf-8")
    code, output, errors = invoke("--spec", str(source))
    assert code == 2 and output == ""
    assert "invalid_frozen_schedule" in errors
    assert "private.png" not in errors


def test_cli_bad_counts_and_unknown_hashes_fail(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    create_spec(source)
    data = json.loads(source.read_text(encoding="utf-8"))
    for field, value in (
        ("face_count", True),
        ("shards", 0),
        ("manifest_sha256", "unknown"),
        ("baseline_commit", "../../other"),
    ):
        changed = {**data, field: value}
        source.write_text(json.dumps(changed), encoding="utf-8")
        code, output, errors = invoke("--spec", str(source))
        assert code == 2 and output == ""
        assert "invalid_frozen_schedule" in errors


def test_cli_bad_checkpoint_is_rejected(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    state = tmp_path / "state.json"
    create_spec(source)
    state.write_text('{"pixels":"not metadata"}', encoding="utf-8")
    code, output, errors = invoke("--spec", str(source), "--state", str(state))
    assert code == 2 and output == ""
    assert "pixels" not in errors


def test_cli_refuses_oversized_spec_or_snapshot(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    state = tmp_path / "state.json"
    source.write_bytes(b"x" * (16 * 1024 + 1))
    code, output, errors = invoke("--spec", str(source))
    assert code == 2 and output == ""
    assert "metadata" in errors
    create_spec(source)
    state.write_bytes(b"x" * (2 * 1024 * 1024 + 1))
    code, output, errors = invoke("--spec", str(source), "--state", str(state))
    assert code == 2 and output == ""
    assert "metadata" in errors


def test_cli_refuses_duplicate_json_keys(tmp_path: Path) -> None:
    source = tmp_path / "spec.json"
    create_spec(source)
    payload = source.read_text(encoding="utf-8")
    source.write_text(payload.replace(
        '"shards": 4', '"shards": 5, "shards": 4', 1,
    ), encoding="utf-8")
    code, output, errors = invoke("--spec", str(source))
    assert code == 2 and output == ""
    assert "invalid_frozen_schedule" in errors
