"""Bounded, private, streaming inputs for independent identity-pair evaluation.

These records contain sensitive pair relationships and must remain in the
operator's private workspace. No pair row is included in public summaries,
checkpoints, application bundles or the Tuesday technical-lock packet.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import math
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from typing import Literal, NoReturn, TextIO, cast

from .errors import CommandValidationError
from .identity_pairs import (
    IdentityPair,
    IdentityPairAudit,
    IdentityPolicy,
    RequiredSlice,
    evaluate_identity_pairs,
)

_SHARD_VERSION = "beljour-private-identity-pairs/1"
_HEADER = frozenset({
    "version", "run_id", "policy_sha256", "manifest_sha256", "model_sha256",
    "preprocessing_sha256", "definitions_sha256", "shard_index", "shard_count",
    "row_count", "rows_sha256", "source_kind",
})
_ROW = frozenset({
    "pair_id", "source_a", "source_b", "subject_a", "subject_b", "genuine",
    "cosine", "slices", "consent_and_rights_checked",
    "reference_labels_checked", "split",
})
_SLICE = frozenset({"dimension", "label"})
_MAX_BYTES = 32 * 1024 * 1024
_MAX_LINE = 12 * 1024
_MAX_ROWS = 100_000
_MAX_SHARDS = 4096


def _refuse(detail: str) -> NoReturn:
    raise CommandValidationError("invalid_identity_shard", detail)


def _pairs_unique(entries: list[tuple[str, object]]) -> dict[str, object]:
    found: dict[str, object] = {}
    for key, value in entries:
        if key in found:
            _refuse("Duplicate JSON keys are forbidden in private evidence.")
        found[key] = value
    return found


def _no_constants(value: str) -> None:
    _refuse(f"Non-finite JSON constant {value} is not allowed.")


def _parse_json(line: str) -> object:
    try:
        return cast(
            object,
            json.loads(line, object_pairs_hook=_pairs_unique, parse_constant=_no_constants),
        )
    except (ValueError, TypeError, UnicodeError) as error:
        _refuse(f"Malformed private evidence JSON: {type(error).__name__}.")
    raise AssertionError("Unreachable JSON parser state")


def _mapping(value: object, keys: frozenset[str]) -> Mapping[str, object]:
    if not isinstance(value, dict) or set(value) != keys:
        _refuse("Private evidence has missing or unexpected fields.")
    if any(type(key) is not str for key in value):
        _refuse("Private evidence object keys must be strings.")
    return cast(Mapping[str, object], value)


def _string(value: object, label: str) -> str:
    if type(value) is not str:
        _refuse(f"{label} must be a string.")
    return cast(str, value)


def _integer(value: object, label: str) -> int:
    if type(value) is not int:
        _refuse(f"{label} must be an integer.")
    return cast(int, value)


def _boolean(value: object, label: str) -> bool:
    if type(value) is not bool:
        _refuse(f"{label} must be a boolean.")
    return cast(bool, value)


def _number(value: object, label: str) -> float:
    if type(value) not in (int, float):
        _refuse(f"{label} must be numeric.")
    number = cast(float, value)
    if not math.isfinite(number):
        _refuse(f"{label} must be finite.")
    return number


def _slices(value: object) -> tuple[RequiredSlice, ...]:
    if not isinstance(value, list) or len(value) > 6:
        _refuse("Pair slice fields exceed the frozen schema.")
    tags: list[RequiredSlice] = []
    for raw in value:
        row = _mapping(raw, _SLICE)
        tags.append(RequiredSlice(_string(row["dimension"], "dimension"),
                                  _string(row["label"], "label")))
    return tuple(tags)


def _parse_row(value: object) -> IdentityPair:
    row = _mapping(value, _ROW)
    split = _string(row["split"], "split")
    if split not in ("calibration", "frozen"):
        _refuse("Pair split must be calibration or frozen.")
    return IdentityPair(
        pair_id=_string(row["pair_id"], "pair_id"),
        source_a=_string(row["source_a"], "source_a"),
        source_b=_string(row["source_b"], "source_b"),
        subject_a=_string(row["subject_a"], "subject_a"),
        subject_b=_string(row["subject_b"], "subject_b"),
        genuine=_boolean(row["genuine"], "genuine"),
        cosine=_number(row["cosine"], "cosine"),
        slices=_slices(row["slices"]),
        consent_and_rights_checked=_boolean(
            row["consent_and_rights_checked"], "consent_and_rights_checked",
        ),
        reference_labels_checked=_boolean(
            row["reference_labels_checked"], "reference_labels_checked",
        ),
        split=cast(Literal["calibration", "frozen"], split),
    )


@dataclass(frozen=True, slots=True)
class PrivatePairShard:
    """Contains sensitive rows; must never be serialized into public packets."""

    run_id: str
    policy_sha256: str
    shard_index: int
    shard_count: int
    expected_count: int
    row_digest: str
    source_kind: str
    rows: tuple[IdentityPair, ...]

    def public_status(self) -> dict[str, object]:
        return {
            "shard_index": self.shard_index,
            "shard_count": self.shard_count,
            "rows_read": len(self.rows),
            "valid_row_count": len(self.rows) == self.expected_count,
        }


def _checked_stream_lines(source: TextIO) -> Iterable[str]:
    total = 0
    for number, line in enumerate(source):
        if type(line) is not str:
            _refuse("Private pair reader requires UTF-8 text.")
        line_bytes = len(line.encode("utf-8"))
        total += line_bytes
        if line_bytes > _MAX_LINE or total > _MAX_BYTES:
            _refuse("Private pair input exceeds the local resource limit.")
        if number > _MAX_ROWS:
            _refuse("Private pair input has too many rows.")
        if not line.strip():
            _refuse("Blank records are not allowed in private pair evidence.")
        yield line


def read_private_pair_shard(source: TextIO, policy: IdentityPolicy) -> PrivatePairShard:
    """Read a private JSONL shard with exact policy binding and bounded memory."""
    source_lines = iter(_checked_stream_lines(source))
    try:
        first = next(source_lines)
    except StopIteration:
        _refuse("Private pair shard is empty.")
    header = _mapping(_parse_json(first), _HEADER)
    if _string(header["version"], "version") != _SHARD_VERSION:
        _refuse("Private pair schema version is unsupported.")
    run_id = _string(header["run_id"], "run_id")
    if not run_id or len(run_id) > 80 or not run_id.replace("-", "").replace("_", "").isalnum():
        _refuse("Run ID must be an opaque, bounded token.")
    if _string(header["policy_sha256"], "policy_sha256") != policy.fingerprint():
        _refuse("Shard policy does not match the frozen evaluation policy.")
    for name, expected in (
        ("manifest_sha256", policy.manifest_sha256),
        ("model_sha256", policy.model_sha256),
        ("preprocessing_sha256", policy.preprocessing_sha256),
        ("definitions_sha256", policy.definitions_sha256),
    ):
        if _string(header[name], name) != expected:
            _refuse("Shard model, definition or manifest identity has changed.")
    count = _integer(header["row_count"], "row_count")
    index = _integer(header["shard_index"], "shard_index")
    total = _integer(header["shard_count"], "shard_count")
    if not 0 <= index < total <= _MAX_SHARDS or not 0 <= count <= _MAX_ROWS:
        _refuse("Shard numbering or declared row count is invalid.")
    row_digest = _string(header["rows_sha256"], "rows_sha256")
    if len(row_digest) != 64 or any(char not in "0123456789abcdef" for char in row_digest):
        _refuse("Shard rows require a lowercase SHA-256 checksum.")
    source_kind = _string(header["source_kind"], "source_kind")
    if source_kind not in ("synthetic", "authorized_private"):
        _refuse("Shard source class must be explicit.")
    rows: list[IdentityPair] = []
    checksum = hashlib.sha256()
    for line in source_lines:
        if len(rows) >= count:
            _refuse("Private shard contains records beyond its declared count.")
        raw = _parse_json(line)
        checksum.update(json.dumps(raw, sort_keys=True, separators=(",", ":"),
                                   ensure_ascii=True, allow_nan=False).encode("ascii"))
        checksum.update(b"\n")
        rows.append(_parse_row(raw))
    if len(rows) != count:
        _refuse("Private shard is incomplete.")
    if checksum.hexdigest() != row_digest:
        _refuse("Private shard payload checksum does not match.")
    return PrivatePairShard(
        run_id=run_id,
        policy_sha256=policy.fingerprint(),
        shard_index=index,
        shard_count=total,
        expected_count=count,
        row_digest=row_digest,
        source_kind=source_kind,
        rows=tuple(rows),
    )


def combine_private_pair_shards(
    shards: Sequence[PrivatePairShard], policy: IdentityPolicy,
) -> IdentityPairAudit:
    """Do not merge partial/mixed sharded evidence into an accepted audit."""
    if not shards or len(shards) > _MAX_SHARDS:
        _refuse("No complete private pair shard set was supplied.")
    first = shards[0]
    if len(shards) != first.shard_count:
        _refuse("Private pair shards are incomplete.")
    indices: set[int] = set()
    rows: list[IdentityPair] = []
    for shard in shards:
        if (
            shard.run_id != first.run_id
            or shard.shard_count != first.shard_count
            or shard.source_kind != first.source_kind
            or shard.policy_sha256 != policy.fingerprint()
        ):
            _refuse("Pair shard run identity, provenance or policy differs.")
        if shard.shard_index in indices or not 0 <= shard.shard_index < shard.shard_count:
            _refuse("Pair shards have missing or repeated indexes.")
        if len(shard.rows) != shard.expected_count:
            _refuse("One private shard has an invalid row count.")
        indices.add(shard.shard_index)
        rows.extend(shard.rows)
        if len(rows) > 1_000_000:
            _refuse("Combined private evidence exceeds the bounded audit size.")
    if indices != set(range(first.shard_count)):
        _refuse("The private shard set is missing an index.")
    return evaluate_identity_pairs(
        rows, policy,
        measured_on_external_faces=first.source_kind == "authorized_private",
    )
