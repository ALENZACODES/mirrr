"""Resumable, subject-isolated streaming of one shard of an approved split.

Subjects, never single images, are assigned to shards, so one person's images
always land in the same shard. A reader audits the approved corpus once (without
hashing every image), then streams its shard of the train or eval manifest in
file order. Each yielded row is re-validated: record shape, licence, split,
shard, the live revocation register and the image's bytes against its digest.

Progress lives in a cursor file bound to the manifest digest, the revocation
digest, the training plan and the shard layout. A batch either completes and
advances the cursor or changes nothing, and a cursor is written atomically with
owner-only permissions, so an interrupted job resumes without repeating or
skipping a row. Cursors hold counts and byte offsets only. Author: John Khan.
"""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import TYPE_CHECKING, Any

from .atomic import read_private_json, write_private_json
from .audit import CorpusInvalid, _json_dict, _valid_grant, validate_corpus
from .pipeline import TrainingPlan, checked_image, partition
from .policy import ImageGrant, Rejected
from .revocations import parse_revocations

if TYPE_CHECKING:
    from .shard_index import ShardIndex

CURSOR_SCHEMA = "beljour-shard-cursor/1"
MAX_SHARDS = 4096
MAX_BATCH = 4096
MAX_ROW_BYTES = 4096
CURSOR_KEYS = frozenset({
    "schema", "manifest_sha256", "revocations_sha256", "plan_sha256", "split",
    "shard", "shard_count", "offset", "position", "batches",
})


def subject_shard(subject_key: str, seed: int, shard_count: int) -> int:
    """Stable shard of a subject; shared with `shards.plan_shards` accounting."""
    if type(shard_count) is not int or not 1 <= shard_count <= MAX_SHARDS:
        raise ValueError("Invalid shard count")
    digest = hashlib.sha256(b"beljour-shard/1\0" + f"{seed}\0{subject_key}".encode()).digest()
    return int.from_bytes(digest[:8], "big") % shard_count


def _inside(path: Path, folder: Path) -> bool:
    target, root = path.resolve(), folder.resolve()
    return target == root or target.is_relative_to(root)


def _file_identity(path: Path) -> tuple[int, int, int, int]:
    info = path.stat()
    return info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns


class ShardReader:
    """Yield verified grants from one shard of one split, with a resumable cursor."""

    def __init__(
        self, approved: Path, images: Path, plan: TrainingPlan, *,
        shard: int, shard_count: int, split: str = "train",
        revocations: Path | None = None, index: ShardIndex | None = None,
    ) -> None:
        if split not in ("train", "eval"):
            raise ValueError("Unknown split")
        subject_shard("0" * 64, plan.seed, shard_count)
        if type(shard) is not int or not 0 <= shard < shard_count:
            raise ValueError("Invalid shard number")
        self.approved, self.images, self.plan = approved, images, plan
        self.shard, self.shard_count, self.split = shard, shard_count, split
        self.audit = validate_corpus(
            approved, images, plan, revocations=revocations, check_image_bytes=False,
        )
        self.revoked = parse_revocations(revocations)
        self.manifest = approved / f"{split}.jsonl"
        self.identity = _file_identity(self.manifest)
        self.offsets: list[int] | None = None
        if index is not None:
            # A loaded index was bound to an audit; it must be this audit.
            if (index.manifest_sha256, index.revocations_sha256, index.plan_sha256) != (
                self.audit.manifest_sha256, self.audit.revocations_sha256, plan.digest()
            ):
                raise ValueError("Shard index was built for a different corpus or plan")
            if index.shard_count != shard_count:
                raise ValueError("Shard index uses a different shard count")
            # A cursor from a scanning reader stays valid here; `resume` checks
            # its offset against the indexed rows instead of the index identity.
            self.offsets = index.shard_offsets(split, shard)
        self.offset = 0
        self.position = 0
        self.batches = 0
        self.complete = False

    def _binding(self) -> dict[str, Any]:
        return {
            "schema": CURSOR_SCHEMA,
            "manifest_sha256": self.audit.manifest_sha256,
            "revocations_sha256": self.audit.revocations_sha256,
            "plan_sha256": self.plan.digest(),
            "split": self.split,
            "shard": self.shard,
            "shard_count": self.shard_count,
        }

    def _grant(self, line: bytes) -> ImageGrant | None:
        """Parse one manifest line; None when it belongs to another shard."""
        if len(line) > MAX_ROW_BYTES or not line.endswith(b"\n"):
            raise CorpusInvalid("filtered_manifest_size")
        grant = _valid_grant(_json_dict(line, "invalid_filtered_record"))
        if partition(grant.subject_key, self.plan.seed, self.plan.holdout_fraction) != self.split:
            raise CorpusInvalid("cross_split_subject")
        if subject_shard(grant.subject_key, self.plan.seed, self.shard_count) != self.shard:
            return None
        if self.revoked.rejects(grant.subject_key, grant.sha256, grant.consent_receipt_id):
            raise CorpusInvalid("revoked_training_item")
        try:
            checked_image(self.images, grant)
        except Rejected as exc:
            raise CorpusInvalid("changed_approved_image") from exc
        return grant

    def _scan(self, stream: Any, count: int) -> tuple[list[ImageGrant], int, bool]:
        found: list[ImageGrant] = []
        offset = self.offset
        stream.seek(offset)
        while len(found) < count:
            line = stream.readline(MAX_ROW_BYTES + 1)
            if not line:
                return found, offset, True
            offset += len(line)
            grant = self._grant(line)
            if grant is not None:
                found.append(grant)
        return found, offset, False

    def _indexed(self, stream: Any, count: int, offsets: list[int]) -> tuple[list[ImageGrant], int, bool]:
        found: list[ImageGrant] = []
        for location in offsets[self.position:self.position + count]:
            stream.seek(location)
            grant = self._grant(stream.readline(MAX_ROW_BYTES + 1))
            if grant is None:
                raise CorpusInvalid("shard_index_mismatch")
            found.append(grant)
        end = self.position + len(found)
        done = end >= len(offsets)
        return found, offsets[end] if not done else self.identity[2], done

    def next_batch(self, count: int) -> tuple[ImageGrant, ...]:
        """Return up to ``count`` verified grants; empty once the shard is done."""
        if type(count) is not int or not 1 <= count <= MAX_BATCH:
            raise ValueError("Invalid shard batch size")
        if self.complete:
            return ()
        if _file_identity(self.manifest) != self.identity:
            raise CorpusInvalid("changed_filtered_manifest")
        with self.manifest.open("rb") as stream:
            if self.offsets is None:
                found, offset, done = self._scan(stream, count)
            else:
                found, offset, done = self._indexed(stream, count, self.offsets)
        # Only a fully verified batch moves the cursor.
        self.offset, self.position, self.complete = offset, self.position + len(found), done
        if found:
            self.batches += 1
        return tuple(found)

    def checkpoint(self, path: Path) -> str:
        """Atomically write the cursor (0600) outside the corpus folders."""
        if _inside(path.parent, self.approved) or _inside(path.parent, self.images):
            raise ValueError("Keep shard cursors outside the approved corpus and images")
        return write_private_json(path, {
            **self._binding(), "offset": self.offset,
            "position": self.position, "batches": self.batches,
        })

    def resume(self, path: Path) -> None:
        """Continue from a cursor written for exactly this corpus, plan and shard."""
        cursor = read_private_json(path, max_bytes=4096)
        if set(cursor) != CURSOR_KEYS or any(
            cursor[key] != value for key, value in self._binding().items()
        ):
            raise ValueError("Shard cursor belongs to a different corpus, plan or shard")
        offset, position, batches = cursor["offset"], cursor["position"], cursor["batches"]
        size = self.identity[2]
        if any(type(value) is not int or value < 0 for value in (offset, position, batches)):
            raise ValueError("Invalid shard cursor")
        if offset > size or position > self.audit.train_count + self.audit.eval_count:
            raise ValueError("Invalid shard cursor")
        if offset:
            with self.manifest.open("rb") as stream:
                stream.seek(offset - 1)
                if stream.read(1) != b"\n":
                    raise ValueError("Shard cursor is not at a row boundary")
        if self.offsets is not None:
            if position > len(self.offsets) or (
                position < len(self.offsets) and self.offsets[position] < offset
            ) or (position and self.offsets[position - 1] >= offset):
                raise ValueError("Shard cursor disagrees with the shard index")
        self.offset, self.position, self.batches = offset, position, batches
        self.complete = offset >= size or (
            self.offsets is not None and position >= len(self.offsets)
        )

    def public(self) -> dict[str, Any]:
        """Counts only: no subjects, image hashes, paths or offsets."""
        return {
            "schema": "beljour-shard-progress/1",
            "split": self.split,
            "shard": self.shard,
            "shard_count": self.shard_count,
            "yielded": self.position,
            "batches": self.batches,
            "complete": self.complete,
            "indexed": self.offsets is not None,
            "image_bytes": "VERIFIED_PER_ITEM",
        }
