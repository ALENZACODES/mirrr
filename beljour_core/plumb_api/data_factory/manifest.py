"""Streaming JSONL manifests with content hashes and deterministic shards.

Layout: one header line (schema, shard count, tool version), one line per
record, one footer line (row count, hash of all rows, count and hash per
shard). The writer streams to a temporary file and renames it into place on
close, so a crashed run never leaves a half manifest under the final name.
Gzip output is byte-stable (no timestamp, no file name). The reader verifies
the footer and fails on truncation, duplicates or any edited row.
Author: John Khan.
"""

from __future__ import annotations

import gzip
import io
import json
import os
import zlib
from collections.abc import Iterable, Iterator, Mapping
from dataclasses import dataclass, field
from pathlib import Path
from types import TracebackType
from typing import IO, Any

from .hashing import RollingHash, canonical_json, sha256_file, shard_of
from .records import ImageRecord, RecordError

MANIFEST_SCHEMA = "beljour-data-manifest/1"
TOOL_NAME = "plumb_api.data_factory"
TOOL_VERSION = "1.0.0"
MAX_SHARDS = 4096
GZIP_MAGIC = b"\x1f\x8b"
READ_ERRORS = (OSError, EOFError, UnicodeDecodeError, zlib.error)


class ManifestError(ValueError):
    """A manifest is malformed, truncated or does not match its footer."""


@dataclass(frozen=True)
class ManifestRow:
    """One record as stored in a manifest."""

    record: ImageRecord
    shard: int
    annotations: Mapping[str, Any] = field(default_factory=dict)

    def to_json(self) -> dict[str, Any]:
        """Row object written on one line."""
        row = self.record.to_dict()
        row["shard"] = self.shard
        if self.annotations:
            row["annotations"] = dict(self.annotations)
        return row


@dataclass(frozen=True)
class ShardSummary:
    """Row count and order-sensitive hash of one shard."""

    count: int
    sha256: str

    def to_dict(self) -> dict[str, Any]:
        """JSON form."""
        return {"count": self.count, "sha256": self.sha256}


@dataclass(frozen=True)
class ManifestSummary:
    """Footer contents plus the hash of the finished file."""

    count: int
    rows_sha256: str
    shards: dict[int, ShardSummary]
    shard_count: int
    file_sha256: str
    compressed: bool

    def footer(self) -> dict[str, Any]:
        """Footer object as written in the file."""
        return {"count": self.count, "rows_sha256": self.rows_sha256,
                "shards": {str(k): v.to_dict() for k, v in sorted(self.shards.items())}}


def _header(shards: int) -> dict[str, Any]:
    return {"schema": MANIFEST_SCHEMA, "shards": shards, "tool": TOOL_NAME,
            "tool_version": TOOL_VERSION}


class ManifestWriter:
    """Context manager that streams rows and writes the footer on close."""

    def __init__(self, path: Path, *, shards: int = 16, compress: bool = False) -> None:
        if not 1 <= shards <= MAX_SHARDS:
            raise ManifestError(f"shard count must be between 1 and {MAX_SHARDS}")
        self.path = path
        self.shards = shards
        self.compress = compress
        self._tmp = path.with_name(path.name + ".partial")
        self._raw: IO[bytes] | None = None
        self._out: IO[bytes] | gzip.GzipFile | None = None
        self._all = RollingHash()
        self._per_shard: dict[int, RollingHash] = {}
        self._seen: set[str] = set()
        self.summary: ManifestSummary | None = None

    def __enter__(self) -> ManifestWriter:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._raw = self._tmp.open("wb")
        if self.compress:
            self._out = gzip.GzipFile(filename="", mode="wb", fileobj=self._raw, mtime=0)
        else:
            self._out = self._raw
        self._line(_header(self.shards))
        return self

    def _line(self, value: Mapping[str, Any]) -> None:
        if self._out is None:
            raise ManifestError("manifest writer is not open")
        self._out.write(canonical_json(value).encode("utf-8") + b"\n")

    def write(self, record: ImageRecord, annotations: Mapping[str, Any] | None = None
              ) -> ManifestRow:
        """Append one record; its shard comes from its content hash."""
        if record.content_sha256 in self._seen:
            raise ManifestError(f"duplicate record {record.content_sha256[:12]}")
        self._seen.add(record.content_sha256)
        row = ManifestRow(record, shard_of(record.content_sha256, self.shards),
                          dict(annotations or {}))
        text = canonical_json(row.to_json())
        if self._out is None:
            raise ManifestError("manifest writer is not open")
        self._out.write(text.encode("utf-8") + b"\n")
        self._all.add_line(text)
        self._per_shard.setdefault(row.shard, RollingHash()).add_line(text)
        return row

    def __exit__(self, kind: type[BaseException] | None, error: BaseException | None,
                 trace: TracebackType | None) -> None:
        if kind is not None:
            self._close_streams()
            self._tmp.unlink(missing_ok=True)
            return
        shards = {k: ShardSummary(v.count, v.hexdigest())
                  for k, v in sorted(self._per_shard.items())}
        footer = {"count": self._all.count, "rows_sha256": self._all.hexdigest(),
                  "shards": {str(k): v.to_dict() for k, v in shards.items()}}
        self._line({"footer": footer})
        self._close_streams()
        os.replace(self._tmp, self.path)
        self.summary = ManifestSummary(self._all.count, self._all.hexdigest(), shards,
                                       self.shards, sha256_file(self.path), self.compress)

    def _close_streams(self) -> None:
        if self._out is not None and self._out is not self._raw:
            self._out.close()
        if self._raw is not None:
            self._raw.close()
        self._out = None
        self._raw = None


def is_gzip(path: Path) -> bool:
    """True when the file starts with the gzip magic bytes."""
    with path.open("rb") as probe:
        return probe.read(2) == GZIP_MAGIC


def _open_text(path: Path) -> IO[str]:
    if is_gzip(path):
        return io.TextIOWrapper(gzip.GzipFile(filename=str(path), mode="rb"), encoding="utf-8")
    return path.open("r", encoding="utf-8")


def _parse(line: str, number: int) -> dict[str, Any]:
    try:
        value = json.loads(line)
    except ValueError as exc:
        raise ManifestError(f"line {number}: not valid JSON") from exc
    if not isinstance(value, dict):
        raise ManifestError(f"line {number}: must be a JSON object")
    return value


def _row(value: dict[str, Any], number: int, shards: int) -> ManifestRow:
    data = dict(value)
    shard = data.pop("shard", None)
    annotations = data.pop("annotations", {})
    if not isinstance(shard, int) or isinstance(shard, bool):
        raise ManifestError(f"line {number}: shard missing")
    if not isinstance(annotations, dict):
        raise ManifestError(f"line {number}: annotations must be an object")
    try:
        record = ImageRecord.from_dict(data)
    except RecordError as exc:
        raise ManifestError(f"line {number}: {exc}") from exc
    if shard != shard_of(record.content_sha256, shards):
        raise ManifestError(f"line {number}: shard does not match the content hash")
    return ManifestRow(record, shard, annotations)


@dataclass
class ManifestReader:
    """Iterates rows and verifies the footer once the last row is read."""

    path: Path
    header: dict[str, Any] = field(default_factory=dict)
    summary: ManifestSummary | None = None

    def __iter__(self) -> Iterator[ManifestRow]:
        return self._rows()

    def _rows(self) -> Iterator[ManifestRow]:
        all_rows = RollingHash()
        per_shard: dict[int, RollingHash] = {}
        seen: set[str] = set()
        footer: dict[str, Any] | None = None
        with _open_text(self.path) as handle:
            try:
                first = handle.readline()
            except READ_ERRORS as exc:
                raise ManifestError("manifest unreadable") from exc
            self.header = _parse(first, 1) if first else {}
            if self.header.get("schema") != MANIFEST_SCHEMA:
                raise ManifestError(f"manifest schema must be {MANIFEST_SCHEMA}")
            shards = self.header.get("shards")
            if not isinstance(shards, int) or not 1 <= shards <= MAX_SHARDS:
                raise ManifestError("manifest header has no valid shard count")
            number = 1
            try:
                for line in handle:
                    number += 1
                    if footer is not None:
                        raise ManifestError(f"line {number}: data after the footer")
                    value = _parse(line, number)
                    if "footer" in value:
                        footer = value["footer"]
                        continue
                    row = _row(value, number, shards)
                    if row.record.content_sha256 in seen:
                        raise ManifestError(f"line {number}: duplicate content hash")
                    seen.add(row.record.content_sha256)
                    # Rows are written canonically, so the line text is what was hashed.
                    text = line.rstrip("\n")
                    all_rows.add_line(text)
                    per_shard.setdefault(row.shard, RollingHash()).add_line(text)
                    yield row
            except READ_ERRORS as exc:
                raise ManifestError(f"manifest damaged or truncated near line {number}") from exc
        self._finish(footer, all_rows, per_shard, shards)

    def _finish(self, footer: Any, all_rows: RollingHash, per_shard: dict[int, RollingHash],
                shards: int) -> None:
        if not isinstance(footer, dict):
            raise ManifestError("manifest has no footer (truncated)")
        if footer.get("count") != all_rows.count:
            raise ManifestError("manifest row count does not match its footer")
        if footer.get("rows_sha256") != all_rows.hexdigest():
            raise ManifestError("manifest rows do not match the footer hash")
        computed = {str(k): ShardSummary(v.count, v.hexdigest()).to_dict()
                    for k, v in sorted(per_shard.items())}
        if footer.get("shards") != computed:
            raise ManifestError("manifest shard hashes do not match the footer")
        self.summary = ManifestSummary(
            all_rows.count, all_rows.hexdigest(),
            {k: ShardSummary(v.count, v.hexdigest()) for k, v in sorted(per_shard.items())},
            shards, sha256_file(self.path), is_gzip(self.path))


def read_manifest(path: Path) -> tuple[list[ManifestRow], ManifestSummary]:
    """Read and verify a whole manifest."""
    reader = ManifestReader(path)
    rows = list(reader)
    if reader.summary is None:
        raise ManifestError("manifest verification did not complete")
    return rows, reader.summary


def verify_manifest(path: Path) -> ManifestSummary:
    """Stream through a manifest only to verify it."""
    reader = ManifestReader(path)
    for _ in reader:
        pass
    if reader.summary is None:
        raise ManifestError("manifest verification did not complete")
    return reader.summary


def write_manifest(path: Path, rows: Iterable[tuple[ImageRecord, Mapping[str, Any]]], *,
                   shards: int = 16, compress: bool = False) -> ManifestSummary:
    """Write (record, annotations) pairs in the given order."""
    writer = ManifestWriter(path, shards=shards, compress=compress)
    with writer:
        for record, annotations in rows:
            writer.write(record, annotations)
    if writer.summary is None:
        raise ManifestError("manifest was not finished")
    return writer.summary
