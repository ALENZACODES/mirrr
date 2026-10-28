"""Variation job contracts: labels unchanged, bounded plans and refused inputs.
Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_spec import declared_labels
from lab.synth_diversity.stress_variations import (
    VIEWS,
    VariationJob,
    apply_camera,
    check_views,
    recipe_for,
    variation_jobs,
)
from lab.synth_diversity.types import SyntheticInputError


def schedule(seed: int = 9) -> StressSchedule:
    return StressSchedule(seed=seed, count=len(ALL_PROFILES))


def test_every_job_keeps_its_case_declared_labels() -> None:
    for job in variation_jobs(schedule(), start=0, stop=5):
        row = job.to_dict()
        assert row["declared_traits"] == list(declared_labels(job.case.plan.tags))
        assert row["test_only"] is True and row["train_allowed"] is False
        assert "image" not in row and "pixels" not in row


def test_job_identities_are_unique_over_the_full_plan() -> None:
    jobs = list(variation_jobs(schedule()))
    assert len(jobs) == len(ALL_PROFILES) * len(VIEWS)
    assert len({job.identity for job in jobs}) == len(jobs)


def test_identity_depends_on_study_seed() -> None:
    first = VariationJob(schedule(1).at(0), "reference")
    second = VariationJob(schedule(2).at(0), "reference")
    assert first.identity != second.identity


def test_chunked_plans_equal_the_full_plan() -> None:
    full = [job.identity for job in variation_jobs(schedule())]
    parts = [job.identity for start in range(0, len(ALL_PROFILES), 7)
             for job in variation_jobs(schedule(), start=start,
                                       stop=min(start + 7, len(ALL_PROFILES)))]
    assert parts == full


def test_view_subsets_preserve_order() -> None:
    jobs = list(variation_jobs(schedule(), ("warm", "reference"), 0, 2))
    assert [job.view for job in jobs] == ["warm", "reference", "warm", "reference"]


@pytest.mark.parametrize("views", ((), ("reference", "reference"), ("flash",), ["warm"]))
def test_invalid_view_sets_are_refused(views: object) -> None:
    with pytest.raises(SyntheticInputError):
        check_views(views)  # type: ignore[arg-type]


def test_unknown_view_cannot_make_a_job() -> None:
    with pytest.raises(SyntheticInputError):
        VariationJob(schedule().at(0), "infrared")
    with pytest.raises(SyntheticInputError):
        recipe_for("REFERENCE")


@pytest.mark.parametrize("bad", (
    np.zeros((10, 10), dtype=np.uint8),
    np.zeros((10, 10, 3), dtype=np.float32),
    np.zeros((10, 10, 4), dtype=np.uint8),
))
def test_camera_refuses_non_rgb_input(bad: np.ndarray) -> None:
    with pytest.raises(SyntheticInputError):
        apply_camera(bad, recipe_for("warm"), 0)


def test_out_of_range_chunk_is_refused() -> None:
    with pytest.raises(SyntheticInputError):
        list(variation_jobs(schedule(), start=5, stop=2))


def test_recipe_dict_is_json_ready() -> None:
    for view in VIEWS:
        row = recipe_for(view).to_dict()
        assert isinstance(row["channel_gain"], list) and len(row["channel_gain"]) == 3
