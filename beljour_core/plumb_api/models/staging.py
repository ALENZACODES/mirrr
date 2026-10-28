"""Offline, licence-gated staging of content-addressed browser assets.

The inputs are already downloaded local files. This module never opens a URL,
imports a model, or executes third-party code. Every selected source and every
existing destination is verified before writing any output. Browser builds
independently repeat these checks before copying staged files into the site.

Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Any

from .registry import MAX_MODEL_BYTES, SHA, ModelRegistry, RegistryError

RUNTIME_SOURCE = Path(__file__).with_name("runtime.json")
PATH_COMPONENT = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")


def _relative(value: str) -> str:
    path = PurePosixPath(value)
    if (not value or path.is_absolute() or path.as_posix() != value or
            any(not PATH_COMPONENT.fullmatch(part) or part in {".", ".."} for part in path.parts)):
        raise RegistryError("asset path must contain only safe relative components")
    return value


@dataclass(frozen=True)
class AssetPin:
    """One verified file, with separate source-cache and public-site paths."""

    name: str
    source: str
    destination: str
    sha256: str
    bytes: int

    def __post_init__(self) -> None:
        _relative(self.source)
        _relative(self.destination)
        if not isinstance(self.sha256, str) or not SHA.fullmatch(self.sha256):
            raise RegistryError("asset digest must be a lower-case SHA-256")
        if type(self.bytes) is not int or not 0 < self.bytes <= MAX_MODEL_BYTES:
            raise RegistryError("asset byte length is outside the allowed range")


@dataclass(frozen=True)
class StageResult:
    name: str
    path: str
    sha256: str
    bytes: int
    copied: bool


def model_pins(registry: ModelRegistry, ledger: Mapping[str, Any],
               names: Iterable[str] | None = None) -> tuple[AssetPin, ...]:
    """Default to cleared models; explicitly selecting a pending model fails."""
    selected = list(names) if names is not None else [
        entry.id for entry in registry.entries.values() if entry.status == "allowed"
    ]
    if len(selected) != len(set(selected)):
        raise RegistryError("duplicate selected model")
    pins = []
    for name in selected:
        entry = registry.require_allowed(name, ledger)
        if entry.sha256 is None or entry.bytes is None:
            raise RegistryError(f"model {name}: exact pin missing")
        pins.append(AssetPin(name, entry.filename, entry.asset_path.removeprefix("/models/"),
                             entry.sha256, entry.bytes))
    return tuple(pins)


def runtime_pins(source: Mapping[str, Any], ledger: Mapping[str, Any]) -> tuple[AssetPin, ...]:
    """Validate the existing MediaPipe runtime against its exact ledger entry."""
    if source.get("format") != "beljour-model-runtime/1":
        raise RegistryError("unknown browser runtime format")
    if source.get("status") != "allowed" or source.get("licence") not in ledger.get("policy", {}).get("allowed", []):
        raise RegistryError("browser runtime licence is not allowed")
    matches = [entry for entry in ledger.get("runtime", []) if entry.get("name") == source.get("name")]
    if len(matches) != 1:
        raise RegistryError("exact runtime licence entry missing or duplicated")
    entry = matches[0]
    package = source.get("package", {})
    digest = package.get("sha256", "")
    url = package.get("url", "")
    if (entry.get("status") != "allowed" or entry.get("licence") != source["licence"] or
            not isinstance(digest, str) or not SHA.fullmatch(digest) or
            not isinstance(url, str) or url not in entry.get("urls", []) or
            entry.get("sha256") != digest or entry.get("bytes") != package.get("bytes")):
        raise RegistryError("browser runtime archive does not match the licence ledger")
    files = source.get("files")
    if not isinstance(files, list) or not 1 <= len(files) <= 16:
        raise RegistryError("browser runtime requires a bounded file list")
    pins = []
    for record in files:
        if not isinstance(record, dict) or set(record) != {"path", "sha256", "bytes"}:
            raise RegistryError("invalid runtime file record")
        path = record["path"]
        if not isinstance(path, str):
            raise RegistryError("runtime path must be text")
        pins.append(AssetPin(f"runtime:{path}", f"runtime/{_relative(path)}",
                             f"runtime/{digest}/{path}", record["sha256"], record["bytes"]))
    if len({pin.destination for pin in pins}) != len(pins):
        raise RegistryError("duplicate runtime file")
    return tuple(pins)


def read_runtime() -> dict[str, Any]:
    result: dict[str, Any] = json.loads(RUNTIME_SOURCE.read_text(encoding="utf-8"))
    return result


def _no_links(path: Path) -> None:
    # Checking parents prevents a safe basename from following a linked directory.
    for candidate in (path, *path.parents):
        if candidate.is_symlink():
            raise RegistryError("linked browser asset path is forbidden")


def _read_exact(path: Path, pin: AssetPin) -> bytes:
    _no_links(path)
    if not path.is_file():
        raise RegistryError(f"asset {pin.name}: missing local file")
    if path.stat().st_size != pin.bytes:
        raise RegistryError(f"asset {pin.name}: byte length mismatch")
    with path.open("rb") as stream:
        content = stream.read(pin.bytes + 1)
    if len(content) != pin.bytes or hashlib.sha256(content).hexdigest() != pin.sha256:
        raise RegistryError(f"asset {pin.name}: SHA-256 mismatch")
    return content


def stage_assets(pins: Iterable[AssetPin], *, source: Path, output: Path,
                 check_only: bool = False) -> tuple[StageResult, ...]:
    """Copy validated assets atomically; --check reads only the staged files.

    Existing correct files are unchanged, including their timestamps. Existing
    altered files are rejected, rather than silently repairing an unexplained
    mutation. An invalid source cannot leave a partially staged batch.
    """
    batch = tuple(pins)
    if len(batch) > 80 or len({pin.destination for pin in batch}) != len(batch):
        raise RegistryError("duplicate or excessive staged assets")
    source, output = source.absolute(), output.absolute()
    _no_links(output)
    if not check_only:
        _no_links(source)
    prepared: list[tuple[AssetPin, bytes | None, bool]] = []
    for pin in batch:
        destination = output / pin.destination
        _no_links(destination)
        if check_only:
            _read_exact(destination, pin)
            prepared.append((pin, None, False))
            continue
        source_content = _read_exact(source / pin.source, pin)
        exists = destination.exists()
        if exists:
            _read_exact(destination, pin)
        prepared.append((pin, source_content, not exists))
    results = []
    for pin, content, copy in prepared:
        destination = output / pin.destination
        if copy:
            destination.parent.mkdir(parents=True, exist_ok=True)
            _no_links(destination.parent)
            temporary: Path | None = None
            try:
                with tempfile.NamedTemporaryFile(dir=destination.parent, prefix=".stage-", delete=False) as stream:
                    temporary = Path(stream.name)
                    stream.write(content if content is not None else b"")
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, destination)
            finally:
                if temporary is not None:
                    temporary.unlink(missing_ok=True)
        results.append(StageResult(pin.name, f"/models/{pin.destination}", pin.sha256, pin.bytes, copy))
    return tuple(results)
