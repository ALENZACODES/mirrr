"""R28F local hair journey: a recipe to guarded pixels or a coded refusal, on a drawn block.

Pass definition: fibre, palette and men's style journeys return actual guarded pixels
from the existing engines; level 1.0 is unchanged; refusals keep their engine codes;
the summary has no image bytes; fibre reports planned and observed effect.
Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.commerce.local_hair_journey import run_local_hair
from plumb_api.commerce.local_hair_recipe import LocalHairRecipe
from tests.r31f_fibre_scene import HEAD, scene


def test_fibre_journey_returns_guarded_pixels_with_planned_and_observed_effect() -> None:
    image, region, scalp = scene()
    found = run_local_hair(LocalHairRecipe("fibre", 4.0, zone="crown", shade_id="natural-04-n"), image, region,
                           HEAD, scalp_mask=scalp)
    assert (found.status, found.changed_pixels) == ("rendered", 820)
    assert found.image is not None and found.image.shape == image.shape
    assert not np.array_equal(found.image, image)
    evidence = found.evidence
    assert evidence is not None
    assert evidence["planned_effect_fraction"] == pytest.approx(0.546356, abs=1e-6)
    assert evidence["observation"]["observed_effect_fraction"] == pytest.approx(0.391729, abs=1e-6)


def test_level_one_is_unchanged_for_every_kind() -> None:
    image, region, scalp = scene()
    for recipe in (LocalHairRecipe("fibre", 1.0, zone="crown"),
                   LocalHairRecipe("palette", 1.0, shade_id="natural-03-n"),
                   LocalHairRecipe("short-sides", 1.0, style_id="local-low-fade")):
        found = run_local_hair(recipe, image, region, HEAD, scalp_mask=scalp)
        assert found.status == "unchanged", recipe.kind
        assert found.image is not None and np.array_equal(found.image, image)


def test_palette_and_style_journeys_render_and_refuse_with_engine_codes() -> None:
    image, region, scalp = scene()
    palette = run_local_hair(LocalHairRecipe("palette", 3.0, shade_id="natural-03-n"), image, region, HEAD)
    assert (palette.status, palette.changed_pixels) == ("rendered", 2600)
    lighter = run_local_hair(LocalHairRecipe("palette", 3.0, shade_id="golden-08-w"), image, region, HEAD)
    assert (lighter.status, lighter.code) == ("refused", "lightening_not_automatic")
    chosen = run_local_hair(LocalHairRecipe("palette", 3.0, shade_id="golden-08-w", allow_lightening=True),
                            image, region, HEAD)
    assert chosen.status == "rendered"
    style = run_local_hair(LocalHairRecipe("short-sides", 3.0, style_id="local-low-fade"), image, region, HEAD)
    assert (style.status, style.changed_pixels) == ("rendered", 636)
    assert run_local_hair(LocalHairRecipe("short-sides", 3.0, style_id="local-low-fade"),
                          image, region, None).code == "no_mesh"
    assert run_local_hair(LocalHairRecipe("fibre", 3.0, zone="crown"), image, region, HEAD).code == "no_scalp"


def test_summary_has_no_image_bytes_and_labels_quality_untested() -> None:
    image, region, scalp = scene()
    summary = run_local_hair(LocalHairRecipe("fibre", 3.0, zone="crown"), image, region, HEAD,
                             scalp_mask=scalp).summary()
    assert "image" not in summary and summary["provider_calls"] == 0
    assert summary["real_face_quality"] == "not_tested"
    assert len(repr(summary)) < 1500
