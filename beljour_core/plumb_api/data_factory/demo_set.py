"""Writes a small drawn data set that exercises every pipeline stage.

The folder gets drawn images, an intake JSONL, a deny-list of a made-up
source and a config. The mix: distinct portraits, exact and near copies, a
blocked licence, a denied source, a missing consent flag, a blurred image, a
corrupted file and a CMYK file. `DemoSet` says what each stage should do, so
tests and the README walk-through can check the run.
Author: John Khan.
"""

from __future__ import annotations

import io
import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image

from .cli import starter_config
from .licence import DenyList
from .records import AGE_BANDS, LIGHTING, POSE_BUCKETS, SKIN_TONE_GROUPS
from .synthetic import blurred, brightened, cropped, jpeg_roundtrip, portrait, to_jpeg, to_png

DENIED_SOURCE = "Hollow Pine Archive"
OWN_SOURCE = "beljour-studio-shoot"


@dataclass
class DemoSet:
    """Paths of the written set and the expected reject counts."""

    root: Path
    config_path: Path
    intake_path: Path
    distinct: int
    expected_rejects: dict[str, dict[str, int]] = field(default_factory=dict)

    @property
    def expected_final(self) -> int:
        """Records that should reach the manifest without balancing."""
        return self.distinct


def _row(rel: str, index: int, rng: random.Random, **changes: Any) -> dict[str, Any]:
    row: dict[str, Any] = {
        "path": rel,
        "source": OWN_SOURCE,
        "licence": "CC0-1.0",
        "attribution": "",
        "commercial_use": True,
        "consent": True,
        "age_band": AGE_BANDS[index % len(AGE_BANDS)],
        "skin_tone_group": SKIN_TONE_GROUPS[index % len(SKIN_TONE_GROUPS)],
        "lighting": LIGHTING[index % len(LIGHTING)],
        "pose_bucket": rng.choice(POSE_BUCKETS),
    }
    row.update(changes)
    return row


def _cmyk_jpeg() -> bytes:
    buffer = io.BytesIO()
    Image.new("CMYK", (300, 300), (10, 80, 120, 0)).save(buffer, format="JPEG")
    return buffer.getvalue()


def write_demo_set(root: Path, *, distinct: int = 12, size: int = 320,
                   seed: int = 2026) -> DemoSet:
    """Write the demo set into root (created if needed) and return its description."""
    rng = random.Random(seed)
    images = root / "images"
    images.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, Any]] = []

    def add(name: str, data: bytes, index: int, **changes: Any) -> None:
        (images / name).write_bytes(data)
        rows.append(_row(name, index, rng, **changes))

    for index in range(distinct):
        add(f"face-{index:03d}.png", to_png(portrait(seed + index, size)), index)
    base = portrait(seed, size)
    add("copy-exact.png", to_png(base), 0, source="beljour-partner-batch")
    add("copy-jpeg.jpg", to_jpeg(jpeg_roundtrip(base, 70), 90), 0)
    add("copy-crop.png", to_png(cropped(portrait(seed + 1, size), 0.02)), 1)
    add("copy-bright.png", to_png(brightened(portrait(seed + 2, size), 1.1)), 2)
    add("blocked-licence.png", to_png(portrait(seed + 500, size)), 3, licence="CC-BY-NC-4.0")
    add("denied-source.png", to_png(portrait(seed + 501, size)), 4, source=DENIED_SOURCE)
    add("no-consent.png", to_png(portrait(seed + 502, size)), 5, consent=False)
    add("blurred.png", to_png(blurred(portrait(seed + 503, size), 8)), 6)
    add("corrupted.png", to_png(portrait(seed + 504, size))[:200], 7)
    add("cmyk.jpg", _cmyk_jpeg(), 8)
    rows.append(_row("missing-file.png", 9, rng))
    deny_path = root / "deny.json"
    deny_path.write_text(json.dumps(DenyList.from_names([DENIED_SOURCE]).to_json()),
                         encoding="utf-8")
    intake = root / "intake.jsonl"
    intake.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows),
                      encoding="utf-8")
    config = starter_config("intake.jsonl", "images", "demo-set")
    config["licence"] = {"denylist_path": "deny.json", "extra_allowed": [],
                         "require_consent": True, "use_builtin_denylist": True}
    config["manifest"] = {"shards": 4, "gzip": False}
    config_path = root / "config.json"
    config_path.write_text(json.dumps(config, indent=1) + "\n", encoding="utf-8")
    return DemoSet(root, config_path, intake, distinct, {
        "ingest": {"path-unsafe-or-missing": 1, "image-cmyk": 1},
        "licence": {"licence-blocked": 1, "source-denied": 1, "consent-missing": 1},
        "exact_dedup": {"exact-duplicate": 1},
        "quality": {"image-corrupted": 1, "quality-below-threshold": 1},
        "near_dedup": {"near-duplicate": 3},
    })
