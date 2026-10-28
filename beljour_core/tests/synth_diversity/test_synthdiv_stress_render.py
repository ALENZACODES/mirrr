"""Local stress-manifest reconstruction uses synthetic inputs only.
Author: John Khan.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest

from lab.synth_diversity.fixtures import make_drawn_face
from lab.synth_diversity.stress_manifest import write_stress_manifest
from lab.synth_diversity.stress_render import (
    MAX_RENDER_CHUNK,
    RenderJob,
    assert_render_contract,
    jobs_from_manifest,
    prepare_job,
    render_case,
    render_chunk,
)
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.stress_slices import SliceBridge
from lab.synth_diversity.types import BaseFace, SyntheticInputError


def _bases() -> dict[str, BaseFace]:
    drawn = make_drawn_face(seed=17, base_id="drawn_face")
    return {drawn.base_id: drawn}


def test_render_stress_case_is_deterministic_in_memory() -> None:
    schedule = StressSchedule(seed=17, count=40)
    case = schedule.at(1)
    bases = _bases()
    before = bases["drawn_face"].image.copy()
    first = render_case(case, bases)
    second = render_case(case, bases)
    assert_render_contract(first, case)
    assert np.array_equal(first.image, second.image)
    assert np.array_equal(bases["drawn_face"].image, before)
    assert first.image.shape == before.shape
    assert first.image.dtype == np.uint8


def test_render_job_refuses_base_id_and_source_mismatch() -> None:
    schedule = StressSchedule(seed=9, count=40)
    case = schedule.at(0)
    base = make_drawn_face(seed=17, base_id="wrong_name")
    with pytest.raises(SyntheticInputError):
        RenderJob(base=base, case=case)
    with pytest.raises(SyntheticInputError):
        prepare_job(case, {"unexpected": base})
    alternate = StressSchedule(seed=9, count=40, base_source_id="S05").at(0)
    with pytest.raises(SyntheticInputError):
        RenderJob(base=_bases()["drawn_face"], case=alternate)


def test_render_chunks_match_individual_rendering() -> None:
    schedule = StressSchedule(seed=5, count=40)
    bases = _bases()
    rendered = list(render_chunk(schedule, bases, 0, 2))
    assert len(rendered) == 2
    for index, item in enumerate(rendered):
        assert_render_contract(item, schedule.at(index))


def test_render_chunk_rejects_unbounded_work() -> None:
    schedule = StressSchedule(seed=17, count=160)
    with pytest.raises(SyntheticInputError):
        list(render_chunk(schedule, _bases(), 0, MAX_RENDER_CHUNK + 1))
    with pytest.raises(SyntheticInputError):
        list(render_chunk(schedule, _bases(), 2, 1))


def test_render_jobs_from_verified_manifest_are_reconstructable(tmp_path: Path) -> None:
    destination = tmp_path / "cases"
    schedule = StressSchedule(seed=4, count=42)
    write_stress_manifest(destination, schedule)
    jobs = jobs_from_manifest(destination, _bases())
    first = next(jobs)
    assert first.case == schedule.at(0)
    result = first.render()
    assert_render_contract(result, first.case)


def test_mapped_manifest_requires_exact_mapping_to_render(tmp_path: Path) -> None:
    destination = tmp_path / "cases"
    bridge = SliceBridge({"fitzpatrick=VI": "G Deep V6"})
    write_stress_manifest(destination, StressSchedule(seed=4, count=42), bridge)
    with pytest.raises(SyntheticInputError):
        list(jobs_from_manifest(destination, _bases()))
    assert next(jobs_from_manifest(destination, _bases(), bridge)).case.ordinal == 0


def test_mutated_manifest_rejected_before_render_job_yield(tmp_path: Path) -> None:
    destination = tmp_path / "cases"
    write_stress_manifest(destination, StressSchedule(seed=7, count=41))
    with (destination / "stress.jsonl").open("ab") as stream:
        stream.write(b"\n")
    with pytest.raises(SyntheticInputError):
        next(jobs_from_manifest(destination, _bases()))


def test_render_never_persists_a_face_file(tmp_path: Path) -> None:
    case = StressSchedule(seed=12, count=42).at(0)
    assert not tuple(tmp_path.iterdir())
    render_case(case, _bases())
    assert not tuple(tmp_path.iterdir())
