"""C16 gate-fix module ownership: every new Python file of this task, owner K.

The engine and runner fixes were handed to their owning lanes as notes in
docs/reviews/c16-lane-fix-notes.md; only files outside lane-owned folders remain.

Not wired into arena/registry.py or lane_registry/__init__.py (that wiring is a
cross-lane request). check() fails when a listed file is missing, when a file
under one of this task's own folders is missing from the list, or when a
listed owner is not K. Author: John Khan.
"""
from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
OWNER = "K"

# path -> (owner, short purpose)
MODULES: Mapping[str, tuple[str, str]] = {
    "api/plumb_api/arena/lane_registry/k_gate_fixes.py": (OWNER, "this ownership list"),
    "api/tests/gate_fixes/test_gatefix_registry.py": (OWNER, "this list's own check"),
    "api/tests/gate_fixes/gatefix_gate_diff.py": (OWNER, "numbers-only diff of two .gates.json"),
    "api/tests/gate_fixes/test_gatefix_gate_diff.py": (OWNER, "gate diff tool tests"),
    "api/tests/gate_fixes/gatefix_drawing.py": (OWNER, "drawn photos and fake detector sources"),
    "api/tests/gate_fixes/gatefix_gates.py": (OWNER, "tiny synthetic gate plans and rows"),
    "api/tests/gate_fixes/gatefix_meshes.py": (OWNER, "drawn meshes, yaw and painted photos"),
    "api/tests/gate_fixes/filters_reference.py": (OWNER, "pre-C16 Still Her reference for tests"),
    "api/tests/gate_fixes/test_gatefix_mesh_recovery.py": (OWNER, "item (a) mesh recovery"),
    "api/tests/gate_fixes/test_gatefix_hair_gates.py": (OWNER, "item (b) hair gate definitions"),
    "api/tests/gate_fixes/test_gatefix_subject_profile.py": (OWNER, "item (c) subject, turns"),
    "api/tests/gate_fixes/test_gatefix_teeth.py": (OWNER, "item (d) teeth regression tests"),
    "api/tests/gate_fixes/test_gatefix_shade.py": (OWNER, "item (d) shade regression tests"),
    "api/tests/gate_fixes/test_gatefix_filters.py": (OWNER, "item (e) identity, speed, greyscale"),
    "api/tests/gate_fixes/test_gatefix_engines.py": (OWNER, "item (f) warp layout and turn"),
    "api/tests/gate_fixes/test_gatefix_50000.py": (OWNER, "item (g) 50,000-face definitions"),
    "api/tests/gate_fixes/test_gatefix_recovery_report.py": (OWNER, "stretch: recovery report"),
    "api/tests/gate_fixes/test_gatefix_adversarial.py": (OWNER, "stretch: adversarial drawn cases"),
}

# Folders that hold only this task's files; every .py inside must be listed.
OWN_FOLDERS = ("api/tests/gate_fixes",)


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
