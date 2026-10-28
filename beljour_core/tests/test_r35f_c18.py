"""C18 snapshots: ordered, digest-bound and provenance checked; changes are reported.

In-house reference data only. Author: John Khan.
"""
from __future__ import annotations

import dataclasses
import hashlib

import pytest

from plumb_api.engines import shade
from plumb_api.engines.shade.c18 import (
    C18_KINDS,
    C18Snapshot,
    canonical_text,
    check_c18_shades,
    load_c18_shades,
    snapshot_digest,
)
from plumb_api.engines.shade.loaders import load_shade_catalogue


def test_counts_sources_and_catalogue_identity() -> None:
    counts = {kind: load_c18_shades(kind).count for kind in C18_KINDS}
    assert counts == {"skin": 96, "base": 80, "hair": 90}
    assert load_c18_shades("skin").records is load_shade_catalogue("reference").records
    assert load_c18_shades("base").source == "engines/shade/reference_shades.json"
    assert load_c18_shades() is load_c18_shades("skin")
    assert shade.load_c18_shades is load_c18_shades and shade.C18Snapshot is C18Snapshot


def test_digest_is_sha256_of_the_documented_text() -> None:
    snap = load_c18_shades("skin")
    text = canonical_text("skin", snap.records)
    lines = text.splitlines()
    assert lines[0] == "beljour-c18-snapshot/1|skin|96" and len(lines) == 97 and text.endswith("\n")
    assert lines[1] == "LG-01C|Reference 1C|skin|cool|1|1||81.000000|10.270000|9.250000"
    assert load_c18_shades("hair").records[0].id == "natural-01-n"
    assert canonical_text("hair", load_c18_shades("hair").records).splitlines()[1] == (
        "natural-01-n|Natural depth 1 neutral|hair|neutral|1||natural|4.702300|1.874400|-0.506200")
    assert snap.digest == hashlib.sha256(text.encode("utf-8")).hexdigest()
    assert len({load_c18_shades(k).digest for k in C18_KINDS}) == 3


def test_current_snapshots_pass_their_check() -> None:
    for kind in C18_KINDS:
        result = check_c18_shades(load_c18_shades(kind))
        assert result.ok and result.problems == ()
        assert result.public()["release_pass"] is False


def test_changed_value_is_reported_and_changes_the_digest() -> None:
    snap = load_c18_shades("skin")
    first = dataclasses.replace(snap.records[0], lab=(81.0, 10.27, 9.26))
    records = (first, *snap.records[1:])
    honest = C18Snapshot("skin", records, snapshot_digest("skin", records), snap.source)
    assert honest.digest != snap.digest
    problems = check_c18_shades(honest).problems
    assert problems == ("record_changed:LG-01C", "digest_differs_from_source")
    stale = C18Snapshot("skin", records, snap.digest, snap.source)
    assert "digest_mismatch" in check_c18_shades(stale).problems


def test_reordering_removal_and_provenance_are_reported() -> None:
    snap = load_c18_shades("base")
    swapped = (snap.records[1], snap.records[0], *snap.records[2:])
    assert "order_or_ids_changed" in check_c18_shades(dataclasses.replace(snap, records=swapped)).problems
    shorter = check_c18_shades(dataclasses.replace(snap, records=snap.records[:-1])).problems
    assert {"count_changed", "ids_changed", "digest_mismatch"} <= set(shorter)
    moved = check_c18_shades(dataclasses.replace(snap, source="elsewhere.json"))
    assert moved.problems == ("source_changed",) and not moved.ok


def test_separator_in_text_is_refused() -> None:
    snap = load_c18_shades("hair")
    bad = (dataclasses.replace(snap.records[0], name="Natural|1"), *snap.records[1:])
    with pytest.raises(ValueError):
        canonical_text("hair", bad)
    result = check_c18_shades(dataclasses.replace(snap, records=bad))
    assert "record_text_invalid" in result.problems


@pytest.mark.parametrize("kind", ["reference", "", None, "SKIN", ["skin"]])
def test_unknown_kind(kind: object) -> None:
    with pytest.raises(ValueError):
        load_c18_shades(kind)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        check_c18_shades({"kind": "skin"})  # type: ignore[arg-type]
