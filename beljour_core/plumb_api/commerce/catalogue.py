"""Validated source of truth for fictional colour cosmetics and a reproducible SKU grid.

Only the independent source JSON above defines product names. Generating shade SKUs at
runtime avoids hundreds of near-identical hand-maintained entries. No invented SKU is
presented as a tested or purchasable real-world shade. Author: John Khan.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).with_name("catalogue.json")
SLUG = re.compile(r"^[a-z][a-z0-9-]{2,35}$")
TONE_OFFSETS: dict[str, tuple[int, int, int]] = {
    "cool": (8, -1, 6), "neutral": (0, 0, 0), "warm": (5, 4, -5), "olive": (-4, 2, -7),
}
# This is a synthetic RGB swatch approximation, not a scientific skin classification.
SHADE_SUFFIX = {"cool": "Rose", "neutral": "Balance", "warm": "Gold", "olive": "Olive"}


@dataclass(frozen=True)
class Product:
    sku: str
    formula_id: str
    name: str
    description: str
    category: str
    vto: str | None
    price_cents: int
    finish: str
    concerns: tuple[str, ...]
    depth: int | None
    undertone: str | None
    swatch: str
    coverage: str

    def to_json(self) -> dict[str, Any]:
        return {"id": self.sku, "formula_id": self.formula_id, "name": self.name,
                "description": self.description, "category": self.category, "vto": self.vto,
                "price_cents": self.price_cents, "currency": "CAD", "finish": self.finish,
                "concerns": list(self.concerns), "depth": self.depth,
                "undertone": self.undertone, "swatch": self.swatch, "coverage": self.coverage,
                "sample": True, "label": "Fictional sample product; not tested against real products"}


def _rgb(value: str) -> tuple[int, int, int]:
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise ValueError("invalid swatch")
    return tuple(int(value[index:index + 2], 16) for index in (1, 3, 5))  # type: ignore[return-value]


def swatch_at(hex_colour: str, tone: str) -> str:
    offsets = TONE_OFFSETS[tone]
    channels = _rgb(hex_colour)
    return "#" + "".join(f"{max(0, min(255, c + d)):02x}" for c, d in zip(channels, offsets, strict=True))


def validate_source(raw: object) -> dict[str, Any]:
    if not isinstance(raw, dict) or raw.get("format") != "beljour-commerce-catalogue/1":
        raise ValueError("wrong commerce catalogue schema")
    if raw.get("author") != "John Khan" or raw.get("currency") != "CAD":
        raise ValueError("catalogue ownership or currency changed")
    if raw.get("tones") != list(TONE_OFFSETS) or len(raw.get("depths", [])) != 10:
        raise ValueError("undertones or depth bands have changed")
    swatches = raw.get("depth_swatches")
    if not isinstance(swatches, list) or len(swatches) != 10:
        raise ValueError("ten depth swatches required")
    for colour in swatches:
        _rgb(colour)
    expected = {"id", "name", "description", "category", "vto", "price_cents", "finish", "concerns", "coverage"}
    rows = raw.get("formulas")
    if not isinstance(rows, list) or not rows:
        raise ValueError("catalogue must have products")
    seen: set[str] = set()
    valid_categories = {"complexion", "cheek", "lip", "prep", "finish"}
    for row in rows:
        if not isinstance(row, dict) or not expected <= row.keys():
            raise ValueError("product fields missing")
        if not isinstance(row["id"], str) or not SLUG.fullmatch(row["id"]) or row["id"] in seen:
            raise ValueError("invalid or duplicate product id")
        seen.add(row["id"])
        if not isinstance(row["name"], str) or not 4 <= len(row["name"]) <= 70:
            raise ValueError("product name invalid")
        if not isinstance(row["description"], str) or not 12 <= len(row["description"]) <= 250:
            raise ValueError("product description invalid")
        if row["category"] not in valid_categories or row["finish"] not in raw["finishes"]:
            raise ValueError("product category or finish unknown")
        if row["vto"] not in (None, "foundation", "blush", "lip"):
            raise ValueError("unknown VTO effect")
        if (row["category"] in ("complexion", "cheek", "lip")) != (row["vto"] is not None):
            raise ValueError("VTO category mismatch")
        if type(row["price_cents"]) is not int or not 0 < row["price_cents"] < 100_000:
            raise ValueError("sample price out of range")
        concerns = row["concerns"]
        if (not isinstance(concerns, list) or not concerns or len(concerns) != len(set(concerns))
                or not set(concerns) <= set(raw["concerns"])):
            raise ValueError("invalid concerns")
        if row["coverage"] not in ("none", "sheer", "medium"):
            raise ValueError("invalid coverage")
    return raw


@lru_cache(maxsize=1)
def source() -> dict[str, Any]:
    return validate_source(json.loads(DATA_PATH.read_text(encoding="utf-8")))


@lru_cache(maxsize=1)
def products() -> tuple[Product, ...]:
    raw = source()
    output: list[Product] = []
    for row in raw["formulas"]:
        if row["category"] != "complexion":
            # Other categories use only original fictional names and one fixed swatch.
            # A cheek or lip colour is intentionally not described as a skin tone.
            offsets = {"cheek": "#be6e7a", "lip": "#924e61", "prep": "#e1d9cf", "finish": "#d7c5b8"}
            output.append(Product(row["id"], row["id"], row["name"], row["description"],
                                  row["category"], row["vto"], row["price_cents"], row["finish"],
                                  tuple(row["concerns"]), None, None, offsets[row["category"]],
                                  row["coverage"]))
            continue
        for depth in range(1, 11):
            for undertone in raw["tones"]:
                suffix = f"{depth:02d}-{undertone}"
                output.append(Product(f"{row['id']}-{suffix}", row["id"],
                                      f"{row['name']} {raw['depths'][depth - 1].title()} {SHADE_SUFFIX[undertone]}",
                                      row["description"], row["category"], row["vto"],
                                      row["price_cents"], row["finish"], tuple(row["concerns"]),
                                      depth, undertone, swatch_at(raw["depth_swatches"][depth - 1], undertone),
                                      row["coverage"]))
    if len({p.sku for p in output}) != len(output):
        raise ValueError("product SKUs not unique")
    return tuple(output)


@lru_cache(maxsize=1)
def by_id() -> dict[str, Product]:
    return {p.sku: p for p in products()}


def require_product(sku: str) -> Product:
    try:
        return by_id()[sku]
    except (KeyError, TypeError) as exc:
        from ..errors import PlumbError
        raise PlumbError(404, "unknown_product", "That item is not in our sample catalogue.") from exc


def public_catalogue() -> dict[str, Any]:
    raw = source()
    return {"version": raw["version"], "format": raw["format"], "currency": "CAD",
            "note": raw["note"], "finishes": raw["finishes"], "concerns": raw["concerns"],
            "products": [p.to_json() for p in products()]}
