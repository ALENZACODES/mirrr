"""Card maker service: make_card, make_another, export_png, export_svg, export_payload.

A Card bundles the accepted design, the sanitised text and the stripped photo. The photo is
held in memory only; it is never written to the design store. make_another keeps the photo
and text and asks the uniqueness engine for a fresh design.
Author: John Khan.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass, field, replace
from typing import Any

from PIL import Image

from .access import accessible
from .compose import Composition, compose
from .errors import CardOptionError, CardPhotoError
from .export import SHARE_WIDTH, build_payload, payload_json, png_bytes
from .grammar import CARD_FORMATS, CardDesign, format_of, sub_seed
from .occasions import get_occasion
from .photo import FIT_MODES, FaceBox, encode_tile, fit_photo, load_photo, prepare_image
from .provider import MotifProvider
from .render_raster import pixel_box, render_raster
from .render_svg import render_svg
from .store import DesignStore
from .text import CardText, make_text
from .uniqueness import UniquenessEngine

SVG_PHOTO_SCALE = 1.0
MAX_EXPORT_WIDTH = 4320
MIN_EXPORT_WIDTH = 108


@dataclass(frozen=True)
class Card:
    """One finished card: design, text and photo, plus the store it was issued from."""

    design: CardDesign
    text: CardText
    fingerprint: str
    attempts: int
    generation: int
    look_locked: bool
    fit: str
    photo: Image.Image = field(compare=False, repr=False)
    face: FaceBox | None = field(compare=False, repr=False, default=None)
    store: DesignStore | None = field(compare=False, repr=False, default=None)
    provider: MotifProvider | None = field(compare=False, repr=False, default=None)
    perceptual: bool = field(compare=False, default=True)


def _new_seed() -> int:
    return secrets.randbits(63)


def _issue(occasion: str, seed: int, look: str | None, store: DesignStore,
           provider: MotifProvider | None, perceptual: bool,
           card_format: str) -> tuple[CardDesign, str, int]:
    engine = UniquenessEngine(store, provider, perceptual=perceptual)
    reservation = engine.reserve(occasion, seed, look, card_format)
    return reservation.design, reservation.key.fingerprint, reservation.attempts


def make_card(occasion: str, photo: bytes | Image.Image, *, to: str = "", sender: str = "",
              message: str = "", greeting: str | None = None, look: str | None = None,
              seed: int | None = None, face: FaceBox | None = None, fit: str = "cover",
              store: DesignStore | None = None, provider: MotifProvider | None = None,
              perceptual: bool = True, card_format: str = "portrait") -> Card:
    """Build a unique greeting card around an already edited photo.

    photo is encoded image bytes (JPEG, PNG or WebP) or a Pillow image; either way it is
    rebuilt from pixels so no metadata survives. face is the chosen person's face box from
    the multi-face picker; it only steers the crop. card_format is "portrait" (1080 x 1350),
    "square" (1080 x 1080) or "story" (1080 x 1920). Without a store, an in-memory store is
    created and kept on the card so make_another can continue from it.
    """
    occ = get_occasion(occasion)
    if look is not None:
        occ.look(look)
    if fit not in FIT_MODES:
        raise CardPhotoError(f"unknown fit mode: {fit!r}")
    if card_format not in CARD_FORMATS:
        raise CardOptionError(f"unknown card format: {card_format!r}")
    text = make_text(to, sender, message, greeting, occ.greeting)
    if isinstance(photo, Image.Image):
        clean = prepare_image(photo)
    else:
        clean = load_photo(photo)
    card_store = store if store is not None else DesignStore()
    first_seed = seed if seed is not None else _new_seed()
    design, fingerprint, attempts = _issue(occ.id, first_seed, look, card_store, provider,
                                           perceptual, card_format)
    return Card(design, text, fingerprint, attempts, 0, look is not None, fit, clean, face,
                card_store, provider, perceptual)


def make_another(card: Card, *, look: str | None = None) -> Card:
    """A new, never-issued design for the same occasion, photo and text."""
    store = card.store if card.store is not None else DesignStore()
    generation = card.generation + 1
    keep = look if look is not None else (card.design.look if card.look_locked else None)
    seed = sub_seed(card.design.seed, f"another:{generation}")
    design, fingerprint, attempts = _issue(card.design.occasion, seed, keep, store,
                                           card.provider, card.perceptual,
                                           format_of(card.design))
    return replace(card, design=design, fingerprint=fingerprint, attempts=attempts,
                   generation=generation, look_locked=keep is not None, store=store)


def edit_text(card: Card, *, to: str | None = None, sender: str | None = None,
              message: str | None = None, greeting: str | None = None) -> Card:
    """Same design with changed text; unspecified fields keep their current value."""
    occ = get_occasion(card.design.occasion)
    text = make_text(card.text.to if to is None else to,
                     card.text.sender if sender is None else sender,
                     card.text.message if message is None else message,
                     card.text.greeting if greeting is None else greeting, occ.greeting)
    return replace(card, text=text)


def card_composition(card: Card) -> Composition:
    """The card's composition after the accessibility pass (plate added when needed)."""
    return accessible(compose(card.design, card.text, card.provider))


def render_card(card: Card, width: int = SHARE_WIDTH) -> Image.Image:
    """The card as an RGB Pillow image."""
    if not MIN_EXPORT_WIDTH <= width <= MAX_EXPORT_WIDTH:
        raise CardOptionError(f"width must be {MIN_EXPORT_WIDTH}..{MAX_EXPORT_WIDTH} pixels")
    return render_raster(card_composition(card), card.photo, width, card.face, card.fit)


def export_png(card: Card, width: int = SHARE_WIDTH) -> bytes:
    """Share-size PNG (1080 x 1350 by default) with author and app metadata only."""
    return png_bytes(render_card(card, width))


def export_svg(card: Card) -> str:
    """The card as one self-contained SVG document with the photo embedded."""
    comp = card_composition(card)
    x0, y0, x1, y1 = pixel_box(comp.photo_box, SVG_PHOTO_SCALE)
    tile = fit_photo(card.photo, x1 - x0, y1 - y0, card.fit, card.face)
    return render_svg(comp, encode_tile(tile))


def export_payload(card: Card) -> dict[str, Any]:
    """Virtual-card payload: version, occasion, SVG, text, fingerprint and author."""
    design = card.design
    return build_payload(occasion=design.occasion, look=design.look, svg=export_svg(card),
                         to=card.text.to, sender=card.text.sender, message=card.text.message,
                         greeting=card.text.greeting, fingerprint=card.fingerprint,
                         seed=design.seed, width=design.width, height=design.height)


def export_payload_json(card: Card) -> str:
    """The payload as deterministic JSON text."""
    return payload_json(export_payload(card))
