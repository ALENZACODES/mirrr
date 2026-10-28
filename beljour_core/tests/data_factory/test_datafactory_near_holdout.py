"""Near-copy leak guard with drawn frozen images written next to a synthetic lock.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from plumb_api.data_factory.config import load_config
from plumb_api.data_factory.dedup import NearDupConfig
from plumb_api.data_factory.demo_set import DemoSet, write_demo_set
from plumb_api.data_factory.hashing import sha256_bytes
from plumb_api.data_factory.holdout import (
    FROZEN_LOCK_FORMAT,
    HoldoutGuard,
    frozen_faces_hash,
    load_frozen_lock,
)
from plumb_api.data_factory.near_holdout import NearHoldoutGuard, fingerprint_sets
from plumb_api.data_factory.perceptual import dhash, phash
from plumb_api.data_factory.pipeline import run_pipeline
from plumb_api.data_factory.stages import StageError
from plumb_api.data_factory.synthetic import portrait, resized, to_jpeg, to_png


def frozen_folder(folder: Path, images: dict[str, bytes]) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    faces = []
    for index, (name, data) in enumerate(sorted(images.items())):
        (folder / name).write_bytes(data)
        faces.append({"face_id": f"t{index}", "sha256": sha256_bytes(data), "rel_path": name})
    lock = folder / "frozen.lock"
    lock.write_text(json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": faces,
                                "faces_sha256": frozen_faces_hash(faces)}))
    return lock


def test_resized_copy_is_caught_only_by_near_guard(tmp_path: Path) -> None:
    secret = portrait(4242, 256)
    lock = frozen_folder(tmp_path / "frozen" / "set-1000",
                         {"a.png": to_png(secret), "b.png": to_png(portrait(4243, 256))})
    copy = resized(secret, 0.6)
    copy_hash = sha256_bytes(to_png(copy))
    exact = HoldoutGuard.from_paths([lock])
    assert exact.check([(copy_hash, [])]).clean
    prints, stats = fingerprint_sets(exact.sets)
    assert stats.printed == 2 and stats.missing == 0
    guard = NearHoldoutGuard(prints, NearDupConfig())
    leak = guard.match(copy_hash, phash(copy), dhash(copy))
    assert leak is not None and leak.frozen_set == "set-1000"
    assert leak.frozen_sha256 == sha256_bytes(to_png(secret))
    other = portrait(7, 256)
    assert guard.match("x" * 64, phash(other), dhash(other)) is None
    assert leak.to_dict()["phash_distance"] == leak.phash_distance


def test_missing_changed_and_unreadable_frozen_files(tmp_path: Path) -> None:
    images = {"a.png": to_png(portrait(1, 128)), "b.png": to_png(portrait(2, 128)),
              "c.png": to_png(portrait(3, 128)), "d.png": to_png(portrait(4, 128))}
    lock = frozen_folder(tmp_path / "s", images)
    (tmp_path / "s" / "a.png").unlink()
    (tmp_path / "s" / "b.png").write_bytes(b"edited")
    frozen = load_frozen_lock(lock)
    broken = {"c.png": b"\x89PNG\r\n\x1a\nnot really"}
    lock2 = frozen_folder(tmp_path / "t", broken)
    _, stats = fingerprint_sets([frozen, load_frozen_lock(lock2)])
    assert stats.to_dict() == {"printed": 2, "missing": 1, "changed": 1, "unreadable": 1}


def test_fingerprint_cache(tmp_path: Path) -> None:
    lock = frozen_folder(tmp_path / "s", {"a.png": to_png(portrait(9, 128))})
    cache = tmp_path / "work" / "prints.jsonl"
    first, _ = fingerprint_sets([load_frozen_lock(lock)], cache_path=cache)
    (tmp_path / "s" / "a.png").unlink()
    second, stats = fingerprint_sets([load_frozen_lock(lock)], cache_path=cache)
    assert first == second and stats.printed == 1 and stats.missing == 0
    cache.write_text("not json\n" + cache.read_text())
    third, _ = fingerprint_sets([load_frozen_lock(lock)], cache_path=cache)
    assert third == first


@pytest.fixture()
def demo_with_frozen_copy(tmp_path: Path) -> DemoSet:
    demo = write_demo_set(tmp_path / "set", distinct=6, size=240)
    source = portrait(2026 + 3, 240)
    frozen_folder(tmp_path / "frozen" / "set-10000", {"t.jpg": to_jpeg(resized(source, 1.2))})
    raw = json.loads(demo.config_path.read_text())
    raw["holdout"] = {"locks": [str(tmp_path / "frozen")], "on_leak": "fail"}
    demo.config_path.write_text(json.dumps(raw))
    return demo


def test_pipeline_fails_on_near_copy(demo_with_frozen_copy: DemoSet) -> None:
    with pytest.raises(StageError, match="0 exact and 1 near"):
        run_pipeline(load_config(demo_with_frozen_copy.config_path))


def test_pipeline_drops_near_copy_or_skips_check(demo_with_frozen_copy: DemoSet) -> None:
    demo = demo_with_frozen_copy
    raw = json.loads(demo.config_path.read_text())
    raw["holdout"]["on_leak"] = "drop"
    demo.config_path.write_text(json.dumps(raw))
    result = run_pipeline(load_config(demo.config_path))
    holdout = next(stage for stage in result.stages if stage.name == "holdout")
    assert holdout.reject_reasons == {"frozen-test-near-copy": 1}
    assert holdout.stats["frozen_prints"]["printed"] == 1
    assert len(result.items) == demo.expected_final - 1
    raw["holdout"]["near"] = False
    demo.config_path.write_text(json.dumps(raw))
    relaxed = run_pipeline(load_config(demo.config_path), relock=True)
    assert len(relaxed.items) == demo.expected_final
