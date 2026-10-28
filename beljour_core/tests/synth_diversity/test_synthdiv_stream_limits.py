"""Stream byte and row limits, framing and declared-count bounds.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_provenance import sha256_bytes
from lab.synth_diversity.stress_provenance_stream_contract import MAX_STREAM_ROW_BYTES
from lab.synth_diversity.stress_provenance_stream_fixtures import build_world
from lab.synth_diversity.stress_provenance_stream_io import (
    MAX_STREAM_ROWS,
    STREAM_HEADER,
    STREAM_ROWS,
    header_from_dict,
    iter_stream,
    open_stream,
)
from lab.synth_diversity.types import SyntheticInputError


def header_dict(world_stream: Path) -> dict[str, object]:
    return json.loads((world_stream / STREAM_HEADER).read_text())


def test_declared_row_count_is_bounded(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    data = header_dict(world.stream)
    with pytest.raises(SyntheticInputError, match="too many rows"):
        header_from_dict({**data, "rows": MAX_STREAM_ROWS + 1})
    with pytest.raises(SyntheticInputError):
        header_from_dict({**data, "rows": -1})


def test_oversized_row_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    big = b'{"pad":"' + b"x" * MAX_STREAM_ROW_BYTES + b'"}\n'
    data = (world.stream / STREAM_ROWS).read_bytes() + big
    (world.stream / STREAM_ROWS).write_bytes(data)
    path = world.stream / STREAM_HEADER
    header = header_dict(world.stream)
    header["sha256"], header["bytes"] = sha256_bytes(data), len(data)
    path.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError, match="framing or size"):
        list(iter_stream(world.stream, open_stream(world.stream)))


def test_missing_final_newline_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    data = (world.stream / STREAM_ROWS).read_bytes()[:-1]
    (world.stream / STREAM_ROWS).write_bytes(data)
    path = world.stream / STREAM_HEADER
    header = header_dict(world.stream)
    header["sha256"], header["bytes"] = sha256_bytes(data), len(data)
    path.write_text(json.dumps(header, sort_keys=True, separators=(",", ":")) + "\n")
    with pytest.raises(SyntheticInputError, match="framing"):
        list(iter_stream(world.stream, open_stream(world.stream)))


def test_oversized_header_is_refused(tmp_path: Path) -> None:
    world = build_world(tmp_path)
    path = world.stream / STREAM_HEADER
    path.write_bytes(path.read_bytes()[:-1] + b" " * 20_000 + b"\n")
    with pytest.raises(SyntheticInputError, match="size"):
        open_stream(world.stream)
