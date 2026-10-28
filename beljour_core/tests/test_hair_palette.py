"""Synthetic colour vectors only; no commercial product claims or face photos."""
from __future__ import annotations

import math
from pathlib import Path

import pytest

from plumb_api.engines.core.colour import ciede2000, lab_to_rgb, rgb_to_lab
from plumb_api.engines.hair_palette import catalogue, measured_level, require_shade, suggest
from plumb_api.engines.hair_palette.catalogue import HairShade
from plumb_api.engines.hair_palette.export import render_source, write_or_check


def test_ninety_original_shades_have_complete_provenance():
    shades = catalogue()
    assert len(shades) >= 60
    assert len({shade.id for shade in shades}) == len(shades)
    assert all(shade.assumed and 1 <= shade.level <= 10 for shade in shades)
    assert all(not any(token in shade.name.casefold() for token in ("loreal", "wella", "redken")) for shade in shades)
    assert set(range(1, 11)) <= {s.level for s in shades if s.family == "natural"}
    for family in ("natural", "ash", "golden", "copper", "red", "violet", "mahogany"):
        assert {s.undertone for s in shades if s.family == family} == {"warm", "neutral", "cool"}
    assert {"fashion", "grey", "silver", "white"} <= {s.family for s in shades}


def test_lab_lch_gamut_and_round_trips():
    for shade in catalogue():
        rgb = lab_to_rgb(shade.lab)
        assert all(-1e-6 <= channel <= 255 + 1e-6 for channel in rgb)
        assert max(abs(a - b) for a, b in zip(rgb, shade.rgb, strict=True)) < .1
        assert max(abs(a - b) for a, b in zip(rgb_to_lab(shade.rgb), shade.lab, strict=True)) < .006
        assert shade.lch[0] == shade.lab[0]
        assert abs(shade.lch[1] - math.hypot(*shade.lab[1:])) < .001
        assert abs((shade.lch[2] - math.degrees(math.atan2(shade.lab[2], shade.lab[1]))) % 360) < 360


def test_perceptual_distances_are_distinct_and_deterministic():
    shades = catalogue()
    for i, first in enumerate(shades):
        for other in shades[i + 1:]:
            assert ciede2000(first.lab, other.lab) >= 1.0
    for sample in (shades[3], shades[18], shades[35], shades[64], shades[-1]):
        result = suggest(sample.lab, allow_lightening=True, count=4)
        assert result[0].shade.id == sample.id
        assert result[0].delta_e00 == pytest.approx(0, abs=1e-8)
        assert result == suggest(sample.lab, allow_lightening=True, count=4)
        assert require_shade(sample.id) is sample


def test_default_never_proposes_lighter_levels():
    for sample in catalogue()[::7]:
        readings = suggest(sample.lab, count=8)
        assert all(row.shade.level <= row.measured_level for row in readings)
        assert all(row.no_lightening for row in readings)
        assert 1 <= measured_level(sample.lab) <= 10
    with pytest.raises(ValueError, match="Unknown"):
        require_shade("fictional-unregistered-brand")


def test_family_undertone_and_invalid_inputs():
    neutral = require_shade("natural-05-n")
    results = suggest(neutral.lab, family="natural", undertone="cool", count=10)
    assert results and all(row.shade.family == "natural" and row.shade.undertone == "cool" for row in results)
    for bad in ((float("nan"), 2., 3.), (102., 0., 0.), (33., 200., 0.), (20.,)):
        with pytest.raises(ValueError):
            suggest(bad)
    with pytest.raises(ValueError, match="undertone"):
        suggest(neutral.lab, undertone="pink")  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="Count"):
        suggest(neutral.lab, count=100)


def test_validation_rejects_disguised_and_uncleared_sources():
    entry = catalogue()[0].public()
    with pytest.raises(ValueError, match="estimated"):
        HairShade.parse({**entry, "assumed": False})
    with pytest.raises(ValueError, match="disagree"):
        HairShade.parse({**entry, "lab": [50., 0., 0.]})
    with pytest.raises(ValueError, match="unknown"):
        HairShade.parse({**entry, "brand": "invented"})


def test_mirror_drift_fails_closed(tmp_path: Path):
    source = tmp_path / "data.ts"
    assert write_or_check(source, check=False)
    assert write_or_check(source, check=True)
    assert source.read_text() == render_source()
    source.write_text(source.read_text().replace("Natural depth", "Changed by hand", 1))
    assert not write_or_check(source, check=True)
