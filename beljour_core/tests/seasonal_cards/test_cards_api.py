"""Public API tests: make_card, make_another, edit_text, providers and typed errors.

Author: John Khan.
"""

from __future__ import annotations

import io

import pytest
from PIL import Image

from plumb_api.seasonal import cards
from plumb_api.seasonal.cards import (
    OCCASION_IDS,
    CardError,
    CardPhotoError,
    CardTextError,
    DesignStore,
    MotifError,
    UnknownLookError,
    UnknownOccasionError,
    edit_text,
    export_png,
    export_svg,
    make_another,
    make_card,
    render_card,
)
from plumb_api.seasonal.cards.compose import compose
from plumb_api.seasonal.cards.provider import ShapeMotifProvider
from plumb_api.seasonal.cards.shapes import Circle, Shape
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait


def _photo(seed: int = 4) -> bytes:
    return encode_with_metadata(synthetic_portrait(400, 500, seed=seed)[0])


def test_public_names_are_exported() -> None:
    for name in ("make_card", "make_another", "export_png", "export_payload", "CardError",
                 "MotifProvider", "DesignStore"):
        assert name in cards.__all__
        assert hasattr(cards, name)


@pytest.mark.parametrize("occasion_id", OCCASION_IDS)
def test_make_card_for_every_occasion(occasion_id: str) -> None:
    card = make_card(occasion_id, _photo(), to="Sam", sender="Alex", seed=1)
    assert card.design.occasion == occasion_id
    assert card.text.greeting == cards.OCCASIONS[occasion_id].greeting
    assert card.generation == 0
    assert card.store is not None and len(card.store) == 1


def test_halloween_hero_flow_make_another_never_repeats() -> None:
    card = make_card("halloween", _photo(), to="Mia", sender="Dad",
                     message="Trick or treat!", seed=31)
    seen = {card.fingerprint}
    current = card
    for _ in range(25):
        current = make_another(current)
        assert current.fingerprint not in seen
        seen.add(current.fingerprint)
        assert current.text == card.text
        assert current.photo is card.photo
        assert current.design.occasion == "halloween"
    assert current.generation == 25
    assert card.store is not None and len(card.store) == 26


def test_make_another_keeps_a_chosen_look() -> None:
    card = make_card("diwali", _photo(), look="rangoli_bright", seed=2)
    for _ in range(5):
        card = make_another(card)
        assert card.design.look == "rangoli_bright"
    switched = make_another(card, look="diya_glow")
    assert switched.design.look == "diya_glow"


def test_shared_store_prevents_repeats_across_users() -> None:
    store = DesignStore()
    a = make_card("eid_al_fitr", _photo(1), seed=99, store=store)
    b = make_card("eid_al_fitr", _photo(2), seed=99, store=store)
    assert a.fingerprint != b.fingerprint
    assert b.attempts >= 2


def test_same_seed_replays_the_same_svg_on_fresh_stores() -> None:
    photo = _photo()
    first = export_svg(make_card("hanukkah", photo, to="A", seed=17))
    second = export_svg(make_card("hanukkah", photo, to="A", seed=17))
    assert first == second


def test_edit_text_keeps_the_design() -> None:
    card = make_card("easter", _photo(), to="Ann", seed=5)
    edited = edit_text(card, message="Spring is here", greeting="Happy Spring")
    assert edited.design == card.design
    assert edited.text.to == "Ann"
    assert edited.text.message == "Spring is here"
    assert edited.text.greeting == "Happy Spring"
    with pytest.raises(CardTextError):
        edit_text(card, to="x" * 41)


def test_pillow_image_input_is_accepted_and_stripped() -> None:
    image = synthetic_portrait(300, 300, seed=8)[0]
    image.info["comment"] = "leak"
    card = make_card("holi", image, seed=3)
    assert card.photo.info == {}
    assert render_card(card, 216).size == (216, 270)


def test_transparent_and_greyscale_photos_render() -> None:
    transparent = synthetic_portrait(300, 400, seed=6, alpha=True)[0]
    buffer = io.BytesIO()
    transparent.save(buffer, format="PNG")
    card = make_card("vaisakhi", buffer.getvalue(), seed=4, fit="contain")
    assert Image.open(io.BytesIO(export_png(card, 270))).size == (270, 338)
    grey = io.BytesIO()
    synthetic_portrait(300, 400, seed=7)[0].convert("L").save(grey, format="PNG")
    assert make_card("gurpurab", grey.getvalue(), seed=4).photo.mode == "RGB"


def test_typed_errors_all_derive_from_card_error() -> None:
    with pytest.raises(UnknownOccasionError):
        make_card("birthday", _photo())
    with pytest.raises(UnknownLookError):
        make_card("halloween", _photo(), look="rangoli_bright")
    with pytest.raises(CardPhotoError):
        make_card("halloween", b"nope")
    with pytest.raises(CardPhotoError):
        make_card("halloween", _photo(), fit="stretch")
    with pytest.raises(CardTextError):
        make_card("halloween", _photo(), message="x" * 281)
    with pytest.raises(cards.CardOptionError):
        make_card("halloween", _photo(), card_format="poster")
    with pytest.raises(cards.CardOptionError):
        render_card(make_card("halloween", _photo(), seed=1), 50)
    for error in (UnknownOccasionError, UnknownLookError, CardPhotoError, CardTextError,
                  MotifError, cards.UniquenessExhaustedError, cards.CardOptionError,
                  cards.DesignStoreError):
        assert issubclass(error, CardError)


class LampProvider:
    """A minimal external provider, as the packs session would supply."""

    def motif_ids(self, occasion: str) -> tuple[str, ...]:
        return ("diya", "paper_lamp")

    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str:
        r = size / 2
        return f'<g><circle cx="{r}" cy="{r}" r="{r * 0.8}" fill="#ffb627"/></g>'


def test_external_provider_motifs_are_used_in_svg_and_raster() -> None:
    card = make_card("diwali", _photo(), seed=12, provider=LampProvider())
    ids = {o.motif_id for o in card.design.ornaments}
    assert ids <= {"diya", "paper_lamp"} and ids
    svg = export_svg(card)
    assert svg.count('fill="#ffb627"') >= len(card.design.ornaments)
    assert render_card(card, 216).size == (216, 270)


class UnsafeProvider(LampProvider):
    def motif_svg(self, occasion: str, motif_id: str, size: float, seed: int) -> str:
        return '<g><image href="https://example.com/a.png"/></g>'


def test_unsafe_external_provider_is_refused_at_render() -> None:
    card = make_card("diwali", _photo(), seed=12, provider=UnsafeProvider(), perceptual=False)
    with pytest.raises(MotifError):
        export_svg(card)


class ForbiddenProvider(LampProvider):
    def motif_ids(self, occasion: str) -> tuple[str, ...]:
        return ("khanda", "temple_outline")


def test_forbidden_ids_from_a_provider_never_reach_a_card() -> None:
    card = make_card("vaisakhi", _photo(), seed=3, provider=ForbiddenProvider(),
                     perceptual=False)
    assert card.design.ornaments == ()


class ShapedProvider(LampProvider):
    """A provider that also returns primitives, so raster output matches its SVG."""

    def motif_shapes(self, occasion: str, motif_id: str, seed: int) -> list[Shape]:
        return [Circle(0.5, 0.5, 0.4, "#ffb627")]


def test_shape_provider_gives_identical_art_to_svg_and_raster() -> None:
    card = make_card("diwali", _photo(), seed=12, provider=ShapedProvider())
    assert isinstance(ShapedProvider(), ShapeMotifProvider)
    assert not isinstance(LampProvider(), ShapeMotifProvider)
    comp = compose(card.design, card.text, ShapedProvider())
    for art in comp.ornaments:
        assert art.svg is None
        assert len(art.shapes) == 1 and isinstance(art.shapes[0], Circle)
        assert art.shapes[0].r == pytest.approx(art.ornament.size * 0.4)
    svg = export_svg(card)
    assert svg.count('fill="#ffb627"') == len(card.design.ornaments)
