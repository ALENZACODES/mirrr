"""Metadata-only CLI for an externally verified frozen Pro run.

The independent evaluator owns the locked face files, labels and final PASS.
This local command never reads photographs, imports weights or issues a verdict.
Author: John Khan.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import TextIO

from .errors import CommandValidationError
from .frozen_schedule import (
    FrozenRunSpecification,
    FrozenScheduleLedger,
    decode_frozen_metadata_json,
    make_tickets,
    restore_frozen_schedule,
)

_MAX_SPEC_BYTES = 16 * 1024
_MAX_STATE_BYTES = 2 * 1024 * 1024


def _read_metadata(path: Path, max_bytes: int) -> str:
    try:
        if not path.is_file() or path.stat().st_size > max_bytes:
            raise ValueError("metadata file is absent or oversized")
        payload = path.read_bytes()
        if len(payload) > max_bytes:
            raise ValueError("metadata changed while reading")
        return payload.decode("utf-8")
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        raise CommandValidationError(
            "invalid_frozen_schedule", "A bounded metadata-only JSON file is required.",
        ) from exc


def _read_specification(path: Path) -> FrozenRunSpecification:
    obj = decode_frozen_metadata_json(_read_metadata(path, _MAX_SPEC_BYTES))
    if not isinstance(obj, dict):
        raise CommandValidationError("invalid_frozen_schedule", "Specification must be a JSON object.")
    allowed = frozenset({
        "set_id", "run_id", "build_commit", "recipe_sha256",
        "face_count", "shards", "manifest_sha256",
        "definitions_sha256", "model_sha256", "baseline_commit",
    })
    if set(obj) != allowed:
        raise CommandValidationError("invalid_frozen_schedule", "Unexpected specification fields.")
    fields = obj
    return FrozenRunSpecification(
        set_id=_string(fields["set_id"]),
        run_id=_string(fields["run_id"]),
        build_commit=_string(fields["build_commit"]),
        recipe_sha256=_string(fields["recipe_sha256"]),
        face_count=_integer(fields["face_count"]),
        shards=_integer(fields["shards"]),
        manifest_sha256=_string(fields["manifest_sha256"]),
        definitions_sha256=_string(fields["definitions_sha256"]),
        model_sha256=_string(fields["model_sha256"]),
        baseline_commit=_string(fields["baseline_commit"]),
    )


def _string(value: object) -> str:
    if not isinstance(value, str):
        raise CommandValidationError("invalid_frozen_schedule", "Identifier must be a string.")
    return value


def _integer(value: object) -> int:
    if type(value) is not int:
        raise CommandValidationError("invalid_frozen_schedule", "Count must be an integer.")
    return value


def main(
    argv: Sequence[str] | None = None,
    *,
    out: TextIO | None = None,
    err: TextIO | None = None,
) -> int:
    """Return 0 for parsed metadata, 2 for rejected input, 3 for incomplete/failed evidence."""
    output = out if out is not None else sys.stdout
    errors = err if err is not None else sys.stderr
    parser = argparse.ArgumentParser(prog="pro-frozen-schedule")
    parser.add_argument("--spec", required=True, help="JSON with preregistered metadata only")
    parser.add_argument("--state", help="Optional aggregate-only resume checkpoint")
    parser.add_argument("--tickets", action="store_true", help="Print ordinal shard tickets")
    try:
        parsed = parser.parse_args(argv)
        spec = _read_specification(Path(parsed.spec))
        if parsed.state is None:
            ledger = FrozenScheduleLedger(spec)
        else:
            checkpoint = _read_metadata(Path(parsed.state), _MAX_STATE_BYTES)
            ledger = restore_frozen_schedule(checkpoint, spec)
        result = {
            "schedule": spec.public_metadata(),
            "schedule_sha256": spec.fingerprint,
            "evidence": ledger.status().public_metadata(),
            "tickets": [ticket.public_metadata() for ticket in make_tickets(spec)]
            if parsed.tickets else [],
            "release_qualified": False,
        }
        output.write(json.dumps(result, sort_keys=True, separators=(",", ":")) + "\n")
        if parsed.state is not None and ledger.status().status != "ready_for_external_gate":
            return 3
        return 0
    except CommandValidationError as exc:
        errors.write(f"{exc.code}: invalid or incomplete frozen metadata\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
