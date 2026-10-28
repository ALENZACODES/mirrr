"""SYNTHETIC dry run of the arena pipeline: drawn faces, a stand-in for the reference app's
outputs and scripted judges, so every step of a first real gate run can be rehearsed here.

Nothing a dry run writes is a result. Its folder carries _arena/SYNTHETIC-DRY-RUN.json before
anything else is written; capture intake refuses to mix it with real data, `arena.py results`
stamps its results file `synthetic`, `arena.py gate` reports SYNTHETIC and exits 3, `report`,
`regression` and `registry` refuse it, and the instrument panel shows such a file as refused
and keeps every real number NOT_RUN.

The pieces here are what a real run gets from outside the repository:
  * build_faces: drawn faces in the frozen-1000 layout, one per FairFace-style cell plus
    SFHQ-style and adversarial-style folders, labelled "drawn by arena/dry_run.py".
  * write_capture: a capture folder of stand-in "reference outputs" (simple drawn changes of
    the original: greyer for Older, smoother for Younger, a hue turn for Gender swap) with a
    capture.json that says synthetic.
  * judge_run: scripted judges that read the sealed key (a real judge never can) and pick our
    side with a fixed chance per filter, so the gate maths sees a PASS-like, a borderline and
    a FAIL-like filter.
Author: John Khan.
"""
from __future__ import annotations

import csv
import json
import random
from collections.abc import Mapping, Sequence
from pathlib import Path

import numpy as np

from . import constants as C
from .freeze import read_manifest
from .intake import CAPTURE_FORMAT, PRODUCER, SIDECAR, SYNTHETIC_MARKER
from .pairs import read_key
from .slots import BASELINE, ORIGINAL, Slots, load_image, save_png
from .synthetic import SKIN_TONES, drawn_face

LABEL = "SYNTHETIC dry run: drawn faces, stand-in reference outputs and scripted judges; never a result"
SOURCE = "drawn by arena/dry_run.py"
FACE_SIZE = (120, 144)
# Chance that a scripted judge prefers our side, per filter (ASSUMED, only to exercise the maths).
OUR_SIDE_CHANCE = {"old": 0.7, "young": 0.52, "gender_swap": 0.35}


def mark(root: Path) -> Path:
    marker = root / C.ARENA_DIR / SYNTHETIC_MARKER
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text(json.dumps({"format": "beljour-dry-run/1", "label": LABEL}, indent=1) + "\n", encoding="utf-8")
    return marker


def _folder(root: Path, rel: str, rows: list[dict[str, str]]) -> Path:
    folder = root / C.FROZEN_DIR / rel
    folder.mkdir(parents=True, exist_ok=True)
    with (folder / "manifest.csv").open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=sorted({k for r in rows for k in r}))
        writer.writeheader()
        writer.writerows(rows)
    return folder


def build_faces(root: Path, *, per_cell: int = 1, sfhq: int = 20, adversarial: int = 10) -> dict[str, np.ndarray]:
    """Draw the faces and their manifests. Returns drawn landmark points by frozen-relative path."""
    if root.is_dir() and any(root.iterdir()):
        raise FileExistsError(f"{root} is not empty; a dry run starts from an empty folder")
    root.mkdir(parents=True, exist_ok=True)
    mark(root)
    tones = list(SKIN_TONES)
    plan: list[tuple[str, dict[str, str]]] = []
    for race in C.FAIRFACE_RACES:
        for gender in C.FAIRFACE_GENDERS:
            for band in C.ADULT_BANDS:
                age = "60-69" if band == "60+" else band
                plan += [("fairface-synthetic", {"race": race, "gender": gender, "age_band": age})] * per_cell
    plan += [("sfhq-synthetic", {})] * sfhq
    plan += [("adversarial/synthetic", {"tags": C.ADVERSARIAL_TAGS[i % len(C.ADVERSARIAL_TAGS)],
                                        "gender": "Female" if i % 2 else ""}) for i in range(adversarial)]
    points: dict[str, np.ndarray] = {}
    manifests: dict[str, list[dict[str, str]]] = {}
    for seed, (rel, labels) in enumerate(plan, 1):
        face = drawn_face(tones[seed % len(tones)], seed=seed, width=FACE_SIZE[0], height=FACE_SIZE[1], freckles=4)
        name = f"drawn_{seed:04d}.png"
        manifests.setdefault(rel, []).append({"file": name, "source": SOURCE, "licence": "Own work (synthetic)",
                                              "attribution": SOURCE, **labels})
        save_png(root / C.FROZEN_DIR / rel / name, face.image)
        points[f"{rel}/{name}"] = face.points
    for rel, rows in manifests.items():
        _folder(root, rel, rows)
    return points


def cache_landmarks(root: Path, points: Mapping[str, np.ndarray]) -> int:
    """Store the drawn points in the arena's landmark cache (normalised, keyed by face ID)."""
    written = 0
    for row in read_manifest(root):
        pts = points.get(row["rel_path"])
        if pts is None:
            continue
        target = root / C.ARENA_DIR / "landmarks" / f"{row['face_id']}.npy"
        target.parent.mkdir(parents=True, exist_ok=True)
        np.save(target, np.asarray(pts, dtype=np.float64)[:, :2] / np.array([float(row["width"]), float(row["height"])]))
        written += 1
    return written


def stand_in(image: np.ndarray, filter_name: str) -> np.ndarray:
    """A simple drawn change of the original, standing in for a reference output."""
    rgb = image.astype(np.float64)
    if filter_name == "old":
        grey = rgb.mean(axis=2, keepdims=True)
        out = 0.7 * rgb + 0.3 * grey - 6
    elif filter_name == "young":
        padded = np.pad(rgb, ((1, 1), (1, 1), (0, 0)), mode="edge")
        out = np.mean([padded[dy:dy + rgb.shape[0], dx:dx + rgb.shape[1]] for dy in range(3) for dx in range(3)], axis=0) + 4
    else:
        out = rgb[..., [1, 2, 0]] * 0.25 + rgb * 0.75
    return np.clip(np.rint(out), 0, 255).astype(np.uint8)


def write_capture(root: Path, target: Path, filters: Sequence[str] = C.FILTERS) -> int:
    """Stand-in reference outputs for the sealed block, with a synthetic capture.json."""
    slots = Slots(root)
    target.mkdir(parents=True, exist_ok=True)
    count = 0
    for fid, row in slots.rows.items():
        if row.get("baseline") != "1":
            continue
        for filt in filters:
            if filt == "gender_swap" and row.get("gender", "").lower() not in ("male", "female"):
                continue
            save_png(target / f"{fid}_{filt}.png", stand_in(load_image(slots.path(ORIGINAL, filt, fid)), filt))
            count += 1
    sidecar = {"format": CAPTURE_FORMAT, "producer": PRODUCER, "synthetic": True, "app_version": "SYNTHETIC",
               "tier": "SYNTHETIC", "settings": "default", "device": "none (drawn by arena/dry_run.py)",
               "captured_by": "arena/dry_run.py", "captured_on": "2026-01-01", "terms_reviewed": True,
               "terms_note": LABEL, "adults_only": True,
               "third_party_upload": {s: True for s in C.SETS}}
    (target / SIDECAR).write_text(json.dumps(sidecar, indent=1) + "\n", encoding="utf-8")
    return count


def judge_run(root: Path, run_id: str, *, seed: int = 5) -> int:
    """Scripted judgements for every assignment of a run, one JSONL file per bundle."""
    key = read_key(root / C.ARENA_DIR / "runs" / run_id)
    out = root / C.ARENA_DIR / "runs" / run_id / "judgements"
    out.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    by_judge: dict[int, list[str]] = {}
    for aid, row in sorted(key.items()):
        ours = row["a"] if row["a"] not in (BASELINE, ORIGINAL) else row["b"]
        chance = OUR_SIDE_CHANCE.get(row["filter"], 0.5) if BASELINE in (row["a"], row["b"]) else 0.8
        winner_slot = ours if rng.random() < chance else (row["b"] if ours == row["a"] else row["a"])
        record = {"format": "beljour-judgement/1", "assignment": aid, "judge": f"synthetic-judge-{row['judge_slot'] + 1:02d}",
                  "kind": "human", "winner": "A" if winner_slot == row["a"] else "B",
                  "reason": C.REASONS[rng.randrange(len(C.REASONS))], "woman_judge": row["judge_slot"] % 2 == 0,
                  "at": "2026-01-01T00:00:00+00:00"}
        by_judge.setdefault(row["judge_slot"], []).append(json.dumps(record, sort_keys=True))
    for judge, lines in by_judge.items():
        (out / f"synthetic-judge-{judge + 1:02d}.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return sum(len(v) for v in by_judge.values())
