"""Shadow, moving foil and coloured-liner feature checks. Author: John Khan."""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.eyes import FEATURES, render_eyes
from plumb_api.engines.eyes.benchmark import DEFAULT_STYLES
from plumb_api.engines.eyes.contracts import ANATOMIES
from plumb_api.engines.eyes.geometry import eye_protection, frames
from plumb_api.engines.eyes.liner import colour_recommendations
from plumb_api.engines.eyes.shadow import flip_colour, pigment_payoff
from plumb_api.engines.eyes.specimens import specimen


@pytest.mark.parametrize("feature", FEATURES)
@pytest.mark.parametrize("tone", [45, 115, 185, 235])
def test_all_features_preserve_iris_sclera_alpha_and_pixels_outside_coverage(feature: str, tone: int) -> None:
    photo, mesh, traces = specimen(96, 112, tone=tone, alpha=True)
    original, mesh_before = photo.copy(), mesh.copy()
    result = render_eyes(photo, mesh, {"feature": feature, "style": DEFAULT_STYLES[feature], "observed_lashes": traces,
                                     "anatomy": {"right": "hooded", "left": "monolid"}, "colour": [160, 85, 110]})
    protected = eye_protection(photo.shape[0], photo.shape[1], frames(mesh, photo.shape[1], photo.shape[0]))
    assert np.array_equal(result.image[protected > 0], photo[protected > 0])
    assert np.array_equal(result.image[result.coverage == 0], photo[result.coverage == 0])
    assert np.array_equal(result.image[:, :, 3], photo[:, :, 3])
    assert np.array_equal(photo, original) and np.array_equal(mesh, mesh_before)
    assert result.report["changed_pixels"] > 0
    assert result.report["real_face_quality"] == "Not tested"
    assert "simulation" in result.report["label"]
    assert np.all(np.isfinite(result.coverage))
    assert float(np.min(result.coverage)) >= 0 and float(np.max(result.coverage)) <= 1


def test_w65_skin_depth_never_changes_liner_thickness() -> None:
    photo, mesh, _ = specimen(160, 192)
    pale = render_eyes(photo, mesh, {"feature": "W65", "skin_depth": .05})
    deep = render_eyes(photo, mesh, {"feature": "W65", "skin_depth": .95})
    assert np.array_equal(pale.coverage, deep.coverage)
    assert np.array_equal(pale.image, deep.image)
    assert "not been thickened" in deep.report["sides"][0]["contrast_note"]


@pytest.mark.parametrize("anatomy", ANATOMIES)
def test_w66_techniques_create_distinct_eye_adapted_results(anatomy: str) -> None:
    photo, mesh, _ = specimen(144, 176, tone=70)
    results = [render_eyes(photo, mesh, {"feature": "W66", "style": style, "colour": [235, 190, 210],
                                       "anatomy": {"right": anatomy, "left": anatomy}}) for style in ("cut_crease", "halo", "smokey")]
    assert all(result.report["changed_pixels"] > 0 for result in results)
    assert not np.array_equal(results[0].image, results[1].image)
    assert not np.array_equal(results[1].image, results[2].image)


def test_pastel_payoff_increases_for_deep_lids_but_sheer_limit_is_disclosed() -> None:
    colour = (240, 210, 225)
    pale = pigment_payoff(.1, colour, .4)
    deep = pigment_payoff(.9, colour, .4)
    assert pale["opacity"] < deep["opacity"] <= .95
    sheer = pigment_payoff(.9, colour, .9)
    assert sheer["warnings"]
    assert "unverified" in sheer["warnings"][0]


@pytest.mark.parametrize("tone", [40, 120, 220])
def test_w67_angle_flip_remains_visible_on_deep_lids_without_glitter(tone: int) -> None:
    photo, mesh, _ = specimen(144, 176, tone=tone)
    common = {"feature": "W67", "style": "duochrome", "colour": [150, 48, 133], "secondary_colour": [45, 165, 110],
              "transparency": .2, "anatomy": {"right": "monolid", "left": "open"}}
    left = render_eyes(photo, mesh, dict(common, angle=-70))
    right = render_eyes(photo, mesh, dict(common, angle=70))
    assert np.array_equal(left.coverage, right.coverage)
    region = left.coverage > .1
    assert np.count_nonzero(region) > 0
    assert float(np.mean(np.abs(left.image[region].astype(float) - right.image[region]))) > 12
    assert all(side["glitter_particles"] == 0 for side in right.report["sides"])
    assert right.report["sides"][0]["motion_parameter"] == "angle"


def test_foil_and_duochrome_are_smooth_not_seeded_sparkles() -> None:
    primary, secondary = (150, 50, 100), (50, 160, 110)
    assert flip_colour(primary, secondary, -90, "duochrome") == primary
    assert flip_colour(primary, secondary, 90, "duochrome") == secondary
    sequence = [flip_colour(primary, secondary, angle, "foil") for angle in range(-80, 81, 5)]
    assert max(abs(a - b) for x, y in zip(sequence, sequence[1:], strict=False) for a, b in zip(x, y, strict=True)) < 6


def test_w75_anatomy_changes_makeup_only_and_expert_validation_is_not_claimed() -> None:
    photo, mesh, _ = specimen(140, 168)
    source = mesh.copy()
    result = render_eyes(photo, mesh, {"feature": "W75", "anatomy": {"right": "hooded", "left": "monolid"}})
    assert result.report["sides"][0]["style"] == "batwing"
    assert result.report["sides"][1]["style"] == "soft_wing"
    assert np.array_equal(source, mesh)
    assert result.report["geometry_changed"] is False
    assert "Not tested" in result.report["artist_validation"]


def test_w76_brown_eyes_get_all_colours_and_untraced_mascara_is_disclosed() -> None:
    options = colour_recommendations((91, 65, 43))
    assert {item["name"] for item in options} == {"navy", "burgundy", "forest"}
    assert all("brown eyes" in item["why"] for item in options)
    photo, mesh, _ = specimen()
    result = render_eyes(photo, mesh, {"feature": "W76", "style": "burgundy"})
    assert result.report["changed_pixels"] > 0
    assert result.report["mascara"]["status"] == "unavailable"
    assert any("Trace your visible lashes" in text for text in result.report["warnings"])


def test_coloured_mascara_has_no_iris_recolour_or_extra_hairs() -> None:
    photo, mesh, traces = specimen()
    result = render_eyes(photo, mesh, {"feature": "W76", "style": "forest", "observed_lashes": traces})
    assert result.report["mascara"]["observed_count"] == result.report["mascara"]["rendered_count"] == 10
    assert result.report["eye_colour_changed"] is False
