"""C16 item (e): Still Her measured with the original computed once per photo.

Pass definition: for every shipped recipe on drawn portraits (light, very
dark, greyscale and a freckled medium face) the cached path gives a ToneReport
equal field by field (==, not approx) to the pre-C16 measurement, and the same
problems() list; the grey-look and LUT shortcuts return identical arrays; the
cached path is at least 2x faster on a 640 px portrait; on a greyscale
original the hue and chroma rules are not applied while lightness still is.
Drawn images only.

Ported to main: the per-face cache is Lane B's still_her.prepare_face
(FaceInputs, passed as inputs=), and main's grey-look shortcut is the
single-pixel uniform look inside engine.render. The pre-C16 reference
(filters_reference.old_measure) runs on main's render without the cache, so
it is still the independent "before" for identity and speed. C16's
filters/qa/original.py and engine.look_on_grey are not used by main's
measurement, so nothing here relies on them. Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import os
import time
from typing import Any

import numpy as np
import pytest
from filters_reference import old_measure

from plumb_api.filters import engine
from plumb_api.filters.colour import lut as LUT
from plumb_api.filters.colour import space as S
from plumb_api.filters.masks import blend
from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.qa import still_her as SH
from plumb_api.filters.recipe import registry

RECIPES = registry.default().ranked()
# old_measure leaves skin_chroma at the dataclass default; main records the measured value.
NOT_IN_REFERENCE = {"skin_chroma"}


def greyscale(p: F.Portrait) -> np.ndarray:
    level = np.rint(p.image.astype(np.float64) @ np.array([0.299, 0.587, 0.114]))
    grey: np.ndarray = np.repeat(level[..., None], 3, axis=-1).clip(0, 255).astype(np.uint8)
    return grey


def faded(p: F.Portrait, keep: float) -> np.ndarray:
    """Keep `keep` of each pixel's colour around its grey level (a faded print)."""
    grey = greyscale(p).astype(np.float64)
    mixed = grey + keep * (p.image.astype(np.float64) - grey)
    out: np.ndarray = np.rint(mixed).clip(0, 255).astype(np.uint8)
    return out


def portraits() -> list[tuple[str, np.ndarray, F.Portrait]]:
    light = F.portrait("light", width=160, height=192)
    dark = F.portrait("very_dark", width=160, height=192)
    medium = F.portrait("medium", seed=3, width=160, height=192, grain=7.0)
    return [("light", light.image, light), ("very_dark", dark.image, dark),
            ("greyscale", greyscale(medium), medium), ("freckled", medium.image, medium)]


def reports(image: np.ndarray, p: F.Portrait, cached: bool) -> list[SH.ToneReport]:
    centre = F.face_centre(p)
    known = SH.prepare_face(image, p.face.points, p.masks) if cached else None
    return [SH.measure_image(r, image, p.face.points, p.masks, "t", face_centre=centre,
                             inputs=known) for r in RECIPES]


def skin_chroma(image: np.ndarray, p: F.Portrait) -> float:
    lab = S.srgb_to_lab(S.bytes_to_unit(image))[np.asarray(p.masks.skin) >= 0.5]
    return float(np.hypot(lab[:, 1], lab[:, 2]).mean())


@pytest.mark.parametrize("name,image,portrait", portraits(),
                         ids=lambda v: v if isinstance(v, str) else "")
def test_cached_reports_equal_the_pre_c16_measurement(name: str, image: np.ndarray,
                                                      portrait: F.Portrait) -> None:
    centre = F.face_centre(portrait)
    before = [old_measure(r, image, portrait.face.points, portrait.masks, "t", centre)
              for r in RECIPES]
    after = reports(image, portrait, cached=True)
    assert len(after) == len(before) == len(RECIPES)
    chroma = skin_chroma(image, portrait)
    for recipe, old, new in zip(RECIPES, before, after, strict=True):
        for item in dataclasses.fields(SH.ToneReport):
            if item.name not in NOT_IN_REFERENCE:
                assert getattr(new, item.name) == getattr(old, item.name), (recipe["id"], item.name)
        assert new.skin_chroma == chroma
        old.skin_chroma = new.skin_chroma
        assert SH.problems(recipe, [new]) == SH.problems(recipe, [old])


def test_reports_without_a_cache_equal_the_cached_ones() -> None:
    p = F.portrait("tan", width=160, height=192)
    assert reports(p.image, p, cached=False) == reports(p.image, p, cached=True)


def test_grey_look_shortcut_is_identical_for_every_recipe() -> None:
    # Main's render scores a prepared face with one mid-grey pixel broadcast to the frame
    # when the plan has no spatial or light stage; that must equal the full grey photo.
    p = F.portrait("medium", width=160, height=192)
    frame_centre = F.face_centre(p)
    shape = p.image.shape[:2]
    shortcut = 0
    for recipe in RECIPES:
        plan = engine.render(p.image, recipe, engine.DEFAULTS, p.masks,
                             face_centre=frame_centre).plan
        if plan.identity:
            continue
        frame = engine.whole(p.image, frame_centre)
        full = engine.look(engine.grey_photo(shape), plan, frame)
        if plan.family("spatial") or plan.family("light"):
            continue
        shortcut += 1
        single = engine.look(engine.grey_photo((1, 1)), plan, frame, uniform_grey=True)
        assert np.array_equal(np.broadcast_to(single, full.shape), full), recipe["id"]
        assert np.array_equal(engine.look(engine.grey_photo(shape), plan, frame,
                                          uniform_grey=True), full), recipe["id"]
    assert shortcut > 0


def test_lut_distinct_colour_pass_is_identical() -> None:
    p = F.portrait("dark", width=160, height=192)
    noisy = np.random.default_rng(4).integers(0, 256, (40, 50, 3), dtype=np.uint8)
    for recipe in RECIPES[:12]:
        plan = engine.render(p.image, recipe, engine.DEFAULTS, p.masks).plan
        table = engine.CACHE.get(plan)
        for image in (p.image, noisy):
            assert np.array_equal(LUT.apply_bytes(table, image),
                                  LUT.apply(table, S.bytes_to_unit(image)))


def test_original_from_another_photo_is_refused() -> None:
    a, b = F.portrait("light", width=160, height=192), F.portrait("dark", width=200, height=240)
    known = SH.prepare_face(a.image, a.face.points, a.masks)
    with pytest.raises(ValueError, match="another photo"):
        SH.measure_image(RECIPES[0], b.image, b.face.points, b.masks, "x", inputs=known)
    moved = a.face.points.copy()
    moved[0] += 1.0
    with pytest.raises(ValueError, match="another landmark mesh"):
        SH.measure_image(RECIPES[0], a.image, moved, a.masks, "x", inputs=known)


def seconds_per_photo(recipes: list[dict[str, Any]], p: F.Portrait, cached: bool) -> float:
    centre = F.face_centre(p)
    start = time.perf_counter()
    if cached:
        known = SH.prepare_face(p.image, p.face.points, p.masks)
        for recipe in recipes:
            SH.measure_image(recipe, p.image, p.face.points, p.masks, "t", face_centre=centre,
                             inputs=known)
    else:
        for recipe in recipes:
            old_measure(recipe, p.image, p.face.points, p.masks, "t", centre)
    return time.perf_counter() - start


def test_cached_path_is_at_least_twice_as_fast_on_a_640_px_portrait() -> None:
    # Every fifth recipe by default (about 25 s); GATEFIX_FULL_BENCH=1 times all 61.
    full = os.environ.get("GATEFIX_FULL_BENCH") == "1"
    chosen = list(RECIPES) if full else list(RECIPES[::5])
    portrait = F.portrait("medium", width=533, height=640)
    before = seconds_per_photo(chosen, portrait, cached=False)
    after = seconds_per_photo(chosen, portrait, cached=True)
    print(f"Still Her, {len(chosen)} recipes at 533x640: before {before:.1f} s, "
          f"after {after:.1f} s, ratio {before / after:.2f}")
    assert before / after >= 2.0


def test_greyscale_original_skips_hue_and_chroma_rules_but_not_lightness() -> None:
    p = F.portrait("medium", width=160, height=192)
    grey = greyscale(p)
    known = SH.prepare_face(grey, p.face.points, p.masks)
    assert not known.hue_rule_applies
    colour = next(r for r in RECIPES if r["limits"].get("guardMode") != "lightness")
    noisy = SH.ToneReport("grey", lift=4.0, grey_lift=0.0, chroma_ratio=0.2, hue_turn=40.0,
                          spread=1.0, marks_kept=None, neutral_ab=0.0, hue_rule_applies=False)
    found = SH.problems(colour, [noisy])
    assert any("L* rose" in item for item in found)
    assert not any("hue turned" in item or "chroma kept" in item for item in found)


def test_low_chroma_but_coloured_original_keeps_the_hue_rules() -> None:
    p = F.portrait("medium", width=160, height=192)
    for keep, applies in ((0.05, False), (0.35, True)):
        image = faded(p, keep)
        known = SH.prepare_face(image, p.face.points, p.masks)
        assert known.hue_rule_applies is applies, (keep, known.skin_chroma)
    above = SH.prepare_face(faded(p, 0.35), p.face.points, p.masks)
    assert 5.0 <= above.skin_chroma < 12.0


def test_bench_rows_carry_checked_hue_fields() -> None:
    import sys

    from gatefix_gates import REALFACE

    if str(REALFACE) not in sys.path:
        sys.path.insert(0, str(REALFACE))
    import filters_bench

    p = F.portrait("medium", width=160, height=192)
    rows = filters_bench.bench_face(greyscale(p), p.face.points, RECIPES[:3], source="drawn",
                                    file="drawn.png", group="g")
    measured = [row for row in rows if row["check"] != "detect"]
    assert all(row["hue_rule_applies"] is False for row in measured)
    assert all(row["checked_hue_turn"] == 0.0 and row["checked_chroma_ratio"] == 1.0
               for row in measured)
    assert blend.from_landmarks(p.face.points, 192, 160).skin is not None


# Main's mandatory hue lock (filters/masks/hue_lock.py) holds this; it was skipped under C16.
def test_c34_keeps_hue_on_an_underexposed_very_dark_face() -> None:
    p = F.portrait("very_dark", seed=1, width=200, height=240, grain=5.0)
    image = np.rint(p.image.astype(np.float64) * 0.55).clip(0, 255).astype(np.uint8)
    recipe = next(r for r in RECIPES if r["id"] == "C34")
    report = SH.measure_image(recipe, image, p.face.points, p.masks, "d",
                              face_centre=F.face_centre(p))
    assert report.hue_turn <= SH.HUE_MAX
