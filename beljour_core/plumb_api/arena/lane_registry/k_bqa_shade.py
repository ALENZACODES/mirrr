"""C18 shade-accuracy test component ownership: every Python file of the task, owner K.

Not wired into arena/registry.py or lane_registry/__init__.py (that wiring is a
cross-lane request). check() fails when a listed file is missing, when a .py
file under one of this task's own folders is missing from the list, or when a
listed owner is not K. This module only lists paths; it imports no lab code.
Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
OWNER = "K"
PKG = "lab/bqa_shade/"
TESTS = "api/tests/bqa_shade/"

# path -> (owner, short purpose)
MODULES: Mapping[str, tuple[str, str]] = {
    "api/plumb_api/arena/lane_registry/k_bqa_shade.py": (OWNER, "this ownership list"),
    PKG + "__init__.py": (OWNER, "package exports of lab.bqa_shade"),
    PKG + "colour.py": (OWNER, "sRGB, XYZ, Lab, Bradford, LCh, ITA, Delta E 76/94/2000"),
    PKG + "stats.py": (OWNER, "Wilson intervals, status rules, axis tallies"),
    PKG + "contract.py": (OWNER, "result rows and run context"),
    PKG + "datafiles.py": (OWNER, "typed loaders for the package data tables"),
    PKG + "bands.py": (OWNER, "MST colours, reporting bands, undertone rule"),
    PKG + "probe.py": (OWNER, "published CIEDE2000 pairs, engine formula probe"),
    PKG + "synth.py": (OWNER, "drawn faces, patches, mesh and chart"),
    PKG + "lights.py": (OWNER, "drawn lights and camera in linear light"),
    PKG + "engine.py": (OWNER, "read-only adapters to product engines"),
    PKG + "stability.py": (OWNER, "lighting and stability harness"),
    PKG + "coverage.py": (OWNER, "shade range coverage, range versus algorithm"),
    PKG + "__main__.py": (OWNER, "command line: run, lint, probe, sample"),
    PKG + "importers.py": (OWNER, "typed CSV and JSON importers, manifest"),
    PKG + "applied.py": (OWNER, "applied blind-study and lab capture analysis"),
    PKG + "records.py": (OWNER, "swatch, catalogue, device, corrector record schemas"),
    PKG + "catalogue.py": (OWNER, "audits, provenance, claims, sweeps, record filters"),
    PKG + "wording.py": (OWNER, "COL-01 report wording linter"),
    PKG + "render_check.py": (OWNER, "VTO-02 render probe, CON-03 corrector probe"),
    PKG + "cards.py": (OWNER, "Markdown shade card per MST band"),
    PKG + "handlers.py": (OWNER, "one handler per owned check key"),
    PKG + "checks.py": (OWNER, "run_checks entry point and result writer"),
    PKG + "metamerism.py": (OWNER, "stretch: spectral metamerism probe"),
    TESTS + "bqashade_synthetic.py": (OWNER, "synthetic record writers for tests"),
    TESTS + "test_bqashade_colour.py": (OWNER, "colour maths tests"),
    TESTS + "test_bqashade_bands.py": (OWNER, "MST band and undertone tests"),
    TESTS + "test_bqashade_stats.py": (OWNER, "statistics rule tests"),
    TESTS + "test_bqashade_contract.py": (OWNER, "result row and context tests"),
    TESTS + "test_bqashade_scenes.py": (OWNER, "drawn scene and light tests"),
    TESTS + "test_bqashade_stability.py": (OWNER, "stability harness tests"),
    TESTS + "test_bqashade_coverage.py": (OWNER, "range coverage tests"),
    TESTS + "test_bqashade_registry.py": (OWNER, "this list's own check and hygiene"),
    TESTS + "test_bqashade_applied.py": (OWNER, "applied-study analysis tests"),
    TESTS + "test_bqashade_records.py": (OWNER, "record and catalogue check tests"),
    TESTS + "test_bqashade_wording.py": (OWNER, "wording linter and importer tests"),
    TESTS + "test_bqashade_checks.py": (OWNER, "run_checks contract and CLI tests"),
    TESTS + "test_bqashade_render.py": (OWNER, "render and corrector probe tests"),
    TESTS + "test_bqashade_handlers.py": (OWNER, "handler record paths end to end"),
    TESTS + "test_bqashade_stretch.py": (OWNER, "stretch: metamers, confusion, speed, card"),
}

# Folders that hold only this task's files; every .py inside must be listed.
OWN_FOLDERS = ("lab/bqa_shade", "api/tests/bqa_shade")


def check(root: Path = REPO_ROOT) -> list[str]:
    problems: list[str] = []
    for path, (owner, purpose) in sorted(MODULES.items()):
        if owner != OWNER or not purpose.strip():
            problems.append(f"{path}: owner must be {OWNER} with a purpose")
        if not (root / path).is_file():
            problems.append(f"{path}: listed but missing")
    for folder in OWN_FOLDERS:
        for found in sorted((root / folder).rglob("*.py")):
            relative = found.relative_to(root).as_posix()
            if "__pycache__" not in relative and relative not in MODULES:
                problems.append(f"{relative}: new file missing from the K registry")
    return problems
