"""Byte-for-byte frozen-row parity for the face-gate input cache (drawn faces)."""
from __future__ import annotations

import importlib
import itertools
import json
import sys
from dataclasses import asdict
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.arena import marks, scorer
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry

REPO_ROOT = Path(__file__).resolve().parents[3]
BENCH_ROOT = REPO_ROOT / "tests" / "realface"


def _bench() -> object:
    """Load the real-face bench without loading any real faces or running inference."""
    if str(BENCH_ROOT) not in sys.path:
        sys.path.insert(0, str(BENCH_ROOT))
    return importlib.import_module("filters_bench")


def _bytes(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


@pytest.mark.parametrize("tone", ["dark", "very_dark", "medium"])
def test_prepared_tone_reports_are_identical_to_direct_reports(tone: str) -> None:
    photo = fixtures.portrait(tone, width=96, height=112)
    cache = still_her.prepare_face(photo.image, photo.face.points, photo.masks)
    ids = ("C01", "C03", "C08", "M02")
    for rid in ids:
        recipe = registry.default().get(rid)
        old = still_her.measure(recipe, photo)
        new = still_her.measure_image(recipe, photo.image, photo.face.points, photo.masks, photo.face.tone,
                                      face_centre=fixtures.face_centre(photo), inputs=cache)
        assert _bytes(asdict(old)) == _bytes(asdict(new)), (tone, rid)
        assert _bytes(still_her.problems(recipe, [old])) == _bytes(still_her.problems(recipe, [new]))


def test_input_side_of_arena_scorer_matches_existing_implementation() -> None:
    photo = fixtures.portrait("tan", width=112, height=128)
    cache = still_her.prepare_face(photo.image, photo.face.points, photo.masks)
    assert cache.skin_pixels.any()
    assert cache.scorer_skin is not None
    assert cache.scorer_background is not None
    for delta in (-25, 0, 11, 50):
        result = np.clip(photo.image.astype(np.int16) + delta, 0, 255).astype(np.uint8)
        retained = marks.retention(cache.marks, result, cache.iod)
        expected, _ = scorer.unrequested_changes(photo.image, result, photo.masks.skin,
                                                  points_before=photo.face.points, points_after=photo.face.points,
                                                  retained=retained, filter_name="C97")
        actual = still_her._cached_unrequested(result, photo.face.points, photo.masks, retained, "C97", cache)
        assert _bytes(expected) == _bytes(actual), delta


def test_face_gate_rows_are_byte_identical_with_preparation_enabled() -> None:
    bench = _bench()
    photo = fixtures.portrait("dark", width=96, height=112)
    recipes = [registry.default().get(rid) for rid in ("C01", "C02", "M01")]
    kw = {"source": "synthetic", "file": "never-written", "group": "dark"}
    with patch.object(bench.time, "perf_counter", side_effect=itertools.count(1000.0, 0.125)):
        legacy = bench.bench_face(photo.image, photo.face.points, recipes, reuse_inputs=False, **kw)
    with patch.object(bench.time, "perf_counter", side_effect=itertools.count(1000.0, 0.125)):
        prepared = bench.bench_face(photo.image, photo.face.points, recipes, reuse_inputs=True, **kw)
    assert _bytes(legacy) == _bytes(prepared)
    assert all(row["seconds"] == 0.125 for row in prepared if row["check"] != "detect")
    assert [row["check"] for row in prepared] == ["detect", "C01", "C02", "M01"]


def test_find_marks_runs_once_per_face_not_once_per_recipe() -> None:
    bench = _bench()
    photo = fixtures.portrait("medium", width=96, height=112)
    recipes = [registry.default().get(rid) for rid in ("C01", "C02", "C03", "C08")]
    with patch.object(still_her.M, "find_marks", wraps=still_her.M.find_marks) as detector:
        bench.bench_face(photo.image, photo.face.points, recipes, source="synthetic", file="none", group="medium")
        assert detector.call_count == 1
    with patch.object(still_her.M, "find_marks", wraps=still_her.M.find_marks) as detector:
        bench.bench_face(photo.image, photo.face.points, recipes, source="synthetic", file="none", group="medium",
                         reuse_inputs=False)
        assert detector.call_count == len(recipes)


def test_no_face_keeps_all_failure_rows_and_does_not_prepare() -> None:
    bench = _bench()
    photo = fixtures.portrait("medium", width=96, height=112)
    recipes = [registry.default().get("C01"), registry.default().get("C03")]
    with patch.object(still_her, "prepare_face", side_effect=AssertionError("should not run")):
        missing = bench.bench_face(photo.image, None, recipes, source="synthetic", file="none", group="unknown")
    assert [row["check"] for row in missing] == ["detect", "C01", "C03"]
    assert all(row["pass"] is False for row in missing)
