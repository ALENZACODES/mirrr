"""Tampered, truncated or reordered stream bytes are refused before trust.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import sha256_bytes
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_io import (
    STREAM_HEADER,
    STREAM_ROWS,
    iter_stream,
    open_stream,
)
from lab.synth_diversity.types import SyntheticInputError


def test_edited_row_fails_header_digest(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rows = world.stream / STREAM_ROWS
    rows.write_bytes(rows.read_bytes().replace(b"run-own-a", b"run-own-x", 1))
    with pytest.raises(SyntheticInputError, match="digest"):
        open_stream(world.stream)


def test_truncated_rows_fail_length(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rows = world.stream / STREAM_ROWS
    rows.write_bytes(rows.read_bytes()[:-10])
    with pytest.raises(SyntheticInputError, match="byte length"):
        open_stream(world.stream)


def test_reordered_rows_with_rewritten_header_still_fail(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    rows = world.stream / STREAM_ROWS
    lines = rows.read_bytes().splitlines(keepends=True)
    data = b"".join([lines[1], lines[0], *lines[2:]])
    rows.write_bytes(data)
    header_path = world.stream / STREAM_HEADER
    header = json.loads(header_path.read_text())
    header["sha256"] = sha256_bytes(data)
    header_path.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")
    parsed = open_stream(world.stream)
    with pytest.raises(SyntheticInputError):
        list(iter_stream(world.stream, parsed))


def test_header_field_edit_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    header_path = world.stream / STREAM_HEADER
    header = json.loads(header_path.read_text())
    header["schema"] = "OTHER"
    header_path.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError, match="schema"):
        open_stream(world.stream)
