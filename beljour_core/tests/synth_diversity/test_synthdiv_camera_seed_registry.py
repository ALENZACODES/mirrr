"""Camera seed registry: replayable bindings, order independence and refusals.
Author: John Khan.
"""

from __future__ import annotations

from dataclasses import replace

import pytest

from lab.synth_diversity.stress_camera_seed_registry import (
    SeedBinding,
    bind,
    build_registry,
    merge_bindings,
)
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_variations import VIEWS, VariationJob
from lab.synth_diversity.types import SyntheticInputError

SCHEDULE = StressSchedule(seed=21, count=len(ALL_PROFILES))
VIEW_SET = ("reference", "warm", "sensor_noise")


def bindings() -> list[SeedBinding]:
    return [bind(case, view) for case in SCHEDULE.cases() for view in VIEW_SET]


def test_bindings_replay_variation_job_seeds() -> None:
    case = SCHEDULE.at(4)
    assert bind(case, "warm").seed == VariationJob(case, "warm").seed


def test_registry_is_independent_of_worker_order() -> None:
    forward = merge_bindings(SCHEDULE, bindings(), VIEW_SET)
    backward = merge_bindings(SCHEDULE, reversed(bindings()), VIEW_SET)
    chunks = bindings()
    interleaved = merge_bindings(SCHEDULE, chunks[1::2] + chunks[::2], VIEW_SET)
    assert forward == backward == interleaved
    assert forward.digest == interleaved.digest


def test_full_registry_covers_every_case_and_view() -> None:
    registry = build_registry(SCHEDULE)
    assert len(registry.bindings) == len(ALL_PROFILES) * len(VIEWS)


def test_payload_is_test_only_and_digest_bound() -> None:
    payload = build_registry(SCHEDULE, VIEW_SET).to_payload()
    assert payload["test_only"] is True and payload["train_allowed"] is False
    assert payload["registry_sha256"] == build_registry(SCHEDULE, VIEW_SET).digest


def test_altered_seed_is_refused() -> None:
    rows = bindings()
    rows[0] = replace(rows[0], seed=rows[0].seed + 1)
    with pytest.raises(SyntheticInputError, match="derived"):
        merge_bindings(SCHEDULE, rows, VIEW_SET)


def test_mismatched_recipe_is_refused() -> None:
    rows = bindings()
    rows[1] = replace(rows[1], recipe_sha256="0" * 64)
    with pytest.raises(SyntheticInputError, match="recipe"):
        merge_bindings(SCHEDULE, rows, VIEW_SET)


def test_duplicate_and_missing_jobs_are_refused() -> None:
    rows = bindings()
    with pytest.raises(SyntheticInputError, match="duplicate"):
        merge_bindings(SCHEDULE, [*rows, rows[0]], VIEW_SET)
    with pytest.raises(SyntheticInputError, match="missing 1"):
        merge_bindings(SCHEDULE, rows[1:], VIEW_SET)


def test_unknown_view_and_foreign_case_are_refused() -> None:
    rows = bindings()
    with pytest.raises(SyntheticInputError, match="view"):
        merge_bindings(SCHEDULE, [*rows, replace(rows[0], view="cool")], VIEW_SET)
    foreign = bind(StressSchedule(seed=22, count=len(ALL_PROFILES)).at(0), "warm")
    with pytest.raises(SyntheticInputError, match="outside"):
        merge_bindings(SCHEDULE, [*rows, foreign], VIEW_SET)


def test_seed_collision_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(VariationJob, "seed", property(lambda job: 7))
    with pytest.raises(SyntheticInputError, match="share one seed"):
        merge_bindings(SCHEDULE, bindings(), VIEW_SET)


def test_study_seed_changes_registry_digest() -> None:
    other = StressSchedule(seed=23, count=len(ALL_PROFILES))
    assert build_registry(SCHEDULE, VIEW_SET).digest != build_registry(other, VIEW_SET).digest
