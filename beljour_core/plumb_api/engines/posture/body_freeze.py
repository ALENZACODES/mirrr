"""Frozen external body-set run: provenance-bound fingerprint and deterministic shards.

A frozen run binds one external, licence-checked manifest to the committed r25e/r26e
definitions. Each row passes the existing r25e admission rules (adult release, minors
excluded, commercial and derived-metric licence, independent Monk label, deny-listed
source ancestry). The run fingerprint covers every row's original provenance, so any
edit to the manifest or the definitions produces a different run. Bodies are assigned to
bounded shards by photo hash alone. Public output is aggregate counts and fingerprints only.

No photographs are read here. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from functools import cached_property
from typing import Any

from .body_acceptance import ACCEPTANCE, EXPECTED_ACCEPTANCE, load_acceptance
from .body_evidence import (
    BODY_SIZES,
    DEFINITIONS,
    EXPECTED_DEFINITIONS,
    MIN_BODIES_PER_VIEW,
    MIN_PER_GROUP,
    MIN_TOTAL_BODIES,
    VIEWS,
    BodyEvidenceError,
    _check_item,
)
from .catalogue import posture_fixes

FREEZE_FORMAT = "beljour-posture-body-freeze/1"
# ASSUMED operational bounds: far above the 1,200-body minimum, small enough to stay in memory.
MAX_BODIES = 200_000
MAX_SHARDS = 4096
TONES = tuple(str(tone) for tone in range(1, 11))
FIX_IDS_BY_VIEW: dict[str, tuple[str, ...]] = {
    view: tuple(entry.id for entry in posture_fixes() if entry.view == view) for view in VIEWS
}
_ROW_KEYS = frozenset({
    "photo_sha256", "source", "source_ancestry", "licence", "derived_metrics_allowed",
    "released_adult", "minors_excluded", "view", "body_size", "monk",
})


class FreezeError(BodyEvidenceError):
    """A refused manifest or run, with a stable code and no row content."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode()


def definitions_digest() -> str:
    """SHA-256 over the exact committed r25e and r26e definition bytes."""
    load_acceptance()
    digest = hashlib.sha256(b"beljour-body-definitions/1\0")
    for folder, names in ((DEFINITIONS, EXPECTED_DEFINITIONS), (ACCEPTANCE, EXPECTED_ACCEPTANCE)):
        for name in names:
            data = (folder / f"{name}.json").read_bytes()
            digest.update(len(data).to_bytes(8, "big"))
            digest.update(data)
    return digest.hexdigest()


def shard_of(photo_sha256: str, shard_count: int) -> int:
    raw = hashlib.sha256(b"beljour-body-shard/1\0" + photo_sha256.encode("ascii")).digest()
    return int.from_bytes(raw[:8], "big") % shard_count


@dataclass(frozen=True)
class FrozenBody:
    photo_sha256: str
    view: str
    body_size: str
    monk: str
    shard: int

    def job_ids(self) -> tuple[str, ...]:
        return tuple(f"{self.photo_sha256}:{fix_id}" for fix_id in FIX_IDS_BY_VIEW[self.view])


@dataclass(frozen=True)
class FrozenRun:
    fingerprint: str
    definitions_sha256: str
    shard_count: int
    bodies: tuple[FrozenBody, ...]

    def group_counts(self) -> dict[tuple[str, str, str], int]:
        counts: Counter[tuple[str, str, str]] = Counter()
        for body in self.bodies:
            counts[(body.view, body.body_size, body.monk)] += 1
        return dict(counts)

    def body(self, photo_sha256: str) -> FrozenBody | None:
        return self._by_hash.get(photo_sha256)

    @cached_property
    def _by_hash(self) -> dict[str, FrozenBody]:
        return {body.photo_sha256: body for body in self.bodies}

    def set_status(self) -> str:
        """r25e coverage only: thin or partial sets are UNPROVEN, a complete set NOT_RUN."""
        if not self.bodies:
            return "NOT_RUN"
        counts = self.group_counts()
        per_view = {view: sum(n for key, n in counts.items() if key[0] == view) for view in VIEWS}
        thin = len(self.bodies) < MIN_TOTAL_BODIES or min(per_view.values()) < MIN_BODIES_PER_VIEW or any(
            counts.get((view, size, tone), 0) < MIN_PER_GROUP
            for view in VIEWS for size in BODY_SIZES for tone in TONES
        )
        return "UNPROVEN" if thin else "NOT_RUN"

    @property
    def job_count(self) -> int:
        return sum(len(FIX_IDS_BY_VIEW[body.view]) for body in self.bodies)

    def public(self) -> dict[str, Any]:
        """Aggregates and fingerprints only: no photo hash, source or per-body record."""
        counts = self.group_counts()
        return {
            "format": FREEZE_FORMAT,
            "fingerprint": self.fingerprint,
            "definitions_sha256": self.definitions_sha256,
            "bodies": len(self.bodies),
            "jobs": self.job_count,
            "shards": self.shard_count,
            "groups": [
                {"view": view, "body_size": size, "monk": tone, "bodies": counts.get((view, size, tone), 0)}
                for view in VIEWS for size in BODY_SIZES for tone in TONES
            ],
            "set_status": self.set_status(),
        }

    def private_record(self) -> dict[str, Any]:
        """Operator-only run file: needed to bind results, kept outside the repository."""
        return {
            "format": FREEZE_FORMAT,
            "fingerprint": self.fingerprint,
            "definitions_sha256": self.definitions_sha256,
            "shard_count": self.shard_count,
            "bodies": [[b.photo_sha256, b.view, b.body_size, b.monk] for b in self.bodies],
        }


def _fingerprint(definitions: str, shard_count: int, rows: Sequence[Mapping[str, Any]]) -> str:
    digest = hashlib.sha256(b"beljour-body-run/1\0")
    digest.update(canonical({"definitions": definitions, "shards": shard_count, "format": FREEZE_FORMAT}))
    for row in sorted(rows, key=lambda item: str(item["photo_sha256"])):
        record = canonical({key: row[key] for key in sorted(_ROW_KEYS)})
        digest.update(len(record).to_bytes(8, "big"))
        digest.update(record)
    return digest.hexdigest()


def freeze_manifest(rows: Sequence[Mapping[str, Any]], *, shard_count: int = 64) -> FrozenRun:
    """Admit every row through the r25e rules, refuse duplicates, then fingerprint and shard."""
    if type(shard_count) is not int or not 1 <= shard_count <= MAX_SHARDS:
        raise FreezeError("invalid_shard_count")
    if not isinstance(rows, Sequence) or isinstance(rows, (str, bytes)) or len(rows) > MAX_BODIES:
        raise FreezeError("manifest_size_limit")
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, Mapping) or set(row) != _ROW_KEYS:
            raise FreezeError("invalid_manifest_row")
        try:
            _check_item(row)
        except BodyEvidenceError as exc:
            raise FreezeError("inadmissible_manifest_row") from exc
        digest = str(row["photo_sha256"])
        if digest in seen:
            raise FreezeError("duplicate_body")
        seen.add(digest)
    definitions = definitions_digest()
    bodies = tuple(
        FrozenBody(str(row["photo_sha256"]), str(row["view"]), str(row["body_size"]), str(row["monk"]),
                   shard_of(str(row["photo_sha256"]), shard_count))
        for row in sorted(rows, key=lambda item: str(item["photo_sha256"]))
    )
    return FrozenRun(_fingerprint(definitions, shard_count, rows), definitions, shard_count, bodies)


def load_private_run(record: object) -> FrozenRun:
    """Rebuild an operator run file; refuse it if the committed definitions have drifted."""
    if not isinstance(record, dict) or set(record) != {
        "format", "fingerprint", "definitions_sha256", "shard_count", "bodies",
    } or record["format"] != FREEZE_FORMAT:
        raise FreezeError("invalid_frozen_run")
    if record["definitions_sha256"] != definitions_digest():
        raise FreezeError("definitions_changed")
    count = record["shard_count"]
    raw = record["bodies"]
    if type(count) is not int or not 1 <= count <= MAX_SHARDS or not isinstance(raw, list) or len(raw) > MAX_BODIES:
        raise FreezeError("invalid_frozen_run")
    bodies: list[FrozenBody] = []
    seen: set[str] = set()
    for item in raw:
        if not isinstance(item, list) or len(item) != 4 or not all(isinstance(value, str) for value in item):
            raise FreezeError("invalid_frozen_run")
        digest, view, size, tone = item
        if (len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest) or view not in VIEWS
                or size not in BODY_SIZES or tone not in TONES or digest in seen):
            raise FreezeError("invalid_frozen_run")
        seen.add(digest)
        bodies.append(FrozenBody(digest, view, size, tone, shard_of(digest, count)))
    fingerprint = record["fingerprint"]
    if not isinstance(fingerprint, str) or len(fingerprint) != 64:
        raise FreezeError("invalid_frozen_run")
    return FrozenRun(fingerprint, record["definitions_sha256"], count, tuple(sorted(bodies, key=lambda b: b.photo_sha256)))


def control_rows(per_group: int = MIN_PER_GROUP, *, views: Sequence[str] = VIEWS) -> list[dict[str, Any]]:
    """Artificial balanced control manifest: counter-derived hashes, no photographs.

    Used to check the bookkeeping at full scale (20 per group gives 1,200 bodies and
    4,200 jobs). A control is never evidence about real bodies.
    """
    rows: list[dict[str, Any]] = []
    for view in views:
        for size in BODY_SIZES:
            for tone in TONES:
                for copy in range(per_group):
                    label = f"control/{view}/{size}/{tone}/{copy}".encode()
                    rows.append({
                        "photo_sha256": hashlib.sha256(label).hexdigest(), "source": "owner_consent_control",
                        "source_ancestry": [], "licence": "Owner-Consent", "derived_metrics_allowed": True,
                        "released_adult": True, "minors_excluded": True, "view": view,
                        "body_size": size, "monk": tone,
                    })
    return rows
