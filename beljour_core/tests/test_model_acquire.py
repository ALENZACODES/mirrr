"""Deployment downloads are policy-checked and mocked; no real network or weights.

Pass definition: no request before licence approval, no unverified cache writes,
no archive extraction beyond exact approved members. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import tarfile
from pathlib import Path

import pytest

from plumb_api.models.registry import ModelRegistry, RegistryError

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("model_acquire_tested_script", ROOT / "scripts/fetch_models.py")
assert SPEC and SPEC.loader
acquire_script = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(acquire_script)


def fingerprint(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def setup(*, pending: bool = False, linked_member: bool = False, duplicate: bool = False) -> tuple:
    model_bytes = b"synthetic model file without executable contents"
    code_bytes = b"synthetic runtime text that is never imported"
    wasm_bytes = b"synthetic WASM text that is never executed"
    files = [("demo.mjs", code_bytes), ("wasm/demo.wasm", wasm_bytes)]
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w:gz") as archive:
        for index, (name, data) in enumerate(files):
            info = tarfile.TarInfo("package/" + name)
            info.size = len(data)
            if linked_member and index == 0:
                info.type = tarfile.SYMTYPE
                info.linkname = "../../outside"
            archive.addfile(info, io.BytesIO(data))
            if duplicate and index == 0:
                archive.addfile(info, io.BytesIO(data))
        extra = b"not selected and never extracted"
        info = tarfile.TarInfo("../../outside.txt")
        info.size = len(extra)
        archive.addfile(info, io.BytesIO(extra))
    archive_bytes = stream.getvalue()
    package_url = "https://registry.npmjs.org/synthetic-fixture/-/synthetic-fixture-1.tgz"
    runtime = {"format": "beljour-model-runtime/1", "name": "Synthetic runtime", "version": "test",
               "licence": "MIT", "status": "allowed",
               "package": {"url": package_url, "sha256": fingerprint(archive_bytes), "bytes": len(archive_bytes)},
               "files": [{"path": name, "sha256": fingerprint(data), "bytes": len(data)} for name, data in files]}
    model_url = "https://storage.googleapis.com/mediapipe-models/synthetic/1/test.task"
    status = "pending" if pending else "allowed"
    registry = ModelRegistry({"format": "beljour-models/1", "version": 1, "models": [{
        "id": "test-model", "task": "face-detection", "filename": "test.task", "url": model_url,
        "sha256": fingerprint(model_bytes), "bytes": len(model_bytes), "licenceName": "Synthetic model",
        "licence": "MIT", "status": status, "runsOn": "browser", "note": "Synthetic bytes only",
    }]})
    ledger = {"policy": {"allowed": ["MIT"]}, "runtime": [
        {"name": "Synthetic model", "licence": "MIT", "status": status, "urls": [model_url]},
        {"name": "Synthetic runtime", "licence": "MIT", "status": "allowed", "urls": [package_url],
         "sha256": fingerprint(archive_bytes), "bytes": len(archive_bytes)},
    ]}
    payloads = {model_url: model_bytes, package_url: archive_bytes}
    return registry, ledger, runtime, payloads


def test_fetches_only_approved_sources_and_reuses_verified_external_cache(tmp_path: Path) -> None:
    registry, ledger, runtime, payloads = setup()
    requests = []

    def fetch(url: str, length: int) -> bytes:
        requests.append(url)
        assert length == len(payloads[url])
        return payloads[url]

    pins = acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=fetch)
    assert len(pins) == 3 and requests == list(payloads)
    assert {path.relative_to(tmp_path).as_posix() for path in tmp_path.rglob("*") if path.is_file()} == {
        "test.task", "runtime/demo.mjs", "runtime/wasm/demo.wasm",
    }
    assert not (tmp_path.parent / "outside.txt").exists()
    assert acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=fetch) == pins
    assert requests == list(payloads), "correct cache must avoid every second request"


def test_pending_explicit_selection_makes_no_request(tmp_path: Path) -> None:
    registry, ledger, runtime, _ = setup(pending=True)
    calls = []
    with pytest.raises(RegistryError, match="pending"):
        acquire_script.acquire(registry, ledger, runtime, tmp_path,
                               names=["test-model"], fetcher=lambda url, count: calls.append(url))
    assert not calls and not list(tmp_path.iterdir())


@pytest.mark.parametrize("bad_runtime", [False, True])
def test_invalid_download_is_never_saved_as_a_valid_cache_file(tmp_path: Path, bad_runtime: bool) -> None:
    registry, ledger, runtime, payloads = setup()

    def fetch(url: str, length: int) -> bytes:
        data = payloads[url]
        if (url == runtime["package"]["url"]) == bad_runtime:
            return bytes([data[0] ^ 1]) + data[1:]
        return data

    with pytest.raises(RegistryError, match="SHA-256"):
        acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=fetch)
    assert not (tmp_path / "runtime").exists()
    assert (tmp_path / "test.task").exists() == bad_runtime


@pytest.mark.parametrize("case", ["link", "duplicate"])
def test_archive_member_must_be_one_regular_file(tmp_path: Path, case: str) -> None:
    registry, ledger, runtime, payloads = setup(linked_member=case == "link", duplicate=case == "duplicate")
    with pytest.raises(RegistryError, match="one exact regular file"):
        acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=lambda url, _: payloads[url])
    assert not (tmp_path / "runtime").exists()


def test_corrupted_cache_fails_before_network_and_never_silently_repairs(tmp_path: Path) -> None:
    registry, ledger, runtime, payloads = setup()
    path = tmp_path / "test.task"
    path.write_bytes(b"wrong")
    with pytest.raises(RegistryError, match="cache length"):
        acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=lambda url, _: pytest.fail("network"))
    assert path.read_bytes() == b"wrong"
    path.unlink()
    external = tmp_path / "other.task"
    external.write_bytes(next(iter(payloads.values())))
    path.symlink_to(external)
    with pytest.raises(RegistryError, match="linked"):
        acquire_script.acquire(registry, ledger, runtime, tmp_path, fetcher=lambda url, _: pytest.fail("network"))


class FakeResponse(io.BytesIO):
    def __init__(self, data: bytes, *, status: int = 200, url: str = "https://example.test/model", headers: dict | None = None):
        super().__init__(data)
        self.status = status
        self.url = url
        self.headers = headers or {}

    def geturl(self) -> str:
        return self.url


@pytest.mark.parametrize("response,message", [
    (lambda: FakeResponse(b"abc", status=302), "redirected or failed"),
    (lambda: FakeResponse(b"abc", url="https://elsewhere.test/model"), "redirected or failed"),
    (lambda: FakeResponse(b"abc", headers={"Content-Length": "99"}), "length header"),
    (lambda: FakeResponse(b"abc", headers={"Content-Encoding": "gzip"}), "preserve exact"),
    (lambda: FakeResponse(b"ab"), "size mismatch"),
    (lambda: FakeResponse(b"abcd"), "exceeds"),
])
def test_downloader_bounds_and_policy_without_network(monkeypatch: pytest.MonkeyPatch, response, message: str) -> None:
    class Opener:
        def open(self, request, timeout):
            assert timeout == 30
            assert request.get_header("Accept-encoding") == "identity"
            return response()

    monkeypatch.setattr(acquire_script, "build_opener", lambda handler: Opener())
    with pytest.raises(RegistryError, match=message):
        acquire_script.download("https://example.test/model", 3)


def test_downloader_returns_exact_mocked_bytes(monkeypatch: pytest.MonkeyPatch) -> None:
    class Opener:
        def open(self, request, timeout):
            return FakeResponse(b"abc", headers={"Content-Length": "3"})

    monkeypatch.setattr(acquire_script, "build_opener", lambda handler: Opener())
    assert acquire_script.download("https://example.test/model", 3) == b"abc"
