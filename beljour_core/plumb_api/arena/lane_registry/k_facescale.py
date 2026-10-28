"""Lane K ownership for the facescale test runner (lab.facescale) and its tests.

Lists every Python file added by task C13-FACESCALE-RUNNER with owner "K" and
a short purpose. facescale_ownership() reports files that are missing from
the list or listed but absent. Paths only: production code never imports lab
code.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

from . import LaneContribution

REPO_ROOT = Path(__file__).resolve().parents[4]
OWNER = "K"
FOLDERS: tuple[str, ...] = ("lab/facescale", "api/tests/facescale")
REGISTRY_FILE = "api/plumb_api/arena/lane_registry/k_facescale.py"

K_FACESCALE_MODULES: Mapping[str, tuple[str, str]] = {
    REGISTRY_FILE: (OWNER, "ownership list for the facescale test runner"),
    "lab/facescale/__init__.py": (OWNER, "public exports, training and display guards"),
    "lab/facescale/__main__.py": (OWNER, "python -m lab.facescale entry point"),
    "lab/facescale/registry.py": (OWNER, "test-only source registry, sources.local.json"),
    "lab/facescale/loaders/__init__.py": (OWNER, "loader per layout kind"),
    "lab/facescale/loaders/base.py": (OWNER, "FaceItem, openers, loader base class"),
    "lab/facescale/loaders/flat.py": (OWNER, "flat and numbered-subfolder layout"),
    "lab/facescale/loaders/identity.py": (OWNER, "identity-folder layout"),
    "lab/facescale/loaders/csv_labelled.py": (OWNER, "image folder plus label CSVs"),
    "lab/facescale/loaders/tsv_photos.py": (OWNER, "TSV-keyed photo layout"),
    "lab/facescale/loaders/npz_sidecar.py": (OWNER, "part folders with NPZ sidecars"),
    "lab/facescale/loaders/manifest.py": (OWNER, "seeded-generator JSONL manifest"),
    "lab/facescale/loaders/recordio.py": (OWNER, "pure-Python RecordIO reader and writer"),
    "lab/facescale/decode.py": (OWNER, "streaming decode at 128-640 px"),
    "lab/facescale/checkers.py": (OWNER, "FaceChecker protocol, tiers, fake and realface"),
    "lab/facescale/pool.py": (OWNER, "RAM-and-core budget, spawn pool, chunked work"),
    "lab/facescale/runner.py": (OWNER, "run one shard with resume and guards"),
    "lab/facescale/metrics.py": (OWNER, "vectorised per-shard aggregation"),
    "lab/facescale/results.py": (OWNER, "compact gzipped shard result format"),
    "lab/facescale/shards.py": (OWNER, "2M shard plans with stable extension"),
    "lab/facescale/resume.py": (OWNER, "atomic writes, checkpoints, done test"),
    "lab/facescale/merge.py": (OWNER, "shard merge, Wilson 95% intervals, reports"),
    "lab/facescale/disk.py": (OWNER, "disk-budget guard"),
    "lab/facescale/leakguard.py": (OWNER, "training-leak and display guards"),
    "lab/facescale/kaggle_gen.py": (OWNER, "private Kaggle kernel folder writer"),
    "lab/facescale/cli.py": (OWNER, "command line"),
    "lab/facescale/bench.py": (OWNER, "synthetic speed proof"),
    "lab/facescale/synthetic.py": (OWNER, "drawn images and synthetic layouts"),
    "lab/facescale/sampler.py": (OWNER, "stratified sample for core and full tiers"),
    "lab/facescale/fixnotes.py": (OWNER, "fix notes per owning lane"),
    "lab/facescale/progress.py": (OWNER, "progress and ETA in Toronto time"),
    "lab/facescale/dedupe.py": (OWNER, "exact and dHash duplicate audit"),
    "lab/facescale/calibrate.py": (OWNER, "640 px vs 256 px drift table"),
    "lab/facescale/rebalance.py": (OWNER, "shard rebalancer by machine speed"),
    "lab/facescale/schema.py": (OWNER, "shard result schema validator"),
    "lab/facescale/scanfile.py": (OWNER, "per-source scan files with threaded hashing"),
    "lab/facescale/estimate.py": (OWNER, "run-time estimate against a deadline"),
    "lab/facescale/realface_import.py": (OWNER, "realface JSONL stream to shard result"),
    "api/tests/facescale/test_facescale_registry.py": (OWNER, "source registry tests"),
    "api/tests/facescale/test_facescale_loaders.py": (OWNER, "loader tests incl. RecordIO"),
    "api/tests/facescale/test_facescale_decode.py": (OWNER, "decode tests and memory bound"),
    "api/tests/facescale/test_facescale_metrics.py": (OWNER, "vectorised vs per-row tests"),
    "api/tests/facescale/test_facescale_shards.py": (OWNER, "plan tests incl. 2M timing"),
    "api/tests/facescale/test_facescale_resume.py": (OWNER, "crash and checkpoint tests"),
    "api/tests/facescale/test_facescale_results.py": (OWNER, "result format and size tests"),
    "api/tests/facescale/test_facescale_lane_registry.py": (OWNER, "this ownership list"),
    "api/tests/facescale/test_facescale_runner.py": (OWNER, "shard runs, pool, adapter"),
    "api/tests/facescale/test_facescale_merge.py": (OWNER, "Wilson intervals and merging"),
    "api/tests/facescale/test_facescale_disk.py": (OWNER, "disk-budget guard tests"),
    "api/tests/facescale/test_facescale_leakguard.py": (OWNER, "training and display guards"),
    "api/tests/facescale/test_facescale_kaggle.py": (OWNER, "kernel folder tests"),
    "api/tests/facescale/test_facescale_cli.py": (OWNER, "command line end to end"),
    "api/tests/facescale/test_facescale_bench.py": (OWNER, "synthetic speed proof"),
    "api/tests/facescale/test_facescale_sampler.py": (OWNER, "stratified sampler tests"),
    "api/tests/facescale/test_facescale_fixnotes.py": (OWNER, "fix note tests"),
    "api/tests/facescale/test_facescale_progress.py": (OWNER, "progress and rebalance tests"),
    "api/tests/facescale/test_facescale_dedupe.py": (OWNER, "duplicate audit tests"),
    "api/tests/facescale/test_facescale_calibrate_schema.py": (OWNER, "drift and schema tests"),
    "api/tests/facescale/test_facescale_cli_tools.py": (OWNER, "CLI tool commands"),
    "api/tests/facescale/test_facescale_scanfile.py": (OWNER, "scan files and scan kernels"),
    "api/tests/facescale/test_facescale_edges.py": (OWNER, "odd formats, broken shards, resume"),
    "api/tests/facescale/test_facescale_estimate.py": (OWNER, "run-time estimate tests"),
    "api/tests/facescale/test_facescale_realface_import.py": (OWNER, "stream import tests"),
}

# Not wired into registry.py; see the hand-off note for the cross-lane request.
CONTRIBUTIONS: tuple[LaneContribution, ...] = ()


def files_on_disk(root: Path = REPO_ROOT) -> list[str]:
    """Every .py file in the owned folders plus the registry file itself."""
    found = {REGISTRY_FILE} if (root / REGISTRY_FILE).is_file() else set()
    for folder in FOLDERS:
        base = root / folder
        if base.is_dir():
            found.update(p.relative_to(root).as_posix() for p in base.rglob("*.py")
                         if "__pycache__" not in p.parts)
    return sorted(found)


def facescale_ownership(
    root: Path = REPO_ROOT,
    modules: Mapping[str, tuple[str, str]] = K_FACESCALE_MODULES,
) -> list[str]:
    """Problems: unlisted files, listed files that do not exist, wrong owner or purpose."""
    problems = []
    on_disk = set(files_on_disk(root))
    for path in sorted(on_disk - set(modules)):
        problems.append(f"{path}: not listed in k_facescale.py")
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            problems.append(f"{path}: listed but missing")
        if owner != OWNER:
            problems.append(f"{path}: owner {owner!r}, expected {OWNER!r}")
        if not purpose.strip():
            problems.append(f"{path}: empty purpose")
    return problems
