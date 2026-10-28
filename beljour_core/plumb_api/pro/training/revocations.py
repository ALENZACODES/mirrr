"""Bounded private revocation register for pretraining admissions. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import stat
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REVOCATION_SCHEMA = "beljour-training-revocations/1"
REVOCATION_SCHEMA_V2 = "beljour-training-revocations/2"
MAX_REVOCATIONS = 3_200_000


class RevocationInvalid(ValueError):
    """An invalid register, with no untrusted content in the error."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class RevocationSet:
    subjects: frozenset[str]
    images: frozenset[str]
    sha256: str | None
    receipts: frozenset[str] = frozenset()

    def rejects(self, subject: str, image: str, receipt: str = "") -> bool:
        return (
            subject in self.subjects or image in self.images
            or (bool(receipt) and receipt in self.receipts)
        )

    def public(self) -> dict[str, Any]:
        return {
            "subject_revocations": len(self.subjects),
            "image_revocations": len(self.images),
            "consent_revocations": len(self.receipts),
            "status": "REGISTER_CHECKED" if self.sha256 is not None else "NO_REGISTER",
        }


def _hash_string(value: object) -> str:
    if not isinstance(value, str) or len(value) != 64:
        raise RevocationInvalid("invalid_revocation_entry")
    if any(letter not in "0123456789abcdef" for letter in value):
        raise RevocationInvalid("invalid_revocation_entry")
    return value


def parse_revocations(file: Path | None) -> RevocationSet:
    if file is None:
        return RevocationSet(frozenset(), frozenset(), None)
    try:
        before = file.lstat()
        if not stat.S_ISREG(before.st_mode):
            raise RevocationInvalid("invalid_revocation_file")
        if not 0 < before.st_size <= MAX_REVOCATIONS * 70 + 1024:
            raise RevocationInvalid("revocation_size_limit")
        data = file.read_bytes()
        after = file.lstat()
    except OSError as exc:
        raise RevocationInvalid("missing_revocation_file") from exc
    if (before.st_dev, before.st_ino) != (after.st_dev, after.st_ino):
        raise RevocationInvalid("changed_revocation_file")
    try:
        loaded: object = json.loads(data)
    except (json.JSONDecodeError, UnicodeError) as exc:
        raise RevocationInvalid("invalid_revocation_json") from exc
    if not isinstance(loaded, dict):
        raise RevocationInvalid("invalid_revocation_schema")
    if loaded.get("schema") == REVOCATION_SCHEMA:
        if set(loaded) != {"schema", "subjects", "images"}:
            raise RevocationInvalid("invalid_revocation_schema")
        receipt_values: object = []
    elif loaded.get("schema") == REVOCATION_SCHEMA_V2:
        if set(loaded) != {"schema", "subjects", "images", "receipts"}:
            raise RevocationInvalid("invalid_revocation_schema")
        receipt_values = loaded["receipts"]
    else:
        raise RevocationInvalid("invalid_revocation_schema")
    subject_values, image_values = loaded["subjects"], loaded["images"]
    if (not isinstance(subject_values, list) or not isinstance(image_values, list)
        or not isinstance(receipt_values, list)):
        raise RevocationInvalid("invalid_revocation_schema")
    if len(subject_values) + len(image_values) + len(receipt_values) > MAX_REVOCATIONS:
        raise RevocationInvalid("revocation_size_limit")
    subjects = tuple(_hash_string(value) for value in subject_values)
    images = tuple(_hash_string(value) for value in image_values)
    receipts = tuple(_hash_string(value) for value in receipt_values)
    if (len(set(subjects)) != len(subjects) or len(set(images)) != len(images)
        or len(set(receipts)) != len(receipts)):
        raise RevocationInvalid("duplicate_revocation")
    return RevocationSet(
        frozenset(subjects),
        frozenset(images),
        hashlib.sha256(data).hexdigest(),
        frozenset(receipts),
    )
