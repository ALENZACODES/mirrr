"""Tests for lazy shard streaming, the disk writer, dry runs and manifest reading.

Files go to pytest temporary folders only, never into the repository.
Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.stress.labels import scene_from_json
from lab.facescale_synth.stress.scene import SceneConfig
from lab.facescale_synth.stress.stream import (
    MANIFEST_FORMAT,
    encode,
    iter_shard,
    portrait_config,
    read_manifest,
    with_traits,
    write_shard,
)

TINY = SceneConfig(width=64, height=64, min_face_px=10.0)


def test_iter_shard_follows_the_shard_rule() -> None:
    indices = [item.index for item in iter_shard(TINY, 3, 23, 4, 2)]
    assert indices == [2, 6, 10, 14, 18, 22]


def test_shards_together_equal_the_unsharded_set() -> None:
    whole = {item.index: item.image.tobytes() for item in iter_shard(TINY, 4, 12)}
    parts: dict[int, bytes] = {}
    for shard in range(3):
        for item in iter_shard(TINY, 4, 12, 3, shard):
            parts[item.index] = item.image.tobytes()
    assert parts == whole


def test_portrait_preset_gives_one_large_face() -> None:
    config = portrait_config(128, 128)
    for item in iter_shard(config, 5, 20):
        assert len(item.label.faces) == 1
        assert item.label.faces[0].box[3] - item.label.faces[0].box[1] >= 0.4 * 128


def test_encode_formats() -> None:
    item = next(iter_shard(TINY, 1, 1))
    assert encode(item.image, "png")[:4] == b"\x89PNG"
    assert encode(item.image, "jpg")[:2] == b"\xff\xd8"
    with pytest.raises(ValueError):
        encode(item.image, "gif")


def test_writer_writes_images_and_manifest(tmp_path: Path) -> None:
    lines: list[str] = []
    report = write_shard(tmp_path / "out", TINY, 6, 10, 2, 1, fmt="png", log=lines.append)
    assert report.items == 5 and not report.dry_run
    assert lines and "estimated" in lines[0]
    folder = Path(report.folder)
    manifest = folder / "manifest.jsonl"
    rows = [json.loads(line) for line in manifest.read_text().splitlines()]
    header, body = rows[0], rows[1:]
    assert header["format"] == MANIFEST_FORMAT
    assert header["source_id"] == "S20"
    policy.check_stamp(header)
    assert [row["index"] for row in body] == [1, 3, 5, 7, 9]
    for row in body:
        data = (folder / row["file"]).read_bytes()
        assert hashlib.sha256(data).hexdigest() == row["sha256"]
        assert row["test_only"] is True
        assert scene_from_json(row["label"]).index == row["index"]
        assert row["expect"]["index"] == row["index"]
    assert report.image_bytes == sum(row["bytes"] for row in body)


def test_writer_refuses_an_existing_manifest(tmp_path: Path) -> None:
    write_shard(tmp_path, TINY, 7, 2, log=lambda _: None)
    with pytest.raises(FileExistsError):
        write_shard(tmp_path, TINY, 7, 2, log=lambda _: None)


def test_writer_refuses_the_repository() -> None:
    with pytest.raises(policy.UsageRefused):
        write_shard(policy.REPO_ROOT / "lab" / "stress_out", TINY, 1, 2, log=lambda _: None)


def test_dry_run_counts_without_writing(tmp_path: Path) -> None:
    lines: list[str] = []
    report = write_shard(
        tmp_path / "plan", TINY, 8, 2_000_000, 64, 5, dry_run=True, log=lines.append
    )
    assert report.dry_run and report.items == 31_250
    assert report.estimate_bytes > 31_250 * 1000
    assert not (tmp_path / "plan").exists()
    assert "31250 items" in lines[0]


def test_read_manifest_refuses_training(tmp_path: Path) -> None:
    report = write_shard(tmp_path, TINY, 9, 3, log=lambda _: None)
    manifest = Path(report.folder) / "manifest.jsonl"
    assert len(list(read_manifest(manifest, "score"))) == 3
    with pytest.raises(policy.UsageRefused):
        list(read_manifest(manifest, "train"))
    with pytest.raises(policy.UsageRefused):
        list(read_manifest(manifest, "demo"))


def test_with_traits_pins_families() -> None:
    config = with_traits(portrait_config(96, 96), {"fitzpatrick": "VI", "vitiligo": "focal"})
    for item in iter_shard(config, 10, 6):
        traits = item.label.faces[0].traits
        assert traits["fitzpatrick"] == "VI" and traits["vitiligo"] == "focal"
