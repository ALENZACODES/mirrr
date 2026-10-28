"""Synthetic parity and applicability checks for the frozen filter gate.

Every input is generated in memory and never saved. Human review and licensed
real-face evidence remain separate release requirements.
Author: John Khan.
"""
from __future__ import annotations

import importlib
import itertools
import json
import os
import sys
from dataclasses import asdict, replace
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

from plumb_api.arena import scorer
from plumb_api.filters import engine
from plumb_api.filters.masks import blend, guard
from plumb_api.filters.qa import fixtures, performance, still_her
from plumb_api.filters.recipe import registry

ROOT = Path(__file__).resolve().parents[3]


def _bench() -> object:
    """Import only the bench's source, without loading faces or running a detector."""
    path = str(ROOT / "tests/realface")
    if path not in sys.path:
        sys.path.insert(0, path)
    return importlib.import_module("filters_bench")


def _serial(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, allow_nan=False, separators=(",", ":")).encode()


def drawn(tone: str, style: str) -> fixtures.Portrait:
    photo = fixtures.portrait(tone, seed=7, width=84, height=104, grain=5)
    if style == "colour":
        return photo
    image = photo.image
    grey = np.rint(image.astype(np.float64) @ (0.2126, 0.7152, 0.0722)).astype(np.uint8)
    if style == "grey":
        copy = np.broadcast_to(grey[:, :, None], image.shape).copy()
    elif style == "sepia":
        copy = np.stack([np.clip(grey + 3, 0, 255), grey, grey], axis=-1).astype(np.uint8)
    elif style == "lowchroma":
        blend = 0.25 * image.astype(np.float64) + 0.75 * grey[..., None]
        copy = np.rint(blend).astype(np.uint8)
    else:
        raise ValueError("unknown drawn style")
    face = replace(photo.face, image=copy)
    return fixtures.Portrait(face, photo.masks)


@pytest.mark.parametrize("tone,style", [
    ("very_light", "colour"),
    ("medium", "colour"),
    ("very_dark", "colour"),
    ("dark", "grey"),
    ("medium", "sepia"),
])
def test_every_shipped_recipe_matches_direct_uncached_report(tone: str, style: str) -> None:
    face = drawn(tone, style)
    original = still_her.prepare_face(face.image, face.face.points, face.masks)
    for recipe in registry.default().ranked():
        old = still_her.measure_image(recipe, face.image, face.face.points, face.masks, tone,
                                      face_centre=fixtures.face_centre(face))
        new = still_her.measure_image(recipe, face.image, face.face.points, face.masks, tone,
                                      face_centre=fixtures.face_centre(face), inputs=original)
        assert _serial(asdict(old)) == _serial(asdict(new)), (tone, style, recipe["id"])
        assert (_serial(still_her.problems(recipe, [old]))
                == _serial(still_her.problems(recipe, [new])))


def test_greyscale_exempts_only_undefined_chromaticity_not_lightness() -> None:
    face = drawn("dark", "grey")
    recipe = registry.default().get("C05")
    result = still_her.measure(recipe, face)
    assert not result.hue_rule_applies
    assert result.skin_chroma < still_her.CHROMA_HUE_FLOOR
    injected = replace(result, hue_turn=160.0, chroma_ratio=0.05,
                       lift=still_her.LIFT_MAX + 0.5, grey_lift=0.0)
    problems = still_her.problems(recipe, [injected])
    assert any("L* rose" in item for item in problems)
    assert not any("hue turned" in item or "chroma kept" in item for item in problems)


def test_chromatic_appearance_still_enforces_original_hue_and_chroma_thresholds() -> None:
    recipe = registry.default().get("C05")
    chosen = None
    for blend in (0.25, 0.4, 0.6, 1.0):
        image = drawn("medium", "colour")
        grey = np.rint(image.image.astype(np.float64) @ (0.2126, 0.7152, 0.0722))
        tinted = np.rint(blend * image.image.astype(np.float64) +
                         (1 - blend) * grey[..., None]).astype(np.uint8)
        face = fixtures.Portrait(replace(image.face, image=tinted), image.masks)
        measured = still_her.measure(recipe, face)
        if still_her.CHROMA_HUE_FLOOR <= measured.skin_chroma < 15:
            chosen = measured
            break
    assert chosen is not None, "a just-chromatic original must exist in the synthetic sweep"
    assert chosen.hue_rule_applies
    invalid = replace(chosen, hue_turn=6.1, chroma_ratio=0.84)
    found = still_her.problems(recipe, [invalid])
    assert any("hue turned" in problem for problem in found)
    assert any("chroma kept" in problem for problem in found)


def test_realface_bench_rows_are_identical_with_cache_excluding_wall_clock() -> None:
    bench = _bench()
    face = drawn("medium", "sepia")
    recipes = registry.default().ranked()
    common = {"source": "drawn", "file": "no-image-saved", "group": "medium"}
    with patch.object(bench.time, "perf_counter", side_effect=itertools.count(10.0, 0.0625)):
        legacy = bench.bench_face(face.image, face.face.points, recipes,
                                  reuse_inputs=False, **common)
    with patch.object(bench.time, "perf_counter", side_effect=itertools.count(10.0, 0.0625)):
        prepared = bench.bench_face(face.image, face.face.points, recipes,
                                    reuse_inputs=True, **common)
    assert _serial(legacy) == _serial(prepared)
    assert len(prepared) == len(recipes) + 1
    assert all(row["seconds"] == 0.0625 for row in prepared if row["check"] != "detect")
    for row in prepared[1:]:
        assert "hue_rule_applies" in row
        assert "checked_hue_turn" in row
        assert "checked_chroma_ratio" in row


@pytest.mark.parametrize("tone", ("tan", "dark", "very_dark"))
@pytest.mark.parametrize("recipe_id", ("C05", "C15", "C23", "C34"))
def test_deep_skin_colour_filters_keep_still_her_thresholds(tone: str, recipe_id: str) -> None:
    face = fixtures.portrait(tone, seed=4, width=116, height=144, grain=6)
    recipe = registry.default().get(recipe_id)
    result = still_her.measure(recipe, face)
    assert result.hue_turn <= still_her.HUE_MAX
    assert "skin lightened" not in result.flags
    assert result.marks_kept is None or result.marks_kept >= still_her.MARKS_KEPT


@pytest.mark.skipif(os.getenv("GATEFIX_TIMING") != "1", reason="opt-in multi-run 640px timing")
def test_timed_640px_full_catalogue_is_at_least_twice_as_fast() -> None:
    photo = fixtures.portrait("very_dark", seed=3, width=534, height=640, grain=5)
    results = performance.compare([photo], registry.default().ranked(), repeats=3)
    assert results.passed
    old = sum(row.legacy_median_ms for row in results.rows)
    cached = sum(row.cached_median_ms for row in results.rows) + results.face_preparation_ms
    for item in results.rows:
        print(f"{item.recipe}: direct {item.legacy_median_ms / 1000:.4f}s "
              f"cached {item.cached_median_ms / 1000:.4f}s")
    print(f"640px median photo: direct {old / 1000:.3f}s cached {cached / 1000:.3f}s")
    print(f"640px median photo: rate {old / cached:.3f}x")
    assert old / cached >= 2.0


def test_deep_skin_guard_stops_unrequested_brightening_against_clipped_background() -> None:
    image = np.full((64, 72, 3), 255, dtype=np.uint8)
    image[18:48, 20:55] = (66, 40, 30)
    skin = np.zeros(image.shape[:2], dtype=np.float64)
    skin[18:48, 20:55] = 1.0
    masks = blend.FilterMasks(skin, skin, "landmarks")
    template = registry.default().get("C08")
    bright = {**template, "id": "C97", "stages": [
        {"op": "colour.exposure", "params": {"ev": 1.0}},
    ]}
    protected = engine.render(image, bright, masks=masks).image
    assert not scorer.lightened(*scorer.skin_shift(image, protected, skin))
    with patch.object(guard, "DEEP_SKIN_LIFT_CAP", 3.0):
        permissive = engine.render(image, bright, masks=masks).image
    assert scorer.lightened(*scorer.skin_shift(image, permissive, skin))


@pytest.mark.parametrize("tone", ("very_light", "medium", "very_dark"))
@pytest.mark.parametrize("mode", ("full", "lightness"))
def test_prepared_guard_matches_all_rendered_rgb_bytes(tone: str, mode: str) -> None:
    face = fixtures.portrait(tone, seed=23, width=109, height=131, grain=8)
    assert face.masks.skin is not None
    before = face.image
    yy, xx = np.indices(before.shape[:2])
    styled = np.clip(before.astype(np.int16) + np.stack(
        [((xx + yy) % 17) - 6, ((yy * 3) % 13) - 5, ((xx * 2) % 11) - 3], axis=-1
    ), 0, 255).astype(np.uint8)
    rise = np.sin(xx / 13) * 2.0 - 0.5
    legacy = guard.guard(before, styled, face.masks.skin, rise, mode=mode)
    original = guard.prepare_guard(before, face.masks.skin)
    cached = guard.guard(before, styled, face.masks.skin, rise, mode=mode, original=original)
    assert legacy.tobytes() == cached.tobytes()
    with pytest.raises(ValueError, match="another photo or mask"):
        other = before.copy()
        other[2, 2, 1] ^= 1
        guard.guard(other, styled, face.masks.skin, rise, mode=mode, original=original)
