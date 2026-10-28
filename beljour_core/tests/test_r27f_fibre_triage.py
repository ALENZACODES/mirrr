"""Fibre-cover triage: coded not_applicable outcomes stay counted; eligible inputs render.

Drawn hair blocks only. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.concealer import CoverSession
from plumb_api.engines.concealer.triage import cover_with_triage, summarize_triage, triage_cover
from tests.r27f_fixtures import HEAD, hair_block


def test_eligible_hair_renders_through_the_guarded_renderer() -> None:
    image, region, scalp = hair_block((64, 41, 39))
    before = image.copy()
    found = cover_with_triage(CoverSession(), image, region, scalp, landmarks=HEAD, level=4.0)
    assert found.status == "rendered" and found.result is not None and found.result.changed_pixels > 0
    changed = np.any(found.result.image[..., :3] != before[..., :3], axis=-1)
    assert not np.any(changed & (scalp < 128)) and np.array_equal(image, before)
    assert found.public()["render"]["provider_calls"] == 0


def test_level_one_is_unchanged_not_a_render() -> None:
    image, region, scalp = hair_block((64, 41, 39))
    assert cover_with_triage(CoverSession(), image, region, scalp, landmarks=HEAD, level=1.0).status == "unchanged"


@pytest.mark.parametrize(("case", "code"), [
    ("no_mesh", "no_mesh"), ("small", "insufficient_hair"), ("dark", "too_dark"), ("flat", "low_detail"),
])
def test_unreadable_inputs_are_coded_not_applicable(case: str, code: str) -> None:
    image, region, scalp = hair_block((2, 2, 2), scalp=(3, 2, 2)) if case == "dark" else \
        hair_block((64, 41, 39), detail=0) if case == "flat" else hair_block((64, 41, 39))
    if case == "small":
        region = np.zeros_like(region)
        region[40:50, 30:40] = 255
    landmarks = None if case == "no_mesh" else HEAD
    found = cover_with_triage(CoverSession(), image, region, scalp, landmarks=landmarks)
    assert (found.status, found.code, found.result) == ("not_applicable", code, None)


def test_renderer_refusals_are_kept() -> None:
    image, region, _ = hair_block((64, 41, 39))
    found = cover_with_triage(CoverSession(), image, region, np.zeros_like(region), landmarks=HEAD)
    assert (found.status, found.code) == ("refused", "no_scalp")


def test_summary_keeps_every_case_in_the_denominator() -> None:
    session = CoverSession()
    image, region, scalp = hair_block((64, 41, 39))
    outcomes = [cover_with_triage(session, image, region, scalp, landmarks=HEAD),
                cover_with_triage(session, image, region, scalp, landmarks=None),
                cover_with_triage(session, image, region, np.zeros_like(scalp), landmarks=HEAD)]
    body = summarize_triage(outcomes).public()
    assert body["total"] == 3 and body["statuses"] == {"not_applicable": 1, "rendered": 1, "unchanged": 0,
                                                      "refused": 1}
    assert body["codes"] == {"no_mesh": 1, "no_scalp": 1}
    with pytest.raises(ValueError):
        summarize_triage([triage_cover(image, region, scalp, landmarks=HEAD)])
    with pytest.raises(ValueError):
        triage_cover(image, region[:-1], scalp, landmarks=HEAD)
