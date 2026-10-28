"""Download set: one ZIP with the card, its SVG, its payload and the matching extras.

The archive is built in memory with fixed timestamps and a fixed file order, so the same card
always gives byte-identical bytes. Nothing is sent anywhere; the user saves or shares the
file from their own device.
Author: John Khan.
"""

from __future__ import annotations

import io
import zipfile

from .export import AUTHOR
from .keepsakes import export_envelope_png, export_gift_tag_png
from .service import Card, export_payload_json, export_png, export_svg

FIXED_TIME = (2026, 10, 31, 0, 0, 0)
BUNDLE_NAMES: tuple[str, ...] = ("card.png", "card.svg", "card.json", "envelope.png",
                                 "gift-tag.png", "README.txt")


def _readme(card: Card) -> str:
    return (
        f"BELJOUR {card.design.occasion} card set\n"
        f"Design fingerprint: {card.fingerprint}\n"
        "card.png      share image\n"
        "card.svg      scalable card\n"
        "card.json     virtual card payload\n"
        "envelope.png  matching envelope front\n"
        "gift-tag.png  matching gift tag\n"
        f"Author: {AUTHOR}\n"
    )


def bundle_files(card: Card) -> dict[str, bytes]:
    """Every file of the download set, in archive order."""
    return {
        "card.png": export_png(card),
        "card.svg": export_svg(card).encode("utf-8"),
        "card.json": export_payload_json(card).encode("utf-8"),
        "envelope.png": export_envelope_png(card),
        "gift-tag.png": export_gift_tag_png(card),
        "README.txt": _readme(card).encode("utf-8"),
    }


def export_bundle_zip(card: Card) -> bytes:
    """The download set as deterministic ZIP bytes."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in bundle_files(card).items():
            info = zipfile.ZipInfo(name, date_time=FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            archive.writestr(info, data)
    return buffer.getvalue()
