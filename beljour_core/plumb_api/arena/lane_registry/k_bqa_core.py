"""Lane K ownership of the C17 testing-core package (lab/bqa_core) and its tests.

Lists every Python file the task adds, with owner and purpose, and checks the
list against the files on disk: an unlisted file in the owned folders, or a
listed file that does not exist, is a problem. This module only reads paths; it
never imports lab code. Not wired into the shared registry (cross-lane request).
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

OWNER = "K"
REPO_ROOT = Path(__file__).resolve().parents[4]
REGISTRY_FILE = "api/plumb_api/arena/lane_registry/k_bqa_core.py"
OWNED_FOLDERS: tuple[str, ...] = ("lab/bqa_core", "api/tests/bqa_core")

_LAB = "lab/bqa_core/"
_TESTS = "api/tests/bqa_core/"

MODULES: Mapping[str, tuple[str, str]] = {
    REGISTRY_FILE: (OWNER, "C17 ownership list and its check"),
    _LAB + "__init__.py": (OWNER, "public exports of the testing core"),
    _LAB + "__main__.py": (OWNER, "python -m lab.bqa_core entry point"),
    _LAB + "cli.py": (OWNER, "find, list, run, scorecard and dashboard commands"),
    _LAB + "registry.py": (OWNER, "295-check registry loader and search (USE-01)"),
    _LAB + "stats.py": (OWNER, "Wilson intervals and shared status rules"),
    _LAB + "results.py": (OWNER, "result and run formats, privacy rule, JSONL"),
    _LAB + "paths.py": (OWNER, "outside-repo folder rule, hashing and clock"),
    _LAB + "worker.py": (OWNER, "child process that runs one package"),
    _LAB + "runner.py": (OWNER, "package discovery, isolated runs, run folder (MOD-03)"),
    _LAB + "isolation.py": (OWNER, "MOD-03 self-test with failing fake packages"),
    _LAB + "drawn.py": (OWNER, "seeded drawn face inputs"),
    _LAB + "modules.py": (OWNER, "module probe protocol and sidecars (MOD-01, MOD-02)"),
    _LAB + "adapters.py": (OWNER, "probes for product engines via public exports"),
    _LAB + "replay.py": (OWNER, "replay, version stamps, debug overlay (ARC-01..03)"),
    _LAB + "plan.py": (OWNER, "suite plan and release report (PLN-01..03)"),
    _LAB + "scorecard.py": (OWNER, "per-suite and per-check scorecards"),
    _LAB + "reports.py": (OWNER, "group report, runs on file, flaky register (AUTO-01..03)"),
    _LAB + "golden.py": (OWNER, "golden diff, approvals, re-run detection (REG, MON-03)"),
    _LAB + "retest.py": (OWNER, "change-type retest matrix (RET-01, RET-02)"),
    _LAB + "defects.py": (OWNER, "defect records and audits (DEF, BUG, MAN-03)"),
    _LAB + "evidence.py": (OWNER, "evidence index, tracing and honesty guards"),
    _LAB + "report_audit.py": (OWNER, "report audits (GT-03, GLO-01, REF-01, MST-01..03)"),
    _LAB + "sets.py": (OWNER, "gold, silver, challenge and fresh set versioning"),
    _LAB + "templates.py": (OWNER, "empty record templates and inputs pre-flight"),
    _LAB + "checks.py": (OWNER, "run_checks entry point and code-level checks"),
    _LAB + "checks_records.py": (OWNER, "record-driven checks for C17 keys"),
    _TESTS + "conftest.py": (OWNER, "tests: shared synthetic fixtures"),
    _TESTS + "test_bqacore_registry.py": (OWNER, "tests: check registry"),
    _TESTS + "test_bqacore_results.py": (OWNER, "tests: formats, privacy and statistics"),
    _TESTS + "test_bqacore_runner.py": (OWNER, "tests: runner isolation"),
    _TESTS + "test_bqacore_modules.py": (OWNER, "tests: module probes and replay"),
    _TESTS + "test_bqacore_replay.py": (OWNER, "tests: stamps and debug overlay"),
    _TESTS + "test_bqacore_plan.py": (OWNER, "tests: plan, scorecard and reports"),
    _TESTS + "test_bqacore_golden.py": (OWNER, "tests: golden diff and retest matrix"),
    _TESTS + "test_bqacore_defects.py": (OWNER, "tests: defect audits"),
    _TESTS + "test_bqacore_evidence.py": (OWNER, "tests: evidence tracing and guards"),
    _TESTS + "test_bqacore_sets.py": (OWNER, "tests: set versioning"),
    _TESTS + "test_bqacore_checks.py": (OWNER, "tests: run_checks end to end"),
    _TESTS + "test_bqacore_cli.py": (OWNER, "tests: command line"),
    _TESTS + "test_bqacore_templates.py": (OWNER, "tests: record templates"),
    _TESTS + "test_bqacore_lane_registry.py": (OWNER, "tests: this ownership list"),
}


def files_on_disk(root: Path = REPO_ROOT) -> list[str]:
    """Repo-relative paths of every .py file in the owned folders."""
    found: list[str] = []
    for folder in OWNED_FOLDERS:
        base = root / folder
        if base.is_dir():
            found += [path.relative_to(root).as_posix() for path in sorted(base.rglob("*.py"))
                      if "__pycache__" not in path.parts]
    return found


def problems(root: Path = REPO_ROOT,
             modules: Mapping[str, tuple[str, str]] = MODULES) -> list[str]:
    """Every mismatch between the list and the files; empty means in step."""
    issues = [f"{path}: not listed in {REGISTRY_FILE}" for path in files_on_disk(root)
              if path not in modules]
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            issues.append(f"{path}: listed but does not exist")
        if owner != OWNER:
            issues.append(f"{path}: owner must be {OWNER}")
        if not purpose.strip():
            issues.append(f"{path}: purpose is empty")
    if REGISTRY_FILE not in modules:
        issues.append(f"{REGISTRY_FILE}: the registry must list itself")
    return issues
