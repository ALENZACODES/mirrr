"""Motif tests: the shared MotifProvider contract and the respect rules.

Author: John Khan.
"""

from __future__ import annotations

import random
import xml.etree.ElementTree as ElementTree

import pytest

from plumb_api.seasonal.packs import (
    FORBIDDEN_TOKENS,
    MotifProvider,
    PackError,
    PackMotifProvider,
    forbidden_problems,
    is_forbidden,
    list_packs,
    register_motif,
)
from plumb_api.seasonal.packs.forbidden import forbidden_reason, motif_tokens
from plumb_api.seasonal.packs.motifs import BUILTIN_MOTIFS, MotifError, library_ids, motif_shapes
from plumb_api.seasonal.packs.registry import pack_problems
from plumb_api.seasonal.packs.shapes import ShapeKind, crescent_points, group_svg, oval

PROVIDER: MotifProvider = PackMotifProvider()
ALL_MOTIFS = [
    (occasion, motif) for occasion, builders in BUILTIN_MOTIFS.items() for motif in builders
]
SVG = "{http://www.w3.org/2000/svg}"


def parse(svg: str) -> ElementTree.Element:
    wrapped = f'<svg xmlns="http://www.w3.org/2000/svg">{svg}</svg>'
    return ElementTree.fromstring(wrapped)


def test_provider_lists_five_motifs_for_each_shipped_occasion() -> None:
    for occasion in ("halloween", "christmas", "thanksgiving", "new_year", "easter"):
        assert len(PROVIDER.motif_ids(occasion)) == 5
    # Other tests may register throwaway motifs (prefixed test_ or audit_) for kwanzaa.
    assert all(m.startswith(("test_", "audit_")) for m in PROVIDER.motif_ids("kwanzaa"))


def test_provider_rejects_unknown_occasions_and_motifs() -> None:
    with pytest.raises(KeyError):
        PROVIDER.motif_ids("summer")
    with pytest.raises(MotifError, match="no motif"):
        PROVIDER.motif_svg("halloween", "snowflake", 64, 0)
    with pytest.raises(MotifError, match="positive"):
        PROVIDER.motif_svg("halloween", "bat", 0, 0)
    with pytest.raises(MotifError, match="positive"):
        PROVIDER.motif_svg("halloween", "bat", float("nan"), 0)


@pytest.mark.parametrize(("occasion", "motif"), ALL_MOTIFS)
def test_motif_svg_is_one_self_contained_group(occasion: str, motif: str) -> None:
    svg = PROVIDER.motif_svg(occasion, motif, 96.0, 4)
    root = parse(svg)
    groups = list(root)
    assert len(groups) == 1 and groups[0].tag == f"{SVG}g"
    assert groups[0].get("data-motif") == motif
    lowered = svg.lower()
    for banned in ("<script", "href", "url(", "<text", "<image", "<foreignobject", "on"):
        if banned == "on":
            assert " onload" not in lowered and " onclick" not in lowered
        else:
            assert banned not in lowered


@pytest.mark.parametrize(("occasion", "motif"), ALL_MOTIFS)
def test_motif_fits_its_box(occasion: str, motif: str) -> None:
    size = 100.0
    root = parse(PROVIDER.motif_svg(occasion, motif, size, 1))
    for element in root.iter():
        points = element.get("points")
        if points:
            for pair in points.split():
                x, y = (float(v) for v in pair.split(","))
                assert -2.0 <= x <= size + 2.0 and -2.0 <= y <= size + 2.0
        if element.get("cx") is not None:
            cx, cy = float(element.get("cx", "0")), float(element.get("cy", "0"))
            assert 0.0 <= cx <= size and 0.0 <= cy <= size


@pytest.mark.parametrize(("occasion", "motif"), ALL_MOTIFS)
def test_motifs_are_seeded_and_deterministic(occasion: str, motif: str) -> None:
    first = PROVIDER.motif_svg(occasion, motif, 50, 7)
    again = PROVIDER.motif_svg(occasion, motif, 50, 7)
    assert first == again
    variants = {PROVIDER.motif_svg(occasion, motif, 50, seed) for seed in range(12)}
    assert all(v.startswith("<g ") for v in variants)


def test_seeds_change_details_of_some_motifs() -> None:
    for occasion, motif in (("halloween", "pumpkin"), ("easter", "egg"), ("new_year", "confetti")):
        variants = {PROVIDER.motif_svg(occasion, motif, 50, seed) for seed in range(10)}
        assert len(variants) > 1


def test_motif_sizes_scale_coordinates() -> None:
    small = motif_shapes("christmas", "ornament", 3)
    svg_small = group_svg(small, 10, {})
    svg_large = group_svg(small, 1000, {})
    assert svg_small != svg_large
    assert len(parse(svg_small)[0]) == len(small)


def test_shapes_are_well_formed() -> None:
    for occasion, motif in ALL_MOTIFS:
        for shape in motif_shapes(occasion, motif, 2):
            assert shape.colour.startswith("#") and len(shape.colour) == 7
            assert 0.0 < shape.opacity <= 1.0
            if shape.kind is ShapeKind.POLYGON:
                assert len(shape.points) >= 3
            elif shape.kind is ShapeKind.LINE:
                assert len(shape.points) >= 2 and shape.width > 0
            else:
                assert shape.radii[0] > 0 and shape.radii[1] > 0


def test_crescent_is_a_thin_shape_inside_the_circle() -> None:
    points = crescent_points((0.5, 0.5), 0.4, (0.64, 0.4), 0.34)
    assert len(points) > 20
    for x, y in points:
        assert (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.4**2 + 1e-9


def test_rotated_ellipse_svg_has_a_transform() -> None:
    svg = group_svg((oval("#123456", (0.5, 0.5), (0.2, 0.1), angle=30.0),), 10, {"id": "x"})
    assert 'transform="rotate(30 5 5)"' in svg


def test_forbidden_list_covers_the_named_rules() -> None:
    for token in ("khanda", "cross", "deity", "prophet", "saint", "scripture", "temple"):
        assert token in FORBIDDEN_TOKENS
    for token in ("gurdwara", "mosque", "church", "synagogue", "costume", "caricature"):
        assert token in FORBIDDEN_TOKENS


@pytest.mark.parametrize(
    "motif",
    ["khanda", "khanda_sticker", "golden_temple", "cross", "praying_saint", "deity_face"],
)
def test_forbidden_ids_are_caught(motif: str) -> None:
    assert is_forbidden(motif)
    assert forbidden_problems([motif])


@pytest.mark.parametrize(
    "motif",
    ["moon", "lantern", "diya", "rangoli", "menorah", "dreidel", "kinara", "colour_powder"],
)
def test_community_greeting_symbols_are_allowed(motif: str) -> None:
    assert not is_forbidden(motif)


def test_bad_ids_are_reported_as_not_snake_case() -> None:
    reason = forbidden_reason("Bad Id")
    assert reason is not None and "snake case" in reason
    assert motif_tokens("a_b__c") == ("a", "b", "c")


def test_no_shipped_pack_or_motif_uses_a_forbidden_id() -> None:
    every_id: list[str] = []
    for builders in BUILTIN_MOTIFS.values():
        every_id.extend(builders)
    for pack in list_packs():
        every_id.extend(pack.motifs)
        for look in pack.looks:
            every_id.extend(look.motifs)
            every_id.append(look.id)
            style = look.params.get("style")
            if isinstance(style, str):
                every_id.append(style)
        assert pack_problems(pack) == []
    assert forbidden_problems(every_id) == []


def test_provider_ids_for_other_occasions_pass_the_ban_list() -> None:
    for occasion in ("diwali", "hanukkah", "eid_al_fitr", "kwanzaa", "vaisakhi"):
        assert forbidden_problems(PROVIDER.motif_ids(occasion)) == []


def test_register_motif_rejects_forbidden_and_unknown() -> None:
    def builder(rng: random.Random) -> tuple[()]:
        return ()

    with pytest.raises(PackError, match="forbidden"):
        register_motif("vaisakhi", "khanda", builder)
    with pytest.raises(KeyError):
        register_motif("summer", "sun", builder)
    with pytest.raises(PackError, match="already registered"):
        register_motif("halloween", "bat", builder)
    assert "khanda" not in library_ids("vaisakhi")
