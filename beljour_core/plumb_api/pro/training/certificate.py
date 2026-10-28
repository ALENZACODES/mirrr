"""Aggregate rights certificate for externally reviewed training records. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any

from .atomic import read_private_json, write_private_json
from .audit import _iter_rows, validate_corpus
from .pipeline import TrainingPlan
from .policy import ALLOWED
from .withdrawal import LINEAGE_SCHEMA

CERTIFICATE_SCHEMA = "beljour-training-provenance/1"
MAX_REJECTION_ROW_BYTES = 256


def _canonical(document: dict[str, Any]) -> bytes:
    return json.dumps(
        document, sort_keys=True, ensure_ascii=True, separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")


def _digest(document: dict[str, Any]) -> str:
    return hashlib.sha256(_canonical(document)).hexdigest()


def _rejection_reasons(path: Path) -> dict[str, int]:
    counts: Counter[str] = Counter()
    with path.open("rb") as opened:
        for raw in opened:
            if len(raw) > MAX_REJECTION_ROW_BYTES or not raw.endswith(b"\n"):
                raise ValueError("Invalid rejection audit entry")
            try:
                entry = json.loads(raw)
            except (UnicodeError, json.JSONDecodeError) as exc:
                raise ValueError("Invalid rejection audit entry") from exc
            if not isinstance(entry, dict) or set(entry) != {"row", "reason"}:
                raise ValueError("Invalid rejection audit shape")
            reason = entry["reason"]
            if type(entry["row"]) is not int or not isinstance(reason, str):
                raise ValueError("Invalid rejection audit fields")
            if entry["row"] < 1 or not reason.isidentifier() or len(reason) > 64:
                raise ValueError("Invalid rejection audit fields")
            counts[reason] += 1
    return dict(sorted(counts.items()))


def build_certificate(
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Reconcile accepted licence classes and rejected reason codes to audited counts.

    The digest detects changes after export. It is not a signature, rights opinion,
    proof of consent, or independent legal clearance. No file-level data is exposed.
    """
    audit = validate_corpus(
        approved, images, plan, revocations=revocations, check_image_bytes=True,
    )
    by_source: dict[str, Counter[str]] = {}
    for split in ("train", "eval"):
        for grant in _iter_rows(approved / f"{split}.jsonl", split=split, plan=plan):
            if grant.source not in ALLOWED or grant.licence not in ALLOWED[grant.source]:
                raise ValueError("Uncleared licence in approved manifest")
            by_source.setdefault(grant.source, Counter())[grant.licence] += 1
    accepted = {
        source: dict(sorted(licences.items()))
        for source, licences in sorted(by_source.items())
    }
    source_totals = {
        source: sum(licences.values()) for source, licences in accepted.items()
    }
    if source_totals != audit.source_counts:
        raise ValueError("Licence totals do not match audited population")
    rejections = _rejection_reasons(approved / "rejected.jsonl")
    with (approved / "summary.json").open("r", encoding="utf-8") as opened:
        summary = json.load(opened)
    if not isinstance(summary, dict) or summary.get("reason_counts") != rejections:
        raise ValueError("Rejection reason counts differ from ingest ledger")
    if summary.get("scanned") != (
        audit.train_count + audit.eval_count + sum(rejections.values())
        + summary.get("withdrawn", 0)
    ):
        raise ValueError("Scanned population differs from audit")
    withdrawn = summary.get("withdrawn", 0)
    if type(withdrawn) is not int or withdrawn < 0:
        raise ValueError("Invalid consent-withdrawal count")
    lineage = "NO_WITHDRAWAL_RECORDED"
    if withdrawn:
        proof = read_private_json(approved / "checkpoint-provenance.json")
        if (
            proof.get("schema") != LINEAGE_SCHEMA
            or proof.get("current_manifest") != audit.manifest_sha256
            or proof.get("status") != "RETRAIN_REQUIRED"
            or not isinstance(proof.get("old_manifests"), list)
            or not proof["old_manifests"]
        ):
            raise ValueError("Unverifiable affected-checkpoint provenance")
        lineage = "PRE_WITHDRAWAL_CHECKPOINTS_RETRAIN_REQUIRED"
    core: dict[str, Any] = {
        "schema": CERTIFICATE_SCHEMA,
        "product": "BELJOUR",
        "status": "FILTERED_CORPUS_AUDITED",
        "manifest_sha256": audit.manifest_sha256,
        "approved_train": audit.train_count,
        "approved_eval": audit.eval_count,
        "accepted_by_source_and_licence": accepted,
        "rejected_by_reason": rejections,
        "rejected_count": sum(rejections.values()),
        "licence_policy": "SOURCE_SPECIFIC_ALLOWLIST_ENFORCED",
        "consent_policy": "COOPERATIVE_OPT_IN_RECEIPT_REQUIRED",
        "active_consented_records": audit.source_counts.get("consented", 0),
        "withdrawn_consent_records": withdrawn,
        "checkpoint_consent_status": lineage,
        "evidence": "HASHED_IMAGE_SPECIFIC_RIGHTS_REVIEW_AT_INGEST",
        "independent_legal_certification": "NOT_PERFORMED",
        "model_quality": "NOT_EVALUATED",
        "release_quality": "NOT_RUN",
    }
    return {**core, "integrity_sha256": _digest(core)}


def verify_certificate(document: object) -> dict[str, Any]:
    """Reject modified claims, unknown fields and unmeasured release passes."""
    if not isinstance(document, dict):
        raise ValueError("Invalid certificate")
    expected = {
        "schema", "product", "status", "manifest_sha256", "approved_train",
        "approved_eval", "accepted_by_source_and_licence", "rejected_by_reason",
        "rejected_count", "licence_policy", "evidence", "consent_policy",
        "active_consented_records", "withdrawn_consent_records",
        "checkpoint_consent_status",
        "independent_legal_certification", "model_quality", "release_quality",
        "integrity_sha256",
    }
    if set(document) != expected or document["schema"] != CERTIFICATE_SCHEMA:
        raise ValueError("Unsupported certificate")
    if document["release_quality"] != "NOT_RUN" or document["model_quality"] != "NOT_EVALUATED":
        raise ValueError("Unsupported approval claim")
    if document["independent_legal_certification"] != "NOT_PERFORMED":
        raise ValueError("Unsupported clearance claim")
    count = document["withdrawn_consent_records"]
    active = document["active_consented_records"]
    if type(count) is not int or count < 0 or type(active) is not int or active < 0:
        raise ValueError("Invalid consent counts")
    expected_lineage = (
        "PRE_WITHDRAWAL_CHECKPOINTS_RETRAIN_REQUIRED"
        if count else "NO_WITHDRAWAL_RECORDED"
    )
    if (document["checkpoint_consent_status"] != expected_lineage
        or document["consent_policy"] != "COOPERATIVE_OPT_IN_RECEIPT_REQUIRED"):
        raise ValueError("Unsupported consent provenance")
    digest = document["integrity_sha256"]
    if not isinstance(digest, str) or len(digest) != 64:
        raise ValueError("Invalid certificate digest")
    body = {key: value for key, value in document.items() if key != "integrity_sha256"}
    if _digest(body) != digest:
        raise ValueError("Certificate was changed")
    return dict(document)


def export_certificate(
    destination: Path,
    approved: Path,
    images: Path,
    plan: TrainingPlan,
    *,
    revocations: Path | None = None,
) -> dict[str, Any]:
    """Write only aggregate provenance to a new, non-overwritten file."""
    result = build_certificate(approved, images, plan, revocations=revocations)
    write_private_json(destination, result, replace=False)
    return result
