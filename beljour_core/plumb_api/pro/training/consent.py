"""Verify specific, cooperative model-training consent before dataset admission.

Author: John Khan.
"""

from __future__ import annotations

import hashlib
import json
import re
import stat
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

RECEIPT_SCHEMA = "beljour-training-consent/1"
TRAINING_SCOPE = "commercial_model_training"
MAX_RECEIPT_BYTES = 8192
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_TIMESTAMP = re.compile(r"20[2-9][0-9]-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]Z\Z")
_REQUIRED = frozenset({
    "schema", "receipt_id", "timestamp", "scope", "cooperative_opt_in",
    "capture_verified", "image_sha256", "subject_key", "withdrawn",
})


class ConsentRejected(ValueError):
    """Public errors use stable codes and never include data from receipts."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class ConsentProof:
    receipt_sha256: str
    receipt_id: str
    timestamp: str
    scope: str


def _hash(value: object) -> str:
    if not isinstance(value, str) or _SHA.fullmatch(value) is None:
        raise ConsentRejected("invalid_consent_identifier")
    return value


def _timestamp_utc(value: object) -> str:
    if not isinstance(value, str) or _TIMESTAMP.fullmatch(value) is None:
        raise ConsentRejected("invalid_consent_timestamp")
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise ConsentRejected("invalid_consent_timestamp") from exc
    if parsed.year < 2020 or parsed > datetime.now(UTC):
        raise ConsentRejected("invalid_consent_timestamp")
    return value


def checked_receipt(
    folder: Path, digest: object, *, image_sha256: object, subject_key: object,
    receipt_id: object, timestamp: object, scope: object,
) -> ConsentProof:
    """Verify archived consent bytes and exact subject, image and scope binding.

    Arguments come from untrusted rows, so each is validated here and a missing or
    malformed one is refused with a coded reason.
    """
    checked_digest = _hash(digest)
    checked_id = _hash(receipt_id)
    _hash(image_sha256)
    _hash(subject_key)
    checked_time = _timestamp_utc(timestamp)
    if scope != TRAINING_SCOPE:
        raise ConsentRejected("unsupported_consent_scope")
    if folder.is_symlink() or not folder.is_dir():
        raise ConsentRejected("missing_consent_archive")
    path = folder / f"{checked_digest}.consent.json"
    try:
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or not 1 <= info.st_size <= MAX_RECEIPT_BYTES:
            raise ConsentRejected("invalid_consent_receipt")
        raw = path.read_bytes()
    except OSError as exc:
        raise ConsentRejected("missing_consent_receipt") from exc
    if hashlib.sha256(raw).hexdigest() != checked_digest:
        raise ConsentRejected("changed_consent_receipt")
    try:
        content: Any = json.loads(raw)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ConsentRejected("invalid_consent_receipt") from exc
    if not isinstance(content, dict) or set(content) != _REQUIRED:
        raise ConsentRejected("invalid_consent_receipt")
    if content["schema"] != RECEIPT_SCHEMA or content["scope"] != TRAINING_SCOPE:
        raise ConsentRejected("unsupported_consent_scope")
    if content["cooperative_opt_in"] is not True or content["capture_verified"] is not True:
        raise ConsentRejected("consent_not_opted_in")
    if content["withdrawn"] is not False:
        raise ConsentRejected("consent_withdrawn")
    if content["receipt_id"] != checked_id or content["timestamp"] != checked_time:
        raise ConsentRejected("consent_binding_mismatch")
    if content["image_sha256"] != image_sha256 or content["subject_key"] != subject_key:
        raise ConsentRejected("consent_binding_mismatch")
    return ConsentProof(checked_digest, checked_id, checked_time, TRAINING_SCOPE)


def approve_consent(row: dict[str, Any], archive: Path) -> ConsentProof:
    """An optional Terms acceptance never stands in for affirmative training opt-in."""
    if row.get("training_opt_in") is not True:
        raise ConsentRejected("missing_training_opt_in")
    return checked_receipt(
        archive, row.get("consent_sha256"),
        image_sha256=row.get("sha256"), subject_key=row.get("subject_key"),
        receipt_id=row.get("consent_receipt_id"),
        timestamp=row.get("consent_timestamp"), scope=row.get("consent_scope"),
    )


def checked_saved_consent(
    folder: Path, *, image_sha256: str, subject_key: str,
    receipt_sha256: str, receipt_id: str, timestamp: str, scope: str,
) -> None:
    checked_receipt(
        folder, receipt_sha256, image_sha256=image_sha256,
        subject_key=subject_key, receipt_id=receipt_id,
        timestamp=timestamp, scope=scope,
    )
