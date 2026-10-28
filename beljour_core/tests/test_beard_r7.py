"""R7 LS7 beard area and strands on a drawn face mesh (no person).

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.beard import regions, strands, synthetic
from plumb_api.engines.proportions.synthetic import rolled
from plumb_api.quality.metrics import digest, q1_outside_mask, q9_monotonic

PTS = synthetic.face_points(240, 270)
FACE = synthetic.face_photo(PTS, 240, 270, 2)


def test_area_neckline_moustache_and_lips():
    high = regions.area(PTS, 270, 240, neckline="high")
    low = regions.area(PTS, 270, 240, neckline="low")
    assert low.hard.sum() > high.hard.sum()
    mous = regions.area(PTS, 270, 240, region="moustache")
    assert mous.hard.sum() < high.hard.sum() / 3
    lip = PTS[14]
    assert high.hard[int(round(lip[1])), int(round(lip[0]))] == 0
    sharp = regions.area(PTS, 270, 240, edge="sharp")
    assert (sharp.weight >= 0.5).sum() > (high.weight >= 0.5).sum()
    for kwargs in ({"neckline": "chest"}, {"edge": "soft"}, {"region": "eyebrows"}):
        with pytest.raises(ValueError):
            regions.area(PTS, 270, 240, **kwargs)


@pytest.mark.parametrize("style", list(strands.STYLES))
def test_strands_density_colour_q1_and_determinism(style):
    coverage, last = [], None
    for density in strands.DENSITIES:
        last = strands.render(FACE, PTS, style=style, density=density, colour=synthetic.HAIR_LAB)
        coverage.append(last.metrics["coverage"])
    assert q9_monotonic(coverage).passed, coverage
    assert last.metrics["strand_delta_e"] <= 3.0
    assert q1_outside_mask(FACE, last.image, last.edit_mask).passed
    again = strands.render(FACE, PTS, style=style, colour=synthetic.HAIR_LAB)
    assert digest(again.image) == digest(last.image)


def test_options_and_errors():
    hexed = strands.render(FACE, PTS, colour="#5A4030", edge="sharp", length=5, neckline="high")
    assert hexed.metrics["edge"] == "sharp" and hexed.metrics["strands"] > 0
    turned = rolled(PTS, 6.0)
    assert strands.render(synthetic.face_photo(turned, 240, 270), turned, colour=synthetic.HAIR_LAB).metrics["strands"] > 0
    rgba = np.concatenate([FACE, np.full((270, 240, 1), 255, np.uint8)], axis=2)
    assert strands.render(rgba, PTS, style="stubble").image.shape == (270, 240, 4)
    for kwargs in ({"style": "goatee"}, {"density": 7}, {"length": 0}, {"edge": "soft"}, {"colour": (1.0, 2.0)}):
        with pytest.raises(ValueError):
            strands.render(FACE, PTS, **kwargs)
    with pytest.raises(ValueError):
        strands.render(FACE, PTS[:100])


def test_growth_directions():
    across, down = np.array([1.0, 0.0]), np.array([0.0, 1.0])
    assert strands.growth(0.0, across, down, False)[1] == pytest.approx(1.0)
    right = strands.growth(1.0, across, down, False)
    assert right[0] > 0 and right[1] > 0
    assert strands.growth(-1.0, across, down, True)[0] < 0
