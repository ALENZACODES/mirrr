"""R28F local hair acceptance scorecard: counts only, real-face quality not tested.

Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.commerce.local_hair_acceptance import summarize_local_hair
from plumb_api.commerce.local_hair_journey import JourneyResult, run_local_hair
from plumb_api.commerce.local_hair_recipe import LocalHairRecipe
from tests.r31f_fibre_scene import HEAD, scene


def journeys() -> list[JourneyResult]:
    image, region, scalp = scene()
    recipes = [LocalHairRecipe("fibre", 3.0, zone="crown"), LocalHairRecipe("fibre", 1.0, zone="crown"),
               LocalHairRecipe("palette", 3.0, shade_id="natural-03-n"),
               LocalHairRecipe("palette", 3.0, shade_id="golden-08-w"),
               LocalHairRecipe("short-sides", 3.0, style_id="local-low-fade")]
    out = [run_local_hair(r, image, region, HEAD, scalp_mask=scalp) for r in recipes]
    out.append(run_local_hair(LocalHairRecipe("short-sides", 2.0, style_id="local-low-fade"), image, region, None))
    return out


def test_every_journey_shares_one_denominator() -> None:
    report = summarize_local_hair(journeys())
    assert report.attempted == 6
    assert dict(report.totals) == {"rendered": 3, "unchanged": 1, "refused": 2}
    assert dict(report.by_kind["palette"]) == {"rendered": 1, "unchanged": 0, "refused": 1}
    assert dict(report.refusal_codes) == {"lightening_not_automatic": 1, "no_mesh": 1}
    assert report.rendered_rate == pytest.approx(0.5)


def test_summaries_are_accepted_and_quality_is_never_claimed() -> None:
    report = summarize_local_hair([j.summary() for j in journeys()]).public()
    assert report["real_face_quality"] == "not_tested" and report["release_pass"] is False
    assert summarize_local_hair([]).public()["rendered_rate"] == 0.0


def test_unknown_rows_are_refused() -> None:
    with pytest.raises(ValueError):
        summarize_local_hair([{"kind": "wig", "status": "rendered"}])
    with pytest.raises(ValueError):
        summarize_local_hair([{"kind": "fibre", "status": "approved"}])
    with pytest.raises(ValueError):
        summarize_local_hair([42])  # type: ignore[list-item]
