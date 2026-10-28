"""Measured performance of the metadata stages on synthetic records.

Times each step on N made-up records: licence filter, exact dedup, near dedup
over random 64-bit hashes with planted near copies, slice balancing, a gzip
manifest write and verify, lock build and verify, and a holdout check. The
numbers are wall-clock seconds on the machine that runs it; nothing is
estimated. Pixel work (decode, strip, score) is not part of this report.
Author: John Khan.
"""

from __future__ import annotations

import json
import platform
import resource
import tempfile
import time
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any, TypeVar

import numpy as np

from .dedup import HashedItem, NearDupConfig, exact_dedup, near_dedup
from .holdout import FROZEN_LOCK_FORMAT, HoldoutGuard, frozen_faces_hash
from .licence import DenyList, LicenceFilter, load_policy
from .lockfile import build_lock, verify_lock, write_lock
from .manifest import verify_manifest, write_manifest
from .records import ImageRecord
from .slices import SliceSpec, balance
from .synthetic import fake_hash, fake_records

PERF_SCHEMA = "beljour-data-perf/1"
T = TypeVar("T")


def _timed(timings: dict[str, float], name: str, work: Callable[[], T]) -> T:
    started = time.perf_counter()
    value = work()
    timings[name] = round(time.perf_counter() - started, 3)
    return value


def _hashes(count: int, seed: int) -> tuple[list[int], list[int], int]:
    rng = np.random.default_rng(seed)
    phashes = rng.integers(0, 2**64 - 1, size=count, dtype=np.uint64, endpoint=True)
    dhashes = rng.integers(0, 2**64 - 1, size=count, dtype=np.uint64, endpoint=True)
    planted = count // 200
    sources = np.arange(planted) * 2
    phashes[sources + 1] = phashes[sources] ^ np.uint64(0b101000001)
    dhashes[sources + 1] = dhashes[sources] ^ np.uint64(0b11)
    return [int(v) for v in phashes], [int(v) for v in dhashes], planted


def _frozen_lock(folder: Path, records: Sequence[ImageRecord], count: int) -> Path:
    hashes = [fake_hash(index, "frozen") for index in range(count)]
    hashes[: min(10, len(records))] = [r.content_sha256 for r in records[:10]]
    faces = [{"face_id": f"f{i}", "sha256": h, "rel_path": f"{i}.png"}
             for i, h in enumerate(hashes)]
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "frozen.lock"
    path.write_text(json.dumps({"format": FROZEN_LOCK_FORMAT, "faces": faces,
                                "faces_sha256": frozen_faces_hash(faces)}), encoding="utf-8")
    return path


def measure(count: int, seed: int = 11, scratch: Path | None = None) -> dict[str, Any]:
    """Run every step once on `count` records and return the timings."""
    timings: dict[str, float] = {}
    records = _timed(timings, "generate_records", lambda: list(fake_records(count, seed)))
    duplicated = records + records[: count // 100]
    lic = LicenceFilter(load_policy(), DenyList.builtin())
    kept, _ = _timed(timings, "licence_filter", lambda: lic.run(duplicated))
    unique, links = _timed(timings, "exact_dedup", lambda: exact_dedup(
        kept, ident=lambda r: r.content_sha256, keys=lambda r: (r.content_sha256,),
        rank=lambda r: (r.source,)))
    phashes, dhashes, planted = _hashes(len(unique), seed)
    entries = [HashedItem(r.content_sha256, p, d, (r.content_sha256,), r)
               for r, p, d in zip(unique, phashes, dhashes, strict=True)]
    near = _timed(timings, "near_dedup", lambda: near_dedup(entries, NearDupConfig()))
    spec = SliceSpec(dimensions=("age_band", "skin_tone_group"), per_cell=max(1, count // 100))
    balanced = _timed(timings, "balance", lambda: balance(near.kept, spec))
    with tempfile.TemporaryDirectory(dir=scratch) as folder:
        root = Path(folder)
        manifest = root / "perf.manifest.jsonl.gz"
        rows: list[tuple[ImageRecord, dict[str, Any]]] = [(record, {}) for record in near.kept]
        summary = _timed(timings, "manifest_write_gzip", lambda: write_manifest(
            manifest, rows, shards=64, compress=True))
        _timed(timings, "manifest_verify", lambda: verify_manifest(manifest))
        lock = build_lock(summary, manifest.name, fake_hash(0, "config"), set_name="perf")
        write_lock(root / "perf.lock", lock)
        problems = _timed(timings, "lock_verify", lambda: verify_lock(root / "perf.lock"))
        frozen = _frozen_lock(root / "frozen" / "set", near.kept, 10_000)
        guard = HoldoutGuard.from_paths([frozen])
        report = _timed(timings, "holdout_check", lambda: guard.check(
            (r.content_sha256, ()) for r in near.kept))
    return {
        "records": count,
        "seconds": timings,
        "total_seconds": round(sum(timings.values()), 3),
        "exact_duplicates_removed": len(links),
        "near_pairs_planted": planted,
        "near_duplicates_removed": len(near.links),
        "candidate_pairs": near.candidate_pairs,
        "balanced_selected": len(balanced.selected),
        "manifest_rows": summary.count,
        "lock_problems": len(problems),
        "holdout_leaks": len(report.leaks),
        "peak_rss_mb": round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024.0, 1),
    }


def perf_report(counts: Sequence[int], seed: int = 11) -> dict[str, Any]:
    """Measurements for each record count plus a short machine description."""
    return {"schema": PERF_SCHEMA, "python": platform.python_version(),
            "machine": platform.machine(), "numpy": np.__version__,
            "runs": [measure(count, seed) for count in counts]}


def render_perf(report: dict[str, Any]) -> str:
    """Markdown table of a perf report."""
    runs = report["runs"]
    steps = list(runs[0]["seconds"]) if runs else []
    lines = ["# Data factory performance (measured)", "", "Author: John Khan.", "",
             f"Python {report['python']} on {report['machine']}, numpy {report['numpy']}.",
             "Seconds of wall-clock time per step.", "",
             "| Step | " + " | ".join(f"{run['records']:,} records" for run in runs) + " |",
             "|---|" + "|".join("---" for _ in runs) + "|"]
    for step in steps:
        lines.append(f"| {step} | " + " | ".join(str(run["seconds"][step]) for run in runs)
                     + " |")
    lines.append("| total | " + " | ".join(str(run["total_seconds"]) for run in runs) + " |")
    lines += ["", "| Check | " + " | ".join(str(run["records"]) for run in runs) + " |",
              "|---|" + "|".join("---" for _ in runs) + "|"]
    for key in ("exact_duplicates_removed", "near_pairs_planted", "near_duplicates_removed",
                "candidate_pairs", "manifest_rows", "lock_problems", "holdout_leaks",
                "peak_rss_mb"):
        lines.append(f"| {key} | " + " | ".join(str(run[key]) for run in runs) + " |")
    return "\n".join(lines) + "\n"
