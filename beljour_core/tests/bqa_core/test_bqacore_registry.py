"""Check registry: 295 printed rows, paged keys, owners and the find command (USE-01).

Author: John Khan.
"""

from __future__ import annotations

import io
import time
from collections import Counter

import pytest

from lab.bqa_core.registry import (
    CHECKS_CSV,
    COVER_COUNT,
    PAGED_KEYS,
    PRINTED_ROWS,
    RegistryError,
    load_registry,
    parse_rows,
    suite_of,
)

C17_KEYS = {
    "USE-01", "SUM-03", "MOD-01", "MOD-02", "MOD-03", "ARC-01", "ARC-02", "ARC-03", "DSN-01",
    "GT-03", "SPL-02", "SPL-03", "PLN-01", "PLN-02", "PLN-03", "REG-01", "REG-02", "REG-03",
    "AUT-01", "AUT-03", "AUTO-01", "AUTO-02", "AUTO-03", "MAN-03", "DEF-01", "DEF-02", "DEF-03",
    "BUG-01", "BUG-03", "MON-03", "RET-01", "RET-02", "TPL-01", "TPL-02", "TPL-03", "MST-01",
    "MST-02", "MST-03", "GLO-01", "REF-01",
}


def csv_text() -> str:
    return CHECKS_CSV.read_text(encoding="utf-8")


def test_count_is_pinned_and_cover_difference_recorded() -> None:
    registry = load_registry()
    assert len(registry) == PRINTED_ROWS == 295
    # The report cover says 297; two pages print two checks instead of three.
    assert COVER_COUNT - PRINTED_ROWS == 2
    pages = Counter(check.page for check in registry)
    assert sorted(page for page, count in pages.items() if count == 2) == [97, 98]
    assert all(count == 3 for page, count in pages.items() if page not in (97, 98))
    assert len(set(registry.keys())) == 295


def test_paged_keys_and_ids_used_twice() -> None:
    registry = load_registry()
    assert PAGED_KEYS <= set(registry.keys())
    ids = Counter(check.id for check in registry)
    assert sorted(i for i, count in ids.items() if count == 2) == [
        "CON-01", "CON-02", "CON-03", "EXP-01", "EXP-02", "EXP-03"]
    assert registry.get("CON-01@27").owner == "C18"
    assert registry.get("CON-01@47").owner == "C22"


def test_owner_kind_and_derived_columns() -> None:
    registry = load_registry()
    assert {check.key for check in registry.by_owner("C17")} == C17_KEYS
    assert len(registry.by_owner("C17")) == 40
    kinds = Counter(check.kind for check in registry)
    assert set(kinds) == {"A", "H", "P", "D", "S"}
    for check in registry:
        assert check.suite == suite_of(check.id)
    assert registry.get("CAT-A1").suite == "CAT"
    assert registry.get("CAT-A1").module == "M1"
    assert registry.get("FND-01").module == "M3"
    assert registry.get("FND-01").evidence_kind == "physical"
    assert registry.get("TRD-01").module == "M6"
    assert registry.get("PLN-01").evidence_kind == "signoff"


def test_find_by_key_words_and_shared_id() -> None:
    registry = load_registry()
    assert [c.key for c in registry.find("fnd-01")] == ["FND-01"]
    assert [c.key for c in registry.find("CON-01")] == ["CON-01@27", "CON-01@47"]
    assert [c.key for c in registry.find("CON-01@47")] == ["CON-01@47"]
    assert "ARC-01" in [c.key for c in registry.find("200 replays")]
    assert registry.find("   ") == []
    assert registry.find("no such words anywhere zzz") == []


def test_find_every_key_well_under_thirty_seconds() -> None:
    """USE-01: every key is found, and all 295 lookups take far less than 30 s."""
    registry = load_registry()
    started = time.perf_counter()
    for key in registry.keys():
        assert registry.find(key)[0].key == key
    assert time.perf_counter() - started < 1.0


@pytest.mark.parametrize("mutation, message", [
    (lambda t: t.replace("FND-02,FND-02,25", "FND-01,FND-01,25"), "duplicate key"),
    (lambda t: t.replace("FND-01,FND-01,25,P", "FND-01,FND-01,25,Q"), "unknown kind"),
    (lambda t: t.replace(",C18,FND,", ",C99,FND,", 1), "unknown owner"),
    (lambda t: t.replace("CON-01@27,CON-01,27", "CON-01@28,CON-01,27"), "paged key"),
    (lambda t: t.replace("physical", "panel", 1), "evidence_kind"),
    (lambda t: t.replace(",M3,", ",M9,", 1), "unknown module"),
    (lambda t: "\n".join(t.splitlines()[:-1]) + "\n", "expected 295"),
])
def test_validation_rejects_broken_tables(mutation: object, message: str) -> None:
    assert callable(mutation)
    broken = mutation(csv_text())
    with pytest.raises(RegistryError) as caught:
        parse_rows(io.StringIO(broken))
    assert any(message in problem for problem in caught.value.problems)


def test_wrong_columns_and_short_rows() -> None:
    with pytest.raises(RegistryError, match="columns"):
        parse_rows(io.StringIO("key,id\nA-01,A-01\n"))
    header = csv_text().splitlines()[0]
    with pytest.raises(RegistryError, match="number of fields"):
        parse_rows(io.StringIO(header + "\nUSE-01,USE-01,2\n"))


def test_suite_of_rejects_non_ids() -> None:
    assert suite_of("WE1-03") == "WE1"
    assert suite_of("AUTO-02") == "AUTO"
    with pytest.raises(ValueError):
        suite_of("not an id")
