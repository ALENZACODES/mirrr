"""Shared read-only shade catalogues: counts, sources, immutability and lookups.

All records are original in-house estimates; no product, photo or person data.
Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import json
from pathlib import Path

import pytest

from plumb_api.engines import shade
from plumb_api.engines.hair_palette import catalogue as hair_catalogue
from plumb_api.engines.shade import finder
from plumb_api.engines.shade.loaders import (
    KINDS,
    NOTE,
    ShadeCatalogue,
    ShadeRecord,
    checked_lab,
    load_base_shades,
    load_hair_shades,
    load_reference_shades,
    load_shade_catalogue,
    load_shades,
    shade_by_id,
)

SHADE_DIR = Path(finder.__file__).resolve().parent


def test_catalogue_counts_match_the_r30f_contract() -> None:
    assert len(load_reference_shades()) == 96
    assert len(load_base_shades()) == 80
    assert len(load_hair_shades()) == 90
    assert {kind: load_shade_catalogue(kind).count for kind in KINDS} == {"reference": 96, "base": 80, "hair": 90}


def test_package_exports_the_same_objects() -> None:
    assert shade.load_reference_shades is load_reference_shades
    assert shade.ShadeRecord is ShadeRecord and shade.ShadeCatalogue is ShadeCatalogue
    assert shade.load_shades("hair") is load_hair_shades()


def test_skin_records_follow_the_committed_json_in_order() -> None:
    base = json.loads((SHADE_DIR / "reference_shades.json").read_text(encoding="utf-8"))["shades"]
    deep = json.loads((SHADE_DIR / "deep_reference_shades.json").read_text(encoding="utf-8"))["shades"]
    records = load_reference_shades()
    assert [r.id for r in records] == [row["id"] for row in base + deep]
    for record, row in zip(records, base + deep, strict=True):
        assert record.lab == tuple(float(v) for v in row["lab"])
        assert (record.level, record.step, record.undertone) == (row["depth"], row["step"], row["undertone"])
        assert record.surface == "skin" and record.family is None


def test_base_is_the_historical_prefix_of_reference() -> None:
    assert load_reference_shades()[:80] == load_base_shades()
    assert [r["id"] for r in finder.reference_table()] == [r.id for r in load_base_shades()]
    assert {r.id for r in load_reference_shades()[80:]} == {f"LG-{s}{t}" for s in (21, 22, 23, 24) for t in "CNWO"}


def test_hair_records_mirror_the_hair_palette() -> None:
    for record, source in zip(load_hair_shades(), hair_catalogue(), strict=True):
        assert (record.id, record.name, record.lab, record.level) == (source.id, source.name, source.lab, source.level)
        assert (record.surface, record.family, record.step) == ("hair", source.family, None)


def test_records_and_catalogues_are_read_only_and_cached() -> None:
    record = load_reference_shades()[0]
    with pytest.raises(dataclasses.FrozenInstanceError):
        record.lab = (1.0, 2.0, 3.0)  # type: ignore[misc]
    assert isinstance(load_shades(), tuple)
    assert load_shade_catalogue("reference") is load_shade_catalogue("reference")


def test_public_form_is_labelled_assumed_and_unverified() -> None:
    body = load_shade_catalogue("hair").public()
    assert body["assumed"] is True and body["tested_against_real_products"] is False
    assert body["note"] == NOTE and body["count"] == 90
    assert all(row["assumed"] is True for row in body["records"])
    assert body["source"] == "engines/hair_palette/catalogue.json"


def test_lookup_by_id() -> None:
    assert shade_by_id("LG-22O").lab == (20.0, 2.27, 10.7)
    assert shade_by_id("natural-01-n").surface == "hair"
    assert shade_by_id("LG-01C", "base") is load_base_shades()[0]
    assert load_shade_catalogue("reference").by_id("LG-24W").level == 10
    for bad, kind in (("LG-99X", None), ("natural-01-n", "reference"), ("LG-21C", "base"), ("", None)):
        with pytest.raises(ValueError):
            shade_by_id(bad, kind)  # type: ignore[arg-type]


@pytest.mark.parametrize("kind", ["skin", "", None, "REFERENCE", ["hair"]])
def test_unknown_catalogue_kind_is_refused(kind: object) -> None:
    with pytest.raises(ValueError, match="Unknown shade catalogue kind"):
        load_shade_catalogue(kind)  # type: ignore[arg-type]


@pytest.mark.parametrize("lab", [(1, 2), (float("nan"), 0, 0), (101, 0, 0), (50, 129, 0), (True, 0, 0), "abc"])
def test_checked_lab_refuses_instead_of_clipping(lab: object) -> None:
    with pytest.raises(ValueError):
        checked_lab(lab)  # type: ignore[arg-type]
