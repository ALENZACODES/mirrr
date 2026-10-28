"""JSON-ready catalogue of packs and looks for the web picker.

The web lane can render the seasonal picker from this one document: pack
titles, palettes, look ids with kind, whether the look needs a chosen face,
the strength range and default, plus optional motif SVG thumbnails and the
current suggestions. Output is plain dicts, lists, strings and numbers, with
stable key order so the document diffs cleanly.
Author: John Khan.
"""

from __future__ import annotations

import json
from datetime import date

from .calendar import DEFAULT_REGION, suggest
from .model import STRENGTH_MAX, STRENGTH_MIN, STRENGTH_STEP, Look, LookKind, SeasonalPack
from .motifs import PackMotifProvider
from .occasions import OCCASIONS
from .particles import LOOP_FRAMES
from .registry import DEFAULT_REGISTRY, PackRegistry

CATALOGUE_VERSION = 1
THUMBNAIL_SIZE = 64.0

JsonValue = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]


def look_entry(look: Look) -> dict[str, JsonValue]:
    """Picker row for one look."""
    return {
        "id": look.id,
        "title": look.title,
        "kind": look.kind.value,
        "needs_face": look.kind.needs_face,
        "animates": look.kind is LookKind.LIGHT,
        "loop_frames": LOOP_FRAMES if look.kind is LookKind.LIGHT else 0,
        "strength": {
            "min": STRENGTH_MIN,
            "max": STRENGTH_MAX,
            "step": STRENGTH_STEP,
            "default": look.default_strength,
            "curve": look.curve.value,
        },
        "motifs": list(look.motifs),
    }


def pack_entry(pack: SeasonalPack, thumbnails: bool = False) -> dict[str, JsonValue]:
    """Picker section for one pack."""
    palette = pack.palette
    entry: dict[str, JsonValue] = {
        "occasion": pack.occasion,
        "name": OCCASIONS[pack.occasion].name,
        "title": pack.title,
        "greeting": pack.greeting,
        "palette": {
            "primary": palette.primary,
            "secondary": palette.secondary,
            "accent": palette.accent,
            "dark": palette.dark,
            "light": palette.light,
        },
        "looks": [look_entry(look) for look in pack.looks],
    }
    if thumbnails:
        provider = PackMotifProvider()
        entry["motif_svg"] = {
            motif: provider.motif_svg(pack.occasion, motif, THUMBNAIL_SIZE, 0)
            for motif in pack.motifs
        }
    return entry


def catalogue(
    registry: PackRegistry | None = None,
    *,
    today: date | None = None,
    region: str = DEFAULT_REGION,
    window_days: int = 45,
    thumbnails: bool = False,
) -> dict[str, JsonValue]:
    """The whole picker document; suggestions are included when today is given."""
    packs = registry or DEFAULT_REGISTRY
    document: dict[str, JsonValue] = {
        "version": CATALOGUE_VERSION,
        "packs": [pack_entry(pack, thumbnails) for pack in packs.packs()],
        "missing_occasions": list(packs.missing()),
    }
    if today is not None:
        rows: list[JsonValue] = []
        for item in suggest(today, region, window_days, registry=packs):
            occurrence = item.occurrence
            rows.append(
                {
                    "occasion": item.occasion,
                    "start": occurrence.start.isoformat(),
                    "end": occurrence.end.isoformat(),
                    "days_until": item.days_until,
                    "has_pack": item.has_pack,
                    "verified": occurrence.verified,
                    "note": occurrence.note,
                }
            )
        document["today"] = today.isoformat()
        document["region"] = region
        document["suggestions"] = rows
    return document


def catalogue_json(
    registry: PackRegistry | None = None,
    *,
    today: date | None = None,
    region: str = DEFAULT_REGION,
    thumbnails: bool = False,
) -> str:
    """The catalogue as compact, key-sorted JSON text."""
    document = catalogue(registry, today=today, region=region, thumbnails=thumbnails)
    return json.dumps(document, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
