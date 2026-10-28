"""Deterministic filtered image ingestion and bounded training. Author: John Khan."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageOps

from .atomic import write_private_json
from .policy import ImageGrant, Rejected, approve
from .revocations import parse_revocations


def manifest_digest(train: bytes, evaluation: bytes) -> str:
    """Bind ordered splits with domain separation and unambiguous lengths."""
    digest = hashlib.sha256(b"beljour-splits/2\x00")
    for split in (train, evaluation):
        digest.update(len(split).to_bytes(8, "big"))
        digest.update(split)
    return digest.hexdigest()


def manifest_digest_files(train: Path, evaluation: Path) -> str:
    digest = hashlib.sha256(b"beljour-splits/2\x00")
    for path in (train, evaluation):
        digest.update(path.stat().st_size.to_bytes(8, "big"))
        with path.open("rb") as opened:
            for chunk in iter(lambda: opened.read(1024 * 1024), b""):
                digest.update(chunk)
    return digest.hexdigest()


@dataclass(frozen=True)
class TrainingPlan:
    image_size: int = 32
    latent_dim: int = 64
    batch_size: int = 8
    steps: int = 1000
    learning_rate: float = 0.0005
    seed: int = 2026
    holdout_fraction: float = 0.15

    def validate(self) -> None:
        if self.image_size not in (32, 64, 128):
            raise ValueError("Unsupported image size")
        if self.latent_dim not in (32, 64, 128, 256):
            raise ValueError("Unsupported embedding dimension")
        if not 1 <= self.batch_size <= 256 or not 1 <= self.steps <= 10_000_000:
            raise ValueError("Training limits exceeded")
        if not 0 < self.learning_rate < 0.1 or not np.isfinite(self.learning_rate):
            raise ValueError("Invalid optimizer rate")
        if not 0.05 <= self.holdout_fraction <= 0.5:
            raise ValueError("Invalid heldout size")
        if not 0 <= self.seed <= 2**32 - 1:
            raise ValueError("Invalid seed")

    def digest(self) -> str:
        self.validate()
        return hashlib.sha256(json.dumps(asdict(self), sort_keys=True).encode()).hexdigest()


@dataclass(frozen=True)
class IngestReport:
    scanned: int
    accepted: int
    rejected: int
    reason_counts: dict[str, int]
    manifest_sha256: str


def digest_path(file: Path) -> str:
    digest = hashlib.sha256()
    with file.open("rb") as opened:
        for chunk in iter(lambda: opened.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def checked_image(folder: Path, grant: ImageGrant) -> Path:
    root = folder.resolve(strict=True)
    path = (root / grant.path).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise Rejected("missing_image")
    if not 0 < path.stat().st_size <= 25 * 1024 * 1024:
        raise Rejected("image_size_limit")
    if digest_path(path) != grant.sha256:
        raise Rejected("image_hash_mismatch")
    try:
        with Image.open(path) as photo:
            if photo.format not in ("JPEG", "PNG", "WEBP"):
                raise Rejected("invalid_image")
            if not 16 <= photo.width <= 10000 or not 16 <= photo.height <= 10000:
                raise Rejected("image_dimensions")
            if photo.width * photo.height > 24_000_000:
                raise Rejected("image_dimensions")
            photo.verify()
    except (OSError, ValueError, SyntaxError) as exc:
        raise Rejected("invalid_image") from exc
    return path


def partition(subject_key: str, seed: int, holdout: float) -> str:
    digest = hashlib.sha256(f"{seed}/{subject_key}".encode()).digest()
    ratio = int.from_bytes(digest[:8], "big") / float(1 << 64)
    return "eval" if ratio < holdout else "train"


def ingest(
    manifest: Path,
    images: Path,
    rights: Path,
    destination: Path,
    *,
    plan: TrainingPlan,
    max_rows: int = 3_200_000,
    revocations: Path | None = None,
) -> IngestReport:
    """Filter every image before any approved training manifest is written.

    Rejection records contain only source row number and a constant error code.
    No rejected filenames, people, paths, hashes or pixels are logged.
    """
    plan.validate()
    revoked = parse_revocations(revocations)
    if not manifest.is_file() or not images.is_dir() or not rights.is_dir():
        raise ValueError("Private source and review directories are required")
    if destination.resolve().is_relative_to(images.resolve()):
        raise ValueError("Keep filtered manifests outside source images")
    destination.mkdir(parents=True, exist_ok=True, mode=0o700)
    streams = {}
    scratch = {}
    consent_stage = Path(tempfile.mkdtemp(prefix=".consent-stage-", dir=destination))
    os.chmod(consent_stage, 0o700)
    count = 0
    accepted = 0
    reasons: Counter[str] = Counter()
    seen: set[str] = set()
    try:
        for name in ("train", "eval", "rejected"):
            fd, temp = tempfile.mkstemp(prefix=".ingest-", dir=destination)
            scratch[name] = Path(temp)
            streams[name] = os.fdopen(fd, "wb")
        with manifest.open("r", encoding="utf-8") as source:
            for count, raw in enumerate(source, 1):
                if count > max_rows:
                    raise ValueError("Manifest exceeds maximum item count")
                try:
                    if len(raw) > 8192:
                        raise Rejected("oversized_manifest_row")
                    row = json.loads(raw)
                    grant = approve(row, rights)
                    checked_image(images, grant)
                    if grant.source == "consented" and revocations is None:
                        raise Rejected("missing_consent_revocation_register")
                    if revoked.rejects(
                        grant.subject_key, grant.sha256, grant.consent_receipt_id,
                    ):
                        raise Rejected("revoked_training_item")
                    if grant.sha256 in seen:
                        raise Rejected("duplicate_image")
                    seen.add(grant.sha256)
                    if grant.source == "consented":
                        stored = consent_stage / f"{grant.consent_receipt_sha256}.consent.json"
                        copied = rights / stored.name
                        content = copied.read_bytes()
                        if hashlib.sha256(content).hexdigest() != grant.consent_receipt_sha256:
                            raise Rejected("changed_consent_receipt")
                        descriptor = os.open(
                            stored, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600,
                        )
                        with os.fdopen(descriptor, "wb") as proof_output:
                            proof_output.write(content)
                            proof_output.flush()
                            os.fsync(proof_output.fileno())
                    split = partition(grant.subject_key, plan.seed, plan.holdout_fraction)
                    entry = json.dumps(asdict(grant), sort_keys=True).encode() + b"\n"
                    streams[split].write(entry)
                    accepted += 1
                except (Rejected, json.JSONDecodeError) as exc:
                    reason = exc.reason if isinstance(exc, Rejected) else "invalid_json"
                    reasons[reason] += 1
                    entry = json.dumps({"row": count, "reason": reason}).encode() + b"\n"
                    streams["rejected"].write(entry)
        for stream in streams.values():
            stream.flush()
            os.fsync(stream.fileno())
            stream.close()
        for name in ("train", "eval", "rejected"):
            os.chmod(scratch[name], 0o600)
            os.replace(scratch[name], destination / f"{name}.jsonl")
        receipt_dir = destination / "consent_receipts"
        if receipt_dir.is_symlink():
            raise ValueError("Invalid existing consent archive")
        previous = destination / ".previous-consent-stage"
        if previous.exists():
            raise ValueError("Unfinished consent archive replacement")
        if receipt_dir.exists():
            receipt_dir.rename(previous)
        consent_stage.rename(receipt_dir)
        if previous.exists():
            shutil.rmtree(previous)
        digest_value = manifest_digest_files(
            destination / "train.jsonl",
            destination / "eval.jsonl",
        )
        result = IngestReport(count, accepted, count - accepted, dict(sorted(reasons.items())), digest_value)
        summary = {
            "schema": "beljour-ingest/1",
            "digest_version": 2,
            "revocations_sha256": revoked.sha256,
            **asdict(result),
            "plan_sha256": plan.digest(),
        }
        write_private_json(destination / "summary.json", summary)
        return result
    finally:
        for stream in streams.values():
            if not stream.closed:
                stream.close()
        for leftover in scratch.values():
            leftover.unlink(missing_ok=True)
        if consent_stage.exists():
            shutil.rmtree(consent_stage)


def read_pixels(image: Path, size: int) -> NDArray[np.float32]:
    with Image.open(image) as opened:
        oriented = ImageOps.exif_transpose(opened).convert("RGB")
        oriented.thumbnail((size, size), Image.Resampling.BILINEAR)
        square = Image.new("RGB", (size, size), (127, 127, 127))
        square.paste(oriented, ((size - oriented.width) // 2, (size - oriented.height) // 2))
        array = np.asarray(square, dtype=np.float32) / 255.0
    return array.reshape(-1)
