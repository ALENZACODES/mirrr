"""BELJOUR Studio Play look packs built from owned filter presets.

Studio Play sits beside the 61 core registered filters. Each Studio Play look
resolves to a concrete recipe by taking a shipped BELJOUR base recipe and
applying one named preset. This keeps the pack renderable by the existing
engine while preserving the FX1 registry and its 61-look proof ledger.

No imported LUTs, ripped preset files or platform assets are used here. The
LUT-class pack is authored from our own curve and colour parameters only.
Author: John Khan.
"""
from __future__ import annotations

import copy
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Final

from .recipe import registry as recipe_registry
from .recipe import schema


@dataclass(frozen=True)
class ComponentLicence:
    component: str
    role: str
    licence: str
    note: str


@dataclass(frozen=True)
class LookSpec:
    id: str
    name: str
    pack: str
    order: int
    row: str
    base_recipe_id: str
    preset: str
    family: str
    light: str
    tab: str
    description: str
    licence_notes: tuple[ComponentLicence, ...]


_PACKS: Final[dict[str, tuple[LookSpec, ...]]] = {
    "lut-class": (
        LookSpec(
            id="SP01",
            name="Glass Bloom",
            pack="lut-class",
            order=1,
            row="Studio Play",
            base_recipe_id="C08",
            preset="Glass Bloom",
            family="Masthead",
            light="Window",
            tab="Clean",
            description="Clean glass skin with a lifted pearl finish.",
            licence_notes=(
                ComponentLicence("BELJOUR preset curve", "look design", "BELJOUR in-repo original",
                                 "Own curve points and colour parameters. No imported LUT file."),
                ComponentLicence("BELJOUR filter engine", "render runtime", "BELJOUR in-repo original",
                                 "Applies procedural colour ops and bakes an in-memory LUT."),
            ),
        ),
        LookSpec(
            id="SP02",
            name="Golden Vinyl",
            pack="lut-class",
            order=2,
            row="Studio Play",
            base_recipe_id="C30",
            preset="Golden Vinyl",
            family="Cover Evening",
            light="Evening",
            tab="Warm",
            description="Warm golden contrast with a soft analogue fade.",
            licence_notes=(
                ComponentLicence("BELJOUR preset curve", "look design", "BELJOUR in-repo original",
                                 "Own curve and fade settings only. No foreign preset assets."),
                ComponentLicence("BELJOUR filter engine", "render runtime", "BELJOUR in-repo original",
                                 "Owned colour, split-tone and fade operators."),
            ),
        ),
        LookSpec(
            id="SP03",
            name="Lilac Air",
            pack="lut-class",
            order=3,
            row="Studio Play",
            base_recipe_id="C77",
            preset="Lilac Air",
            family="Editorial Day",
            light="Window",
            tab="Pastel",
            description="Airy lilac pastel with crisp editorial light.",
            licence_notes=(
                ComponentLicence("BELJOUR preset curve", "look design", "BELJOUR in-repo original",
                                 "Own curve-fit style values and split-tone parameters."),
                ComponentLicence("BELJOUR filter engine", "render runtime", "BELJOUR in-repo original",
                                 "Uses owned split-tone, exposure and saturation ops."),
            ),
        ),
        LookSpec(
            id="SP04",
            name="Midnight Gloss",
            pack="lut-class",
            order=4,
            row="Studio Play",
            base_recipe_id="C93",
            preset="Midnight Gloss",
            family="Heritage",
            light="Studio",
            tab="Film-style",
            description="Deep cool gloss with restrained blue-film lift.",
            licence_notes=(
                ComponentLicence("BELJOUR preset curve", "look design", "BELJOUR in-repo original",
                                 "Own master and blue-channel curve points. No imported LUTs."),
                ComponentLicence("BELJOUR filter engine", "render runtime", "BELJOUR in-repo original",
                                 "Uses owned highlight-rolloff, tint and white-balance ops."),
            ),
        ),
    ),
}


def pack_names() -> tuple[str, ...]:
    return tuple(sorted(_PACKS))


def specs(pack: str = "lut-class") -> tuple[LookSpec, ...]:
    if pack not in _PACKS:
        raise KeyError(f"unknown Studio Play pack {pack!r}")
    return _PACKS[pack]


def _preset(base_recipe: Mapping[str, Any], preset_name: str) -> Mapping[str, Any]:
    for preset in base_recipe.get("presets", []):
        if preset.get("name") == preset_name:
            return preset
    raise KeyError(f"{base_recipe.get('id', '?')}: preset {preset_name!r} not found")


def resolve(spec: LookSpec, cat: recipe_registry.Catalogue | None = None) -> dict[str, Any]:
    catalogue = cat or recipe_registry.default()
    base = copy.deepcopy(catalogue.get(spec.base_recipe_id))
    preset = _preset(base, spec.preset)
    raw_stages = [copy.deepcopy(stage) for stage in base.get("stages", [])]
    for stage in raw_stages:
        sid = stage.get("id")
        patch = preset.get("patch", {}).get(sid)
        if patch:
            stage["params"] = {**stage.get("params", {}), **patch}
    raw_stages.extend(copy.deepcopy(stage) for stage in preset.get("append", []))
    out = copy.deepcopy(base)
    out["id"] = spec.id
    out["name"] = spec.name
    out["rank"] = spec.order
    out["tab"] = spec.tab
    out["description"] = spec.description
    out["editorial"] = {"family": spec.family, "light": spec.light}
    out["stages"] = raw_stages
    out["presets"] = []
    out["provenance"] = {
        "writtenFrom": "filters-plan.md §Studio Play LUT-class via owned preset overlays only",
        "answers": ["roadmap-oct-25"],
        "concepts": ["curve-fit LUT class", "owned preset overlay"],
    }
    return out


def resolve_pack(pack: str = "lut-class") -> list[dict[str, Any]]:
    catalogue = recipe_registry.default()
    return [resolve(spec, catalogue) for spec in specs(pack)]


def licence_rows(pack: str = "lut-class") -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in specs(pack):
        for item in spec.licence_notes:
            rows.append({
                "lookId": spec.id,
                "lookName": spec.name,
                "pack": spec.pack,
                "row": spec.row,
                "component": item.component,
                "role": item.role,
                "licence": item.licence,
                "note": item.note,
            })
    return rows


def manifest(pack: str = "lut-class") -> dict[str, Any]:
    return {
        "format": "beljour-studio-play/1",
        "product": "BELJOUR",
        "tagline": "Your best day. Still you.",
        "pack": pack,
        "about": (
            "Studio Play derivative look pack. Each row resolves from an owned BELJOUR base recipe "
            "plus a named preset. No imported LUT files or platform assets."
        ),
        "looks": [
            {
                "id": spec.id,
                "name": spec.name,
                "order": spec.order,
                "row": spec.row,
                "baseRecipeId": spec.base_recipe_id,
                "preset": spec.preset,
                "family": spec.family,
                "light": spec.light,
                "tab": spec.tab,
                "description": spec.description,
            }
            for spec in specs(pack)
        ],
        "licences": licence_rows(pack),
    }


def validate(pack: str = "lut-class") -> list[str]:
    problems: list[str] = []
    identifiers: set[str] = set()
    names: set[str] = set()
    for spec, recipe in zip(specs(pack), resolve_pack(pack), strict=True):
        if spec.id in identifiers:
            problems.append(f"{spec.id}: repeated Studio Play id")
        identifiers.add(spec.id)
        if spec.name.lower() in names:
            problems.append(f"{spec.id}: repeated Studio Play name")
        names.add(spec.name.lower())
        if spec.row != "Studio Play":
            problems.append(f"{spec.id}: row must be Studio Play")
        if spec.family not in schema.EDITORIAL_FAMILIES:
            problems.append(f"{spec.id}: unrecognized editorial family")
        if spec.light not in schema.EDITORIAL_LIGHTS:
            problems.append(f"{spec.id}: unrecognized editorial light")
        problems.extend(schema.check_recipe(recipe, None))
    return problems


__all__ = [
    "ComponentLicence",
    "LookSpec",
    "licence_rows",
    "manifest",
    "pack_names",
    "resolve",
    "resolve_pack",
    "specs",
    "validate",
]
