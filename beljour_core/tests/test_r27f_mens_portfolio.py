"""The 48-style men's portfolio: selection rule and per-render evidence.

Drawn heads only; tonal simulation, not a haircut prediction. Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.menshair import available_presets
from plumb_api.engines.menshair.portfolio import (
    PORTFOLIO_SIZE,
    SHORT_SIDES,
    portfolio,
    render_evidence,
    select_portfolio,
)
from plumb_api.engines.menshair.portfolio_matrix import ANCHORS, drawn_case


def test_48_styles_with_33_short_sides_across_all_six_families() -> None:
    styles = portfolio()
    assert len(styles) == PORTFOLIO_SIZE == 48 and len({s.id for s in styles}) == 48
    short = [s for s in styles if s.family in SHORT_SIDES]
    assert len(short) == 33 and {s.family for s in short} == set(SHORT_SIDES)
    others = styles[33:]
    assert all(s.presentation == "masculine" for s in others)
    assert len({s.family for s in others}) == len(others) == 15
    assert styles[0].id == "local-low-fade" and styles[-1].id == "local-skin-mid-fauxhawk"


def test_selection_keeps_source_order_and_needs_enough_concepts() -> None:
    order = {s.id: i for i, s in enumerate(available_presets())}
    positions = [order[s.id] for s in portfolio()[:33]]
    assert positions == sorted(positions)
    with pytest.raises(ValueError):
        select_portfolio(available_presets()[:20])


def test_a_render_is_verified_from_its_pixels() -> None:
    image, mask = drawn_case("light", "stripes")
    before = image.copy()
    found = render_evidence(image, mask, ANCHORS, "local-mid-fade", 4.0)
    assert found.status == "rendered" and found.verified and found.changed_pixels > 0
    assert found.source_unchanged and found.outside_unchanged and found.alpha_unchanged
    assert np.array_equal(image, before) and found.public()["provider_calls"] == 0


def test_level_one_is_unchanged_and_missing_mesh_refuses() -> None:
    image, mask = drawn_case("dark", "grain")
    unchanged = render_evidence(image, mask, ANCHORS, "local-mid-fade", 1.0)
    assert (unchanged.status, unchanged.verified, unchanged.changed_pixels) == ("unchanged", False, 0)
    refused = render_evidence(image, mask, None, "local-mid-fade")
    assert (refused.status, refused.code, refused.verified) == ("refused", "no_mesh", False)


def test_rgba_alpha_and_primary_box_are_respected() -> None:
    image, mask = drawn_case("light", "flat")
    rgba = np.dstack([image, np.full(image.shape[:2], 201, dtype=np.uint8)])
    found = render_evidence(rgba, mask, ANCHORS, "local-high-taper", 5.0, primary_box=(0, 0, 24, 56))
    assert found.verified and found.alpha_unchanged and found.outside_unchanged
    with pytest.raises(ValueError):
        render_evidence(image, mask, ANCHORS, "local-not-in-portfolio")
