"""Streaming manifests: round trip, gzip stability, shards and tamper checks.

Includes building and re-reading a 100k-row synthetic manifest.
Author: John Khan.
"""

from __future__ import annotations

import gzip
import json
import time
from pathlib import Path

import pytest

from plumb_api.data_factory.hashing import shard_of
from plumb_api.data_factory.manifest import (
    MANIFEST_SCHEMA,
    ManifestError,
    ManifestReader,
    ManifestWriter,
    read_manifest,
    verify_manifest,
    write_manifest,
)
from plumb_api.data_factory.synthetic import fake_records


def build(path: Path, count: int = 50, *, compress: bool = False, shards: int = 8) -> None:
    rows = [(record, {"quality": 0.5 + index / 1000}) for index, record in
            enumerate(fake_records(count, seed=21))]
    write_manifest(path, rows, shards=shards, compress=compress)


def rewrite_line(path: Path, number: int, edit: dict[str, object]) -> None:
    lines = path.read_text().splitlines()
    value = json.loads(lines[number])
    value.update(edit)
    lines[number] = json.dumps(value, sort_keys=True, separators=(",", ":"))
    path.write_text("\n".join(lines) + "\n")


def test_round_trip(tmp_path: Path) -> None:
    path = tmp_path / "set.jsonl"
    build(path)
    rows, summary = read_manifest(path)
    assert summary.count == len(rows) == 50
    assert sum(shard.count for shard in summary.shards.values()) == 50
    assert all(row.shard == shard_of(row.record.content_sha256, 8) for row in rows)
    assert rows[3].annotations == {"quality": 0.503}
    assert json.loads(path.read_text().splitlines()[0])["schema"] == MANIFEST_SCHEMA
    assert not summary.compressed
    assert not (tmp_path / "set.jsonl.partial").exists()


def test_gzip_is_byte_stable(tmp_path: Path) -> None:
    first, second = tmp_path / "a.jsonl.gz", tmp_path / "b.jsonl.gz"
    build(first, compress=True)
    build(second, compress=True)
    assert first.read_bytes() == second.read_bytes()
    summary = verify_manifest(first)
    assert summary.compressed and summary.count == 50
    plain = tmp_path / "c.jsonl"
    build(plain)
    assert gzip.decompress(first.read_bytes()) == plain.read_bytes()
    assert verify_manifest(plain).rows_sha256 == summary.rows_sha256


def test_duplicate_records_refused_on_write(tmp_path: Path) -> None:
    record = next(fake_records(1))
    with pytest.raises(ManifestError), ManifestWriter(tmp_path / "d.jsonl") as writer:
        writer.write(record)
        writer.write(record)
    assert not (tmp_path / "d.jsonl").exists()
    assert not (tmp_path / "d.jsonl.partial").exists()


@pytest.mark.parametrize(("line", "edit", "message"), [
    (3, {"source": "edited"}, "footer hash"),
    (3, {"shard": 99}, "shard does not match"),
    (3, {"licence": ""}, "licence: missing"),
    (0, {"schema": "other/1"}, "schema"),
    (0, {"shards": 0}, "shard count"),
])
def test_tampering_is_caught(tmp_path: Path, line: int, edit: dict[str, object],
                             message: str) -> None:
    path = tmp_path / "t.jsonl"
    build(path)
    rewrite_line(path, line, edit)
    with pytest.raises(ManifestError, match=message):
        verify_manifest(path)


def test_truncation_and_reordering(tmp_path: Path) -> None:
    path = tmp_path / "x.jsonl"
    build(path)
    lines = path.read_text().splitlines()
    path.write_text("\n".join(lines[:-1]) + "\n")
    with pytest.raises(ManifestError, match="no footer"):
        verify_manifest(path)
    path.write_text("\n".join([lines[0], lines[2], lines[1]] + lines[3:]) + "\n")
    with pytest.raises(ManifestError, match="footer hash"):
        verify_manifest(path)
    path.write_text("\n".join(lines + [lines[1]]) + "\n")
    with pytest.raises(ManifestError, match="after the footer"):
        verify_manifest(path)
    path.write_text("\n".join(lines[:2] + [lines[1]] + lines[2:]) + "\n")
    with pytest.raises(ManifestError, match="duplicate"):
        verify_manifest(path)
    path.write_text(lines[0] + "\n[1]\n")
    with pytest.raises(ManifestError, match="JSON object"):
        verify_manifest(path)
    path.write_text(lines[0] + "\n{oops\n")
    with pytest.raises(ManifestError, match="valid JSON"):
        verify_manifest(path)


def test_truncated_gzip(tmp_path: Path) -> None:
    path = tmp_path / "g.jsonl.gz"
    build(path, count=400, compress=True)
    data = path.read_bytes()
    path.write_bytes(data[: len(data) // 2])
    with pytest.raises(ManifestError):
        verify_manifest(path)


def test_reader_header_and_bad_rows(tmp_path: Path) -> None:
    path = tmp_path / "h.jsonl"
    build(path, count=3)
    reader = ManifestReader(path)
    assert len(list(reader)) == 3
    assert reader.header["shards"] == 8
    rewrite_line(path, 1, {"annotations": [1]})
    with pytest.raises(ManifestError, match="annotations"):
        verify_manifest(path)
    empty = tmp_path / "empty.jsonl"
    empty.write_text("")
    with pytest.raises(ManifestError):
        verify_manifest(empty)
    with pytest.raises(ManifestError):
        ManifestWriter(tmp_path / "bad.jsonl", shards=0)


def test_hundred_thousand_rows_build_and_reread(tmp_path: Path) -> None:
    path = tmp_path / "big.jsonl.gz"
    started = time.perf_counter()
    summary = write_manifest(path, ((r, {}) for r in fake_records(100_000, seed=5)),
                             shards=64, compress=True)
    rows, again = read_manifest(path)
    elapsed = time.perf_counter() - started
    assert summary.count == again.count == len(rows) == 100_000
    assert summary.rows_sha256 == again.rows_sha256
    assert summary.file_sha256 == again.file_sha256
    assert len(again.shards) == 64
    assert elapsed < 60.0, f"100k manifest took {elapsed:.1f}s"
