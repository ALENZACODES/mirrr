"""Parallel generation for the arena: one job per face and hero filter, run in worker processes.

A full pipeline (Adaptive Strength, four Best-of-N candidates, Identity Lock, Texture Graft)
takes about 7-12 s per face and filter at 512 x 640 on one core of the build sandbox (OLD is the
slowest), so the 100-face gate set is roughly 50 minutes single-threaded. Workers write their
PNG straight into the slot (one file per job, no shared state) and return the trace line.
Author: John Khan.
"""
from __future__ import annotations

import json
import os
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from . import producers, weapons
from .slots import Slots


@dataclass(frozen=True)
class Job:
    root: str
    slot: str
    face_id: str
    filter: str
    row: dict[str, str]
    image_path: str
    points: list[list[float]]  # landmarks in pixels of the working image
    working_side: int
    seed: int
    weapons: bool


def _working(path: str, side: int) -> np.ndarray:
    from PIL import Image

    from .slots import load_image
    image = load_image(Path(path))
    scale = side / max(image.shape[:2])
    if scale >= 1:
        return image
    size = (round(image.shape[1] * scale), round(image.shape[0] * scale))
    return np.array(Image.fromarray(image).resize(size, Image.Resampling.LANCZOS), dtype=np.uint8)


def run_job(job: Job) -> dict[str, Any]:
    """Render one face and filter into the slot. Returns the trace (or the error) as a dict."""
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    try:
        image = _working(job.image_path, job.working_side)
        pts = np.asarray(job.points, dtype=np.float64)

        def make(overrides: dict[str, Any]) -> weapons.Renderer:
            return lambda s, seed: producers.render(job.filter, image, pts, strength=s, seed=seed, row=job.row,
                                                    overrides=overrides)

        if job.weapons:
            res = weapons.run_pipeline(image, pts, job.filter, make, seed=job.seed)
            out, trace = res.best.edit.image, res.trace()
        else:
            out, trace = make({})(1.0, job.seed).image, {"weapons": False}
        Slots(Path(job.root)).put(job.slot, job.filter, job.face_id, out)
        return {"face": job.face_id, "filter": job.filter, **trace}
    except Exception as exc:  # noqa: BLE001 - one bad face must not stop a 300-job run
        return {"face": job.face_id, "filter": job.filter, "error": f"{type(exc).__name__}: {str(exc)[:160]}"}


def run_jobs(jobs: Iterable[Job], workers: int = 1, *, on_done: Callable[[dict[str, Any]], None] | None = None
             ) -> list[dict[str, Any]]:
    todo = list(jobs)
    out: list[dict[str, Any]] = []
    if workers <= 1:
        results: Iterable[dict[str, Any]] = (run_job(j) for j in todo)
        for row in results:
            out.append(row)
            if on_done:
                on_done(row)
        return out
    import multiprocessing as mp
    with mp.get_context("spawn").Pool(workers) as pool:
        for row in pool.imap_unordered(run_job, todo, chunksize=1):
            out.append(row)
            if on_done:
                on_done(row)
    return out


def trace_line(row: dict[str, Any]) -> str:
    return json.dumps(row, default=str) + "\n"
