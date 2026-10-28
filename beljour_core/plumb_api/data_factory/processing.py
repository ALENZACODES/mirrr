"""Per-image work for the quality stage, single-process or in a process pool.

One task decodes an image, strips its metadata, hashes the cleaned bytes,
scores quality and computes perceptual hashes. Tasks and results are plain
dataclasses so they cross process boundaries. Results come back in task
order whatever the worker count, so a pool run equals a single-process run.
Author: John Khan.
"""

from __future__ import annotations

import os
from collections.abc import Iterator, Sequence
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .hashing import sha256_bytes, sha256_file
from .imaging import DecodedImage, DecodeLimits, decode, strip_metadata
from .perceptual import dhash, phash, to_hex
from .quality_score import QualityConfig, score_image
from .records import FaceBox

CHUNK_SIZE = 32


@dataclass(frozen=True)
class ImageTask:
    """Input for one image."""

    source_path: str
    original_sha256: str
    face_box: tuple[int, int, int, int] | None
    clean_dir: str | None


@dataclass(frozen=True)
class ImageOutcome:
    """Result for one image; `reason` is set when it was rejected."""

    original_sha256: str
    content_sha256: str
    stored_path: str
    width: int
    height: int
    quality: dict[str, Any] | None
    phash: str | None
    dhash: str | None
    reason: str | None = None
    detail: str = ""


def clean_path(clean_dir: Path, content_sha256: str) -> Path:
    """Where a cleaned image is kept: two-level fan-out by hash."""
    return clean_dir / content_sha256[:2] / f"{content_sha256}.png"


def _reject(task: ImageTask, reason: str, detail: str) -> ImageOutcome:
    return ImageOutcome(task.original_sha256, task.original_sha256, task.source_path, 0, 0,
                        None, None, None, reason, detail)


def _write_once(path: Path, data: bytes) -> None:
    if path.is_file() and path.stat().st_size == len(data):
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f"{path.name}.{os.getpid()}.partial")
    tmp.write_bytes(data)
    os.replace(tmp, path)


def process_image(task: ImageTask, limits: DecodeLimits,
                  quality: QualityConfig) -> ImageOutcome:
    """Decode, clean, hash, score and fingerprint one image."""
    try:
        data = Path(task.source_path).read_bytes()
    except OSError as exc:
        return _reject(task, "image-missing", type(exc).__name__)
    if sha256_bytes(data) != task.original_sha256:
        return _reject(task, "image-changed", "file changed since ingest")
    decoded = decode(data, limits)
    if not isinstance(decoded, DecodedImage):
        return _reject(task, decoded.reason, decoded.detail)
    stored = task.source_path
    content = task.original_sha256
    if task.clean_dir is not None:
        cleaned = strip_metadata(decoded)
        content = sha256_bytes(cleaned)
        target = clean_path(Path(task.clean_dir), content)
        _write_once(target, cleaned)
        stored = str(target)
    box = None if task.face_box is None else FaceBox(*task.face_box)
    if box is not None and (box.x + box.width > decoded.width
                            or box.y + box.height > decoded.height):
        return _reject(task, "face-box-outside-image", "face box exceeds decoded size")
    result = score_image(decoded.rgb, quality, box)
    return ImageOutcome(task.original_sha256, content, stored, decoded.width, decoded.height,
                        result.to_dict(), to_hex(phash(decoded.rgb)), to_hex(dhash(decoded.rgb)))


def _hash_one(path: str) -> str:
    return sha256_file(Path(path))


def hash_files(paths: Sequence[str], *, workers: int = 1) -> list[str]:
    """SHA-256 of each file, in input order, optionally in a process pool."""
    if workers <= 1 or len(paths) <= CHUNK_SIZE:
        return [_hash_one(path) for path in paths]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        return list(pool.map(_hash_one, paths, chunksize=CHUNK_SIZE))


def _run_chunk(args: tuple[Sequence[ImageTask], DecodeLimits, QualityConfig]
               ) -> list[ImageOutcome]:
    tasks, limits, quality = args
    return [process_image(task, limits, quality) for task in tasks]


def run_tasks(tasks: Sequence[ImageTask], limits: DecodeLimits, quality: QualityConfig, *,
              workers: int = 1) -> Iterator[ImageOutcome]:
    """Outcomes in task order; uses a process pool when workers > 1."""
    if workers <= 1 or len(tasks) <= CHUNK_SIZE:
        for task in tasks:
            yield process_image(task, limits, quality)
        return
    chunks = [(tasks[start:start + CHUNK_SIZE], limits, quality)
              for start in range(0, len(tasks), CHUNK_SIZE)]
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for outcomes in pool.map(_run_chunk, chunks):
            yield from outcomes
