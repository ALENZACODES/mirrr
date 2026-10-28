"""Command line: run, verify, leak-check and example, with exit codes.

Author: John Khan.
"""

from __future__ import annotations

import io
import json
import subprocess
import sys
from pathlib import Path

import pytest

from plumb_api.data_factory.cli import EXIT_FAILED, EXIT_OK, EXIT_USAGE, main
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.hashing import sha256_file
from plumb_api.data_factory.holdout import FROZEN_LOCK_FORMAT, frozen_faces_hash

API_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture()
def demo(tmp_path: Path) -> DemoSet:
    return write_demo_set(tmp_path / "set", distinct=5, size=200)


def call(*args: str) -> tuple[int, str]:
    out = io.StringIO()
    code = main(list(args), out)
    return code, out.getvalue()


def test_run_then_verify(demo: DemoSet) -> None:
    code, text = call("run", "--config", str(demo.config_path))
    assert code == EXIT_OK
    assert "lock: demo-set.lock created" in text
    lock = str(demo.root / "out" / "demo-set.lock")
    assert call("verify", "--lock", lock, "--config", str(demo.config_path)) == (
        EXIT_OK, "lock ok\n")
    manifest = demo.root / "out" / "demo-set.manifest.jsonl"
    lines = manifest.read_text().splitlines()
    manifest.write_text("\n".join(lines[:-1]) + "\n")
    code, text = call("verify", "--lock", lock)
    assert code == EXIT_FAILED and text.startswith("FAIL ")


def test_leak_check(demo: DemoSet, tmp_path: Path) -> None:
    assert call("run", "--config", str(demo.config_path))[0] == EXIT_OK
    manifest = demo.root / "out" / "demo-set.manifest.jsonl"
    row = json.loads(manifest.read_text().splitlines()[1])
    faces = [{"face_id": "t1", "sha256": row["content_sha256"], "rel_path": "a.png"}]
    frozen = tmp_path / "frozen" / "set-x"
    frozen.mkdir(parents=True)
    (frozen / "frozen.lock").write_text(json.dumps(
        {"format": FROZEN_LOCK_FORMAT, "faces": faces, "faces_sha256": frozen_faces_hash(faces)}))
    code, text = call("leak-check", "--manifest", str(manifest), "--frozen", str(frozen))
    assert code == EXIT_FAILED and "LEAK " + row["content_sha256"] in text
    other = tmp_path / "frozen2" / "set-y"
    other.mkdir(parents=True)
    faces[0]["sha256"] = sha256_file(demo.config_path)
    (other / "frozen.lock").write_text(json.dumps(
        {"format": FROZEN_LOCK_FORMAT, "faces": faces, "faces_sha256": frozen_faces_hash(faces)}))
    assert call("leak-check", "--manifest", str(manifest), "--frozen", str(other))[0] == EXIT_OK


def test_errors_map_to_exit_codes(demo: DemoSet, tmp_path: Path) -> None:
    code, text = call("run", "--config", str(tmp_path / "missing.json"))
    assert code == EXIT_USAGE and text.startswith("ERROR:")
    assert call("run", "--config", str(demo.config_path))[0] == EXIT_OK
    raw = json.loads(demo.config_path.read_text())
    raw["quality"] = {"min_score": 0.1}
    demo.config_path.write_text(json.dumps(raw))
    code, text = call("run", "--config", str(demo.config_path))
    assert code == EXIT_FAILED and "relock" in text
    assert call("run", "--config", str(demo.config_path), "--relock")[0] == EXIT_OK
    code, text = call("leak-check", "--manifest", "x", "--frozen", str(tmp_path / "none"))
    assert code == EXIT_USAGE


def test_example_writes_parseable_config(tmp_path: Path) -> None:
    target = tmp_path / "config.json"
    assert call("example", "--out", str(target)) == (EXIT_OK, "wrote config.json\n")
    assert json.loads(target.read_text())["schema"] == "beljour-data-config/1"
    assert call("example", "--out", str(target))[0] == EXIT_USAGE


def test_status_command(demo: DemoSet) -> None:
    code, text = call("status", "--config", str(demo.config_path))
    assert code == EXIT_OK and text.splitlines()[0] == "ingest       pending"
    assert call("run", "--config", str(demo.config_path), "--until", "quality")[0] == EXIT_OK
    lines = call("status", "--config", str(demo.config_path))[1].splitlines()
    assert lines[3].split()[:2] == ["quality", "done"]
    assert lines[4].split() == ["near_dedup", "pending"]
    raw = json.loads(demo.config_path.read_text())
    raw["quality"] = {"min_score": 0.2}
    demo.config_path.write_text(json.dumps(raw))
    lines = call("status", "--config", str(demo.config_path))[1].splitlines()
    assert lines[2].split()[:2] == ["exact_dedup", "done"]
    assert lines[3].split() == ["quality", "stale"]


def test_module_entry_point(demo: DemoSet) -> None:
    done = subprocess.run(
        [sys.executable, "-m", "plumb_api.data_factory", "run", "--config",
         str(demo.config_path), "--workers", "1", "--until", "licence"],
        cwd=API_ROOT, capture_output=True, text=True, timeout=120, check=False)
    assert done.returncode == 0, done.stderr
    assert "licence" in done.stdout and "lock:" not in done.stdout
