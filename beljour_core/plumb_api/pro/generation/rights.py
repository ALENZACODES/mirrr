"""Exact licence-ledger and encrypted-shard admission for the generation lab. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ..training.sealed_store import SealedStore
from .contracts import (
    MODEL_ID,
    MODEL_LICENCE,
    MODEL_SCHEMA,
    GenerationRefused,
    canonical_json,
    checked_digest,
    checked_revision,
)

MAX_SHARDS = 256
MAX_BUNDLE_BYTES = 65536
MAX_TOTAL_CIPHERTEXT_BYTES = 40 * 1024**3
LEDGER_MODEL_NAME = "BELJOUR FLUX.1 schnell encrypted model shards"


@dataclass(frozen=True)
class EncryptedShard:
    filename: str
    ciphertext_sha256: str
    ciphertext_bytes: int


@dataclass(frozen=True)
class ModelBundle:
    revision: str
    rights_review_sha256: str
    sealed_key_id: str
    shards: tuple[EncryptedShard, ...]
    bundle_sha256: str

    def binding(self, index: int) -> bytes:
        """The AEAD domain binds every shard to model, revision and ordered index."""
        return canonical_json({
            "model": MODEL_ID, "revision": self.revision,
            "review": self.rights_review_sha256, "key": self.sealed_key_id,
            "index": index,
        })


@dataclass(frozen=True)
class AllowedModel:
    bundle: ModelBundle
    encrypted_root: Path

    def public(self) -> dict[str, Any]:
        return {
            "schema": MODEL_SCHEMA,
            "model": MODEL_ID,
            "revision": self.bundle.revision,
            "encrypted_shards": len(self.bundle.shards),
            "shard_bytes": sum(shard.ciphertext_bytes for shard in self.bundle.shards),
            "bundle_sha256": self.bundle.bundle_sha256,
            "licence": MODEL_LICENCE,
            "status": "ADMITTED_NOT_RENDERED",
        }


def _bundle_dict(file: Path) -> dict[str, Any]:
    if file.is_symlink() or not file.is_file() or not 1 <= file.stat().st_size <= MAX_BUNDLE_BYTES:
        raise GenerationRefused("invalid_generation_bundle")
    try:
        value: object = json.loads(file.read_bytes())
    except (OSError, ValueError, UnicodeError) as exc:
        raise GenerationRefused("invalid_generation_bundle") from exc
    if not isinstance(value, dict) or any(not isinstance(k, str) for k in value):
        raise GenerationRefused("invalid_generation_bundle")
    return value


def _parse_shards(value: object) -> tuple[EncryptedShard, ...]:
    if not isinstance(value, list) or not 1 <= len(value) <= MAX_SHARDS:
        raise GenerationRefused("invalid_generation_shards")
    result: list[EncryptedShard] = []
    seen: set[str] = set()
    cumulative = 0
    for element in value:
        if not isinstance(element, dict) or set(element) != {"file", "sha256", "bytes"}:
            raise GenerationRefused("invalid_generation_shards")
        name = element["file"]
        length = element["bytes"]
        if (not isinstance(name, str) or
            re.fullmatch(r"sealed-[a-z0-9-]{1,80}\.bjev", name) is None or
            name in seen or type(length) is not int or length < 48 or length > 257 * 1024**2):
            raise GenerationRefused("invalid_generation_shards")
        digest = checked_digest(element["sha256"])
        seen.add(name)
        cumulative += length
        if cumulative > MAX_TOTAL_CIPHERTEXT_BYTES:
            raise GenerationRefused("generation_model_size_limit")
        result.append(EncryptedShard(name, digest, length))
    return tuple(result)


def _ledger_row(ledger: Mapping[str, Any], bundle: ModelBundle) -> None:
    rows = ledger.get("models")
    if not isinstance(rows, list):
        raise GenerationRefused("generation_ledger_unavailable")
    matching = [row for row in rows if isinstance(row, dict) and row.get("name") == LEDGER_MODEL_NAME]
    if len(matching) != 1:
        raise GenerationRefused("generation_ledger_unapproved")
    record = matching[0]
    if (
        record.get("status") != "allowed"
        or record.get("licence") != MODEL_LICENCE
        or record.get("sourceCommit") != bundle.revision
        or record.get("manifestSha256") != bundle.bundle_sha256
        or record.get("independentReviewSha256") != bundle.rights_review_sha256
        or not isinstance(record.get("checked"), str)
        or not record.get("checked")
        or not isinstance(record.get("licenceSources"), list)
        or not record.get("licenceSources")
    ):
        raise GenerationRefused("generation_ledger_unapproved")


def admit_model(
    file: Path, *, encrypted_root: Path, ledger: Mapping[str, Any], store: SealedStore,
    rights_review_file: Path,
) -> AllowedModel:
    """Allow only exact local, authenticated ciphertext shards and a unique ledger approval."""
    raw = _bundle_dict(file)
    expected = {"schema", "model", "licence", "revision", "review_sha256", "key_id", "shards"}
    if set(raw) != expected or raw["schema"] != MODEL_SCHEMA or raw["model"] != MODEL_ID:
        raise GenerationRefused("generation_model_forbidden")
    if raw["licence"] != MODEL_LICENCE or raw["key_id"] != store.key_id:
        raise GenerationRefused("generation_licence_unapproved")
    revision = checked_revision(raw["revision"])
    review_hash = checked_digest(raw["review_sha256"])
    shards = _parse_shards(raw["shards"])
    digest = hashlib.sha256(canonical_json(raw)).hexdigest()
    bundle = ModelBundle(revision, review_hash, store.key_id, shards, digest)
    _ledger_row(ledger, bundle)
    if rights_review_file.is_symlink() or not rights_review_file.is_file():
        raise GenerationRefused("generation_review_missing")
    if not 1 <= rights_review_file.stat().st_size <= 4 * 1024 * 1024:
        raise GenerationRefused("generation_review_invalid")
    if hashlib.sha256(rights_review_file.read_bytes()).hexdigest() != review_hash:
        raise GenerationRefused("generation_review_changed")
    if encrypted_root.is_symlink():
        raise GenerationRefused("generation_protected_root_invalid")
    root = encrypted_root.resolve(strict=True)
    if not root.is_dir():
        raise GenerationRefused("generation_protected_root_invalid")
    for index, shard in enumerate(shards):
        path = root / shard.filename
        if path.is_symlink() or not path.is_file():
            raise GenerationRefused("generation_shard_missing")
        if path.stat().st_size != shard.ciphertext_bytes:
            raise GenerationRefused("generation_shard_changed")
        if store.ciphertext_digest(path) != shard.ciphertext_sha256:
            raise GenerationRefused("generation_shard_changed")
        # GCM tag verification happens when the runtime consumes each shard.
        if not bundle.binding(index):
            raise GenerationRefused("generation_binding_invalid")
    return AllowedModel(bundle, root)
