"""Event card maker and uniqueness engine (task C1).

Public API:
    make_card(occasion, photo, *, to, sender, message, greeting, look, seed, face, fit,
              store, provider, perceptual, card_format) -> Card
    make_another(card, *, look) -> Card
    edit_text(card, *, to, sender, message, greeting) -> Card
    export_png(card, width=1080) -> bytes
    export_svg(card) -> str
    export_payload(card) -> dict
    export_payload_json(card) -> str
Extras: export_bundle_zip (download set), export_envelope_png and export_gift_tag_png
(matching set from the same design),
export_animated (looping APNG or GIF), export_contact_sheet_png (variant grid) and
export_print_png (4 x 5 inch, 300 dpi, print-safe colours, bleed and crop marks).
Web glue: handle_make(request, store) and handle_another(request, store) take and return
JSON-style dicts. Errors all derive from CardError. The shared art contract is MotifProvider.
Author: John Khan.
"""

from __future__ import annotations

from .animate import export_animated
from .bundle import export_bundle_zip
from .errors import (
    CardError,
    CardOptionError,
    CardPhotoError,
    CardTextError,
    DesignStoreError,
    MotifError,
    UniquenessExhaustedError,
    UnknownLookError,
    UnknownOccasionError,
)
from .gallery import export_contact_sheet_png
from .grammar import CardDesign
from .handlers import handle_another, handle_make
from .keepsakes import export_envelope_png, export_gift_tag_png
from .occasions import FORBIDDEN_MOTIFS, OCCASION_IDS, OCCASIONS, is_forbidden_motif
from .photo import FaceBox
from .printing import export_print_png
from .provider import BuiltinMotifProvider, MotifProvider, audit_provider
from .service import (
    Card,
    edit_text,
    export_payload,
    export_payload_json,
    export_png,
    export_svg,
    make_another,
    make_card,
    render_card,
)
from .store import DesignStore

__all__ = [
    "FORBIDDEN_MOTIFS",
    "OCCASIONS",
    "OCCASION_IDS",
    "BuiltinMotifProvider",
    "Card",
    "CardDesign",
    "CardError",
    "CardOptionError",
    "CardPhotoError",
    "CardTextError",
    "DesignStore",
    "DesignStoreError",
    "FaceBox",
    "MotifError",
    "MotifProvider",
    "UniquenessExhaustedError",
    "UnknownLookError",
    "UnknownOccasionError",
    "audit_provider",
    "edit_text",
    "export_animated",
    "export_bundle_zip",
    "export_contact_sheet_png",
    "export_envelope_png",
    "export_gift_tag_png",
    "export_payload",
    "export_payload_json",
    "export_png",
    "export_print_png",
    "export_svg",
    "handle_another",
    "handle_make",
    "is_forbidden_motif",
    "make_another",
    "make_card",
    "render_card",
]
