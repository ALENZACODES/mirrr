"""Drawn-only training fixtures: synthetic images, rights reviews and corpora.

Every image here is drawn from seeded shapes and gradients. No photograph,
real face, person or dataset download is used. Author: John Khan.
"""

from __future__ import annotations

import hashlib
import io
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image

from .pipeline import TrainingPlan, ingest, manifest_digest_files, partition
from .policy import RIGHTS, SCHEMA, ImageGrant

DRAWN_EDGE = 48
# One permitted licence per non-user source, cycled so corpora always contain
# several sources for source-level accounting and scoring.
SOURCE_CYCLE: tuple[tuple[str, str], ...] = (
    ("cc0_stock", "CC0-1.0"),
    ("government", "PUBLIC-DOMAIN"),
    ("fairface", "CC-BY-4.0"),
    ("twin_factory", "OWN-SYNTHETIC"),
    ("ffhq_filtered", "CC-BY-4.0"),
)
GROUPS = ("slice_a", "slice_b", "slice_c")
# ASSUMED fixture plan: small enough for unit tests, with a heldout fraction
# large enough that drawn corpora of 18 or more subjects populate both splits.
FIXTURE_PLAN = TrainingPlan(
    image_size=32, latent_dim=32, batch_size=4, steps=4,
    learning_rate=0.0005, seed=2026, holdout_fraction=0.3,
)


def drawn_png(index: int, *, edge: int = DRAWN_EDGE) -> bytes:
    """Deterministic, unique RGB drawing: a gradient field with a seeded ellipse."""
    rng = np.random.default_rng([2026, index])
    axis = np.linspace(0.0, 1.0, edge, dtype=np.float32)
    base = rng.uniform(0.15, 0.85, size=3).astype(np.float32)
    tilt = rng.uniform(-0.3, 0.3, size=(2, 3)).astype(np.float32)
    canvas = (
        base[None, None, :]
        + axis[:, None, None] * tilt[0][None, None, :]
        + axis[None, :, None] * tilt[1][None, None, :]
    )
    rows, cols = np.mgrid[0:edge, 0:edge].astype(np.float32) / edge
    centre = rng.uniform(0.3, 0.7, size=2)
    radius = rng.uniform(0.12, 0.3, size=2)
    inside = ((rows - centre[0]) / radius[0]) ** 2 + ((cols - centre[1]) / radius[1]) ** 2 <= 1.0
    canvas[inside] = rng.uniform(0.0, 1.0, size=3).astype(np.float32)
    pixels = np.clip(np.rint(canvas * 255.0), 0, 255).astype(np.uint8)
    # A per-index marker pixel keeps every drawing byte-distinct.
    pixels[0, 0] = (index % 256, (index // 256) % 256, 7)
    buffer = io.BytesIO()
    Image.fromarray(pixels, "RGB").save(buffer, format="PNG")
    return buffer.getvalue()


def write_review(rights: Path, *, source: str, licence: str, image_sha256: str) -> str:
    """Archive an approved, image-bound rights review and return its digest."""
    rights.mkdir(parents=True, exist_ok=True)
    raw = json.dumps({
        "schema": RIGHTS, "approved": True, "operator_reviewed": True,
        "source": source, "licence": licence, "image_sha256": image_sha256,
    }, sort_keys=True).encode()
    digest = hashlib.sha256(raw).hexdigest()
    (rights / f"{digest}.json").write_bytes(raw)
    return digest


def draw_record(
    photos: Path,
    rights: Path,
    index: int,
    *,
    source: str = "cc0_stock",
    licence: str = "CC0-1.0",
    subject_key: str | None = None,
    group: str | None = None,
) -> dict[str, Any]:
    """Write one drawn image plus its rights review; return the candidate row."""
    photos.mkdir(parents=True, exist_ok=True)
    name = f"drawn-{index:05d}.png"
    data = drawn_png(index)
    (photos / name).write_bytes(data)
    image_sha256 = hashlib.sha256(data).hexdigest()
    row: dict[str, Any] = {
        "schema": SCHEMA,
        "image": name,
        "sha256": image_sha256,
        "subject_key": subject_key or hashlib.sha256(f"drawn-subject-{index}".encode()).hexdigest(),
        "source": source,
        "licence": licence,
        "evidence_sha256": write_review(
            rights, source=source, licence=licence, image_sha256=image_sha256,
        ),
        "adult_confirmed": True,
        "commercial_training": True,
        "model_distribution": True,
        "derived_rights": True,
        "rights_current": True,
        "group": group or GROUPS[index % len(GROUPS)],
    }
    if source == "fairface":
        row["adult_age_band"] = "30-39"
    if source == "ffhq_filtered":
        row["independent_original"] = True
    if source == "twin_factory":
        row["renderer_sha256"] = hashlib.sha256(b"drawn-fixture-renderer").hexdigest()
    return row


@dataclass(frozen=True)
class DrawnCorpus:
    root: Path
    photos: Path
    rights: Path
    approved: Path
    plan: TrainingPlan
    records: list[dict[str, Any]] = field(default_factory=list)

    def source_file(self) -> Path:
        return self.root / "source.jsonl"

    def write_source(self, rows: list[dict[str, Any]]) -> Path:
        path = self.source_file()
        path.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
        return path


def make_corpus(
    root: Path,
    *,
    size: int = 48,
    plan: TrainingPlan = FIXTURE_PLAN,
    revocations: Path | None = None,
) -> DrawnCorpus:
    """Draw ``size`` cleared records over several sources and ingest them."""
    root.mkdir(parents=True, exist_ok=True)
    corpus = DrawnCorpus(
        root, root / "photos", root / "rights", root / "approved", plan, [],
    )
    for index in range(size):
        source, licence = SOURCE_CYCLE[index % len(SOURCE_CYCLE)]
        corpus.records.append(
            draw_record(corpus.photos, corpus.rights, index, source=source, licence=licence),
        )
    report = ingest(
        corpus.write_source(corpus.records), corpus.photos, corpus.rights, corpus.approved,
        plan=plan, revocations=revocations,
    )
    if report.accepted != size or report.rejected:
        raise AssertionError("drawn fixture corpus was not fully admitted")
    return corpus


def synthetic_grant(index: int, *, group: str = "slice_a") -> ImageGrant:
    """A manifest-only grant (no image file) for audits run without image bytes."""
    source, licence = SOURCE_CYCLE[index % len(SOURCE_CYCLE)]
    return ImageGrant(
        f"synthetic-{index:07d}.png",
        hashlib.sha256(f"synthetic-image-{index}".encode()).hexdigest(),
        hashlib.sha256(f"synthetic-subject-{index}".encode()).hexdigest(),
        source, licence, group,
    )


def write_manifests(
    approved: Path,
    grants: list[ImageGrant],
    plan: TrainingPlan,
    *,
    revocations_sha256: str | None = None,
) -> None:
    """Write approved splits and a matching ingest summary, as ingest would.

    Grants are placed in the split their subject partitions to. Used to build
    audit inputs far larger than drawn-image fixtures allow.
    """
    approved.mkdir(parents=True, exist_ok=True, mode=0o700)
    lines: dict[str, list[str]] = {"train": [], "eval": []}
    for grant in grants:
        split = partition(grant.subject_key, plan.seed, plan.holdout_fraction)
        lines[split].append(json.dumps(grant.private_row(), sort_keys=True) + "\n")
    for split, rows in lines.items():
        (approved / f"{split}.jsonl").write_text("".join(rows), encoding="utf-8")
    (approved / "rejected.jsonl").write_text("", encoding="utf-8")
    summary = {
        "schema": "beljour-ingest/1",
        "digest_version": 2,
        "revocations_sha256": revocations_sha256,
        "scanned": len(grants),
        "accepted": len(grants),
        "rejected": 0,
        "reason_counts": {},
        "manifest_sha256": manifest_digest_files(approved / "train.jsonl", approved / "eval.jsonl"),
        "plan_sha256": plan.digest(),
    }
    (approved / "summary.json").write_text(json.dumps(summary, sort_keys=True), encoding="utf-8")
