"""Stacking tests: fixed drawing order, limits and locality of the whole stack.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import (
    Look,
    LookKind,
    PackError,
    PackRegistry,
    Palette,
    SeasonalPack,
    StackItem,
    apply_look,
    apply_looks,
)
from plumb_api.seasonal.packs.stack import MAX_STACK, stack_order
from plumb_api.seasonal.packs.synthetic import pair, single
from plumb_api.seasonal.packs.target import protected_mask, region_mask


def test_order_follows_kind_not_taps() -> None:
    taps = [StackItem("halloween_greeting"), StackItem("witch_hat"), StackItem("moonlit_grade")]
    ordered = [item.look_id for item in stack_order("halloween", taps)]
    assert ordered == ["moonlit_grade", "witch_hat", "halloween_greeting"]


def test_ties_keep_the_callers_order() -> None:
    taps = [StackItem("cheek_web"), StackItem("witch_hat")]
    assert [i.look_id for i in stack_order("halloween", taps)] == ["cheek_web", "witch_hat"]
    taps.reverse()
    assert [i.look_id for i in stack_order("halloween", taps)] == ["witch_hat", "cheek_web"]


def test_stack_equals_manual_application_in_order() -> None:
    image, target = single(200)
    stacked = apply_looks(
        image, "christmas", ["snow_fall", "warm_grade", "knit_hat"], target, seed=10
    )
    manual = apply_look(image, "christmas", "warm_grade", target, seed=10)
    manual = apply_look(manual, "christmas", "knit_hat", target, seed=11)
    manual = apply_look(manual, "christmas", "snow_fall", target, seed=12)
    assert np.array_equal(stacked, manual)


def test_stack_strengths_are_applied() -> None:
    image, target = single(160)
    soft = apply_looks(image, "easter", [StackItem("pastel_grade", 1.0)], target)
    strong = apply_looks(image, "easter", [StackItem("pastel_grade", 5.0)], target)
    soft_change = np.abs(soft.astype(int) - image.astype(int)).sum()
    strong_change = np.abs(strong.astype(int) - image.astype(int)).sum()
    assert soft_change < strong_change


def test_stack_of_face_looks_leaves_the_bystander_alone() -> None:
    image, chosen, bystander = pair()
    height, width = image.shape[:2]
    looks = ["witch_hat", "cheek_web", "floating_bats", "star_freckles"]
    out = apply_looks(image, "halloween", looks, chosen, seed=4)
    diff = np.any(out != image, axis=2)
    assert diff.any()
    assert not diff[~region_mask(chosen, width, height)].any()
    assert not diff[region_mask(bystander, width, height)].any()
    assert not diff[protected_mask(chosen, width, height)].any()


def test_stack_limits() -> None:
    image, target = single(96)
    with pytest.raises(PackError, match="at least one"):
        apply_looks(image, "halloween", [], target)
    with pytest.raises(PackError, match="once"):
        apply_looks(image, "halloween", ["witch_hat", "witch_hat"], target)
    grades = tuple(
        Look(name, LookKind.GRADE, name.title(), "grade.split_tone") for name in ("cool", "warm")
    )
    palette = Palette("#111111", "#222222", "#333333", "#000000", "#ffffff")
    registry = PackRegistry()
    registry.register(SeasonalPack("holi", "Holi", palette, (), grades, "Happy Holi"))
    with pytest.raises(PackError, match="one grade"):
        stack_order("holi", [StackItem("cool"), StackItem("warm")], registry)
    too_many = [
        StackItem(look_id)
        for look_id in (
            "pumpkin_frame",
            "witch_hat",
            "cat_ears",
            "cheek_web",
            "star_freckles",
            "floating_bats",
            "halloween_greeting",
        )
    ]
    assert len(too_many) > MAX_STACK
    with pytest.raises(PackError, match="at most"):
        stack_order("halloween", too_many)


def test_stack_rejects_looks_from_another_pack() -> None:
    with pytest.raises(PackError, match="no look"):
        stack_order("halloween", [StackItem("knit_hat")])


def test_stack_needs_a_face_only_for_face_looks() -> None:
    image, _ = single(96)
    out = apply_looks(image, "new_year", ["midnight_grade", "starlight_frame"])
    assert np.any(out != image)
    with pytest.raises(PackError, match="chosen face"):
        apply_looks(image, "new_year", ["midnight_grade", "party_hat"])
