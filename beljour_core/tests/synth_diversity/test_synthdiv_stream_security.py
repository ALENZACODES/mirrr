"""Symlinks, extra files, duplicate keys and nonfinite values in streams fail.
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


def rewrite_rows(stream: Path, data: bytes) -> None:
    (stream / STREAM_ROWS).write_bytes(data)
    path = stream / STREAM_HEADER
    header = json.loads(path.read_text())
    header["sha256"], header["bytes"] = sha256_bytes(data), len(data)
    path.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")


def test_symlinked_stream_folder_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    (tmp_path / "alias").symlink_to(world.stream)
    with pytest.raises(SyntheticInputError):
        open_stream(tmp_path / "alias")


def test_symlinked_rows_file_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path / "w")
    rows = world.stream / STREAM_ROWS
    rows.rename(tmp_path / "moved")
    rows.symlink_to(tmp_path / "moved")
    with pytest.raises(SyntheticInputError):
        open_stream(world.stream)


def test_extra_file_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    (world.stream / "photo.png").write_bytes(b"\x89PNG")
    with pytest.raises(SyntheticInputError, match="unexpected"):
        open_stream(world.stream)


def test_duplicate_key_inside_row_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    lines = (world.stream / STREAM_ROWS).read_bytes().splitlines(keepends=True)
    lines[0] = lines[0].replace(b'{"format":1,', b'{"format":1,"format":1,', 1)
    rewrite_rows(world.stream, b"".join(lines))
    with pytest.raises(SyntheticInputError, match="duplicate JSON key"):
        list(iter_stream(world.stream, open_stream(world.stream)))


def test_nonfinite_value_inside_row_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    lines = (world.stream / STREAM_ROWS).read_bytes().splitlines(keepends=True)
    lines[0] = lines[0].replace(b'"format":1,', b'"format":NaN,', 1)
    rewrite_rows(world.stream, b"".join(lines))
    with pytest.raises(SyntheticInputError, match="nonfinite"):
        list(iter_stream(world.stream, open_stream(world.stream)))
