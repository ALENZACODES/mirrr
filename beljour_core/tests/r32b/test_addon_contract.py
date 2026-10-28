"""Optional light and diffusion filter stages on generated portraits only.

These contract tests exercise the public renderer, which is also used by the
real-face batch and release gate. No source faces, external assets or models
are persisted. All configurations are original to BELJOUR.
Author: John Khan.
"""
from __future__ import annotations

import copy
import math
from collections.abc import Mapping
from typing import Any

import numpy as np
import pytest

from plumb_api.filters import engine
from plumb_api.filters.colour import space as S
from plumb_api.filters.masks import blend
from plumb_api.filters.qa import fixtures, still_her
from plumb_api.filters.recipe import registry

BUILT = ("fade", "vignette", "centre-light", "glow", "halation", "border")
SPATIAL = ("vignette", "centre-light", "glow")
CHOSEN = ("C01", "C03", "C08", "C09", "C102", "C103", "C105", "C106", "C107", "C14")
TONE_SEEDS = ("very_light", "light", "medium", "tan", "dark", "very_dark")


def _photo(tone: str = "medium") -> fixtures.Portrait:
    return fixtures.portrait(tone, width=72, height=84, seed=73, grain=2.0)


def _render(tone: str, recipe: str, addon: str, amount: float, *, guard: bool = True) -> engine.Result:
    p = _photo(tone)
    return engine.render(p.image, recipe, engine.Settings(level=2.5, guard=guard, addons={addon: amount}),
                         p.masks, face_centre=fixtures.face_centre(p))


def _highlight_image(p: fixtures.Portrait) -> np.ndarray:
    """Give the explicit highlight diffusion a source above its luminance knee."""
    image = p.image.copy()
    image[0:12, 0:12] = 255
    return image


def _lightness(before: np.ndarray, after: np.ndarray) -> float:
    a = S.srgb_to_lab(S.bytes_to_unit(before))
    b = S.srgb_to_lab(S.bytes_to_unit(after))
    return float(np.abs(a[..., 0] - b[..., 0]).mean())


def _mask_change(before: np.ndarray, after: np.ndarray, mask: np.ndarray) -> float:
    changed = np.any(before != after, axis=-1)
    return float(changed[mask].mean()) if mask.any() else 0.0


def test_the_original_top_thirty_have_unique_ids_and_ranked_local_recipes() -> None:
    cat = registry.default()
    top = cat.ranked()[:30]
    assert len(top) == 30
    assert len({str(r["id"]) for r in top}) == 30
    assert all(r["version"] >= 1 and r["status"] == "Build" for r in top)
    assert len([r for r in top if r["limits"]["geometry"] != "none"]) == 0
    assert all(not r["limits"].get("simulationLabel", False) for r in top)


def test_built_addons_have_stage_owners_and_supported_parameters() -> None:
    cat = registry.default()
    assert set(cat.addons).issuperset(BUILT)
    for aid in BUILT:
        item = cat.addons[aid]
        assert item["built"] is True
        assert item["stage"]["op"].startswith(("colour.", "spatial.", "light."))
        assert not registry.check_addons({aid: item})
    assert cat.addons["grain"]["built"] is True
    assert cat.addons["structure"]["built"] is True
    assert cat.addons["halation"]["built"] is True
    assert cat.addons["border"]["built"] is True


@pytest.mark.parametrize("aid,expected", [
    ("vignette", "light.vignette"),
    ("centre-light", "light.centre"),
    ("glow", "spatial.glow"),
])
@pytest.mark.parametrize("amount", [0.0, 0.1, 5.5, 50.0, 99.9, 100.0])
def test_addon_stage_is_only_present_with_positive_amount(aid: str, expected: str, amount: float) -> None:
    rec = registry.default().get("C08")
    planned = engine.plan(rec, engine.Settings(strength=0, addons={aid: amount}), has_skin=True)
    stages = [stage for stage in planned.stages if stage.op == expected]
    assert len(stages) == (1 if amount > 0 else 0)
    assert planned.identity is (amount == 0)
    if stages:
        assert math.isfinite(float(stages[0].params["amount"]))
        assert stages[0].params["amount"] > 0
        assert stages[0].params["amount"] <= registry.default().addons[aid]["stage"]["params"]["amount"]


@pytest.mark.parametrize("aid", SPATIAL)
@pytest.mark.parametrize("bad", [-1, 100.1, float("nan"), float("inf"), -float("inf")])
def test_addons_fail_closed_on_invalid_strength(aid: str, bad: float) -> None:
    with pytest.raises(ValueError, match="add-on amounts"):
        engine.plan(registry.default().get("C03"), engine.Settings(addons={aid: bad}), has_skin=True)


@pytest.mark.parametrize("aid", SPATIAL)
def test_addons_cannot_mutate_the_catalogue_or_source(aid: str) -> None:
    portrait = _photo("dark")
    image = portrait.image.copy()
    cat = registry.default()
    saved = copy.deepcopy(cat.get("C09"))
    first = engine.render(image, saved, engine.Settings(addons={aid: 75}), portrait.masks)
    second = engine.render(image, cat.get("C09"), engine.Settings(addons={aid: 75}), portrait.masks)
    assert np.array_equal(first.image, second.image)
    assert np.array_equal(image, portrait.image)
    assert saved == cat.get("C09")


@pytest.mark.parametrize("aid", SPATIAL)
def test_addon_can_render_at_legacy_zero_strength_without_a_colour_lut(aid: str) -> None:
    portrait = _photo()
    original = _highlight_image(portrait)
    before = original.copy()
    result = engine.render(original, "C08", engine.Settings(strength=0, addons={aid: 85}), portrait.masks)
    assert result.plan.identity is False
    assert len(result.plan.family("colour")) == 0
    assert len(result.plan.family("spatial") + result.plan.family("light")) == 1
    assert _lightness(original, result.image) > 0.01
    assert np.array_equal(original, before)


@pytest.mark.parametrize("rid", CHOSEN)
def test_new_addon_zero_is_pixel_identical_to_old_filter_defaults(rid: str) -> None:
    portrait = _photo()
    settings = engine.Settings()
    with_zero = engine.Settings(addons={"vignette": 0, "centre-light": 0, "glow": 0})
    original = engine.render(portrait.image, rid, settings, portrait.masks)
    rendered = engine.render(portrait.image, rid, with_zero, portrait.masks)
    assert np.array_equal(original.image, rendered.image), rid
    assert np.array_equal(original.look, rendered.look), rid
    assert original.plan.key == rendered.plan.key, rid
    assert original.plan.pending == rendered.plan.pending, rid


@pytest.mark.parametrize("rid", CHOSEN[:6])
def test_new_addons_use_the_same_full_and_prepared_face_contract(rid: str) -> None:
    p = _photo("very_dark")
    prepared = still_her.prepare_face(p.image, p.face.points, p.masks)
    for addon in SPATIAL:
        settings = engine.Settings(level=3.4, addons={addon: 35})
        direct = still_her.measure_image(registry.default().get(rid), p.image, p.face.points, p.masks,
                                         "very_dark", settings, prepared.face_centre)
        reused = still_her.measure_image(registry.default().get(rid), p.image, p.face.points, p.masks,
                                         "very_dark", settings, prepared.face_centre, inputs=prepared)
        assert direct == reused, (rid, addon)


@pytest.mark.parametrize("aid", SPATIAL)
def test_addon_hard_keep_skin_is_byte_identical(aid: str) -> None:
    p = _photo("tan")
    skin = p.masks.skin
    assert skin is not None
    setting = engine.Settings(level=5.0, addons={aid: 100.0}, protect_skin=True, guard=False)
    rendered = engine.render(p.image, "C09", setting, p.masks)
    hard = skin >= 0.5
    assert np.array_equal(p.image[hard], rendered.image[hard])
    assert _mask_change(p.image, rendered.image, ~hard) > 0.05


@pytest.mark.parametrize("aid", SPATIAL)
def test_addon_hard_keep_person_is_byte_identical(aid: str) -> None:
    p = _photo("dark")
    person = p.masks.person
    assert person is not None
    setting = engine.Settings(level=5.0, addons={aid: 100.0}, background_only=True, guard=False)
    rendered = engine.render(p.image, "C09", setting, p.masks)
    hard = person >= 0.5
    assert np.array_equal(p.image[hard], rendered.image[hard])


@pytest.mark.parametrize("aid", SPATIAL)
def test_optional_addon_follows_recipe_strength_without_changing_its_hue_guard(aid: str) -> None:
    p = _photo("very_dark")
    image = _highlight_image(p)
    with_addon = engine.render(image, "C03", engine.Settings(level=4.0, guard=False, addons={aid: 35}), p.masks)
    without = engine.render(image, "C03", engine.Settings(level=4.0, guard=False), p.masks)
    assert with_addon.plan.guard is without.plan.guard is False
    assert with_addon.plan.identity_lock and without.plan.identity_lock
    assert with_addon.plan.strength == without.plan.strength
    assert with_addon.plan.key == without.plan.key
    assert not np.array_equal(with_addon.look, without.look)


@pytest.mark.parametrize("aid", SPATIAL)
def test_addon_at_multiple_amounts_changes_look_continuously(aid: str) -> None:
    p = _photo("medium")
    image = _highlight_image(p)
    distance = []
    for amount in (0.0, 15.0, 50.0, 90.0):
        setting = engine.Settings(strength=0, guard=False, addons={aid: amount})
        result = engine.render(image, "C08", setting, p.masks)
        distance.append(_lightness(image, result.image))
    assert distance[0] == 0
    assert distance[-1] > distance[1] + 0.01, (aid, distance)
    assert all(x <= y + 0.03 for x, y in zip(distance, distance[1:], strict=False)), (aid, distance)


@pytest.mark.parametrize("mask_type", ["skin", "person"])
@pytest.mark.parametrize(
    "failure", ["nan", "inf", "negative", "above_one", "wrong_height", "wrong_width", "wrong_type"]
)
def test_every_python_render_rejects_bad_external_masks_at_zero_strength(mask_type: str, failure: str) -> None:
    p = _photo()
    plane = getattr(p.masks, mask_type)
    assert plane is not None
    bad = plane.copy()
    if failure == "nan":
        bad.flat[0] = np.nan
    elif failure == "inf":
        bad.flat[0] = np.inf
    elif failure == "negative":
        bad.flat[0] = -0.01
    elif failure == "above_one":
        bad.flat[0] = 1.01
    elif failure == "wrong_height":
        bad = bad[:-1]
    elif failure == "wrong_width":
        bad = bad[:, :-1]
    else:
        bad = bad.astype("<U12")
    args: dict[str, Any] = {"skin": p.masks.skin, "person": p.masks.person, "source": "landmarks"}
    args[mask_type] = bad
    masks = blend.FilterMasks(**args)
    with pytest.raises(ValueError, match="filter .* mask"):
        engine.render(p.image, "C08", engine.Settings(strength=0, guard=False), masks)


@pytest.mark.parametrize("height,width", [(0, 20), (10, 0), (0, 0)])
def test_python_render_rejects_empty_photo_even_without_a_mask(height: int, width: int) -> None:
    with pytest.raises(ValueError, match="positive image dimensions"):
        engine.render(np.zeros((height, width, 3), dtype=np.uint8), "C08",
                      engine.Settings(strength=0), blend.NO_MASKS)


@pytest.mark.parametrize("aid", SPATIAL)
@pytest.mark.parametrize("settings", [
    engine.Settings(level=1.0, guard=False),
    engine.Settings(level=3.0, guard=True),
    engine.Settings(level=5.0, guard=False),
])
def test_top_look_addon_render_has_finite_rgb_bytes(aid: str, settings: engine.Settings) -> None:
    p = _photo("very_dark")
    chosen = engine.Settings(level=settings.level, guard=settings.guard, addons={aid: 55})
    for rid in ("C09", "C102", "C103", "C105", "C106", "C107"):
        out = engine.render(p.image, rid, chosen, p.masks)
        assert out.image.dtype == np.uint8
        assert out.image.shape == p.image.shape
        assert out.image.max() <= 255 and out.image.min() >= 0
        assert len(out.notes) == len(set(out.notes))


def test_duplicate_addon_entries_in_settings_override_default_without_leaking_across_looks() -> None:
    catalog = registry.default()
    request: Mapping[str, float] = {"glow": 70, "vignette": 32, "centre-light": 16}
    first = engine.plan(catalog.get("C105"), engine.Settings(addons=request), has_skin=True)
    second = engine.plan(catalog.get("C106"), engine.Settings(addons=request), has_skin=True)
    assert first.recipe != second.recipe
    assert len(first.family("spatial")) == 2
    assert len(second.family("spatial")) == 2
    assert len(first.family("light")) == 2
    assert len(second.family("light")) == 2
    assert engine.plan(catalog.get("C105"), has_skin=True).pending == ()


@pytest.mark.parametrize("rid", ["C09", "C102", "C103", "C105", "C106", "C107"])
@pytest.mark.parametrize("aid", SPATIAL)
def test_next_ranked_filters_keep_six_drawn_skin_tones(rid: str, aid: str) -> None:
    """Synthetic Still Her acceptance at a midlevel additive exposure.

    No rank or threshold is silently changed; all findings belong to the
    independent real-face release gate before public use.
    """
    recipe = registry.default().get(rid)
    faces = fixtures.six_tones(width=90, height=108, grain=2.0)
    settings = engine.Settings(level=2.5, addons={aid: 55})
    reports = [still_her.measure(recipe, face, settings) for face in faces]
    problems = still_her.problems(recipe, reports)
    assert not problems, problems
    assert len(reports) == len(TONE_SEEDS)
    assert {report.tone for report in reports} == set(TONE_SEEDS)


@pytest.mark.parametrize("rid", ["C09", "C102", "C103", "C105", "C106", "C107"])
def test_optional_effects_do_not_change_published_recipe_stage_counts(rid: str) -> None:
    recipe = registry.default().get(rid)
    base = engine.plan(recipe, has_skin=True)
    for aid in SPATIAL:
        addon = engine.plan(recipe, engine.Settings(addons={aid: 55}), has_skin=True)
        assert addon.recipe == base.recipe
        assert addon.version == base.version
        assert addon.strength == base.strength
        assert addon.identity_lock == base.identity_lock
        assert addon.pending == base.pending
        assert len(addon.stages) == len(base.stages) + 1
        assert addon.family("colour") == base.family("colour")
