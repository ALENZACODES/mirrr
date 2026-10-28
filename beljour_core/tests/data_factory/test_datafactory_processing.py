"""Per-image work and process pools: same results as one process, clear rejects.

Author: John Khan.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import pytest

from plumb_api.data_factory.hashing import sha256_bytes, sha256_file
from plumb_api.data_factory.imaging import DecodeLimits
from plumb_api.data_factory.processing import (
    ImageTask,
    clean_path,
    hash_files,
    process_image,
    run_tasks,
)
from plumb_api.data_factory.quality_score import QualityConfig
from plumb_api.data_factory.stages import ingest
from plumb_api.data_factory.synthetic import portrait, to_jpeg, to_png


@pytest.fixture(scope="module")
def image_folder(tmp_path_factory: pytest.TempPathFactory) -> list[Path]:
    folder = tmp_path_factory.mktemp("pool")
    paths = []
    for index in range(70):
        path = folder / f"p{index:03d}.png"
        path.write_bytes(to_png(portrait(900 + index, 140)))
        paths.append(path)
    return paths


def task_for(path: Path, clean: Path | None, box: tuple[int, int, int, int] | None = None
             ) -> ImageTask:
    return ImageTask(str(path), sha256_file(path), box, None if clean is None else str(clean))


def test_parallel_hashing_matches_single_process(image_folder: list[Path]) -> None:
    paths = [str(path) for path in image_folder]
    single = hash_files(paths, workers=1)
    pooled = hash_files(paths, workers=3)
    assert single == pooled
    assert single[0] == sha256_bytes(image_folder[0].read_bytes())


def test_pool_outcomes_match_single_process(image_folder: list[Path], tmp_path: Path) -> None:
    limits, quality = DecodeLimits(), QualityConfig()
    tasks_a = [task_for(path, tmp_path / "a") for path in image_folder]
    tasks_b = [task_for(path, tmp_path / "b") for path in image_folder]
    single = list(run_tasks(tasks_a, limits, quality, workers=1))
    pooled = list(run_tasks(tasks_b, limits, quality, workers=2))
    strip = [(o.content_sha256, o.quality, o.phash, o.dhash) for o in single]
    assert strip == [(o.content_sha256, o.quality, o.phash, o.dhash) for o in pooled]
    for outcome in pooled:
        assert Path(outcome.stored_path) == clean_path(tmp_path / "b", outcome.content_sha256)
        assert sha256_file(Path(outcome.stored_path)) == outcome.content_sha256


def test_rejects(tmp_path: Path) -> None:
    limits, quality = DecodeLimits(), QualityConfig()
    path = tmp_path / "a.png"
    path.write_bytes(to_png(portrait(1, 160)))
    task = task_for(path, None)
    path.write_bytes(to_png(portrait(2, 160)))
    assert process_image(task, limits, quality).reason == "image-changed"
    path.unlink()
    assert process_image(task, limits, quality).reason == "image-missing"
    path.write_bytes(b"\x89PNG\r\n\x1a\nbroken")
    broken = process_image(task_for(path, None), limits, quality)
    assert broken.reason == "image-unreadable"
    path.write_bytes(to_png(portrait(3, 160)))
    outside = process_image(task_for(path, None, (100, 100, 100, 100)), limits, quality)
    assert outside.reason == "face-box-outside-image"
    kept = process_image(task_for(path, None, (10, 10, 120, 120)), limits, quality)
    assert kept.reason is None and kept.content_sha256 == kept.original_sha256
    assert kept.quality is not None and "face" in kept.quality["subscores"]


def test_cleaning_changes_jpeg_hash(tmp_path: Path) -> None:
    path = tmp_path / "a.jpg"
    path.write_bytes(to_jpeg(portrait(4, 160)))
    outcome = process_image(task_for(path, tmp_path / "clean"), DecodeLimits(), QualityConfig())
    assert outcome.content_sha256 != outcome.original_sha256
    assert outcome.stored_path.endswith(".png")


def intake_line(**fields: object) -> str:
    row: dict[str, object] = {"source": "studio", "licence": "CC0-1.0", "attribution": "",
                              "commercial_use": True, "consent": True}
    row.update(fields)
    return json.dumps(row)


def test_ingest_reject_reasons(tmp_path: Path) -> None:
    images = tmp_path / "images"
    images.mkdir()
    good = images / "good.png"
    good.write_bytes(to_png(portrait(5, 160)))
    (tmp_path / "outside.png").write_bytes(good.read_bytes())
    (images / "link.png").symlink_to(tmp_path / "outside.png")
    lines = [
        intake_line(path="good.png"),
        "{not json",
        "[1, 2]",
        intake_line(path="good.png", licence=""),
        intake_line(),
        intake_line(path="../outside.png"),
        intake_line(path="link.png"),
        intake_line(path="absent.png"),
        intake_line(path="good.png", content_sha256="0" * 64),
        intake_line(path="good.png", content_sha256=sha256_file(good)),
        "",
    ]
    intake = tmp_path / "intake.jsonl"
    intake.write_bytes(("\n".join(lines) + "\n").encode() + b'{"path": "\xff\xfe"}\n'
                       + b"x" * (70 * 1024) + b"\n")
    output = ingest(intake, images, DecodeLimits(), workers=1)
    details = " ".join(reject.detail for reject in output.rejects)
    assert "not UTF-8 text" in details and "line too long" in details
    # "../outside.png" already fails record validation; the symlink and the
    # absent file fail the image_root check.
    assert Counter(reject.reason for reject in output.rejects) == {
        "intake-unreadable": 4, "record-invalid": 2, "path-missing": 1,
        "path-unsafe-or-missing": 2, "declared-hash-mismatch": 1}
    assert len(output.kept) == 2
    assert output.stats["intake_rows"] == 12
    assert all(item.original_sha256 == sha256_file(good) for item in output.kept)
