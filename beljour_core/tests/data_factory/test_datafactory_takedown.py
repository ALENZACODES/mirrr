"""Takedown requests propagate to manifests, locks, exports, audit and later runs.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_OK, EXIT_USAGE, main
from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.lockfile import read_lock, verify_lock
from plumb_api.data_factory.manifest import ManifestRow, read_manifest
from plumb_api.data_factory.pipeline import run_pipeline
from plumb_api.data_factory.synthetic import fake_hash
from plumb_api.data_factory.takedown import (
    TakedownError,
    TakedownRegistry,
    TakedownRequest,
    apply_takedown,
    audit_path,
    read_audit,
)


@pytest.fixture()
def published(tmp_path: Path) -> tuple[DemoSet, Path, list[ManifestRow]]:
    demo = write_demo_set(tmp_path / "set", distinct=6, size=200)
    result = run_pipeline(load_config(demo.config_path))
    assert result.lock_path is not None and result.manifest_path is not None
    rows, _ = read_manifest(result.manifest_path)
    return demo, result.lock_path, rows


def request(digest: str, reason: str = "consent-withdrawn") -> TakedownRequest:
    return TakedownRequest(digest, reason, "2026-10-25", "TK-17")


def test_takedown_by_content_hash(published: tuple[DemoSet, Path, list[ManifestRow]]) -> None:
    demo, lock_path, rows = published
    target = rows[2]
    before = read_lock(lock_path)
    result = apply_takedown(lock_path, [request(target.record.content_sha256)])
    assert result.changed and result.removed == [target.record.content_sha256]
    assert result.lock_before == before["lock_sha256"] != result.lock_after
    after = read_lock(lock_path)
    assert after["version"] == 2 and after["parent_lock_sha256"] == before["lock_sha256"]
    assert after["filter_config_sha256"] == before["filter_config_sha256"]
    assert verify_lock(lock_path) == []
    assert (lock_path.parent / "demo-set.lock.v1").is_file()
    remaining, summary = read_manifest(lock_path.parent / "demo-set.manifest.jsonl")
    assert summary.count == len(rows) - 1
    assert target.record.content_sha256 not in {r.record.content_sha256 for r in remaining}
    assert not (lock_path.parent / str(target.record.path)).exists()
    audit = read_audit(audit_path(lock_path))
    assert audit[-1]["action"] == "takedown"
    assert audit[-1]["content_sha256"] == target.record.content_sha256
    assert audit[-1]["lock_after"] == after["lock_sha256"]
    assert demo.root.is_dir()


def test_takedown_by_original_hash(published: tuple[DemoSet, Path, list[ManifestRow]]) -> None:
    _, lock_path, rows = published
    original = str(rows[0].annotations["original_sha256"])
    result = apply_takedown(lock_path, [request(original, "licence-revoked")])
    assert result.removed == [rows[0].record.content_sha256]
    assert read_audit(audit_path(lock_path))[-1]["reason"] == "licence-revoked"


def test_unknown_hash_is_a_logged_noop(published: tuple[DemoSet, Path, list[ManifestRow]]
                                       ) -> None:
    _, lock_path, _ = published
    before = lock_path.read_bytes()
    result = apply_takedown(lock_path, [request(fake_hash(1))])
    assert not result.changed and result.lock_after == result.lock_before
    assert lock_path.read_bytes() == before
    assert read_audit(audit_path(lock_path))[-1]["action"] == "takedown-noop"


def test_tampered_set_is_refused(published: tuple[DemoSet, Path, list[ManifestRow]]) -> None:
    _, lock_path, rows = published
    manifest = lock_path.parent / "demo-set.manifest.jsonl"
    manifest.write_text(manifest.read_text().replace(rows[1].record.source, "edited"))
    with pytest.raises(ValueError):
        apply_takedown(lock_path, [request(rows[1].record.content_sha256)])


def test_registry_keeps_image_out_of_later_runs(
        published: tuple[DemoSet, Path, list[ManifestRow]]) -> None:
    demo, lock_path, rows = published
    registry = demo.root / "takedowns.jsonl"
    TakedownRegistry(registry).add([request(rows[3].record.content_sha256)])
    apply_takedown(lock_path, TakedownRegistry(registry).requests())
    raw = json.loads(demo.config_path.read_text())
    raw["takedowns"] = "takedowns.jsonl"
    demo.config_path.write_text(json.dumps(raw))
    with pytest.raises(Exception, match="relock"):
        run_pipeline(load_config(demo.config_path))
    result = run_pipeline(load_config(demo.config_path), relock=True)
    holdout = next(stage for stage in result.stages if stage.name == "holdout")
    assert holdout.reject_reasons == {"taken-down": 1}
    assert rows[3].record.content_sha256 not in {i.record.content_sha256 for i in result.items}


def test_registry_rules(tmp_path: Path) -> None:
    registry = TakedownRegistry(tmp_path / "t.jsonl")
    assert registry.requests() == [] and registry.hashes() == frozenset()
    assert registry.add([request(fake_hash(1)), request(fake_hash(2))]) == 2
    assert registry.add([request(fake_hash(1))]) == 0
    assert len(registry.requests()) == 2
    (tmp_path / "t.jsonl").write_text('{"schema": "other"}\n')
    with pytest.raises(TakedownError, match="line 1"):
        registry.requests()


@pytest.mark.parametrize(("digest", "reason", "received", "reference"), [
    ("abc", "consent-withdrawn", "2026-10-25", ""),
    (fake_hash(1), "because", "2026-10-25", ""),
    (fake_hash(1), "consent-withdrawn", "25/10/2026", ""),
    (fake_hash(1), "consent-withdrawn", "2026-10-25", "person@example.invalid"),
    (fake_hash(1), "consent-withdrawn", "2026-10-25", "x" * 65),
])
def test_requests_hold_no_personal_data(digest: str, reason: str, received: str,
                                        reference: str) -> None:
    with pytest.raises(TakedownError):
        TakedownRequest(digest, reason, received, reference)


def test_takedown_command(published: tuple[DemoSet, Path, list[ManifestRow]]) -> None:
    demo, lock_path, rows = published
    out = io.StringIO()
    code = main(["takedown", "--lock", str(lock_path), "--hash", rows[0].record.content_sha256,
                 "--reason", "source-request", "--received", "2026-10-25",
                 "--registry", str(demo.root / "reg.jsonl")], out)
    assert code == EXIT_OK
    assert "removed 1 (version 2)" in out.getvalue()
    assert "registry: 1 new request(s)" in out.getvalue()
    bad = io.StringIO()
    assert main(["takedown", "--lock", str(lock_path), "--hash", "nothex",
                 "--reason", "source-request", "--received", "2026-10-25"], bad) == EXIT_USAGE
