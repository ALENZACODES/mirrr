"""Camera variation determinism, pixel effects and unchanged declared labels.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.compose import compose_face
from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_variations import (
    VIEWS,
    VariationJob,
    apply_camera,
    recipe_for,
    render_variation,
    variation_jobs,
)
from lab.synth_diversity.types import BaseFace, SyntheticInputError


def flat(value: int = 120) -> np.ndarray:
    return np.full((24, 40, 3), value, dtype=np.uint8)


def test_eight_named_views_exist() -> None:
    assert len(VIEWS) == 8
    assert VIEWS[0] == "reference"
    assert {recipe_for(view).view for view in VIEWS} == set(VIEWS)


def test_reference_view_is_identity() -> None:
    image = make_drawn_face().image
    assert np.array_equal(apply_camera(image, recipe_for("reference"), 1), image)


def test_exposure_views_darken_and_brighten() -> None:
    low = apply_camera(flat(), recipe_for("exposure_low"), 0)
    high = apply_camera(flat(), recipe_for("exposure_high"), 0)
    assert int(low.mean()) < 120 < int(high.mean())
    assert int(low[0, 0, 0]) == round(120 * 2 ** -0.5)


def test_warm_and_cool_shift_red_blue_balance() -> None:
    warm = apply_camera(flat(), recipe_for("warm"), 0)[0, 0]
    cool = apply_camera(flat(), recipe_for("cool"), 0)[0, 0]
    assert warm[0] > warm[2]
    assert cool[2] > cool[0]
    assert warm[1] == cool[1] == 120


def test_gradients_fall_off_toward_opposite_sides() -> None:
    left = apply_camera(flat(), recipe_for("gradient_left"), 0)
    right = apply_camera(flat(), recipe_for("gradient_right"), 0)
    assert left[0, 0, 0] > left[0, -1, 0]
    assert right[0, 0, 0] < right[0, -1, 0]


def test_noise_is_seeded_and_bounded() -> None:
    recipe = recipe_for("sensor_noise")
    one = apply_camera(flat(), recipe, 7)
    assert np.array_equal(one, apply_camera(flat(), recipe, 7))
    assert not np.array_equal(one, apply_camera(flat(), recipe, 8))
    assert abs(float(one.astype(np.float64).mean()) - 120.0) < 1.0


def test_input_array_is_never_modified() -> None:
    image = flat()
    before = image.copy()
    for view in VIEWS:
        apply_camera(image, recipe_for(view), 3)
    assert np.array_equal(image, before)


def test_saturated_values_clip_instead_of_wrapping() -> None:
    bright = apply_camera(flat(250), recipe_for("exposure_high"), 0)
    assert int(bright.min()) == 255


def test_job_seeds_are_reconstructable_and_view_specific() -> None:
    schedule = StressSchedule(seed=4, count=len(ALL_PROFILES))
    jobs = list(variation_jobs(schedule, start=0, stop=1))
    assert [job.view for job in jobs] == list(VIEWS)
    assert len({job.seed for job in jobs}) == len(VIEWS)
    again = VariationJob(schedule.at(0), "warm")
    assert again.seed == jobs[VIEWS.index("warm")].seed
    assert again.identity == jobs[VIEWS.index("warm")].identity


def test_rendered_variation_matches_manual_composition() -> None:
    schedule = StressSchedule(seed=4, count=len(ALL_PROFILES))
    job = VariationJob(schedule.at(0), "cool")
    base = make_drawn_face()
    rendered = render_variation(job, {"drawn_face": base})
    manual = apply_camera(compose_face(base, job.case.plan).image, job.recipe, job.seed)
    assert rendered.shape == base.image.shape
    assert np.array_equal(rendered, manual)


def test_render_refuses_missing_or_mismatched_base() -> None:
    schedule = StressSchedule(seed=4, count=len(ALL_PROFILES))
    job = VariationJob(schedule.at(0), "reference")
    with pytest.raises(SyntheticInputError):
        render_variation(job, {})
    drawn = make_drawn_face()
    relabelled = BaseFace(drawn.image, drawn.skin_mask, drawn.hair_mask, "drawn_face",
                          source_id="S05")
    with pytest.raises(SyntheticInputError):
        render_variation(job, {"drawn_face": relabelled})
