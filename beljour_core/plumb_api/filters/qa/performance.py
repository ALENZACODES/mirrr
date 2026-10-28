"""Reproducible synthetic timing of the Still Her face-input reuse path.

The A4 gate has two distinct costs: one-time original-face preparation and
per-recipe execution. This comparator measures both and checks that each
report retains the same exact JSON bytes as the uncached implementation.
Results are diagnostic local measurements only. They are **not** real-face
quality evidence or a 100,000-face runtime forecast. No images are returned,
logged, written or retained after the call. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import statistics
import time
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass
from typing import Any

from .. import engine
from . import fixtures as F
from . import still_her as SH


@dataclass(frozen=True)
class RecipeTiming:
    """Measured wall-clock times with a deterministic report-content check."""

    recipe: str
    trials: int
    legacy_median_ms: float
    cached_median_ms: float
    ratio: float | None
    byte_identical: bool
    content_digest: str


@dataclass(frozen=True)
class SpeedRun:
    """Only aggregate measurements; no photographs or mesh coordinates."""

    mode: str
    face_count: int
    recipe_count: int
    repeats: int
    face_preparation_ms: float
    rows: tuple[RecipeTiming, ...]

    @property
    def passed(self) -> bool:
        return bool(self.rows) and all(row.byte_identical for row in self.rows)

    def to_dict(self) -> dict[str, Any]:
        """JSON suitable for internal diagnostics; every number was measured."""
        return {**asdict(self), "passed": self.passed}


def _report_bytes(report: SH.ToneReport) -> bytes:
    """Include all fields and flag order, not just one summary metric."""
    return json.dumps(asdict(report), sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("utf-8")


def _measure(recipe: Mapping[str, Any], photo: F.Portrait,
             original: SH.FaceInputs | None,
             centre: tuple[float, float] | None) -> SH.ToneReport:
    return SH.measure_image(recipe, photo.image, photo.face.points, photo.masks,
                            photo.face.tone, face_centre=centre, inputs=original)


def compare(faces: Sequence[F.Portrait], recipes: Sequence[Mapping[str, Any]], *,
            repeats: int = 1, warm_luts: bool = True) -> SpeedRun:
    """Compare legacy vs prepared paths, alternating test order to limit bias.

    The original-face features are computed once before recipe timings, as in
    the production A4 bench. LUT baking is independently warmed once per recipe
    unless disabled, so it cannot be mistaken for a benefit of this cache.
    Each trial compares complete output rows byte for byte, with no tolerance.
    Use a fixed seed and explicit recipe list when comparing across machines.
    """
    if isinstance(repeats, bool) or not isinstance(repeats, int) or not 1 <= repeats <= 5:
        raise ValueError("repeats must be 1..5")
    if not 1 <= len(faces) <= 12:
        raise ValueError("synthetic face benchmark requires 1..12 drawn fixtures")
    if not 1 <= len(recipes) <= 100:
        raise ValueError("recipe count must be 1..100")
    ids = [str(recipe["id"]) for recipe in recipes]
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate recipe IDs are not a meaningful benchmark")
    # Prepare once per face, including the face-oval centre. Never allocate a
    # second coordinate grid for the benchmark or its LUT warm-up.
    start = time.perf_counter()
    prepared = [SH.prepare_face(face.image, face.face.points, face.masks) for face in faces]
    preparation_ms = (time.perf_counter() - start) * 1000.0
    centres = [source.face_centre for source in prepared]
    if warm_luts:
        # Do not put expensive LUT bake cost on just the first leg of a pair.
        for recipe in recipes:
            first = faces[0]
            engine.render(first.image, recipe, masks=first.masks,
                          face_centre=centres[0])
    elapsed: dict[str, dict[str, list[float]]] = {
        rid: {"legacy": [], "cached": []} for rid in ids
    }
    matching: dict[str, bool] = {rid: True for rid in ids}
    digests: dict[str, Any] = {rid: hashlib.sha256() for rid in ids}
    for face_index, face in enumerate(faces):
        source = prepared[face_index]
        centre = centres[face_index]
        for cycle in range(repeats):
            for recipe, rid in zip(recipes, ids, strict=True):
                observed: dict[str, bytes] = {}
                order = ("legacy", "cached") if (cycle + face_index) % 2 == 0 else ("cached", "legacy")
                for mode in order:
                    t0 = time.perf_counter()
                    report = _measure(recipe, face, None if mode == "legacy" else source, centre)
                    elapsed[rid][mode].append((time.perf_counter() - t0) * 1000.0)
                    observed[mode] = _report_bytes(report)
                matching[rid] &= observed["legacy"] == observed["cached"]
                # Only report hashes survive this scope. The hash is never a face ID.
                digests[rid].update(observed["cached"])
    rows: list[RecipeTiming] = []
    for rid in ids:
        old = statistics.median(elapsed[rid]["legacy"])
        new = statistics.median(elapsed[rid]["cached"])
        rows.append(RecipeTiming(rid, len(elapsed[rid]["cached"]), old, new,
                                 old / new if new > 0 else None, matching[rid], digests[rid].hexdigest()))
    return SpeedRun("synthetic_only", len(faces), len(recipes), repeats, preparation_ms, tuple(rows))
