"""C18 shade QA snapshots: ordered, digest-bound copies of the shared shade catalogues.

Three snapshots, built from shade.loaders (no second copy of the data):

* ``"skin"``: the 96 extended skin references (80 historical plus 16 deep anchors);
* ``"base"``: the 80 historical skin references;
* ``"hair"``: the 90 original hair swatches.

The digest is SHA-256 over a canonical UTF-8 text, one line per record in source
order, so any changed value, name, label or ordering changes it::

    beljour-c18-snapshot/1|<kind>|<count>
    <id>|<name>|<surface>|<undertone>|<level>|<step>|<family>|<L>|<a>|<b>

``step`` and ``family`` are empty when absent; Lab values use six decimals (negative
zero written as zero). The same
text is built in web/src/engines/shade/c18.ts, so both languages agree on the digest.
check_c18_shades() compares a supplied snapshot against the current source and lists
every problem instead of repairing it. Inventory integrity only: not an accuracy result.
Author: John Khan.
"""
from __future__ import annotations

import hashlib
from collections.abc import Sequence
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Literal, get_args

from .loaders import ShadeKind, ShadeRecord, load_shade_catalogue

C18Kind = Literal["skin", "base", "hair"]
C18_KINDS: tuple[C18Kind, ...] = get_args(C18Kind)
FORMAT = "beljour-c18-snapshot/1"
CATALOGUE: dict[C18Kind, ShadeKind] = {"skin": "reference", "base": "base", "hair": "hair"}
EXPECTED_COUNTS: dict[C18Kind, int] = {"skin": 96, "base": 80, "hair": 90}

__all__ = ["C18Check", "C18Kind", "C18Snapshot", "C18_KINDS", "canonical_text", "check_c18_shades",
           "load_c18_shades", "snapshot_digest"]


def _field(value: object) -> str:
    text = "" if value is None else str(value)
    if "|" in text or "\n" in text or "\r" in text:
        raise ValueError("C18 record text may not contain separators")
    return text


def canonical_text(kind: str, records: Sequence[ShadeRecord]) -> str:
    """The exact text the digest covers (see the module docstring)."""
    lines = [f"{FORMAT}|{_field(kind)}|{len(records)}"]
    for r in records:
        lines.append("|".join([
            _field(r.id), _field(r.name), _field(r.surface), _field(r.undertone), str(r.level),
            "" if r.step is None else str(r.step), _field(r.family), *(f"{v + 0.0:.6f}" for v in r.lab),
        ]))
    return "\n".join(lines) + "\n"


def snapshot_digest(kind: str, records: Sequence[ShadeRecord]) -> str:
    return hashlib.sha256(canonical_text(kind, records).encode("utf-8")).hexdigest()


@dataclass(frozen=True, slots=True)
class C18Snapshot:
    kind: C18Kind
    records: tuple[ShadeRecord, ...]
    digest: str
    source: str

    @property
    def count(self) -> int:
        return len(self.records)

    def public(self) -> dict[str, Any]:
        return {"format": FORMAT, "kind": self.kind, "count": self.count, "digest": self.digest,
                "source": self.source, "assumed": True, "tested_against_real_products": False}


@lru_cache(maxsize=len(C18_KINDS))
def _snapshot(kind: C18Kind) -> C18Snapshot:
    catalogue = load_shade_catalogue(CATALOGUE[kind])
    if catalogue.count != EXPECTED_COUNTS[kind]:
        raise ValueError(f"C18 {kind} inventory has {catalogue.count} records, expected {EXPECTED_COUNTS[kind]}")
    return C18Snapshot(kind, catalogue.records, snapshot_digest(kind, catalogue.records), catalogue.source)


def load_c18_shades(kind: C18Kind = "skin") -> C18Snapshot:
    """The current ordered snapshot; raises ValueError for an unknown kind or a changed count."""
    if not isinstance(kind, str) or kind not in C18_KINDS:
        raise ValueError("Unknown C18 shade kind")
    return _snapshot(kind)


@dataclass(frozen=True, slots=True)
class C18Check:
    kind: str
    ok: bool
    problems: tuple[str, ...]
    digest: str
    expected_digest: str

    def public(self) -> dict[str, Any]:
        return {"format": "beljour-c18-check/1", "kind": self.kind, "ok": self.ok,
                "problems": list(self.problems), "digest": self.digest,
                "expected_digest": self.expected_digest, "release_pass": False}


def check_c18_shades(snapshot: C18Snapshot) -> C18Check:
    """Compare a snapshot with the current source: provenance, count, order, values, digest."""
    if not isinstance(snapshot, C18Snapshot):
        raise ValueError("Expected a C18 snapshot")
    current = load_c18_shades(snapshot.kind)
    problems: list[str] = []
    if snapshot.source != current.source:
        problems.append("source_changed")
    if snapshot.count != current.count:
        problems.append("count_changed")
    if [r.id for r in snapshot.records] != [r.id for r in current.records]:
        problems.append("order_or_ids_changed" if {r.id for r in snapshot.records} == {r.id for r in current.records}
                        else "ids_changed")
    else:
        changed = [r.id for r, c in zip(snapshot.records, current.records, strict=True) if r != c]
        problems.extend(f"record_changed:{shade_id}" for shade_id in changed)
    try:
        recomputed = snapshot_digest(snapshot.kind, snapshot.records)
    except ValueError:
        recomputed = ""
        problems.append("record_text_invalid")
    if recomputed != snapshot.digest:
        problems.append("digest_mismatch")
    if snapshot.digest != current.digest:
        problems.append("digest_differs_from_source")
    return C18Check(snapshot.kind, not problems, tuple(problems), snapshot.digest, current.digest)
