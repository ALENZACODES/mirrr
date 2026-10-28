"""Pipeline options: gzip manifests, explicit slice targets, face boxes and limits.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.lockfile import read_lock, verify_lock
from plumb_api.data_factory.manifest import is_gzip, read_manifest
from plumb_api.data_factory.pipeline import RunResult, run_pipeline


@pytest.fixture()
def demo(tmp_path: Path) -> DemoSet:
    return write_demo_set(tmp_path / "opts", distinct=8, size=240)


def configure(demo: DemoSet, relock: bool = False, **changes: Any) -> RunResult:
    raw = json.loads(demo.config_path.read_text())
    raw.update(changes)
    demo.config_path.write_text(json.dumps(raw))
    return run_pipeline(load_config(demo.config_path), relock=relock)


def stage(result: RunResult, name: str) -> Any:
    return next(item for item in result.stages if item.name == name)


def rewrite_intake(demo: DemoSet, change: Any) -> None:
    rows = [json.loads(line) for line in demo.intake_path.read_text().splitlines()]
    demo.intake_path.write_text("".join(json.dumps(change(row)) + "\n" for row in rows))


def test_gzip_manifest(demo: DemoSet) -> None:
    result = configure(demo, manifest={"shards": 2, "gzip": True})
    assert result.manifest_path is not None and result.manifest_path.name.endswith(".gz")
    assert is_gzip(result.manifest_path)
    lock = read_lock(result.lock_path or Path())
    assert lock["manifest"]["compressed"] is True and lock["manifest"]["shard_count"] == 2
    assert verify_lock(result.lock_path or Path()) == []


def test_explicit_targets_report_shortfall(demo: DemoSet) -> None:
    targets = {"lighting=studio": 1, "lighting=outdoor": 9}
    result = configure(demo, balance={"dimensions": ["lighting"], "targets": targets})
    balance = stage(result, "balance")
    cells = {cell["cell"]: cell for cell in balance.stats["cells"]}
    assert cells["lighting=studio"]["selected"] == 1
    assert cells["lighting=outdoor"]["shortfall"] > 0
    assert len(result.items) == 1 + cells["lighting=outdoor"]["selected"]


def test_supplied_face_boxes_are_scored(demo: DemoSet) -> None:
    def add_box(row: dict[str, Any]) -> dict[str, Any]:
        if row["path"].startswith("face-00"):
            row["face_box"] = [0, 0, 20, 20]
        return row

    rewrite_intake(demo, add_box)
    result = configure(demo)
    quality = stage(result, "quality")
    assert quality.reject_reasons.get("quality-below-threshold", 0) >= 8


def test_tight_limits_reject_at_ingest(demo: DemoSet) -> None:
    result = configure(demo, limits={"max_side": 100})
    ingest = stage(result, "ingest")
    assert ingest.reject_reasons.get("image-dimensions-over-limit", 0) >= 8
    assert result.items == []
    rows, summary = read_manifest(result.manifest_path or Path())
    assert rows == [] and summary.count == 0
    assert verify_lock(result.lock_path or Path()) == []


def test_consent_optional_and_extra_licence(demo: DemoSet) -> None:
    def credit(row: dict[str, Any]) -> dict[str, Any]:
        if row["path"] == "face-001.png":
            row["licence"] = "CC-BY-4.0"
        return row

    rewrite_intake(demo, credit)
    strict = configure(demo)
    assert stage(strict, "licence").reject_reasons.get("licence-unknown") == 1
    licence = {"denylist_path": "deny.json", "require_consent": False,
               "extra_allowed": ["CC-BY-4.0"]}
    relaxed = configure(demo, relock=True, licence=licence)
    reasons = stage(relaxed, "licence").reject_reasons
    assert "consent-missing" not in reasons
    assert reasons.get("attribution-missing") == 1


def test_declared_hash_is_checked(demo: DemoSet) -> None:
    def declare(row: dict[str, Any]) -> dict[str, Any]:
        if row["path"] == "face-002.png":
            row["content_sha256"] = "f" * 64
        return row

    rewrite_intake(demo, declare)
    result = configure(demo)
    assert stage(result, "ingest").reject_reasons.get("declared-hash-mismatch") == 1
