"""Build, order, hash and verify the frozen 1,000-face test set (master command v1, "Test set").

Reads the licence-segregated folders under test-faces/frozen-1000/ (FairFace, SFHQ,
adversarial) and their per-folder manifest.csv files, picks

  * 700 FairFace faces split equally over race x gender x adult age band (7 x 2 x 5 = 70 cells
    of 10; faces labelled under 20 are left out because the app is for adults),
  * 200 SFHQ faces,
  * 100 adversarial faces balanced over the fifteen slice tags,

then writes frozen-1000/manifest.csv (one row per face: id, source, licence, slice, hash) and
frozen-1000/frozen.lock (the hash list). Both files sit beside the faces, outside the repo.

The first 100 face IDs are the reference app baseline block: one FairFace face per cell, 20 SFHQ and
10 adversarial faces with different tags, so the comparison set covers every slice.

A lock is append-only: a new version keeps every earlier face, its ID and its position, and
can only add faces (for example the 17 adversarial faces still missing). Nothing here copies
an image into the repo or prints a face. Author: John Khan.
"""
from __future__ import annotations

import csv
import datetime as _dt
import hashlib
import json
import random
import shutil
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field, replace
from pathlib import Path, PurePosixPath

from . import constants as C

LOCK_FORMAT = "beljour-frozen-lock/1"
MANIFEST_NAME = "manifest.csv"
LOCK_NAME = "frozen.lock"
MANIFEST_FIELDS = ("face_id", "order", "baseline", "set", "source", "licence", "attribution", "rel_path",
                   "sha256", "bytes", "width", "height", "race", "gender", "age_bin", "age_band", "tags",
                   "slice", "flags")
FLAGS = {
    "fairface": "internal benchmark only; never displayed; attribution required",
    "sfhq": "provenance review before production training",
    "adversarial": "internal benchmark only; per-row licence",
}
FAIRFACE_ATTRIBUTION = "FairFace - Karkkainen & Joo, WACV 2021, CC BY 4.0"


class FreezeError(RuntimeError):
    """The set can't be frozen as asked (banned source, lock exists, changed faces, ...)."""


@dataclass(frozen=True)
class Candidate:
    rel_path: str
    set: str
    source: str
    licence: str
    sha256: str
    size: int
    race: str = ""
    gender: str = ""
    age_bin: str = ""
    tags: tuple[str, ...] = ()
    attribution: str = ""
    width: int = 0
    height: int = 0

    @property
    def age_band(self) -> str:
        return C.FAIRFACE_AGE_TO_BAND.get(self.age_bin, "")

    @property
    def cell(self) -> tuple[str, str, str]:
        return (self.race, self.gender, self.age_band)

    @property
    def slice(self) -> str:
        if self.set == "fairface":
            return f"{self.race}|{self.gender}|{self.age_band}"
        if self.set == "adversarial":
            return "adv:" + (self.tags[0] if self.tags else "untagged")
        return self.set


@dataclass
class Scan:
    """What the folders hold, before selection, and why anything was left out."""
    candidates: list[Candidate] = field(default_factory=list)
    excluded: dict[str, list[str]] = field(default_factory=dict)

    def exclude(self, why: str, rel: str) -> None:
        self.excluded.setdefault(why, []).append(rel)


@dataclass
class Selection:
    faces: list[Candidate]
    shortfall: dict[str, int]
    notes: list[str]


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _column(row: dict[str, str], *names: str) -> str:
    for name in names:
        value = row.get(name)
        if value:
            return value.strip()
    return ""


def classify_set(rel: Path) -> str | None:
    parts = [p.lower() for p in rel.parts]
    if any("adversarial" in p for p in parts):
        return "adversarial"
    if any("fairface" in p for p in parts):
        return "fairface"
    if any("sfhq" in p for p in parts):
        return "sfhq"
    return None


def banned_reason(*texts: str) -> str | None:
    joined = " ".join(t.lower() for t in texts if t)
    for name in C.BANNED_SOURCES:
        if name in joined:
            return name
    return None


def _image_size(path: Path, decode: bool) -> tuple[int, int] | None:
    if not decode:
        return (0, 0)
    try:
        from PIL import Image
    except ImportError:  # the bench installs Pillow; without it sizes are left at 0
        return (0, 0)
    try:
        with Image.open(path) as img:
            img.verify()
        with Image.open(path) as img:
            return img.size
    except Exception:  # noqa: BLE001 - an unreadable image is excluded, not a crash
        return None


def _tags(row: dict[str, str]) -> tuple[str, ...]:
    raw = _column(row, "tags", "slice", "slices", "adversarial_tag")
    out: list[str] = []
    for part in raw.replace("|", ";").replace(",", ";").split(";"):
        tag = C.canonical_tag(part)
        if tag and tag not in out:
            out.append(tag)
    return tuple(out)


def _rows(folder: Path) -> dict[str, dict[str, str]]:
    manifest = folder / MANIFEST_NAME
    rows: dict[str, dict[str, str]] = {}
    if manifest.is_file():
        with manifest.open(newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                name = _column(row, "file", "filename", "name")
                if name:
                    rows[Path(name).name] = row
    return rows


def scan(root: Path, *, decode: bool = True) -> Scan:
    """Every image under frozen-1000/, labelled from its folder's manifest.csv."""
    frozen = root / C.FROZEN_DIR
    out = Scan()
    if not frozen.is_dir():
        raise FreezeError(f"no {C.FROZEN_DIR} folder under {root}")
    seen: dict[str, str] = {}
    for folder in sorted({p.parent for p in frozen.rglob("*") if p.suffix.lower() in C.IMAGE_EXTS}):
        rel_folder = folder.relative_to(frozen)
        if any(part.startswith("_") or part in {"landmarks", "segmentations"} for part in rel_folder.parts):
            continue
        labels = _rows(folder)
        for path in sorted(folder.iterdir()):
            if path.suffix.lower() not in C.IMAGE_EXTS or not path.is_file():
                continue
            rel = path.relative_to(frozen).as_posix()
            row = labels.get(path.name, {})
            source = _column(row, "source") or folder.name
            licence = _column(row, "licence", "license")
            ban = banned_reason(rel, source, licence, _column(row, "origin", "url", "landing_page"))
            if ban:
                raise FreezeError(f"{rel}: banned source '{ban}' found; remove it before freezing")
            kind = classify_set(Path(rel))
            if kind is None:
                out.exclude("not in a fairface, sfhq or adversarial folder", rel)
                continue
            if not row:
                out.exclude("no manifest.csv row", rel)
                continue
            if not licence:
                out.exclude("no licence in manifest.csv", rel)
                continue
            digest = sha256_file(path)
            if digest in seen:
                out.exclude(f"duplicate of {seen[digest]}", rel)
                continue
            size = _image_size(path, decode)
            if size is None:
                out.exclude("unreadable image", rel)
                continue
            age_bin = _column(row, "age_band", "age", "age_bin")
            cand = Candidate(rel, kind, source, licence, digest, path.stat().st_size,
                             race=_column(row, "race"), gender=_column(row, "gender").capitalize(),
                             age_bin=age_bin, tags=_tags(row) if kind == "adversarial" else (),
                             attribution=_column(row, "attribution", "credit") or
                             (FAIRFACE_ATTRIBUTION if "fairface" in source.lower() or kind == "fairface" else ""),
                             width=size[0], height=size[1])
            if kind == "fairface":
                if age_bin in C.MINOR_AGE_BINS:
                    out.exclude("labelled under 20 (adults only)", rel)
                    continue
                if cand.race not in C.FAIRFACE_RACES or cand.gender not in C.FAIRFACE_GENDERS or not cand.age_band:
                    out.exclude("FairFace label missing or unknown", rel)
                    continue
            seen[digest] = rel
            out.candidates.append(cand)
    return out


def fairface_cells() -> list[tuple[str, str, str]]:
    return [(r, g, b) for r in C.FAIRFACE_RACES for g in C.FAIRFACE_GENDERS for b in C.ADULT_BANDS]


def _pick(items: Sequence[Candidate], n: int, rng: random.Random) -> list[Candidate]:
    ordered = sorted(items, key=lambda c: c.sha256)
    rng.shuffle(ordered)
    return ordered[:n]


def select(candidates: Iterable[Candidate], *, seed: int = 20261023,
           counts: tuple[int, int, int] = (C.FAIRFACE_COUNT, C.SFHQ_COUNT, C.ADVERSARIAL_COUNT)) -> Selection:
    """Choose the faces. Strictly equal FairFace cells: a short cell is reported, never padded
    from another cell, so no group is over-represented."""
    rng = random.Random(seed)
    pool = list(candidates)
    by_set: dict[str, list[Candidate]] = {s: [c for c in pool if c.set == s] for s in C.SETS}
    shortfall: dict[str, int] = {}
    notes: list[str] = []
    n_ff, n_sfhq, n_adv = counts
    cells = fairface_cells()
    per_cell = n_ff // len(cells)
    if per_cell * len(cells) != n_ff:
        notes.append(f"FairFace count {n_ff} is not a multiple of {len(cells)} cells; using {per_cell} per cell")
    chosen_ff: list[Candidate] = []
    for cell in cells:
        members = [c for c in by_set["fairface"] if c.cell == cell]
        got = _pick(members, per_cell, rng)
        if len(got) < per_cell:
            shortfall["fairface:" + "|".join(cell)] = per_cell - len(got)
        chosen_ff.extend(got)
    chosen_sfhq = _pick(by_set["sfhq"], n_sfhq, rng)
    if len(chosen_sfhq) < n_sfhq:
        shortfall["sfhq"] = n_sfhq - len(chosen_sfhq)
    chosen_adv = balanced_by_tag(by_set["adversarial"], n_adv, rng)
    if len(chosen_adv) < n_adv:
        shortfall["adversarial"] = n_adv - len(chosen_adv)
    tag_counts = {t: sum(1 for c in chosen_adv if c.tags and c.tags[0] == t) for t in C.ADVERSARIAL_TAGS}
    empty = [t for t, n in tag_counts.items() if n == 0]
    if empty:
        notes.append("adversarial tags with no face: " + ", ".join(empty))
    return Selection(chosen_ff + chosen_sfhq + chosen_adv, shortfall, notes)


def balanced_by_tag(items: Sequence[Candidate], n: int, rng: random.Random) -> list[Candidate]:
    """Round-robin over primary tags (the first tag of each face) so no slice dominates."""
    groups: dict[str, list[Candidate]] = {}
    for cand in sorted(items, key=lambda c: c.sha256):
        groups.setdefault(cand.tags[0] if cand.tags else "untagged", []).append(cand)
    for members in groups.values():
        rng.shuffle(members)
    order = [t for t in C.ADVERSARIAL_TAGS if t in groups] + sorted(t for t in groups if t not in C.ADVERSARIAL_TAGS)
    out: list[Candidate] = []
    while len(out) < n and any(groups[t] for t in order):
        for tag in order:
            if groups[tag] and len(out) < n:
                out.append(groups[tag].pop())
    return out


def order_faces(faces: Sequence[Candidate], *, seed: int = 20261023, baseline: int = C.BASELINE_COUNT) -> list[Candidate]:
    """Put the baseline block first (one FairFace per cell, 20 SFHQ, 10 adversarial with
    different tags; topped up round-robin by set if short), then the rest interleaved."""
    rng = random.Random(seed + 1)
    remaining = sorted(faces, key=lambda c: c.sha256)
    rng.shuffle(remaining)
    block: list[Candidate] = []

    def take(pred) -> None:  # type: ignore[no-untyped-def]
        for cand in remaining:
            if pred(cand):
                block.append(cand)
                remaining.remove(cand)
                return

    for cell in fairface_cells():
        take(lambda c, cell=cell: c.set == "fairface" and c.cell == cell)
    share_sfhq = round(baseline * 0.2)
    for _ in range(share_sfhq):
        take(lambda c: c.set == "sfhq")
    used_tags: set[str] = set()
    for _ in range(baseline - len(block)):
        before = len(block)
        take(lambda c: c.set == "adversarial" and bool(c.tags) and c.tags[0] not in used_tags)
        if len(block) > before:
            used_tags.add(block[-1].tags[0])
    while len(block) < baseline and remaining:
        progressed = False
        for kind in C.SETS:
            if len(block) >= baseline:
                break
            before = len(block)
            take(lambda c, kind=kind: c.set == kind)
            progressed = progressed or len(block) > before
        if not progressed:
            break
    block = block[:baseline]
    # interleave the rest by slice so any prefix of the order is roughly balanced
    by_slice: dict[str, list[Candidate]] = {}
    for cand in remaining:
        by_slice.setdefault(cand.slice, []).append(cand)
    keys = sorted(by_slice)
    rng.shuffle(keys)
    tail: list[Candidate] = []
    while any(by_slice[k] for k in keys):
        for k in keys:
            if by_slice[k]:
                tail.append(by_slice[k].pop(0))
    return block + tail


def face_id(index: int) -> str:
    return f"LG{index:04d}"


def manifest_rows(ordered: Sequence[Candidate], *, baseline: int = C.BASELINE_COUNT,
                  start: int = 1) -> list[dict[str, str]]:
    rows = []
    for i, cand in enumerate(ordered, start):
        rows.append({
            "face_id": face_id(i), "order": str(i), "baseline": "1" if i <= baseline else "0",
            "set": cand.set, "source": cand.source, "licence": cand.licence, "attribution": cand.attribution,
            "rel_path": cand.rel_path, "sha256": cand.sha256, "bytes": str(cand.size), "width": str(cand.width),
            "height": str(cand.height), "race": cand.race, "gender": cand.gender, "age_bin": cand.age_bin,
            "age_band": cand.age_band, "tags": ";".join(cand.tags), "slice": cand.slice, "flags": FLAGS[cand.set],
        })
    return rows


def _canonical(faces: Sequence[dict[str, str]]) -> str:
    return hashlib.sha256(json.dumps([[f["face_id"], f["sha256"], f["rel_path"]] for f in faces],
                                     separators=(",", ":")).encode()).hexdigest()


def write_manifest(path: Path, rows: Sequence[dict[str, str]]) -> str:
    tmp = path.with_suffix(".csv.tmp")
    with tmp.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=MANIFEST_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    tmp.replace(path)
    return sha256_file(path)


def read_manifest(root: Path) -> list[dict[str, str]]:
    path = root / C.FROZEN_DIR / MANIFEST_NAME
    if not path.is_file():
        raise FreezeError(f"no frozen manifest at {path}; run the freeze first")
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def read_lock(root: Path) -> dict | None:
    path = root / C.FROZEN_DIR / LOCK_NAME
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def freeze(root: Path, *, seed: int = 20261023, new_version: bool = False, decode: bool = True,
           now: str | None = None, counts: tuple[int, int, int] | None = None) -> dict:
    """Freeze (or extend) the set and return the lock. Raises if a lock exists and
    `new_version` is not set, or if a locked face changed or disappeared."""
    frozen = root / C.FROZEN_DIR
    previous = read_lock(root)
    if previous and not new_version:
        raise FreezeError("frozen.lock exists; the set is frozen. Use a new version to add faces")
    found = scan(root, decode=decode)
    targets = counts or (C.FAIRFACE_COUNT, C.SFHQ_COUNT, C.ADVERSARIAL_COUNT)
    if previous:
        old_rows = read_manifest(root)
        problems = verify(root)
        if problems:
            raise FreezeError("locked faces changed: " + "; ".join(problems[:5]))
        kept_hashes = {r["sha256"] for r in old_rows}
        old = [_row_candidate(r) for r in old_rows]
        have = {s: sum(1 for c in old if c.set == s) for s in C.SETS}
        fresh = [c for c in found.candidates if c.sha256 not in kept_hashes]
        needed = [max(0, t - have[s]) for t, s in zip(targets, C.SETS, strict=True)]
        need = (needed[0], needed[1], needed[2])
        # FairFace cells must stay equal, so new FairFace faces only fill short cells.
        extra = _top_up(old, fresh, need, seed)
        rows = old_rows + manifest_rows(order_faces(extra, seed=seed + len(old_rows), baseline=0),
                                        baseline=0, start=len(old_rows) + 1)
        version = int(previous.get("version", 1)) + 1
        shortfall = _shortfall(old + extra, targets)
    else:
        picked = select(found.candidates, seed=seed, counts=targets)
        rows = manifest_rows(order_faces(picked.faces, seed=seed))
        version = 1
        shortfall = picked.shortfall
    manifest_hash = write_manifest(frozen / MANIFEST_NAME, rows)
    counts_by_set = {s: sum(1 for r in rows if r["set"] == s) for s in C.SETS}
    locked_faces = [{"face_id": r["face_id"], "sha256": r["sha256"], "rel_path": r["rel_path"]} for r in rows]
    lock = {
        "format": LOCK_FORMAT, "version": version, "seed": seed,
        "created": now or _dt.datetime.now(_dt.UTC).isoformat(timespec="seconds"),
        "counts": counts_by_set, "total": len(rows), "targets": dict(zip(C.SETS, targets, strict=True)),
        "shortfall": shortfall, "baseline_count": sum(1 for r in rows if r["baseline"] == "1"),
        "manifest_sha256": manifest_hash,
        "excluded": {why: len(paths) for why, paths in sorted(found.excluded.items())},
        "faces": locked_faces,
    }
    lock["faces_sha256"] = _canonical(locked_faces)
    tmp = frozen / (LOCK_NAME + ".tmp")
    tmp.write_text(json.dumps(lock, indent=1) + "\n", encoding="utf-8")
    tmp.replace(frozen / LOCK_NAME)
    return lock


def _row_candidate(row: dict[str, str]) -> Candidate:
    return Candidate(row["rel_path"], row["set"], row["source"], row["licence"], row["sha256"], int(row["bytes"] or 0),
                     race=row["race"], gender=row["gender"], age_bin=row["age_bin"],
                     tags=tuple(t for t in row["tags"].split(";") if t), attribution=row["attribution"],
                     width=int(row["width"] or 0), height=int(row["height"] or 0))


def _shortfall(faces: Sequence[Candidate], targets: tuple[int, int, int]) -> dict[str, int]:
    out: dict[str, int] = {}
    per_cell = targets[0] // len(fairface_cells())
    for cell in fairface_cells():
        have = sum(1 for c in faces if c.set == "fairface" and c.cell == cell)
        if have < per_cell:
            out["fairface:" + "|".join(cell)] = per_cell - have
    for name, target in zip(("sfhq", "adversarial"), targets[1:], strict=True):
        have = sum(1 for c in faces if c.set == name)
        if have < target:
            out[name] = target - have
    return out


def _top_up(old: Sequence[Candidate], fresh: Sequence[Candidate], need: tuple[int, int, int], seed: int) -> list[Candidate]:
    rng = random.Random(seed + 7)
    out: list[Candidate] = []
    per_cell = (need[0] + sum(1 for c in old if c.set == "fairface")) // len(fairface_cells()) if need[0] else 0
    for cell in fairface_cells():
        have = sum(1 for c in old if c.set == "fairface" and c.cell == cell)
        want = max(0, per_cell - have)
        out.extend(_pick([c for c in fresh if c.set == "fairface" and c.cell == cell], want, rng))
    out.extend(_pick([c for c in fresh if c.set == "sfhq"], need[1], rng))
    out.extend(balanced_by_tag([c for c in fresh if c.set == "adversarial"], need[2], rng))
    return out


def verify(root: Path) -> list[str]:
    """Problems with the frozen set on disk: missing, changed or unlisted faces, or a manifest
    that no longer matches the lock. An empty list means the set is intact."""
    return verify_directory(root / C.FROZEN_DIR)


def verify_directory(frozen: Path) -> list[str]:
    """Verify an existing named set using the unchanged arena lock format.

    The bench also has frozen-10000 and versioned sets. Verification must not
    rebuild their locks, move photographs or reinterpret their manifest labels.
    """
    path = frozen / LOCK_NAME
    if not path.is_file():
        return ["no frozen.lock"]
    try:
        lock = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return ["frozen.lock is unreadable"]
    if not isinstance(lock, dict) or lock.get("format") != LOCK_FORMAT:
        return ["unknown frozen.lock format"]
    faces = lock.get("faces")
    if not isinstance(faces, list) or not faces:
        return ["frozen.lock has no face records"]
    identities, paths = set(), set()
    for face in faces:
        if not isinstance(face, dict) or any(not isinstance(face.get(k), str) or not face[k]
                                             for k in ("face_id", "sha256", "rel_path")):
            return ["frozen.lock has a malformed face record"]
        relative = PurePosixPath(face["rel_path"])
        if (relative.is_absolute() or ".." in relative.parts or "\\" in face["rel_path"]
                or relative.as_posix() != face["rel_path"]
                or not (frozen / relative).resolve().is_relative_to(frozen.resolve())):
            return ["frozen.lock has an unsafe face path"]
        if (len(face["sha256"]) != 64 or any(c not in "0123456789abcdef" for c in face["sha256"])
                or face["face_id"] in identities or face["rel_path"] in paths):
            return ["frozen.lock has duplicate or malformed face identities"]
        identities.add(face["face_id"])
        paths.add(face["rel_path"])
    problems: list[str] = []
    if _canonical(faces) != lock.get("faces_sha256"):
        problems.append("frozen.lock face list was edited (hash mismatch)")
    manifest = frozen / MANIFEST_NAME
    if not manifest.is_file():
        problems.append("manifest.csv missing")
    elif sha256_file(manifest) != lock.get("manifest_sha256"):
        problems.append("manifest.csv changed since the lock was written")
    # lock-existing also binds the original immutable upstream metadata.
    inventory_sha = lock.get("existing_inventory_sha256")
    if inventory_sha is not None:
        hashes = frozen / "HASHES.sha256"
        if not hashes.is_file() or sha256_file(hashes) != inventory_sha:
            problems.append("HASHES.sha256 changed since lock-existing")
    source_hashes = lock.get("source_metadata_sha256", {})
    if not isinstance(source_hashes, dict):
        problems.append("invalid source metadata fingerprint")
    else:
        for rel, digest in source_hashes.items():
            if not isinstance(rel, str) or not isinstance(digest, str):
                problems.append("invalid source metadata entry")
                continue
            path = frozen / rel
            if (path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(frozen.resolve())
                    or sha256_file(path) != digest):
                problems.append(f"source manifest changed or disappeared: {rel}")
    for face in faces:
        path = frozen / face["rel_path"]
        if not path.is_file():
            problems.append(f"{face['face_id']}: file missing")
        elif sha256_file(path) != face["sha256"]:
            problems.append(f"{face['face_id']}: file changed")
    return problems


# --- FairFace pool top-up ------------------------------------------------------------------

def pool_candidates(labels_csv: Path, image_root: Path, *, decode: bool = True) -> list[Candidate]:
    """Adult FairFace faces from the official label CSV (file,age,gender,race,...) and the
    image archive folder, for filling short cells. Nothing is copied by this function."""
    out: list[Candidate] = []
    with labels_csv.open(newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            rel = row.get("file", "").strip()
            age = row.get("age", "").strip()
            if not rel or age in C.MINOR_AGE_BINS:
                continue
            path = image_root / rel
            if not path.is_file():
                continue
            race, gender = row.get("race", "").strip(), row.get("gender", "").strip().capitalize()
            if race not in C.FAIRFACE_RACES or gender not in C.FAIRFACE_GENDERS or age not in C.FAIRFACE_AGE_TO_BAND:
                continue
            size = _image_size(path, decode)
            if size is None:
                continue
            out.append(Candidate(str(path), "fairface", "FairFace", "CC BY 4.0", sha256_file(path), path.stat().st_size,
                                 race=race, gender=gender, age_bin=age, attribution=FAIRFACE_ATTRIBUTION,
                                 width=size[0], height=size[1]))
    return out


def copy_pool_faces(root: Path, chosen: Sequence[Candidate], folder: str = "fairface-ccby4") -> list[Candidate]:
    """Copy chosen pool faces into frozen-1000/<folder>/ (outside the repo) and add their
    manifest rows, so the next scan sees them like any other FairFace face."""
    target = root / C.FROZEN_DIR / folder
    target.mkdir(parents=True, exist_ok=True)
    manifest = target / MANIFEST_NAME
    existing = _rows(target)
    new_rows = []
    copied: list[Candidate] = []
    for cand in chosen:
        src = Path(cand.rel_path)
        name = f"pool_{cand.sha256[:12]}{src.suffix.lower()}"
        if name not in existing:
            shutil.copy2(src, target / name)
            new_rows.append({"file": name, "source": "FairFace", "licence": "CC BY 4.0", "race": cand.race,
                             "gender": cand.gender, "age_band": cand.age_bin, "attribution": FAIRFACE_ATTRIBUTION})
        copied.append(replace(cand, rel_path=f"{folder}/{name}"))
    if new_rows:
        fields = ["file", "source", "licence", "race", "gender", "age_band", "attribution"]
        if manifest.is_file():
            with manifest.open(newline="", encoding="utf-8") as fh:
                header = next(csv.reader(fh), [])
            fields = header + [f for f in fields if f not in header]
        write_header = not manifest.is_file()
        with manifest.open("a", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
            if write_header:
                writer.writeheader()
            writer.writerows(new_rows)
    return copied


def fill_from_pool(root: Path, pool: Sequence[Candidate], *, seed: int = 20261023) -> dict[str, int]:
    """Copy just enough pool faces to fill every short FairFace cell. Returns copies per cell."""
    found = scan(root, decode=False)
    per_cell = C.FAIRFACE_COUNT // len(fairface_cells())
    have_hashes = {c.sha256 for c in found.candidates}
    rng = random.Random(seed + 3)
    plan: list[Candidate] = []
    copied: dict[str, int] = {}
    for cell in fairface_cells():
        have = sum(1 for c in found.candidates if c.set == "fairface" and c.cell == cell)
        want = per_cell - have
        if want <= 0:
            continue
        got = _pick([c for c in pool if c.cell == cell and c.sha256 not in have_hashes], want, rng)
        plan.extend(got)
        if got:
            copied["|".join(cell)] = len(got)
    copy_pool_faces(root, plan)
    return copied


def summary(lock: dict) -> str:
    """A short plain-text summary for the CLI (no face data)."""
    lines = [f"frozen set v{lock['version']}: {lock['total']} faces "
             f"({', '.join(f'{k} {v}' for k, v in lock['counts'].items())}); baseline block {lock['baseline_count']}"]
    if lock.get("shortfall"):
        short = sum(lock["shortfall"].values())
        lines.append(f"short by {short}: " + ", ".join(f"{k} {v}" for k, v in sorted(lock["shortfall"].items())[:12])
                     + (" ..." if len(lock["shortfall"]) > 12 else ""))
    for why, n in lock.get("excluded", {}).items():
        lines.append(f"left out {n}: {why}")
    lines.append(f"faces sha256 {lock['faces_sha256'][:16]}..., manifest sha256 {lock['manifest_sha256'][:16]}...")
    return "\n".join(lines)


__all__ = ["Candidate", "FreezeError", "Scan", "Selection", "scan", "select", "order_faces", "freeze", "verify",
           "read_manifest", "read_lock", "pool_candidates", "fill_from_pool", "summary", "face_id"]
