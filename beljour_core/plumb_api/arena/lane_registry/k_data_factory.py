"""Lane K ownership of the data factory modules and their tests.

Lists every Python file the data factory task adds, with owner and purpose,
and checks the list against the files on disk: a file in the owned folders
that is missing from the list, or a listed file that does not exist, is a
problem. Not wired into the shared registry; that is a cross-lane request.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

OWNER = "K"
REPO_ROOT = Path(__file__).resolve().parents[4]
REGISTRY_FILE = "api/plumb_api/arena/lane_registry/k_data_factory.py"
OWNED_FOLDERS: tuple[str, ...] = ("api/plumb_api/data_factory", "api/tests/data_factory")

_PKG = "api/plumb_api/data_factory/"
_TESTS = "api/tests/data_factory/"

MODULES: Mapping[str, tuple[str, str]] = {
    REGISTRY_FILE: (OWNER, "lane K ownership list and its check"),
    _PKG + "__init__.py": (OWNER, "public exports of the data factory"),
    _PKG + "hashing.py": (OWNER, "content, canonical JSON and rolling hashes; shard assignment"),
    _PKG + "records.py": (OWNER, "ImageRecord and field validation"),
    _PKG + "licence.py": (OWNER, "licence policy, source deny-list and decisions"),
    _PKG + "imaging.py": (OWNER, "safe decoding, input limits and metadata stripping"),
    _PKG + "perceptual.py": (OWNER, "pHash and dHash"),
    _PKG + "dedup.py": (OWNER, "exact dedup and multi-index near dedup"),
    _PKG + "quality_score.py": (OWNER, "blur, exposure, noise, resolution and face-box scoring"),
    _PKG + "slices.py": (OWNER, "slice quotas over declared attributes"),
    _PKG + "manifest.py": (OWNER, "streaming JSONL manifests with shard hashes"),
    _PKG + "lockfile.py": (OWNER, "beljour-data-lock/1 build and verify"),
    _PKG + "holdout.py": (OWNER, "frozen test-set leak guard (read-only)"),
    _PKG + "synthetic.py": (OWNER, "procedural images and made-up records for tests"),
    _PKG + "__main__.py": (OWNER, "python -m entry point"),
    _PKG + "cli.py": (OWNER, "command line: run, verify, leak-check, diff, takedown and more"),
    _PKG + "config.py": (OWNER, "pipeline config parsing and config hashes"),
    _PKG + "processing.py": (OWNER, "per-image quality-stage work and process pool"),
    _PKG + "stages.py": (OWNER, "pipeline stages over work items"),
    _PKG + "pipeline.py": (OWNER, "stage runner with resume, publish and relock"),
    _PKG + "report.py": (OWNER, "JSON and Markdown run reports"),
    _PKG + "demo_set.py": (OWNER, "drawn demo set that exercises every stage"),
    _PKG + "takedown.py": (OWNER, "consent and takedown registry, removal with audit"),
    _PKG + "datacard.py": (OWNER, "data card writer"),
    _PKG + "provenance_register.py": (OWNER, "provenance register export per source"),
    _PKG + "perf.py": (OWNER, "measured performance report on synthetic records"),
    _PKG + "integrity.py": (OWNER, "exported-image checks and manifest diffs"),
    _PKG + "near_holdout.py": (OWNER, "near-copy leak guard against frozen images"),
    _PKG + "intake_csv.py": (OWNER, "contributor CSV to intake JSONL"),
    _PKG + "shard_lists.py": (OWNER, "per-shard file lists for loaders"),
    _TESTS + "test_datafactory_records.py": (OWNER, "tests: records and hashing"),
    _TESTS + "test_datafactory_licence.py": (OWNER, "tests: licence filter"),
    _TESTS + "test_datafactory_imaging.py": (OWNER, "tests: decoding and stripping"),
    _TESTS + "test_datafactory_dedup.py": (OWNER, "tests: dedup and multi-index"),
    _TESTS + "test_datafactory_quality.py": (OWNER, "tests: quality scoring"),
    _TESTS + "test_datafactory_slices.py": (OWNER, "tests: slice balancing"),
    _TESTS + "test_datafactory_manifest.py": (OWNER, "tests: manifests"),
    _TESTS + "test_datafactory_lockfile.py": (OWNER, "tests: lock files"),
    _TESTS + "test_datafactory_holdout.py": (OWNER, "tests: holdout leak guard"),
    _TESTS + "test_datafactory_registry.py": (OWNER, "tests: this registry"),
    _TESTS + "test_datafactory_pipeline.py": (OWNER, "tests: end-to-end pipeline and resume"),
    _TESTS + "test_datafactory_config.py": (OWNER, "tests: config parsing and hashing"),
    _TESTS + "test_datafactory_cli.py": (OWNER, "tests: command line"),
    _TESTS + "test_datafactory_takedown.py": (OWNER, "tests: takedown propagation"),
    _TESTS + "test_datafactory_datacard.py": (OWNER, "tests: data card and provenance register"),
    _TESTS + "test_datafactory_processing.py": (OWNER, "tests: per-image work, pools, ingest"),
    _TESTS + "test_datafactory_perf.py": (OWNER, "tests: performance report"),
    _TESTS + "test_datafactory_package.py": (OWNER, "tests: package-wide rules"),
    _TESTS + "test_datafactory_integrity.py": (OWNER, "tests: export checks and diffs"),
    _TESTS + "test_datafactory_options.py": (OWNER, "tests: pipeline options"),
    _TESTS + "test_datafactory_near_holdout.py": (OWNER, "tests: near-copy leak guard"),
    _TESTS + "test_datafactory_intake_csv.py": (OWNER, "tests: CSV intake"),
    _TESTS + "test_datafactory_shard_lists.py": (OWNER, "tests: shard lists, resume, BOM"),
    _TESTS + "test_datafactory_fuzz.py": (OWNER, "tests: seeded corruption, fail closed"),
}


def files_on_disk(root: Path = REPO_ROOT) -> list[str]:
    """Repo-relative paths of every .py file in the owned folders."""
    found: list[str] = []
    for folder in OWNED_FOLDERS:
        base = root / folder
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*.py")):
            if "__pycache__" not in path.parts:
                found.append(path.relative_to(root).as_posix())
    return found


def problems(root: Path = REPO_ROOT, modules: Mapping[str, tuple[str, str]] = MODULES
             ) -> list[str]:
    """Every mismatch between the list and the files; empty means in step."""
    issues: list[str] = []
    listed = set(modules)
    for path in files_on_disk(root):
        if path not in listed:
            issues.append(f"{path}: not listed in {REGISTRY_FILE}")
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            issues.append(f"{path}: listed but does not exist")
        if owner != OWNER:
            issues.append(f"{path}: owner must be {OWNER}")
        if not purpose.strip():
            issues.append(f"{path}: purpose is empty")
    if REGISTRY_FILE not in listed:
        issues.append(f"{REGISTRY_FILE}: the registry must list itself")
    return issues
