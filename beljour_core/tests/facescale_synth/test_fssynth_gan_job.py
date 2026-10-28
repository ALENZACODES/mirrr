"""Tests for the Kaggle job's refusal, hashing, dedupe, checkpoints and manifest reader.

The renderer is a fake that draws seeded noise patterns; no weights, no
network, no generator code is loaded.
Author: John Khan.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import cv2
import numpy as np
import numpy.typing as npt
import pytest
from PIL import Image

from lab.facescale_synth import policy
from lab.facescale_synth.gan import job
from lab.facescale_synth.gan.dedupe import later_duplicates, near_pairs
from lab.facescale_synth.gan.manifest import duplicate_report, parse_row, read_seeded_manifest

timing = pytest.mark.skipif(
    os.environ.get("FSSYNTH_SKIP_TIMING") == "1",
    reason="timing test switched off by FSSYNTH_SKIP_TIMING=1",
)


def pattern(seed: int, psi: float) -> npt.NDArray[np.uint8]:
    """Smooth seeded colour pattern standing in for a generator output."""
    rng = np.random.default_rng(seed)
    small = rng.integers(0, 256, (8, 8, 3), dtype=np.uint8)
    big = cv2.resize(small, (128, 128), interpolation=cv2.INTER_CUBIC)
    return np.asarray(np.clip(big.astype(np.float64) * psi, 0, 255), dtype=np.uint8)


def _config(seeds: list[int]) -> dict[str, object]:
    return {
        "weights_url": "unused",
        "weights_sha256": "0" * 64,
        "code_repo": "unused",
        "code_commit": "0" * 40,
        "seeds": seeds,
        "psi": [1.0] * len(seeds),
        "stamp": policy.stamp(),
        "source_id": "S05",
        "licence": "test",
        "size": 64,
        "phash_threshold": 6,
    }


class FakeTime:
    def __init__(self) -> None:
        self.value = 0.0

    def __call__(self) -> float:
        return self.value


def test_job_refuses_outside_kaggle() -> None:
    with pytest.raises(job.JobRefused, match="only on Kaggle"):
        job.require_kaggle({})
    assert job.require_kaggle({job.KAGGLE_ENV: "Batch"}) == "Batch"


def test_job_script_refuses_to_start_here() -> None:
    env = {k: v for k, v in os.environ.items() if k != job.KAGGLE_ENV}
    result = subprocess.run(
        [sys.executable, "-I", job.__file__], env=env, capture_output=True, text=True, timeout=60
    )
    assert result.returncode != 0
    assert "only on Kaggle" in result.stderr
    assert not (job.WORK_DIR / "beljour_out").exists()


def test_embedded_config_must_be_complete() -> None:
    with pytest.raises(job.JobRefused, match="missing"):
        job.load_config()
    bad = _config([1, 2])
    bad["psi"] = [1.0]
    with pytest.raises(job.JobRefused, match="differ"):
        job.load_config(json.dumps(bad))
    unstamped = _config([1])
    unstamped["stamp"] = {}
    with pytest.raises(job.JobRefused, match="stamp"):
        job.load_config(json.dumps(unstamped))


def test_weights_sha_is_checked(tmp_path: Path) -> None:
    weights = tmp_path / "w.bin"
    weights.write_bytes(b"weights")
    good = job.sha256_file(weights)
    job.verify_sha256(weights, good.upper())
    with pytest.raises(job.JobRefused, match="does not match"):
        job.verify_sha256(weights, "0" * 64)


def test_phash_is_stable_and_separates_images() -> None:
    a = pattern(1, 1.0)
    noisy = np.clip(a.astype(int) + np.random.default_rng(0).integers(-4, 5, a.shape), 0, 255)
    gray = cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)
    small = cv2.resize(gray, (32, 32), interpolation=cv2.INTER_AREA).astype(np.float64)
    assert job.phash64(small) == job.phash64(small.copy())
    from_pil = job.phash_image(Image.fromarray(a))
    near = job.phash_image(Image.fromarray(noisy.astype(np.uint8)))
    far = job.phash_image(Image.fromarray(pattern(2, 1.0)))
    assert job.hamming(from_pil, near) <= 6
    assert job.hamming(from_pil, far) > 10
    with pytest.raises(ValueError):
        job.phash64(np.zeros((8, 8)))


def test_phash_index_matches_brute_force() -> None:
    rng = np.random.default_rng(3)
    stored = [int(v) for v in rng.integers(0, 2**63, 2000, dtype=np.int64)]
    index = job.PhashIndex(threshold=4)
    for value in stored:
        index.add(value)
    for probe in stored[:200]:
        flipped = probe ^ (1 << int(rng.integers(64))) ^ (1 << int(rng.integers(64)))
        assert index.nearest(flipped) is not None
    for _ in range(200):
        probe = int(rng.integers(0, 2**63, dtype=np.int64))
        brute = any(job.hamming(probe, s) <= 4 for s in stored)
        assert (index.nearest(probe) is not None) == brute
    with pytest.raises(ValueError):
        job.PhashIndex(threshold=64)


def test_streaming_index_keeps_first_of_each_near_pair() -> None:
    index = job.PhashIndex(threshold=3)
    assert index.add_if_new(0b1111)
    assert not index.add_if_new(0b1000)
    assert index.add_if_new(0xFFFF_0000_0000_0000)
    assert index.count == 2


def test_batch_pairs_match_brute_force() -> None:
    rng = np.random.default_rng(5)
    values = rng.integers(0, 2**16, 400, dtype=np.int64).astype(np.uint64)
    pairs = {(int(a), int(b)) for a, b in near_pairs(values, 3)}
    brute = {
        (i, j)
        for i in range(len(values))
        for j in range(i + 1, len(values))
        if job.hamming(int(values[i]), int(values[j])) <= 3
    }
    assert pairs == brute
    flags = later_duplicates(values, 3)
    assert set(np.nonzero(flags)[0].tolist()) == {j for _, j in brute}
    assert near_pairs(values[:1], 3).shape == (0, 2)
    with pytest.raises(ValueError):
        near_pairs(values, 64)


@timing
def test_phash_dedupe_on_two_million_hashes_is_fast() -> None:
    rng = np.random.default_rng(11)
    values = rng.integers(0, 2**63, 2_000_000, dtype=np.int64).astype(np.uint64)
    values[-1] = values[0] ^ np.uint64(0b1011)
    values[-2] = values[7] ^ np.uint64(1 << 50)
    started = time.perf_counter()
    pairs = near_pairs(values, 4)
    elapsed = time.perf_counter() - started
    assert {(int(a), int(b)) for a, b in pairs} == {(0, 1_999_999), (7, 1_999_998)}
    assert elapsed < 60.0


def test_clock_stops_seven_minutes_before_the_cap() -> None:
    now = FakeTime()
    clock = job.Clock(cap_seconds=3600.0, now=now)
    now.value = 3600.0 - 7 * 60 - 1
    assert not clock.should_stop()
    now.value = 3600.0 - 7 * 60
    assert clock.should_stop()
    assert clock.checkpoint_due()
    clock.mark_checkpoint()
    assert not clock.checkpoint_due()
    now.value += 15 * 60
    assert clock.checkpoint_due()


def test_run_writes_jpegs_manifest_and_dedupes(tmp_path: Path) -> None:
    seeds = [10, 11, 10, 12, 13]

    def render(seed: int, psi: float) -> npt.NDArray[np.uint8]:
        return pattern(seed if seed != 13 else 12, psi)

    state = job.run(job.load_config(json.dumps(_config(seeds))), tmp_path, render, job.Clock())
    assert state.written == 3
    assert state.exact_duplicates == 2
    rows = list(read_seeded_manifest(tmp_path / "manifest.jsonl", "test"))
    assert [row.seed for row in rows] == [10, 11, 12]
    for row in rows:
        assert (tmp_path / row.file).read_bytes()[:2] == b"\xff\xd8"
        assert row.source_id == "S05"
    assert json.loads((tmp_path / "checkpoint.json").read_text())["next_position"] == 5


def test_run_stops_before_cap_and_resumes(tmp_path: Path) -> None:
    config = job.load_config(json.dumps(_config(list(range(100, 110)))))
    now = FakeTime()
    calls: list[int] = []

    def render(seed: int, psi: float) -> npt.NDArray[np.uint8]:
        calls.append(seed)
        now.value += 60.0
        return pattern(seed, psi)

    first = job.run(config, tmp_path, render, job.Clock(cap_seconds=7 * 60 + 240.0, now=now))
    assert 0 < first.next_position < 10
    stopped_at = first.next_position
    second = job.run(config, tmp_path, render, job.Clock(cap_seconds=10**6, now=now))
    assert second.next_position == 10
    assert calls == list(range(100, 110))
    assert len(calls) == 10 and stopped_at < 10
    rows = list(read_seeded_manifest(tmp_path / "manifest.jsonl", "test"))
    assert [r.seed for r in rows] == list(range(100, 110))


def test_manifest_reader_refuses_training_and_bad_rows(tmp_path: Path) -> None:
    job.run(job.load_config(json.dumps(_config([1, 2]))), tmp_path, pattern, job.Clock())
    path = tmp_path / "manifest.jsonl"
    with pytest.raises(policy.UsageRefused):
        list(read_seeded_manifest(path, "train"))
    with pytest.raises(policy.UsageRefused):
        parse_row({"test_only": False}, "row")
    with pytest.raises(ValueError):
        parse_row({"test_only": True, "sha256": "x", "phash": "y"}, "row")


def test_duplicate_report_across_shards(tmp_path: Path) -> None:
    first, second = tmp_path / "a", tmp_path / "b"
    job.run(job.load_config(json.dumps(_config([1, 2, 3]))), first, pattern, job.Clock())
    job.run(job.load_config(json.dumps(_config([3, 4, 5]))), second, pattern, job.Clock())
    report = duplicate_report([first / "manifest.jsonl", second / "manifest.jsonl"])
    assert report.manifests == 2 and report.rows == 6
    assert report.seed_repeats == 1
    assert report.exact_duplicates == 1
    assert report.unique == 5
    assert (3, 3) in report.examples
    assert report.to_json()["unique"] == 5
