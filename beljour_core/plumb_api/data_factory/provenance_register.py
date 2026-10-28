"""Provenance register: one row per source with its licence evidence fields.

Rows are built from a verified locked set. Measured fields (record counts,
licences, how many records carry an attribution, commercial-use and consent
flags) are filled in; review fields (evidence reference, reviewer, review
date) are left for a person to complete, and any row without them is marked
as needing review. Output is CSV and JSON for the investor pack.
Author: John Khan.
"""

from __future__ import annotations

import csv
import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from .lockfile import assert_lock
from .manifest import ManifestReader

REGISTER_SCHEMA = "beljour-provenance-register/1"
COLUMNS = (
    "source", "records", "licences", "attributed_records", "commercial_use_records",
    "consent_records", "first_content_sha256", "evidence_reference", "reviewed_by",
    "reviewed_on", "status",
)
REVIEW_FIELDS = ("evidence_reference", "reviewed_by", "reviewed_on")


def register_rows(lock_path: Path,
                  reviews: Mapping[str, Mapping[str, str]] | None = None) -> list[dict[str, Any]]:
    """One row per source; `reviews` supplies the person-entered fields by source."""
    lock = assert_lock(lock_path, require_tool_version=False)
    manifest = lock_path.parent / str(lock["manifest"]["file"])
    rows: dict[str, dict[str, Any]] = {}
    for item in ManifestReader(manifest):
        record = item.record
        row = rows.setdefault(record.source, {
            "source": record.source, "records": 0, "licences": set(),
            "attributed_records": 0, "commercial_use_records": 0, "consent_records": 0,
            "first_content_sha256": record.content_sha256,
        })
        row["records"] += 1
        row["licences"].add(record.licence)
        row["attributed_records"] += int(bool(record.attribution.strip()))
        row["commercial_use_records"] += int(record.commercial_use)
        row["consent_records"] += int(record.consent)
        row["first_content_sha256"] = min(row["first_content_sha256"], record.content_sha256)
    supplied = reviews or {}
    out: list[dict[str, Any]] = []
    for source in sorted(rows):
        row = rows[source]
        row["licences"] = "; ".join(sorted(row["licences"]))
        review = supplied.get(source, {})
        for key in REVIEW_FIELDS:
            row[key] = str(review.get(key, "")).strip()
        complete = all(row[key] for key in REVIEW_FIELDS)
        flags_ok = row["commercial_use_records"] == row["consent_records"] == row["records"]
        row["status"] = "reviewed" if complete and flags_ok else "needs review"
        out.append({column: row[column] for column in COLUMNS})
    return out


def write_register(lock_path: Path, out_dir: Path,
                   reviews: Mapping[str, Mapping[str, str]] | None = None
                   ) -> tuple[Path, Path]:
    """Write <set>.provenance.csv and <set>.provenance.json."""
    lock = assert_lock(lock_path, require_tool_version=False)
    rows = register_rows(lock_path, reviews)
    out_dir.mkdir(parents=True, exist_ok=True)
    name = str(lock["set_name"])
    csv_path = out_dir / f"{name}.provenance.csv"
    json_path = out_dir / f"{name}.provenance.json"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    payload = {"schema": REGISTER_SCHEMA, "author": "John Khan", "set_name": name,
               "lock_sha256": lock["lock_sha256"], "rows": rows}
    json_path.write_text(json.dumps(payload, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    return csv_path, json_path


def load_reviews(path: Path) -> dict[str, dict[str, str]]:
    """Read person-entered review fields from a CSV with a source column."""
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or "source" not in reader.fieldnames:
            raise ValueError("review CSV needs a source column")
        return {row["source"]: {key: row.get(key) or "" for key in REVIEW_FIELDS}
                for row in reader}


def needs_review(rows: Sequence[Mapping[str, Any]]) -> list[str]:
    """Sources still waiting for licence evidence review."""
    return [str(row["source"]) for row in rows if row["status"] != "reviewed"]
