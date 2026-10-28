"""C19 BQA-RENDER module ownership: every Python file of this task, owner K.

Not wired into arena/registry.py or lane_registry/__init__.py (that wiring is a
cross-lane request). check() fails when a listed file is missing, when a .py file in
one of this task's own folders is missing from the list, or when an owner is not K.
Production code never imports lab code; this file only lists paths. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
OWNER = "K"

# path -> (owner, short purpose)
MODULES: Mapping[str, tuple[str, str]] = {
    "api/plumb_api/arena/lane_registry/k_bqa_render.py": (OWNER, "this ownership list"),
    "lab/bqa_render/__init__.py": (OWNER, "package exports"),
    "lab/bqa_render/__main__.py": (OWNER, "command line runner"),
    "lab/bqa_render/adapters.py": (OWNER, "render adapters over public engine exports"),
    "lab/bqa_render/bench.py": (OWNER, "torture cases, caches and failure log"),
    "lab/bqa_render/catalogue.py": (OWNER, "typed loader for the owned check table"),
    "lab/bqa_render/checks.py": (OWNER, "run_checks entry point and CAT-A3 audit"),
    "lab/bqa_render/colour.py": (OWNER, "vectorised Lab and CIEDE2000"),
    "lab/bqa_render/extras.py": (OWNER, "contact sheets and speed table"),
    "lab/bqa_render/faces.py": (OWNER, "drawn faces with exact zones"),
    "lab/bqa_render/hair.py": (OWNER, "HAR-02 and HAR-03 hair containment"),
    "lab/bqa_render/intensity.py": (OWNER, "OPA and RLS intensity and honesty checks"),
    "lab/bqa_render/interrupt.py": (OWNER, "JRN-02 and RB2-03 interruption suite"),
    "lab/bqa_render/landmarks.py": (OWNER, "exact mesh landmarks, mirror and scale"),
    "lab/bqa_render/lmk.py": (OWNER, "LMK-02 report builder and LMK-03 tracking"),
    "lab/bqa_render/masks.py": (OWNER, "MSK and SEG mask checks"),
    "lab/bqa_render/outputs.py": (OWNER, "save, preview and photo path checks"),
    "lab/bqa_render/raster.py": (OWNER, "mask drawing and morphology helpers"),
    "lab/bqa_render/records.py": (OWNER, "imported panel and physical records"),
    "lab/bqa_render/robustness.py": (OWNER, "robustness and misuse set"),
    "lab/bqa_render/rows.py": (OWNER, "run context and result rows"),
    "lab/bqa_render/stages.py": (OWNER, "VTO-01 stage recorder and audit"),
    "lab/bqa_render/stats.py": (OWNER, "Wilson intervals and status rules"),
    "lab/bqa_render/zones.py": (OWNER, "zone, spill and placement checks"),
    "api/tests/bqa_render/test_bqarender_catalogue.py": (OWNER, "table schemas, key coverage"),
    "api/tests/bqa_render/test_bqarender_stats_rows.py": (OWNER, "stats, rows, colour maths"),
    "api/tests/bqa_render/test_bqarender_faces.py": (OWNER, "drawn faces and landmarks"),
    "api/tests/bqa_render/test_bqarender_adapters.py": (OWNER, "render adapters"),
    "api/tests/bqa_render/test_bqarender_zones.py": (OWNER, "zones and spill"),
    "api/tests/bqa_render/test_bqarender_intensity.py": (OWNER, "intensity and records"),
    "api/tests/bqa_render/test_bqarender_registry.py": (OWNER, "this list's own check"),
    "api/tests/bqa_render/test_bqarender_outputs.py": (OWNER, "save, paths and uploads"),
    "api/tests/bqa_render/test_bqarender_stages_masks.py": (OWNER, "stages and mask checks"),
    "api/tests/bqa_render/test_bqarender_hair.py": (OWNER, "hair containment"),
    "api/tests/bqa_render/test_bqarender_robustness.py": (OWNER, "robustness and gates"),
    "api/tests/bqa_render/test_bqarender_interrupt.py": (OWNER, "interruption suite"),
    "api/tests/bqa_render/test_bqarender_lmk.py": (OWNER, "landmark report and tracking"),
    "api/tests/bqa_render/test_bqarender_checks.py": (OWNER, "run_checks contract and CLI"),
    "api/tests/bqa_render/test_bqarender_extras.py": (OWNER, "contact sheet and speed table"),
}

# Folders that hold only this task's files; every .py inside must be listed.
OWN_FOLDERS = ("lab/bqa_render", "api/tests/bqa_render")


def check(root: Path = REPO_ROOT) -> list[str]:
    """Problems with the ownership list; an empty list means it is complete."""
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
