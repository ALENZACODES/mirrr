"""A throwaway test-faces folder made of drawn faces, for the arena tests.

Mirrors the box layout (frozen-1000/<set>/ with a manifest.csv per folder) at a small scale.
Every image is drawn by code (arena/synthetic.py); no photo is used. Author: John Khan.
"""
from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

from plumb_api.arena import constants as C
from plumb_api.arena.synthetic import SKIN_TONES, drawn_face

TONES = list(SKIN_TONES)


def _write(folder: Path, rows: list[dict[str, str]]) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    fields = sorted({k for r in rows for k in r})
    with (folder / "manifest.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def _save(path: Path, seed: int, tone: str, size: tuple[int, int] = (96, 116)) -> np.ndarray:
    from PIL import Image
    face = drawn_face(tone, seed=seed, width=size[0], height=size[1], freckles=6)
    Image.fromarray(face.image).save(path)
    return face.points


def build(root: Path, *, per_cell: int = 1, sfhq: int = 6, adversarial_tags: tuple[str, ...] = ("glasses", "beard", "hijab", "side_profile"),
          minors: int = 2, landmarks: bool = True) -> Path:
    """Write a small frozen-1000 tree under `root` and return `root`."""
    frozen = root / C.FROZEN_DIR
    seed = 1
    rows: list[dict[str, str]] = []
    points: dict[str, np.ndarray] = {}
    ff = frozen / "fairface-ccby4"
    ff.mkdir(parents=True, exist_ok=True)
    bins = {"20-29": "20-29", "30-39": "30-39", "40-49": "40-49", "50-59": "50-59", "60+": "60-69"}
    for race in C.FAIRFACE_RACES:
        for gender in C.FAIRFACE_GENDERS:
            for band in C.ADULT_BANDS:
                for k in range(per_cell):
                    name = f"ff_{seed:04d}.png"
                    points[f"fairface-ccby4/{name}"] = _save(ff / name, seed, TONES[seed % len(TONES)])
                    rows.append({"file": name, "source": "FairFace", "licence": "CC BY 4.0", "race": race,
                                 "gender": gender, "age_band": bins[band] if k == 0 else "more than 70" if band == "60+" else bins[band]})
                    seed += 1
    for i in range(minors):
        name = f"ff_minor_{i}.png"
        _save(ff / name, seed, "medium")
        rows.append({"file": name, "source": "FairFace", "licence": "CC BY 4.0", "race": "White", "gender": "Female", "age_band": "10-19"})
        seed += 1
    _write(ff, rows)
    sf = frozen / "sfhq"
    srows = []
    sf.mkdir(parents=True, exist_ok=True)
    for i in range(sfhq):
        name = f"sfhq_{i}.png"
        points[f"sfhq/{name}"] = _save(sf / name, seed, TONES[i % len(TONES)])
        srows.append({"file": name, "source": "SFHQ part 1", "licence": "CC0 (dataset), MIT (repo)"})
        seed += 1
    _write(sf, srows)
    adv = frozen / "adversarial" / "stocksnap"
    arows = []
    adv.mkdir(parents=True, exist_ok=True)
    for i, tag in enumerate(adversarial_tags):
        name = f"adv_{i}.png"
        points[f"adversarial/stocksnap/{name}"] = _save(adv / name, seed, TONES[(i + 2) % len(TONES)])
        arows.append({"file": name, "source": "StockSnap", "licence": "CC0", "slice": tag.replace("_", " "),
                      "gender": "Female" if i % 2 == 0 else ""})
        seed += 1
    _write(adv, arows)
    if landmarks:
        (root / "_drawn_points").mkdir(exist_ok=True)
        for rel, pts in points.items():
            np.save(root / "_drawn_points" / (rel.replace("/", "__") + ".npy"), pts)
    return root


def cache_landmarks(root: Path) -> int:
    """After freezing: copy the drawn landmark points into the arena landmark cache
    (normalised, as scripts/arena.py stores them), keyed by face ID."""
    from plumb_api.arena.freeze import read_manifest
    n = 0
    for row in read_manifest(root):
        src = root / "_drawn_points" / (row["rel_path"].replace("/", "__") + ".npy")
        if src.is_file():
            pts = np.load(src)
            w, h = int(row["width"]), int(row["height"])
            out = root / C.ARENA_DIR / "landmarks" / f"{row['face_id']}.npy"
            out.parent.mkdir(parents=True, exist_ok=True)
            np.save(out, pts / np.array([w, h]))
            n += 1
    return n
