"""Validation tests for SeasonalPack, Look, Palette and strength levels.

Author: John Khan.
"""

from __future__ import annotations

import math

import pytest

from plumb_api.seasonal.packs import (
    OCCASION_IDS,
    OCCASIONS,
    Look,
    LookKind,
    PackError,
    Palette,
    SeasonalPack,
    StrengthCurve,
    UnknownOccasionError,
    validate_strength,
)
from plumb_api.seasonal.packs.model import hex_to_rgb
from plumb_api.seasonal.packs.occasions import require_occasion

PALETTE = Palette("#112233", "#445566", "#778899", "#000000", "#ffffff")


def grade(look_id: str = "test_grade") -> Look:
    return Look(look_id, LookKind.GRADE, "Test grade", "grade.split_tone", {"tint": 0.1})


def pack(*looks: Look, motifs: tuple[str, ...] = ()) -> SeasonalPack:
    return SeasonalPack("halloween", "Test", PALETTE, motifs, looks or (grade(),), "Hello")


def test_occasion_ids_are_the_frozen_fourteen() -> None:
    assert OCCASION_IDS == (
        "halloween",
        "christmas",
        "thanksgiving",
        "new_year",
        "easter",
        "kwanzaa",
        "hanukkah",
        "eid_al_fitr",
        "eid_al_adha",
        "diwali",
        "holi",
        "vaisakhi",
        "gurpurab",
        "bandi_chhor_divas",
    )
    assert set(OCCASIONS) == set(OCCASION_IDS)
    for occasion, info in OCCASIONS.items():
        assert info.id == occasion
        assert info.greeting and len(info.greeting) <= 60
        assert info.days >= 1


def test_unknown_occasion_has_a_clear_message() -> None:
    with pytest.raises(UnknownOccasionError) as caught:
        require_occasion("summer")
    assert "summer" in str(caught.value)
    assert "halloween" in str(caught.value)


@pytest.mark.parametrize("value", [1.0, 1.1, 2.5, 3.0, 4.9, 5.0, 3])
def test_strength_on_the_grid_is_accepted(value: float) -> None:
    assert validate_strength(value) == pytest.approx(float(value))


@pytest.mark.parametrize("value", [0.9, 5.1, 2.55, 1.05, -1.0, math.nan, math.inf])
def test_strength_off_the_grid_is_rejected(value: float) -> None:
    with pytest.raises(PackError):
        validate_strength(value)


def test_strength_rejects_non_numbers() -> None:
    with pytest.raises(PackError):
        validate_strength(True)
    with pytest.raises(PackError):
        validate_strength("3.0")  # type: ignore[arg-type]


def test_strength_rounds_float_noise() -> None:
    assert validate_strength(0.1 * 3 + 1.0) == 1.3


def test_palette_rejects_bad_colours_and_roles() -> None:
    with pytest.raises(PackError, match="primary"):
        Palette("red", "#000000", "#000000", "#000000", "#000000")
    with pytest.raises(PackError, match="unknown palette role"):
        PALETTE.rgb("shadow")
    assert PALETTE.rgb("light") == (255, 255, 255)
    assert PALETTE.rgb("#0a0b0c") == (10, 11, 12)
    assert PALETTE.roles()[0] == "#112233"


def test_hex_to_rgb() -> None:
    assert hex_to_rgb("#ff8000") == (255, 128, 0)
    with pytest.raises(PackError):
        hex_to_rgb("#ff80")


def test_look_validation_errors_name_the_look() -> None:
    with pytest.raises(PackError, match="lower snake case"):
        Look("Bad-Id", LookKind.GRADE, "x", "grade.split_tone")
    with pytest.raises(PackError, match="title"):
        Look("ok", LookKind.GRADE, " ", "grade.split_tone")
    with pytest.raises(PackError, match="renderer"):
        Look("ok", LookKind.GRADE, "Title", "")
    with pytest.raises(PackError, match="ok: strength"):
        Look("ok", LookKind.GRADE, "Title", "grade.split_tone", default_strength=7.0)
    with pytest.raises(PackError, match="kind"):
        Look("ok", "grade", "Title", "grade.split_tone")  # type: ignore[arg-type]


def test_look_params_are_frozen_and_checked() -> None:
    look = grade()
    with pytest.raises(TypeError):
        look.params["tint"] = 0.5  # type: ignore[index]
    with pytest.raises(PackError, match="unsupported type"):
        bad: dict[str, object] = {"tint": [0.1]}
        Look("ok", LookKind.GRADE, "T", "grade.split_tone", bad)  # type: ignore[arg-type]
    with pytest.raises(PackError, match="finite"):
        Look("ok", LookKind.GRADE, "T", "grade.split_tone", {"tint": math.nan})
    with pytest.raises(PackError, match="parameter name"):
        Look("ok", LookKind.GRADE, "T", "grade.split_tone", {"Tint": 0.1})


def test_look_param_readers() -> None:
    look = Look(
        "ok",
        LookKind.FRAME,
        "T",
        "frame.border",
        {"band": 0.1, "style": "band", "motifs": ("a", "b"), "flag": True},
    )
    assert look.param_float("band", 0.5) == 0.1
    assert look.param_float("missing", 0.5) == 0.5
    assert look.param_str("style", "x") == "band"
    assert look.param_names("motifs", ()) == ("a", "b")
    with pytest.raises(PackError):
        look.param_float("style", 0.0)
    with pytest.raises(PackError):
        look.param_float("flag", 0.0)
    with pytest.raises(PackError):
        look.param_str("band", "")
    with pytest.raises(PackError):
        look.param_names("style", ())


def test_look_rejects_forbidden_motifs() -> None:
    with pytest.raises(PackError, match="forbidden"):
        Look("ok", LookKind.FRAME, "T", "frame.border", motifs=("khanda",))


def test_kind_face_rules() -> None:
    assert LookKind.ACCESSORY.needs_face and LookKind.LIGHT.needs_face
    for kind in (LookKind.FRAME, LookKind.GRADE, LookKind.GREETING):
        assert kind.whole_image and not kind.needs_face


def test_pack_validation() -> None:
    with pytest.raises(PackError, match="frozen occasion"):
        SeasonalPack("summer", "T", PALETTE, (), (grade(),), "Hi")
    with pytest.raises(PackError, match="duplicate look ids"):
        pack(grade("a"), grade("a"))
    with pytest.raises(PackError, match="1-12 looks"):
        SeasonalPack("halloween", "T", PALETTE, (), (), "Hi")
    with pytest.raises(PackError, match="duplicate motif"):
        pack(motifs=("bat", "bat"))
    with pytest.raises(PackError, match="forbidden"):
        pack(motifs=("church_window",))
    with pytest.raises(PackError, match="greeting"):
        SeasonalPack("halloween", "T", PALETTE, (), (grade(),), "x" * 61)
    with pytest.raises(PackError, match="title"):
        SeasonalPack("halloween", " ", PALETTE, (), (grade(),), "Hi")
    with pytest.raises(PackError, match="palette"):
        SeasonalPack("halloween", "T", "#000000", (), (grade(),), "Hi")  # type: ignore[arg-type]


def test_pack_rejects_look_motifs_outside_the_pack() -> None:
    look = Look("f", LookKind.FRAME, "T", "frame.border", motifs=("bat",))
    with pytest.raises(PackError, match="does not list"):
        pack(look, motifs=("pumpkin",))


def test_pack_lookup_helpers() -> None:
    first = grade("first")
    second = Look("second", LookKind.FRAME, "T", "frame.border", motifs=("bat",))
    built = pack(first, second, motifs=("bat",))
    assert built.look("second") is second
    assert built.look_ids() == ("first", "second")
    assert built.kinds() == (LookKind.GRADE, LookKind.FRAME)
    with pytest.raises(PackError, match="first, second"):
        built.look("third")


def test_curves_are_distinct_in_the_middle() -> None:
    look_values = {
        curve: Look("x", LookKind.GRADE, "T", "grade.split_tone", curve=curve).amount(3.0)
        for curve in StrengthCurve
    }
    assert look_values[StrengthCurve.EASE_IN] < look_values[StrengthCurve.LINEAR]
    assert look_values[StrengthCurve.LINEAR] < look_values[StrengthCurve.EASE_OUT]
    assert look_values[StrengthCurve.SMOOTH] == pytest.approx(look_values[StrengthCurve.LINEAR])
