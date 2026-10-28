"""W6 deep reference coverage with synthetic Lab readings; no human faces or brands."""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.shade import colourspace as cs
from plumb_api.engines.shade import finder


@pytest.mark.parametrize("depth", range(1, 11))
@pytest.mark.parametrize("undertone", ("cool", "neutral", "warm", "olive"))
def test_each_synthetic_depth_and_undertone_has_a_bounded_match(depth: int, undertone: str) -> None:
    """These are reference colour coordinates, not labelled Monk skin observations."""
    rows = [r for r in finder.extended_reference_table()
            if r["depth"] == depth and r["undertone"] == undertone]
    assert rows
    # The darkest reference for each depth stresses the deeper limit.
    target = min(rows, key=lambda r: r["lab"][0])
    lab = np.asarray(target["lab"], dtype=np.float64)
    samples = np.repeat(cs.lab_to_srgb(lab).reshape(1, 3), 400, axis=0)
    measured, _, _ = finder.trimmed_stats(finder.pixels_to_lab(samples, finder.NO_WHITE))
    candidates = finder.match_shades(measured, finder.extended_reference_table())
    assert candidates, (depth, undertone)
    assert candidates[0]["delta_e"] <= finder.thresholds()["confidence"]["refuse_delta_e_above"]
    assert candidates[0]["lighter_by"] <= finder.thresholds()["never_lighter_allowance"]


def test_deeper_new_anchors_are_fictional_and_preserve_original_inventory() -> None:
    old = finder.reference_table()
    extended = finder.extended_reference_table()
    assert len(old) == 80
    assert len(extended) == 96
    assert tuple(extended[:80]) == old
    assert len({row["id"] for row in extended}) == 96
    assert all(r["name"].startswith("Reference ") for r in extended)
    assert all(0 < float(r["lab"][0]) <= 100 for r in extended)
    assert min(r["lab"][0] for r in extended) < min(r["lab"][0] for r in old)
    assert set(r["undertone"] for r in extended[80:]) == set(finder.UNDERTONES)
    assert all(r["depth"] == 10 for r in extended[80:])


def test_never_lighten_guard_still_refuses_beyond_last_anchor() -> None:
    dark = [15.0, 7.0, 10.0]
    assert finder.match_shades(dark, finder.extended_reference_table()) == []
    assert finder.depth_band(dark[0]) == 10
    assert all(math.isfinite(c["delta_e"]) for c in finder.match_shades([30, 10, 15],
                                                                        finder.extended_reference_table()))


def test_invalid_extension_is_still_rejected() -> None:
    sample = list(finder.extended_reference_table())
    with pytest.raises(ValueError, match="twice"):
        finder.check_table([*sample, sample[-1]])
    assert finder.thresholds()["confidence"]["refuse_below"] == 0.45
    assert finder.thresholds()["confidence"]["refuse_delta_e_above"] == 6.0
