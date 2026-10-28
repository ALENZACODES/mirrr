"""Fail-closed per-image rights review for offline training. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .consent import ConsentRejected, approve_consent

SCHEMA = "beljour-training-image/1"
RIGHTS = "beljour-training-rights/1"
SHA = re.compile(r"[0-9a-f]{64}\Z")
ALLOWED: dict[str, frozenset[str]] = {
    "fairface": frozenset({"CC-BY-4.0"}),
    "ffhq_filtered": frozenset({
        "CC-BY-2.0", "CC-BY-3.0", "CC-BY-4.0", "CC0-1.0",
        "PUBLIC-DOMAIN", "US-GOVERNMENT-WORK",
    }),
    "cc0_stock": frozenset({"CC0-1.0", "PUBLIC-DOMAIN"}),
    "government": frozenset({"PUBLIC-DOMAIN", "US-GOVERNMENT-WORK"}),
    "consented": frozenset({"CONSENTED-COMMERCIAL"}),
    "twin_factory": frozenset({"OWN-SYNTHETIC"}),
}
REQUIRED = frozenset({
    "schema", "image", "sha256", "subject_key", "source", "licence",
    "evidence_sha256", "adult_confirmed", "commercial_training",
    "model_distribution", "derived_rights", "rights_current",
})
OPTIONAL = frozenset({
    "adult_age_band", "consent_sha256", "renderer_sha256", "collection_sha256",
    "independent_original", "group", "training_opt_in",
    "consent_receipt_id", "consent_timestamp", "consent_scope",
})


class Rejected(ValueError):
    """Constant public code, never supplied image metadata."""

    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


def checked_hash(value: object) -> str:
    if not isinstance(value, str) or SHA.fullmatch(value) is None:
        raise Rejected("missing_hash")
    return value


@dataclass(frozen=True)
class ImageGrant:
    path: str
    sha256: str
    subject_key: str
    source: str
    licence: str
    group: str
    consent_receipt_sha256: str = ""
    consent_receipt_id: str = ""
    consent_timestamp: str = ""
    consent_scope: str = ""

    def private_row(self) -> dict[str, str]:
        return vars(self).copy()


def review_file(folder: Path, digest: str, *, row: dict[str, Any]) -> None:
    """Archive must be approved, image-bound and content-addressed."""
    digest = checked_hash(digest)
    source = folder.resolve(strict=True)
    path = (source / f"{digest}.json").resolve()
    if not path.is_relative_to(source) or not path.is_file():
        raise Rejected("missing_rights_review")
    data = path.read_bytes()
    if len(data) > 16384 or hashlib.sha256(data).hexdigest() != digest:
        raise Rejected("changed_rights_review")
    try:
        evidence = json.loads(data)
    except json.JSONDecodeError as exc:
        raise Rejected("invalid_rights_review") from exc
    if not isinstance(evidence, dict) or evidence.get("schema") != RIGHTS:
        raise Rejected("invalid_rights_review")
    if evidence.get("approved") is not True or evidence.get("operator_reviewed") is not True:
        raise Rejected("unverified_rights")
    if evidence.get("source") != row["source"] or evidence.get("licence") != row["licence"]:
        raise Rejected("rights_mismatch")
    if evidence.get("image_sha256") != row["sha256"]:
        raise Rejected("rights_mismatch")


def approve(row: object, evidence_dir: Path) -> ImageGrant:
    if not isinstance(row, dict) or not all(isinstance(k, str) for k in row):
        raise Rejected("invalid_row")
    if set(row) - REQUIRED - OPTIONAL or not REQUIRED.issubset(row):
        raise Rejected("invalid_schema")
    if row.get("schema") != SCHEMA:
        raise Rejected("invalid_schema")
    source = row.get("source")
    if not isinstance(source, str) or source not in ALLOWED:
        raise Rejected("unapproved_source")
    licence = row.get("licence")
    if not isinstance(licence, str) or licence not in ALLOWED[source]:
        raise Rejected("unapproved_licence")
    if row.get("adult_confirmed") is not True:
        raise Rejected("adult_unproven")
    if source == "fairface" and row.get("adult_age_band") not in (
        "20-29", "30-39", "40-49", "50-59", "60-69", "more_than_70"
    ):
        raise Rejected("adult_unproven")
    for field in ("commercial_training", "model_distribution", "derived_rights", "rights_current"):
        if row.get(field) is not True:
            raise Rejected("commercial_rights_unproven")
    if source == "ffhq_filtered":
        if row.get("independent_original") is not True:
            checked_hash(row.get("collection_sha256"))
            raise Rejected("collection_clearance_unverified")
    consent = None
    if source == "consented":
        try:
            consent = approve_consent(row, evidence_dir)
        except ConsentRejected as exc:
            raise Rejected(exc.code) from exc
    elif any(row.get(key) for key in (
        "training_opt_in", "consent_sha256", "consent_receipt_id",
        "consent_timestamp", "consent_scope",
    )):
        raise Rejected("unexpected_consent_fields")
    if source == "twin_factory":
        checked_hash(row.get("renderer_sha256"))
    image_hash = checked_hash(row["sha256"])
    subject = checked_hash(row["subject_key"])
    location = row.get("image")
    if not isinstance(location, str) or not location or len(location) > 240:
        raise Rejected("invalid_path")
    path = Path(location)
    if path.is_absolute() or ".." in path.parts or "\\" in location:
        raise Rejected("invalid_path")
    if path.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
        raise Rejected("invalid_type")
    group = row.get("group", "unlabelled")
    if not isinstance(group, str) or not re.fullmatch(r"[a-z0-9_]{1,48}", group):
        raise Rejected("invalid_group")
    review_file(evidence_dir, checked_hash(row["evidence_sha256"]), row=row)
    if consent is not None:
        return ImageGrant(
            location, image_hash, subject, source, licence, group,
            consent.receipt_sha256, consent.receipt_id,
            consent.timestamp, consent.scope,
        )
    return ImageGrant(location, image_hash, subject, source, licence, group)
