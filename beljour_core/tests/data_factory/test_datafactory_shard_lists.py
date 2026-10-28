"""Per-shard lists match the lock; resume rebuilds deleted cleaned images; BOM intake.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
import shutil
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_OK, main
from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.pipeline import RunResult, run_pipeline
from plumb_api.data_factory.shard_lists import verify_shard_lists, write_shard_lists


@pytest.fixture()
def demo(tmp_path: Path) -> DemoSet:
    return write_demo_set(tmp_path / "set", distinct=9, size=200)


def published(demo: DemoSet) -> RunResult:
    result = run_pipeline(load_config(demo.config_path))
    assert result.lock_path is not None
    return result


def test_lists_cover_every_row(demo: DemoSet, tmp_path: Path) -> None:
    lock_path = published(demo).lock_path or Path()
    index_path = write_shard_lists(lock_path, tmp_path / "lists")
    index = json.loads(index_path.read_text())
    assert sum(info["count"] for info in index["shards"].values()) == demo.expected_final
    assert verify_shard_lists(lock_path, index_path) == []
    first = next(iter(index["shards"].values()))
    row = (tmp_path / "lists" / first["file"]).read_text().splitlines()[0]
    digest, rel = row.split("\t")
    assert len(digest) == 64 and rel.startswith("images/")


def test_broken_lists_are_reported(demo: DemoSet, tmp_path: Path) -> None:
    lock_path = published(demo).lock_path or Path()
    index_path = write_shard_lists(lock_path, tmp_path / "lists")
    index = json.loads(index_path.read_text())
    shards = sorted(index["shards"], key=int)
    first = tmp_path / "lists" / index["shards"][shards[0]]["file"]
    second = tmp_path / "lists" / index["shards"][shards[1]]["file"]
    first.write_text(first.read_text() + second.read_text().splitlines()[0] + "\n")
    problems = verify_shard_lists(lock_path, index_path)
    assert any("rows, lock has" in p for p in problems)
    assert any("belongs elsewhere" in p for p in problems)
    second.unlink()
    assert any("list missing" in p for p in verify_shard_lists(lock_path, index_path))
    index["lock_sha256"] = "0" * 64
    index_path.write_text(json.dumps(index))
    assert verify_shard_lists(lock_path, index_path) == [
        "shard lists were written for another lock"]
    index_path.write_text("[]")
    assert "index" in verify_shard_lists(lock_path, index_path)[0]
    index_path.write_text("{bad")
    assert "unreadable" in verify_shard_lists(lock_path, index_path)[0]


def test_shards_command(demo: DemoSet, tmp_path: Path) -> None:
    lock_path = published(demo).lock_path or Path()
    out = io.StringIO()
    assert main(["shards", "--lock", str(lock_path), "--out", str(tmp_path / "l")],
                out) == EXIT_OK
    assert out.getvalue() == "wrote demo-set.shards.json\n"


def test_resume_rebuilds_deleted_clean_images(demo: DemoSet) -> None:
    first = published(demo)
    shutil.rmtree(demo.root / "work" / "clean")
    again = run_pipeline(load_config(demo.config_path))
    states = {stage.name: stage.status for stage in again.stages}
    assert states["exact_dedup"] == "resumed"
    assert states["quality"] == "ran"
    assert again.lock_status == "unchanged"
    assert again.lock_sha256 == first.lock_sha256


def test_intake_with_byte_order_mark(demo: DemoSet) -> None:
    demo.intake_path.write_bytes(b"\xef\xbb\xbf" + demo.intake_path.read_bytes())
    result = run_pipeline(load_config(demo.config_path))
    ingest = next(stage for stage in result.stages if stage.name == "ingest")
    assert "intake-unreadable" not in ingest.reject_reasons
    assert len(result.items) == demo.expected_final
