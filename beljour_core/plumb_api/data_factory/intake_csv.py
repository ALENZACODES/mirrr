"""Convert a contributor CSV into intake JSONL, validating every row.

Columns map to record fields by name. Booleans accept true/false, yes/no and
1/0. A face box is given as face_x, face_y, face_w, face_h. Batch defaults
(for example one source and licence for a whole delivery) fill empty cells.
Unknown columns are refused unless listed as ignored, so a misspelt column
never drops data silently. Rows with problems are reported and not written.
Author: John Khan.
"""

from __future__ import annotations

import csv
import json
import os
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .records import DECLARED_ATTRIBUTES, validate_record

TEXT_COLUMNS = ("path", "source", "licence", "attribution", "content_sha256") + tuple(
    DECLARED_ATTRIBUTES)
BOOL_COLUMNS = ("commercial_use", "consent")
INT_COLUMNS = ("width", "height")
BOX_COLUMNS = ("face_x", "face_y", "face_w", "face_h")
KNOWN_COLUMNS = frozenset(TEXT_COLUMNS + BOOL_COLUMNS + INT_COLUMNS + BOX_COLUMNS)
TRUE_WORDS = frozenset({"true", "yes", "y", "1"})
FALSE_WORDS = frozenset({"false", "no", "n", "0"})


class IntakeError(ValueError):
    """The CSV cannot be converted at all (for example unknown columns)."""


@dataclass
class Conversion:
    """Rows written and problems per CSV line (header is line 1)."""

    written: int = 0
    problems: list[tuple[int, str]] = field(default_factory=list)

    @property
    def clean(self) -> bool:
        """True when every row converted."""
        return not self.problems


def _bool(value: str) -> bool | str:
    word = value.strip().lower()
    if word in TRUE_WORDS:
        return True
    if word in FALSE_WORDS:
        return False
    return value


def _int(value: str) -> int | str:
    text = value.strip()
    return int(text) if text.lstrip("-").isdigit() else value


def convert_row(cells: Mapping[str, str], defaults: Mapping[str, Any]
                ) -> tuple[dict[str, Any], list[str]]:
    """One CSV row to an intake object plus its validation problems."""
    row: dict[str, Any] = {}
    for name in TEXT_COLUMNS:
        value = (cells.get(name) or "").strip()
        if value:
            row[name] = value
    for name in BOOL_COLUMNS:
        value = (cells.get(name) or "").strip()
        if value:
            row[name] = _bool(value)
    for name in INT_COLUMNS:
        value = (cells.get(name) or "").strip()
        if value:
            row[name] = _int(value)
    box = [(cells.get(name) or "").strip() for name in BOX_COLUMNS]
    problems: list[str] = []
    if any(box):
        if not all(box):
            problems.append("face box needs all of face_x, face_y, face_w, face_h")
        else:
            row["face_box"] = [_int(value) for value in box]
    for key, value in defaults.items():
        row.setdefault(key, value)
    if "attribution" not in row:
        row["attribution"] = ""
    if "path" not in row:
        problems.append("path: missing")
    problems.extend(validate_record(row, require_hash=False))
    return row, problems


def convert_csv(csv_path: Path, out_path: Path, *, defaults: Mapping[str, Any] | None = None,
                ignore_columns: Iterable[str] = ()) -> Conversion:
    """Write valid rows to out_path (JSONL) and report the others."""
    ignored = frozenset(ignore_columns)
    result = Conversion()
    seen_paths: dict[str, int] = {}
    tmp = out_path.with_name(out_path.name + ".partial")
    with csv_path.open(newline="", encoding="utf-8-sig") as source:
        reader = csv.DictReader(source)
        columns = [name.strip() for name in reader.fieldnames or []]
        unknown = sorted(set(columns) - KNOWN_COLUMNS - ignored)
        if unknown:
            raise IntakeError("unknown CSV columns: " + ", ".join(unknown))
        if "path" not in columns:
            raise IntakeError("the CSV needs a path column")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with tmp.open("w", encoding="utf-8") as sink:
            for line, cells in enumerate(reader, start=2):
                clean = {str(k).strip(): v for k, v in cells.items() if k is not None}
                row, problems = convert_row(clean, defaults or {})
                path = row.get("path")
                if isinstance(path, str) and path in seen_paths:
                    problems.append(f"path repeats line {seen_paths[path]}")
                if problems:
                    result.problems.extend((line, problem) for problem in problems)
                    continue
                seen_paths[str(path)] = line
                sink.write(json.dumps(row, sort_keys=True) + "\n")
                result.written += 1
    os.replace(tmp, out_path)
    return result


def batch_defaults(*, source: str | None = None, licence: str | None = None,
                   attribution: str | None = None, commercial_use: bool | None = None,
                   consent: bool | None = None) -> dict[str, Any]:
    """Defaults dict from the values that were given."""
    values: dict[str, Any] = {"source": source, "licence": licence,
                              "attribution": attribution, "commercial_use": commercial_use,
                              "consent": consent}
    return {key: value for key, value in values.items() if value is not None}
