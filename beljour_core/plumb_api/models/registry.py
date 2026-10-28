"""E03: model catalogue, commercial licence and checksum gate.

No model weights are bundled with the app. The catalogue is metadata only: it
lists candidate URLs, but no byte may be used before its *exact* checksum and
licence are cleared and entered in both the catalogue and licences.json. A
pending item is intentionally unavailable, not an implicit exception.

Client mirrors are generated from the same catalogue by scripts/sync_r4_data.py.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

SHA = re.compile(r"^[a-f0-9]{64}$")
FILE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*\.(task|tflite|onnx)$")
IDENT = re.compile(r"^[a-z][a-z0-9-]{2,63}$")
VALID_TASKS = frozenset({"face-detection", "face-landmarks", "pose", "hair-segmentation", "person-segmentation",
                         "inpainting"})
VALID_STATUS = frozenset({"allowed", "pending", "blocked"})
TRUSTED_MODEL_HOSTS = frozenset({"storage.googleapis.com", "huggingface.co"})
# R7: Hugging Face files are only immutable when the URL names a commit. A candidate may
# point at a branch while it is pending; an allowed entry must pin a 40-hex commit.
HF_PATH = re.compile(r"^/[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*/resolve/([A-Za-z0-9._-]+)/[A-Za-z0-9._/-]+$")
COMMIT = re.compile(r"^[a-f0-9]{40}$")
MAX_MODEL_BYTES = 120 * 1024 * 1024
ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CATALOG = Path(__file__).with_name("catalog.json")


class RegistryError(ValueError):
    """A model identity, policy, hash or file is invalid."""


def sha256_bytes(content: bytes | bytearray | memoryview) -> str:
    return hashlib.sha256(content).hexdigest()


def _url(value: Any) -> str:
    if not isinstance(value, str):
        raise RegistryError("a model URL must be text")
    url = urlsplit(value)
    if url.scheme != "https" or url.hostname not in TRUSTED_MODEL_HOSTS or url.username or url.password or url.fragment:
        raise RegistryError("model URL must be an approved HTTPS model host")
    if url.query or not url.path.endswith((".task", ".tflite", ".onnx")):
        raise RegistryError("model URLs must be version-pinned files without query tokens")
    if url.hostname == "huggingface.co" and not HF_PATH.fullmatch(url.path):
        raise RegistryError("Hugging Face model URLs must be /<owner>/<repo>/resolve/<revision>/<file>")
    return value


def pinned_revision(url: str) -> bool:
    """True unless the URL is a Hugging Face file on a branch rather than a commit."""
    parts = urlsplit(url)
    if parts.hostname != "huggingface.co":
        return True
    match = HF_PATH.fullmatch(parts.path)
    return bool(match and COMMIT.fullmatch(match.group(1)))


def _ident(value: Any, name: str) -> str:
    if not isinstance(value, str) or not IDENT.fullmatch(value):
        raise RegistryError(f"invalid {name} identifier")
    return value


@dataclass(frozen=True)
class ModelEntry:
    id: str
    task: str
    filename: str
    url: str
    sha256: str | None
    bytes: int | None
    licence_name: str
    licence: str
    status: str
    runs_on: str
    note: str

    @classmethod
    def parse(cls, item: Mapping[str, Any]) -> ModelEntry:
        expected = {"id", "task", "filename", "url", "sha256", "bytes", "licenceName",
                    "licence", "status", "runsOn", "note"}
        if set(item) != expected:
            raise RegistryError(f"invalid model fields: missing {expected - set(item)}, extra {set(item) - expected}")
        ident = _ident(item["id"], "model")
        task = item["task"]
        if task not in VALID_TASKS:
            raise RegistryError(f"model {ident}: unknown task {task!r}")
        url = _url(item["url"])
        file = item["filename"]
        if (not isinstance(file, str) or not FILE_NAME.fullmatch(file) or
                file not in urlsplit(url).path.rsplit("/", 1)[-1:] or not file.endswith((".task", ".tflite", ".onnx"))):
            raise RegistryError(f"model {ident}: file name must match URL")
        status = item["status"]
        if status not in VALID_STATUS:
            raise RegistryError(f"model {ident}: invalid status")
        digest = item["sha256"]
        length = item["bytes"]
        if digest is not None and (not isinstance(digest, str) or not SHA.fullmatch(digest)):
            raise RegistryError(f"model {ident}: sha256 must be a lower-case 64-char hex digest")
        if length is not None and (type(length) is not int or not (0 < length <= MAX_MODEL_BYTES)):
            raise RegistryError(f"model {ident}: invalid model size")
        if status == "allowed" and (not digest or not length):
            raise RegistryError(f"model {ident}: allowed model needs sha256 and byte count")
        if status == "allowed" and not pinned_revision(url):
            raise RegistryError(f"model {ident}: allowed Hugging Face model must pin a commit, not a branch")
        if item["runsOn"] != "browser":
            raise RegistryError(f"model {ident}: only browser models are approved for E05")
        licence_name = item["licenceName"]
        if not isinstance(licence_name, str) or not licence_name.strip():
            raise RegistryError(f"model {ident}: a licence ledger entry is required")
        licence = item["licence"]
        if not isinstance(licence, str) or not licence:
            raise RegistryError(f"model {ident}: missing licence")
        note = item["note"]
        if not isinstance(note, str) or len(note) > 500:
            raise RegistryError(f"model {ident}: invalid note")
        return cls(ident, task, file, url, digest, length, licence_name, licence, status, "browser", note)

    def public(self) -> dict[str, Any]:
        return {"id": self.id, "task": self.task, "filename": self.filename,
                "url": self.url, "sha256": self.sha256, "bytes": self.bytes,
                "licenceName": self.licence_name, "licence": self.licence,
                "status": self.status, "runsOn": self.runs_on, "note": self.note}

    @property
    def asset_path(self) -> str:
        """Content-addressed same-origin path; pinning does not grant a licence."""
        if self.sha256 is None or self.bytes is None:
            raise RegistryError(f"model {self.id}: no exact asset pin")
        return f"/models/{self.sha256}/{self.filename}"


class ModelRegistry:
    def __init__(self, source: Mapping[str, Any]) -> None:
        if set(source) != {"format", "version", "models"} or source["format"] != "beljour-models/1" or source["version"] != 1:
            raise RegistryError("unsupported model registry format")
        raw = source["models"]
        if not isinstance(raw, list) or len(raw) > 64:
            raise RegistryError("models must be an array with at most 64 entries")
        entries = [ModelEntry.parse(item) for item in raw]
        if len({e.id for e in entries}) != len(entries) or len({e.url for e in entries}) != len(entries):
            raise RegistryError("duplicate model ID or URL")
        self.entries = {e.id: e for e in entries}

    @classmethod
    def read(cls, path: Path = DEFAULT_CATALOG) -> ModelRegistry:
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def get(self, name: str) -> ModelEntry:
        try:
            return self.entries[name]
        except KeyError as exc:
            raise RegistryError(f"unknown model {name!r}") from exc

    def require_allowed(self, name: str, ledger: Mapping[str, Any]) -> ModelEntry:
        entry = self.get(name)
        if entry.status != "allowed":
            raise RegistryError(f"model {name} is {entry.status}: manual fallback required")
        _check_licence(entry, ledger, require_allowed=True)
        return entry

    def check_file(self, name: str, data: bytes | bytearray | memoryview, ledger: Mapping[str, Any]) -> bytes:
        entry = self.require_allowed(name, ledger)
        result = bytes(data)
        if len(result) != entry.bytes:
            raise RegistryError(f"model {name}: file length mismatch")
        if sha256_bytes(result) != entry.sha256:
            raise RegistryError(f"model {name}: sha256 mismatch")
        return result


def _check_licence(entry: ModelEntry, ledger: Mapping[str, Any], require_allowed: bool) -> None:
    runtime = ledger.get("runtime", [])
    matched = [e for e in runtime if e.get("name") == entry.licence_name]
    if len(matched) != 1:
        raise RegistryError(f"model {entry.id}: exact licence entry missing or duplicated")
    licence = matched[0]
    if licence.get("licence") != entry.licence or licence.get("status") != entry.status:
        raise RegistryError(f"model {entry.id}: ledger status or licence differs")
    if not any(entry.url.startswith(prefix) for prefix in licence.get("urls", [])):
        raise RegistryError(f"model {entry.id}: URL is outside licence entry")
    if require_allowed and (licence.get("status") != "allowed" or
                            licence.get("licence") not in ledger.get("policy", {}).get("allowed", [])):
        raise RegistryError(f"model {entry.id}: commercial licence is not allowed")


def verify_catalog_licences(registry: ModelRegistry, ledger: Mapping[str, Any]) -> list[str]:
    failures: list[str] = []
    for item in registry.entries.values():
        try:
            _check_licence(item, ledger, require_allowed=item.status == "allowed")
        except RegistryError as exc:
            failures.append(str(exc))
        if item.status == "allowed" and (item.sha256 is None or item.bytes is None):
            failures.append(f"model {item.id}: allowed model missing pinned bytes")
    return failures


def validate_file(path: Path, *, registry: ModelRegistry, ledger: Mapping[str, Any]) -> ModelEntry:
    """Validate a downloaded *local* file without making any network request."""
    matches = [entry for entry in registry.entries.values() if entry.filename == path.name]
    if len(matches) != 1:
        raise RegistryError(f"unknown or ambiguous model file {path.name}")
    entry = matches[0]
    if not path.is_file() or path.is_symlink():
        raise RegistryError("missing or linked model file")
    if path.stat().st_size > MAX_MODEL_BYTES:
        raise RegistryError("model file exceeds size cap")
    registry.check_file(entry.id, path.read_bytes(), ledger)
    return entry
