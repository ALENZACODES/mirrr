"""Occasion model, respect rules and motif provider contract tests.

Author: John Khan.
"""

from __future__ import annotations

import re

import pytest

from plumb_api.seasonal.cards import (
    FORBIDDEN_MOTIFS,
    OCCASION_IDS,
    OCCASIONS,
    BuiltinMotifProvider,
    MotifError,
    UnknownLookError,
    UnknownOccasionError,
    audit_provider,
    is_forbidden_motif,
)
from plumb_api.seasonal.cards.colour import parse_hex
from plumb_api.seasonal.cards.grammar import design_from_seed
from plumb_api.seasonal.cards.motifs import (
    BUILTIN_MOTIFS,
    KINARA_BLACK,
    KINARA_GREEN,
    KINARA_RED,
    draw_motif,
)
from plumb_api.seasonal.cards.occasions import (
    LAYOUT_IDS,
    PATTERN_FAMILIES,
    get_look,
    get_occasion,
)
from plumb_api.seasonal.cards.patterns import PATTERN_SPECS
from plumb_api.seasonal.cards.provider import check_motif_svg
from plumb_api.seasonal.cards.shapes import shape_bounds

FROZEN_IDS = (
    "halloween", "christmas", "thanksgiving", "new_year", "easter", "kwanzaa", "hanukkah",
    "eid_al_fitr", "eid_al_adha", "diwali", "holi", "vaisakhi", "gurpurab", "bandi_chhor_divas",
)


def test_occasion_ids_are_the_frozen_fourteen_in_order() -> None:
    assert OCCASION_IDS == FROZEN_IDS
    assert tuple(OCCASIONS) == FROZEN_IDS
    for occasion_id in OCCASION_IDS:
        assert re.fullmatch(r"[a-z]+(_[a-z]+)*", occasion_id)


def test_every_occasion_has_five_looks() -> None:
    assert len(OCCASIONS["halloween"].looks) == 5
    for occasion in OCCASIONS.values():
        assert len(occasion.looks) == 5, occasion.id
        assert len(set(occasion.look_ids)) == len(occasion.looks)


@pytest.mark.parametrize("occasion_id", FROZEN_IDS)
def test_every_look_is_well_formed(occasion_id: str) -> None:
    occasion = get_occasion(occasion_id)
    assert occasion.greeting.startswith(("Happy", "Merry", "Eid"))
    assert occasion.name
    for look in occasion.looks:
        assert len(look.palette) == 6
        assert len(set(look.palette)) == 6, f"{look.id} repeats a colour"
        for colour in look.palette:
            parse_hex(colour)
        assert look.grounds and all(0 <= g < 6 for g in look.grounds)
        assert set(look.layouts) <= set(LAYOUT_IDS)
        assert set(look.patterns) <= set(PATTERN_FAMILIES)
        assert set(look.motifs) <= set(occasion.motifs)
        assert len(look.patterns) >= 4


def test_every_pattern_family_is_used_by_some_look() -> None:
    used = {family for occ in OCCASIONS.values() for look in occ.looks
            for family in look.patterns}
    assert used == set(PATTERN_FAMILIES)


def test_look_palettes_are_not_reused() -> None:
    palettes = [look.palette for occ in OCCASIONS.values() for look in occ.looks]
    assert len(set(palettes)) == len(palettes)


def test_pattern_families_all_have_specs_and_valid_ranges() -> None:
    assert set(PATTERN_SPECS) == set(PATTERN_FAMILIES)
    for family, specs in PATTERN_SPECS.items():
        assert specs, family
        for spec in specs:
            assert spec.lo < spec.hi, f"{family}.{spec.name}"


def test_unknown_occasion_and_look_raise_typed_errors() -> None:
    with pytest.raises(UnknownOccasionError):
        get_occasion("birthday")
    with pytest.raises(UnknownLookError):
        get_look("halloween", "snowy_pines")
    with pytest.raises(KeyError):
        get_occasion("Halloween")


def test_forbidden_list_covers_named_rules() -> None:
    for required in ("khanda", "deity", "prophet", "saint", "scripture", "mosque", "temple",
                     "gurdwara", "church", "synagogue", "costume_caricature"):
        assert required in FORBIDDEN_MOTIFS
    assert is_forbidden_motif("khanda")
    assert is_forbidden_motif("gold_khanda_sticker")
    assert is_forbidden_motif("KHANDA")
    assert is_forbidden_motif("small-mosque")
    assert not is_forbidden_motif("diya")
    assert not is_forbidden_motif("crescent")


def test_no_occasion_look_or_builtin_motif_uses_a_forbidden_id() -> None:
    for occasion in OCCASIONS.values():
        for motif_id in occasion.motifs:
            assert not is_forbidden_motif(motif_id), (occasion.id, motif_id)
        for look in occasion.looks:
            for motif_id in look.motifs:
                assert not is_forbidden_motif(motif_id)
    for motif_id in BUILTIN_MOTIFS:
        assert not is_forbidden_motif(motif_id)


def test_no_generated_card_uses_a_forbidden_motif() -> None:
    for occasion_id in OCCASION_IDS:
        for seed in range(40):
            design = design_from_seed(occasion_id, seed)
            for ornament in design.ornaments:
                assert not is_forbidden_motif(ornament.motif_id)
                assert ornament.motif_id in OCCASIONS[occasion_id].motifs


def test_symbols_match_the_communities_greeting_set() -> None:
    expected = {
        "halloween": {"pumpkin", "bat"},
        "christmas": {"snowflake", "evergreen"},
        "thanksgiving": {"maple_leaf", "wheat"},
        "new_year": {"confetti_burst", "firework"},
        "easter": {"egg", "tulip"},
        "kwanzaa": {"kinara"},
        "hanukkah": {"menorah", "dreidel"},
        "eid_al_fitr": {"crescent", "lantern"},
        "eid_al_adha": {"crescent", "lantern"},
        "diwali": {"diya", "rangoli"},
        "holi": {"colour_powder"},
        "vaisakhi": {"wheat", "light_string"},
        "gurpurab": {"diya", "light_string"},
        "bandi_chhor_divas": {"diya", "light_string"},
    }
    for occasion_id, motifs in expected.items():
        assert motifs <= set(OCCASIONS[occasion_id].motifs), occasion_id


def test_builtin_provider_passes_its_own_audit() -> None:
    assert audit_provider(BuiltinMotifProvider()) == []


@pytest.mark.parametrize("motif_id", sorted(BUILTIN_MOTIFS))
def test_each_builtin_motif_draws_inside_a_padded_unit_box(motif_id: str) -> None:
    for seed in range(5):
        shapes = draw_motif(motif_id, seed)
        assert shapes, motif_id
        x0, y0, x1, y1 = shape_bounds(shapes)
        assert x0 >= -0.12 and y0 >= -0.12 and x1 <= 1.12 and y1 <= 1.12, (motif_id, seed)


def test_kinara_keeps_the_seven_candle_colours() -> None:
    shapes = draw_motif("kinara", 3)
    colours = [s.colour for s in shapes]
    assert colours.count(KINARA_RED) == 3
    assert colours.count(KINARA_BLACK) == 1
    assert colours.count(KINARA_GREEN) == 3


def test_motif_svg_is_one_safe_group_sized_to_the_box() -> None:
    provider = BuiltinMotifProvider()
    svg = provider.motif_svg("diwali", "diya", 64.0, 7)
    check_motif_svg(svg)
    assert svg.startswith('<g data-motif="diya">')
    coords = " ".join(re.findall(r'(?:points|cx|cy)="([^"]+)"', svg))
    numbers = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", coords)]
    assert numbers
    assert max(numbers) <= 64.0 * 1.15
    assert "@" not in svg, "palette roles must be resolved in stand-alone SVG"


def test_provider_refuses_motifs_outside_the_occasion() -> None:
    with pytest.raises(MotifError):
        BuiltinMotifProvider().motif_svg("diwali", "pumpkin", 32.0, 0)


@pytest.mark.parametrize("bad", [
    "<g><script>alert(1)</script></g>",
    '<g><image href="https://example.com/x.png"/></g>',
    "<g><text>verse</text></g>",
    '<g onload="x()"></g>',
    "<circle r='3'/>",
    "<g><g></g>",
    '<g style="fill:url(#a)"></g>',
])
def test_unsafe_motif_svg_is_rejected(bad: str) -> None:
    with pytest.raises(MotifError):
        check_motif_svg(bad)


class _BadProvider:
    def motif_ids(self, occasion: str) -> tuple[str, ...]:
        return ("khanda", "lamp")

    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str:
        return "<g><text>hello</text></g>"


def test_audit_flags_forbidden_ids_and_unsafe_svg_from_any_provider() -> None:
    problems = audit_provider(_BadProvider(), occasions=("diwali",))
    assert any("khanda" in p and "forbidden" in p for p in problems)
    assert any("lamp" in p and "forbidden construct" in p for p in problems)
