"""Optional numeric shard index for fast resumable streaming of large manifests.

Building the index costs one audited pass over both approved manifests. It then
stores, per split, two parallel NumPy arrays: the shard number of every row
(sorted) and the byte offset of that row in the manifest. A reader finds its
shard's rows with two binary searches instead of rescanning the manifest.

The index holds integers only: no subject keys, image hashes, sources or paths.
Its metadata binds it to the manifest digest, revocation digest, training plan
and shard count, and records the SHA-256 of each array, so an index left over
from an earlier corpus (for example after a consent withdrawal) is refused.
Rows read through the index are still fully re-validated, image bytes included,
by `shard_stream.ShardReader`. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import stat
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray

from .atomic import decode_private_json, read_private_bytes, write_private_bytes, write_private_json
from .audit import MAX_ROW_BYTES, CorpusAudit, _json_dict, _valid_grant, validate_corpus
from .pipeline import TrainingPlan, partition
from .shard_stream import subject_shard

INDEX_SCHEMA = "beljour-shard-index/1"
METADATA_NAME = "shard-index.json"
SPLITS = ("train", "eval")
_HEADER_ALLOWANCE = 4096
_META_KEYS = frozenset({
    "schema", "manifest_sha256", "revocations_sha256", "plan_sha256",
    "shard_count", "rows", "arrays",
})


def _array_name(split: str, kind: str) -> str:
    return f"{split}-{kind}.npy"


def _checked_folder(index_dir: Path, *protected: Path) -> None:
    if index_dir.is_symlink():
        raise ValueError("Shard index folder must not be a symlink")
    for folder in protected:
        root, target = folder.resolve(), index_dir.resolve()
        if target == root or target.is_relative_to(root):
            raise ValueError("Keep the shard index outside the approved corpus and images")
    if index_dir.exists() and index_dir.stat().st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise ValueError("Shard index folder is writable by other users")


def _scan(approved: Path, plan: TrainingPlan, split: str, shard_count: int) -> tuple[
    NDArray[np.uint32], NDArray[np.uint64],
]:
    shards: list[int] = []
    offsets: list[int] = []
    offset = 0
    with (approved / f"{split}.jsonl").open("rb") as stream:
        for line in stream:
            if len(line) > MAX_ROW_BYTES or not line.endswith(b"\n"):
                raise ValueError("Invalid approved manifest row")
            grant = _valid_grant(_json_dict(line, "invalid_filtered_record"))
            if partition(grant.subject_key, plan.seed, plan.holdout_fraction) != split:
                raise ValueError("Approved manifest row is in the wrong split")
            shards.append(subject_shard(grant.subject_key, plan.seed, shard_count))
            offsets.append(offset)
            offset += len(line)
    order = np.lexsort((np.asarray(offsets, dtype=np.uint64), np.asarray(shards, dtype=np.uint32)))
    return (
        np.asarray(shards, dtype=np.uint32)[order],
        np.asarray(offsets, dtype=np.uint64)[order],
    )


def _npy_bytes(array: NDArray[Any]) -> bytes:
    buffer = io.BytesIO()
    np.save(buffer, array, allow_pickle=False)
    return buffer.getvalue()


def build_shard_index(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    index_dir: Path,
    *,
    shard_count: int = 64,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Audit once, write the numeric arrays, then publish the binding metadata last."""
    subject_shard("0" * 64, plan.seed, shard_count)
    audit = validate_corpus(
        approved, images, plan, revocations=revocations, check_image_bytes=False,
    )
    _checked_folder(index_dir, approved, images)
    index_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    arrays: dict[str, str] = {}
    rows: dict[str, int] = {}
    largest: dict[str, int] = {}
    empty: dict[str, int] = {}
    for split in SPLITS:
        shards, offsets = _scan(approved, plan, split, shard_count)
        counts = np.bincount(shards, minlength=shard_count)
        rows[split] = int(shards.size)
        largest[split] = int(counts.max())
        empty[split] = int(np.count_nonzero(counts == 0))
        for kind, values in (("shards", shards), ("offsets", offsets)):
            name = _array_name(split, kind)
            arrays[name] = write_private_bytes(index_dir / name, _npy_bytes(values))
    if (rows["train"], rows["eval"]) != (audit.train_count, audit.eval_count):
        raise ValueError("Approved manifests changed while indexing")
    write_private_json(index_dir / METADATA_NAME, {
        "schema": INDEX_SCHEMA,
        "manifest_sha256": audit.manifest_sha256,
        "revocations_sha256": audit.revocations_sha256,
        "plan_sha256": plan.digest(),
        "shard_count": shard_count,
        "rows": rows,
        "arrays": arrays,
    })
    return {
        "schema": "beljour-shard-index-report/1",
        "shard_count": shard_count,
        "rows": rows,
        "largest_shard": largest,
        "empty_shards": empty,
        "contents": "NUMERIC_OFFSETS_ONLY",
        "image_bytes": "VERIFIED_WHEN_STREAMED",
    }


def _load_array(path: Path, digest: str, rows: int, dtype: type[np.generic]) -> NDArray[Any]:
    data = read_private_bytes(path, max_bytes=rows * 8 + _HEADER_ALLOWANCE)
    if hashlib.sha256(data).hexdigest() != digest:
        raise ValueError("Shard index array digest mismatch")
    array = np.load(io.BytesIO(data), allow_pickle=False)
    if array.dtype != np.dtype(dtype) or array.shape != (rows,):
        raise ValueError("Unexpected shard index array")
    return array


@dataclass(frozen=True)
class ShardIndex:
    manifest_sha256: str
    revocations_sha256: str | None
    plan_sha256: str
    shard_count: int
    sha256: str
    shards: dict[str, NDArray[np.uint32]]
    offsets: dict[str, NDArray[np.uint64]]

    @classmethod
    def load(
        cls, index_dir: Path, audit: CorpusAudit, plan: TrainingPlan, *, approved: Path,
    ) -> ShardIndex:
        """Open an index only if it was built for exactly this audit and plan."""
        _checked_folder(index_dir, approved)
        raw = read_private_bytes(index_dir / METADATA_NAME, max_bytes=8192)
        metadata = decode_private_json(raw)
        if set(metadata) != _META_KEYS or metadata["schema"] != INDEX_SCHEMA:
            raise ValueError("Unsupported shard index")
        if (metadata["manifest_sha256"], metadata["revocations_sha256"], metadata["plan_sha256"]) != (
            audit.manifest_sha256, audit.revocations_sha256, plan.digest()
        ):
            raise ValueError("Shard index was built for a different corpus or plan")
        count = metadata["shard_count"]
        subject_shard("0" * 64, plan.seed, count)
        expected_rows = {"train": audit.train_count, "eval": audit.eval_count}
        if metadata["rows"] != expected_rows or not isinstance(metadata["arrays"], dict) or set(
            metadata["arrays"]
        ) != {_array_name(split, kind) for split in SPLITS for kind in ("shards", "offsets")}:
            raise ValueError("Shard index row counts differ from the audit")
        shards: dict[str, NDArray[np.uint32]] = {}
        offsets: dict[str, NDArray[np.uint64]] = {}
        for split in SPLITS:
            size = (approved / f"{split}.jsonl").stat().st_size
            rows = expected_rows[split]
            ids = _load_array(index_dir / _array_name(split, "shards"),
                              metadata["arrays"][_array_name(split, "shards")], rows, np.uint32)
            places = _load_array(index_dir / _array_name(split, "offsets"),
                                 metadata["arrays"][_array_name(split, "offsets")], rows, np.uint64)
            if rows and (np.any(np.diff(ids.astype(np.int64)) < 0) or int(ids.max()) >= count
                         or int(places.max()) >= size
                         or np.unique(places).size != rows):
                raise ValueError("Shard index arrays are inconsistent")
            shards[split], offsets[split] = ids, places
        return cls(
            metadata["manifest_sha256"], metadata["revocations_sha256"], metadata["plan_sha256"],
            count, hashlib.sha256(raw).hexdigest(), shards, offsets,
        )

    def shard_offsets(self, split: str, shard: int) -> list[int]:
        """Byte offsets of one shard's rows, in manifest order (binary search)."""
        if split not in SPLITS or type(shard) is not int or not 0 <= shard < self.shard_count:
            raise ValueError("Invalid shard lookup")
        ids = self.shards[split]
        first = int(np.searchsorted(ids, shard, side="left"))
        last = int(np.searchsorted(ids, shard, side="right"))
        selected = self.offsets[split][first:last]
        if np.any(np.diff(selected.astype(np.int64)) <= 0):
            raise ValueError("Shard index offsets are out of order")
        return [int(value) for value in selected]
