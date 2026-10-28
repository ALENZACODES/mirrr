"""Name scanner v1 (filters-plan.md §6.5): other apps' filter names never enter our files.

The names themselves never sit in the repo. John builds hash lists outside it
(scripts/build_name_blocklist.py); only SHA-256 hashes of normalised names are committed:

  name-blocklist.sha256          tier A, distinctive names: blocked everywhere
  name-blocklist-generic.sha256  tier B, ordinary words that are also their filter names:
                                 blocked only as the exact display name of our filter or preset
  name-caution.sha256            brand-caution names (cosmetics, water, wine, the names
                                 renamed in §1.6): a warning that needs John's sign-off

Normalising: Unicode NFKD, accents stripped, lower case, punctuation to spaces, spaces
collapsed; camelCase and snake_case split into words. Every 1- to 4-word window is hashed
twice, joined with a space and with nothing, so "Some Name", "some-name" and "someName"
all match. A hit reports the file, the line and the hash, never the name. Hashes catch
exact normalised matches only, not look-alikes or logos (a human trademark search is still
needed before launch). Author: John Khan.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections.abc import Iterable, Iterator, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
TIER_A = HERE / "name-blocklist.sha256"
TIER_B = HERE / "name-blocklist-generic.sha256"
CAUTION = HERE / "name-caution.sha256"
HEADER = "# beljour-name-hashes/1"
MAX_WINDOW = 4
TEXT_SUFFIXES = {".py", ".ts", ".mjs", ".js", ".json", ".html", ".css", ".md", ".txt", ".yaml", ".yml"}
SKIP_DIRS = {"node_modules", "dist", ".git", ".venv", "venv", "__pycache__", ".mypy_cache", ".ruff_cache",
             ".pytest_cache", "spike-reports", "quality-reports", "test-faces", "frozen-1000", "realface-out"}
SCAN_ROOTS = ("api/plumb_api", "web/src", "web", "docs", "scripts")
ROMAN = {1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v", 6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x",
         11: "xi", 12: "xii", 13: "xiii", 14: "xiv", 15: "xv", 16: "xvi", 17: "xvii", 18: "xviii", 19: "xix", 20: "xx"}
CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")


def normalise(text: str) -> str:
    split = CAMEL.sub(" ", text.replace("_", " "))
    folded = "".join(c for c in unicodedata.normalize("NFKD", split) if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", re.sub(r"[^0-9a-z]+", " ", folded.lower())).strip()


def words(text: str) -> list[str]:
    n = normalise(text)
    return n.split(" ") if n else []


def digest(phrase: str) -> str:
    return hashlib.sha256(phrase.encode("utf-8")).hexdigest()


def variants(name: str) -> set[str]:
    """The normalised forms one name is hashed under: spaced, joined, digits <-> roman numerals."""
    base = words(name)
    if not base:
        return set()
    forms = {tuple(base)}
    for i, w in enumerate(base):
        alt: str | None = None
        if w.isdigit() and int(w) in ROMAN:
            alt = ROMAN[int(w)]
        else:
            alt = next((str(k) for k, v in ROMAN.items() if v == w and k > 1), None)
        if alt is not None:
            forms |= {f[:i] + (alt,) + f[i + 1:] for f in list(forms)}
    out: set[str] = set()
    for f in forms:
        out.add(" ".join(f))
        out.add("".join(f))
    return out


def hashes_for(names: Iterable[str]) -> set[str]:
    return {digest(v) for n in names for v in variants(n)}


def read_hashes(path: Path) -> set[str]:
    if not path.exists():
        return set()
    out: set[str] = set()
    count: int | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("count "):
            count = int(line.split()[1])
            continue
        if not re.fullmatch(r"[0-9a-f]{64}", line):
            raise ValueError(f"{path.name}: not a SHA-256 line: {line[:12]}...")
        out.add(line)
    if count is not None and count != len(out):
        raise ValueError(f"{path.name}: count line says {count}, file has {len(out)} hashes")
    return out


def write_hashes(path: Path, hashes: Iterable[str], about: str) -> None:
    rows = sorted(set(hashes))
    path.write_text("\n".join([HEADER, f"# {about}", f"count {len(rows)}", *rows]) + "\n", encoding="utf-8")


def windows(tokens: Sequence[str], size: int = MAX_WINDOW) -> Iterator[str]:
    for i in range(len(tokens)):
        for n in range(1, size + 1):
            if i + n > len(tokens):
                break
            part = tokens[i:i + n]
            yield " ".join(part)
            if n > 1:
                yield "".join(part)


@dataclass(frozen=True)
class Hit:
    path: str
    line: int
    hash: str
    tier: str

    def text(self) -> str:
        return f"{self.path}:{self.line}: matches a {self.tier} name (hash {self.hash[:12]}...)"


def scan_text(text: str, blocked: set[str], *, path: str = "", tier: str = "tier A") -> list[Hit]:
    if not blocked:
        return []
    hits: list[Hit] = []
    for number, line in enumerate(text.splitlines(), 1):
        tokens = words(line)
        for phrase in windows(tokens):
            h = digest(phrase)
            if h in blocked:
                hits.append(Hit(path, number, h, tier))
                break
    return hits


def scan_display_name(name: str, blocked: set[str]) -> str | None:
    """Tier B: the whole display name, normalised, joined both ways."""
    for v in variants(name):
        h = digest(v)
        if h in blocked:
            return h
    return None


def files_to_scan(root: Path, roots: Sequence[str] = SCAN_ROOTS) -> list[Path]:
    found: dict[str, Path] = {}
    own = {TIER_A.name, TIER_B.name, CAUTION.name}
    for base in roots:
        folder = root / base
        if not folder.exists():
            continue
        paths = [folder] if folder.is_file() else (sorted(folder.glob("*")) if base == "web" else sorted(folder.rglob("*")))
        for p in paths:
            rel = p.relative_to(root)
            if not p.is_file() or p.suffix not in TEXT_SUFFIXES or p.name in own:
                continue
            if any(part in SKIP_DIRS for part in rel.parts):
                continue
            found[rel.as_posix()] = p
    return [found[k] for k in sorted(found)]


def catalogue_names(catalogue: Mapping[str, Any]) -> list[tuple[str, str]]:
    """(where, display text) for every filter name, description and preset label."""
    out: list[tuple[str, str]] = []
    for r in catalogue.get("recipes", []):
        out.append((f"{r['id']} name", r["name"]))
        out.append((f"{r['id']} description", r["description"]))
        for p in r.get("presets", []):
            out.append((f"{r['id']} preset", p["name"]))
    for row in catalogue.get("ranking", []):
        out.append((f"ranking {row['id']}", row["name"]))
    for a in catalogue.get("addons", []):
        out.append((f"add-on {a['id']}", a.get("label", a["id"])))
    return out


@dataclass
class Report:
    hits: list[Hit]
    warnings: list[str]
    files: int

    @property
    def ok(self) -> bool:
        return not self.hits


def scan_repo(root: Path, catalogue: Mapping[str, Any], *, tier_a: set[str] | None = None,
              tier_b: set[str] | None = None, caution: set[str] | None = None,
              roots: Sequence[str] = SCAN_ROOTS) -> Report:
    a = read_hashes(TIER_A) if tier_a is None else tier_a
    b = read_hashes(TIER_B) if tier_b is None else tier_b
    c = read_hashes(CAUTION) if caution is None else caution
    hits: list[Hit] = []
    files = files_to_scan(root, roots)
    if a:
        for path in files:
            hits += scan_text(path.read_text(encoding="utf-8", errors="replace"), a,
                              path=path.relative_to(root).as_posix())
    warnings: list[str] = []
    for where, text in catalogue_names(catalogue):
        for tier, blocked in (("tier A", a), ("tier B", b)):
            h = scan_display_name(text, blocked) if tier == "tier B" else next(
                (x.hash for x in scan_text(text, blocked)), None)
            if h:
                hits.append(Hit(f"catalogue: {where}", 1, h, tier))
        hc = scan_display_name(text, c)
        if hc:
            warnings.append(f"catalogue: {where} matches a brand-caution name (hash {hc[:12]}...); needs John's sign-off")
    return Report(hits, warnings, len(files))


def report_json(report: Report) -> str:
    return json.dumps({"hits": [h.__dict__ for h in report.hits], "warnings": report.warnings,
                       "files": report.files}, indent=1)
