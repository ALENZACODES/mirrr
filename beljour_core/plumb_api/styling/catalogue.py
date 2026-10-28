"""Hair catalogue with S1 cassette provenance and distinct editorial inspiration rows.

The attached S1 listing was a *synthetic* replay, not a live export. It is a mistake
and a possible paid-unit loss to treat ``tpl-*`` IDs as verified YouCam templates.
No entry has live eligibility until an independently recorded S1 manifest identifies
that exact provider ID. Inspiration rows never receive provider IDs by inference.

A future operator can supply a verified ID set to ``filter_catalogue`` without a
network call; there is deliberately no auto-refresh during import or a test run.
Concept credits: S1 replay structure, authored UI metadata. No external code copied.
Author: John Khan.
"""
from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).with_name("catalogue.json")
CASSETTE_PATH = Path(__file__).resolve().parents[1] / "demo" / "cassettes" / "s2_hairstyle.json"
CATALOGUE_FORMAT = "beljour-hair-catalogue/1"
GROUPS = ("short-sides", "pixie", "bob", "layers", "curls", "bangs", "protective", "formal")
LENGTHS = ("short", "medium", "long")
TEXTURES = ("straight", "wavy", "curly", "coily")
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{2,79}$")


class CatalogueError(ValueError):
    """Bad, misleading or inconsistent hairstyle metadata."""


@dataclass(frozen=True)
class HairStyle:
    id: str
    name: str
    group: str
    source: str
    template_id: str | None
    lengths: tuple[str, ...]
    textures: tuple[str, ...]
    description: str
    tags: tuple[str, ...]
    verified_for_live: bool = False

    @property
    def is_idea(self) -> bool:
        return self.source == "inspiration"

    @property
    def can_render_demo(self) -> bool:
        # One synthetic replay result can be displayed as an example. The demo must
        # never pretend that each selected style has its own rendered cassette.
        return self.source == "synthetic-s1"

    def as_dict(self) -> dict[str, Any]:
        return {"id": self.id, "name": self.name, "group": self.group,
                "source": self.source, "template_id": self.template_id,
                "lengths": list(self.lengths), "textures": list(self.textures),
                "description": self.description, "tags": list(self.tags),
                "verified_for_live": self.verified_for_live,
                "can_render_demo": self.can_render_demo}


def _strings(value: object, choices: Iterable[str], where: str) -> tuple[str, ...]:
    if not isinstance(value, list) or not value:
        raise CatalogueError(f"{where}: choose at least one value")
    valid = set(choices)
    if any(not isinstance(s, str) or s not in valid for s in value):
        raise CatalogueError(f"{where}: invalid value")
    if len(set(value)) != len(value):
        raise CatalogueError(f"{where}: duplicate values")
    return tuple(value)


def cassette_templates(path: Path = CASSETTE_PATH) -> dict[str, str]:
    """Read ONLY the template-list reply from the local S1 cassette; no HTTP client."""
    cassette = json.loads(path.read_text(encoding="utf-8"))
    if cassette.get("synthetic") is not True:
        raise CatalogueError("S1 template provenance has changed; review it before import")
    for turn in cassette.get("interactions", []):
        request = turn.get("request", {})
        if request.get("method") != "GET" or "/task/template/hair-style" not in request.get("path", ""):
            continue
        items = turn.get("response", {}).get("json", {}).get("data", {}).get("templates")
        if not isinstance(items, list):
            raise CatalogueError("The S1 template reply isn't a list")
        result: dict[str, str] = {}
        for item in items:
            key, name = item.get("id"), item.get("title")
            if not isinstance(key, str) or not isinstance(name, str) or not ID_RE.fullmatch(key):
                raise CatalogueError("The S1 reply contains an invalid template")
            if key in result:
                raise CatalogueError("The S1 reply repeats a template ID")
            result[key] = name
        return result
    raise CatalogueError("No hairstyle template-list interaction in the S1 cassette")


def parse_catalogue(raw: Mapping[str, Any], *, cassette: Mapping[str, str],
                    verified_ids: frozenset[str] = frozenset()) -> tuple[HairStyle, ...]:
    """Validate the metadata and source linkage; verified IDs are supplied, never guessed."""
    if raw.get("format") != CATALOGUE_FORMAT:
        raise CatalogueError("Unknown hair catalogue schema")
    groups = raw.get("groups")
    if not isinstance(groups, list) or tuple(g.get("id") for g in groups) != GROUPS:
        raise CatalogueError("Groups must be in the editor's documented order")
    if any(not g.get("title") or not g.get("detail") for g in groups):
        raise CatalogueError("Every hair group needs clear copy")
    rows = raw.get("styles")
    if not isinstance(rows, list) or not rows:
        raise CatalogueError("Hair catalogue has no rows")
    found: set[str] = set()
    actual_s1: set[str] = set()
    styles: list[HairStyle] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise CatalogueError(f"Style {index} isn't an object")
        key = row.get("id")
        if not isinstance(key, str) or not ID_RE.fullmatch(key) or key in found:
            raise CatalogueError(f"Bad or duplicate hair id: {key}")
        found.add(key)
        source = row.get("source")
        if source not in ("synthetic-s1", "inspiration"):
            raise CatalogueError(f"{key}: source must be synthetic-s1 or inspiration")
        provider_id = row.get("template_id")
        if source == "synthetic-s1":
            if provider_id != key or cassette.get(key) != row.get("name"):
                raise CatalogueError(f"{key}: not a faithful synthetic S1 entry")
            actual_s1.add(key)
        elif provider_id is not None or not key.startswith("idea-"):
            raise CatalogueError(f"{key}: editorial inspiration must not have a provider ID")
        group = row.get("group")
        if group not in GROUPS:
            raise CatalogueError(f"{key}: unknown hairstyle group")
        name, description = row.get("name"), row.get("description")
        if not isinstance(name, str) or not (3 <= len(name) <= 100):
            raise CatalogueError(f"{key}: empty or overlong style name")
        if not isinstance(description, str) or not (12 <= len(description) <= 220):
            raise CatalogueError(f"{key}: description must explain the cut")
        lengths = _strings(row.get("lengths"), LENGTHS, f"{key} lengths")
        textures = _strings(row.get("textures"), TEXTURES, f"{key} textures")
        tags = row.get("tags")
        if not isinstance(tags, list) or not tags or any(not isinstance(t, str) or not t.isascii()
                                                     or not t.replace("-", "").isalnum() for t in tags):
            raise CatalogueError(f"{key}: invalid tags")
        styles.append(HairStyle(key, name, group, source, provider_id, lengths, textures, description,
                                tuple(tags), bool(provider_id and provider_id in verified_ids)))
    if actual_s1 != set(cassette):
        raise CatalogueError("S1 synthetic entries don't match the cassette")
    if not verified_ids <= set(cassette):
        # A genuine S1 import is a separate operator-reviewed manifest; do not accept
        # arbitrary IDs as verified just because the caller provided a set.
        raise CatalogueError("Verified IDs must match the reviewed S1 set")
    return tuple(styles)


def catalogue(verified_ids: frozenset[str] = frozenset()) -> tuple[HairStyle, ...]:
    return parse_catalogue(json.loads(DATA_PATH.read_text(encoding="utf-8")),
                           cassette=cassette_templates(), verified_ids=verified_ids)


def filtered(styles: Iterable[HairStyle], *, group: str | None = None, length: str | None = None,
             texture: str | None = None, search: str = "", demos_only: bool = False) -> list[HairStyle]:
    if group is not None and group not in GROUPS:
        raise CatalogueError("Unknown group")
    if length is not None and length not in LENGTHS:
        raise CatalogueError("Unknown length")
    if texture is not None and texture not in TEXTURES:
        raise CatalogueError("Unknown hair texture")
    if len(search) > 80:
        raise CatalogueError("Search is too long")
    query = search.strip().casefold()
    return [s for s in styles if (group is None or s.group == group)
            and (length is None or length in s.lengths)
            and (texture is None or texture in s.textures)
            and (not demos_only or s.can_render_demo)
            and (not query or query in s.name.casefold() or query in s.description.casefold()
                 or any(query in tag for tag in s.tags))]


def summary(styles: Iterable[HairStyle]) -> dict[str, int]:
    group = list(styles)
    return {"total": len(group), "synthetic_s1": sum(s.source == "synthetic-s1" for s in group),
            "inspiration": sum(s.is_idea for s in group),
            "live_verified": sum(s.verified_for_live for s in group)}
