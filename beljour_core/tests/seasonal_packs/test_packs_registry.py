"""Registry tests: built-in packs, extension by other packages, rejections.

Author: John Khan.
"""

from __future__ import annotations

import random

import numpy as np
import pytest

from plumb_api.seasonal.packs import (
    BUILTIN_PACKS,
    Look,
    LookKind,
    PackError,
    PackRegistry,
    Palette,
    RenderRequest,
    SeasonalPack,
    UnknownOccasionError,
    apply_look,
    get_pack,
    list_packs,
    register_builtin,
    register_motif,
    register_pack,
    register_renderer,
)
from plumb_api.seasonal.packs.motifs import library_ids
from plumb_api.seasonal.packs.raster import ImageArray
from plumb_api.seasonal.packs.registry import pack_problems
from plumb_api.seasonal.packs.render import renderer_names
from plumb_api.seasonal.packs.shapes import Shape, oval
from plumb_api.seasonal.packs.synthetic import single

PALETTE = Palette("#ff9933", "#138808", "#ffd700", "#3b1f0e", "#fff8e7")
SHIPPED = ("halloween", "christmas", "thanksgiving", "new_year", "easter")


def frame_look(look_id: str = "lamp_frame", motifs: tuple[str, ...] = ("lamp",)) -> Look:
    return Look(
        look_id,
        LookKind.FRAME,
        "Lamp frame",
        "frame.border",
        {"motifs": motifs},
        motifs=motifs,
    )


def test_five_packs_ship_in_frozen_order() -> None:
    assert tuple(pack.occasion for pack in list_packs()) == SHIPPED
    assert tuple(pack.occasion for pack in BUILTIN_PACKS) == SHIPPED


@pytest.mark.parametrize("occasion", SHIPPED)
def test_each_pack_has_five_or_more_looks_and_all_kinds(occasion: str) -> None:
    pack = get_pack(occasion)
    assert len(pack.looks) >= 5
    assert set(pack.kinds()) == set(LookKind)
    assert pack_problems(pack) == []


def test_halloween_has_the_five_hero_looks() -> None:
    ids = set(get_pack("halloween").look_ids())
    assert {"pumpkin_frame", "moonlit_grade", "witch_hat", "cheek_web", "floating_bats"} <= ids


def test_duplicate_registration_is_rejected() -> None:
    with pytest.raises(PackError, match="already registered"):
        register_pack(get_pack("halloween"))


def test_unknown_and_missing_occasions() -> None:
    with pytest.raises(UnknownOccasionError):
        get_pack("summer")
    with pytest.raises(PackError, match="no pack is registered for diwali"):
        get_pack("diwali")


def test_fresh_registry_is_isolated() -> None:
    registry = PackRegistry()
    assert registry.packs() == ()
    assert len(registry.missing()) == 14
    register_builtin(registry)
    register_builtin(registry)
    assert registry.occasions() == SHIPPED
    assert "diwali" in registry.missing()


def lamp(rng: random.Random) -> tuple[Shape, ...]:
    """A small clay lamp with a flame, drawn for the extension test."""
    flame = rng.choice(("#ffb703", "#fb8500"))
    return (
        oval("#a0522d", (0.5, 0.72), (0.4, 0.16)),
        oval(flame, (0.5, 0.42), (0.08, 0.18)),
    )


def test_other_packages_add_an_occasion_with_their_own_motif() -> None:
    registry = PackRegistry()
    look = frame_look(motifs=("test_lamp",))
    pack = SeasonalPack("diwali", "Diwali", PALETTE, ("test_lamp",), (look,), "Happy Diwali")
    if "test_lamp" not in library_ids("diwali"):
        with pytest.raises(PackError, match="not drawn yet"):
            registry.register(pack)
        register_motif("diwali", "test_lamp", lamp)
    with pytest.raises(PackError, match="already registered"):
        register_motif("diwali", "test_lamp", lamp)
    registry.register(pack)
    image, _ = single(128)
    out = apply_look(image, "diwali", "lamp_frame", registry=registry)
    assert np.any(out != image)
    with pytest.raises(PackError, match="no pack is registered"):
        get_pack("diwali")


def test_registration_checks_renderers() -> None:
    registry = PackRegistry()
    bad = Look("odd", LookKind.FRAME, "Odd", "frame.missing")
    pack = SeasonalPack("holi", "Holi", PALETTE, (), (bad,), "Happy Holi")
    with pytest.raises(PackError, match="unknown renderer"):
        registry.register(pack)
    wrong_kind = Look("odd", LookKind.FRAME, "Odd", "grade.split_tone")
    pack = SeasonalPack("holi", "Holi", PALETTE, (), (wrong_kind,), "Happy Holi")
    with pytest.raises(PackError, match="draws grade, not frame"):
        registry.register(pack)
    assert not registry.has("holi")


def test_registration_checks_motif_names_in_params() -> None:
    registry = PackRegistry()
    sneaky = Look(
        "sneaky",
        LookKind.FRAME,
        "Sneaky",
        "frame.border",
        {"motifs": ("lamp",), "corner": "temple_door"},
        motifs=("lamp",),
    )
    pack = SeasonalPack("diwali", "Diwali", PALETTE, ("lamp",), (sneaky,), "Happy Diwali")
    with pytest.raises(PackError, match="forbidden token 'temple'"):
        registry.register(pack)
    unlisted = Look(
        "unlisted", LookKind.FRAME, "U", "frame.border", {"motifs": ("rangoli",)}, motifs=()
    )
    pack = SeasonalPack("diwali", "Diwali", PALETTE, ("lamp",), (unlisted,), "Happy Diwali")
    with pytest.raises(PackError, match="does not list"):
        registry.register(pack)


def test_register_requires_a_pack() -> None:
    with pytest.raises(PackError, match="SeasonalPack"):
        PackRegistry().register("halloween")  # type: ignore[arg-type]


def _invert(request: RenderRequest) -> ImageArray:
    out: ImageArray = (255 - request.image).astype(np.uint8)
    return out


def test_custom_renderer_extends_the_framework() -> None:
    name = "grade.test_invert"
    if name not in renderer_names():
        register_renderer(name, LookKind.GRADE, _invert)
    with pytest.raises(PackError, match="already registered"):
        register_renderer(name, LookKind.GRADE, _invert)
    with pytest.raises(PackError, match="kind.name"):
        register_renderer("plain", LookKind.GRADE, _invert)
    look = Look("invert", LookKind.GRADE, "Invert", name)
    registry = PackRegistry()
    registry.register(SeasonalPack("holi", "Holi", PALETTE, (), (look,), "Happy Holi"))
    image, _ = single(96)
    out = apply_look(image, "holi", "invert", registry=registry)
    assert np.array_equal(out, 255 - image)


def test_apply_look_argument_checks() -> None:
    image, target = single(96)
    with pytest.raises(PackError, match="no look"):
        apply_look(image, "halloween", "missing_look")
    with pytest.raises(PackError, match="strength"):
        apply_look(image, "halloween", "moonlit_grade", strength=9.0)
    with pytest.raises(PackError, match="seed"):
        apply_look(image, "halloween", "moonlit_grade", seed=1.5)  # type: ignore[arg-type]
    with pytest.raises(PackError, match="frame"):
        apply_look(image, "halloween", "floating_bats", target, frame=-1)
    with pytest.raises(ValueError, match="uint8"):
        apply_look(image.astype(np.float32), "halloween", "moonlit_grade")
    with pytest.raises(ValueError, match="RGB"):
        apply_look(image[..., 0], "halloween", "moonlit_grade")
