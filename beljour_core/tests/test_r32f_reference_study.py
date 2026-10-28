"""R32F six-condition reference study on drawn patches: no photos, meshes or models.

Pass definition: every count reproduces the r32f rows of the committed SKN-03
evidence pack exactly (576 synthetic readings, 0 wrong accepted); the drawn
scenes follow the documented layout; the study claims no real-face pass.
Author: John Khan.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade.loaders import load_hair_shades, load_reference_shades, shade_by_id
from plumb_api.engines.shade.reference_study import (
    AGGREGATE_ID,
    CASTS,
    CONDITIONS,
    EVIDENCE_IDS,
    draw_scenario,
    evaluate_reference_scenario,
    run_reference_study,
)

REPO = Path(__file__).resolve().parents[2]
EVIDENCE = json.loads((REPO / "SKN03-EVIDENCE-F-r36f-cp2.json").read_text(encoding="utf-8"))
COMMITTED = {row["id"]: row for row in EVIDENCE["attempts"] if row["id"].startswith("r32f-")}
FIELDS = ("n", "baseline_exact", "candidate_exact", "refused", "wrong_accepted")


@pytest.fixture(scope="module")
def study():  # type: ignore[no-untyped-def]
    return run_reference_study()


def test_every_row_matches_the_committed_evidence_pack(study) -> None:  # type: ignore[no-untyped-def]
    rows = {row["id"]: row for row in study.rows()}
    assert set(rows) == set(COMMITTED) == {*EVIDENCE_IDS.values(), AGGREGATE_ID}
    for identifier, committed in COMMITTED.items():
        assert {f: rows[identifier][f] for f in FIELDS} == {f: committed[f] for f in FIELDS}, identifier


def test_aggregate_rates_and_sources(study) -> None:  # type: ignore[no-untyped-def]
    baseline, candidate = study.summaries()
    assert (baseline.exact, candidate.exact, candidate.total) == (288, 384, 576)
    assert candidate.exact_rate == pytest.approx(2 / 3)
    assert candidate.wrong_accepted == 0
    sources = [o.candidate_source for o in study.outcomes if o.condition == "forehead_glare_cheeks_agree"]
    assert sources == ["cheek_consensus"] * 96
    public = study.public()
    assert public["references"] == 96
    assert public["real_face_pass"] is False and public["tested_against_real_products"] is False


def test_study_is_deterministic_and_ordered() -> None:
    shades = load_reference_shades()[:3]
    first = run_reference_study(("flat_patches", "cheeks_disagree"), shades)
    second = run_reference_study(("flat_patches", "cheeks_disagree"), shades)
    assert [o.public() for o in first.outcomes] == [o.public() for o in second.outcomes]
    assert [(o.shade_id, o.condition) for o in first.outcomes][:2] == [
        (shades[0].id, "flat_patches"), (shades[0].id, "cheeks_disagree")]
    assert [row["id"] for row in first.rows()][-1] == AGGREGATE_ID


def test_single_condition_has_no_aggregate_row() -> None:
    rows = run_reference_study(("flat_patches",), load_reference_shades()[:2]).rows()
    assert [row["id"] for row in rows] == ["r32f-flat-patches"]


def test_drawn_layout_and_sparse_cheeks() -> None:
    lab = shade_by_id("LG-07N", "reference").lab
    image, masks, neutral = draw_scenario(lab, "flat_patches")
    assert image.shape == (28, 106, 3) and image.dtype == np.uint8
    assert neutral is None
    assert {name: int(mask.sum()) for name, mask in masks.items()} == {
        "cheek_right": 576, "cheek_left": 576, "forehead": 576}
    _, sparse, _ = draw_scenario(lab, "insufficient_cheek_samples")
    assert int(sparse["cheek_right"].sum()) == int(sparse["cheek_left"].sum()) == 6
    assert not any((masks[a] & masks[b]).any() for a in masks for b in masks if a < b)


@pytest.mark.parametrize("condition", sorted(CASTS))
def test_light_casts_have_unit_luminance_and_a_neutral_card(condition: str) -> None:
    assert float(cs.RGB_TO_XYZ[1] @ CASTS[condition]) == pytest.approx(1.0, abs=1e-12)
    _, _, neutral = draw_scenario((63.0, 13.29, 17.64), condition)
    assert neutral is not None and int(neutral.sum()) == 576


def test_one_scenario_reports_both_readers() -> None:
    outcome = evaluate_reference_scenario("LG-07N", "forehead_glare_cheeks_agree")
    assert outcome.baseline_id is None and outcome.candidate_id == "LG-07N"
    assert outcome.candidate_exact and not outcome.baseline_exact and not outcome.wrong_accepted
    assert set(outcome.public()) >= {"shade_id", "condition", "candidate_source", "refused"}


def test_unknown_conditions_and_hair_swatches_are_refused() -> None:
    with pytest.raises(ValueError):
        draw_scenario((50.0, 10.0, 10.0), "dim_light")
    with pytest.raises(ValueError):
        run_reference_study(("flat_patches", "flat_patches"))
    with pytest.raises(ValueError):
        run_reference_study(())
    with pytest.raises(ValueError):
        evaluate_reference_scenario(load_hair_shades()[0], "flat_patches")
    assert set(CONDITIONS) == set(EVIDENCE_IDS)
