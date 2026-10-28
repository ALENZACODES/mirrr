"""Owner registry for the C14 synthetic stress, seeded-generator and fairness-slice files.

Lists every Python file in lab/facescale_synth and api/tests/facescale_synth
with its owner and purpose. ``registry_problems`` fails when a file in those
folders is missing from the list or a listed file does not exist. This module
only reads paths; it never imports lab code. Not wired into registry.py yet.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

OWNER = "K"  # lane code for this work; ASSUMED
REPO_ROOT = Path(__file__).resolve().parents[4]
OWNED_FOLDERS: tuple[str, ...] = ("lab/facescale_synth", "api/tests/facescale_synth")
THIS_FILE = "api/plumb_api/arena/lane_registry/k_facescale_synth.py"
LAB = "lab/facescale_synth/"
TESTS = "api/tests/facescale_synth/"

MODULES: Mapping[str, tuple[str, str]] = {
    THIS_FILE: (OWNER, "owner registry and check for task C14 files"),
    LAB + "__init__.py": (OWNER, "C14 public API"),
    LAB + "__main__.py": (OWNER, "python -m lab.facescale_synth entry point"),
    LAB + "cli.py": (OWNER, "box command line for stress, gan and fairness"),
    LAB + "curriculum.py": (OWNER, "test seed list weighted to failing buckets"),
    LAB + "policy.py": (OWNER, "test-only rule, use allow-list, output guards"),
    LAB + "seeds.py": (OWNER, "per-item SHA-256 seeds and the shard rule"),
    LAB + "sources.py": (OWNER, "opaque source ids and box-side source file"),
    LAB + "stress/__init__.py": (OWNER, "stress set public API"),
    LAB + "stress/audit.py": (OWNER, "content-hash audit of N items"),
    LAB + "stress/canvas.py": (OWNER, "layered drawing surface"),
    LAB + "stress/contact.py": (OWNER, "per-trait contact sheets for debugging"),
    LAB + "stress/clutter.py": (OWNER, "backgrounds and face-like decoys"),
    LAB + "stress/expect.py": (OWNER, "checker-side expectations per scene"),
    LAB + "stress/face.py": (OWNER, "code-drawn stress face"),
    LAB + "stress/geometry.py": (OWNER, "face spec and exact feature geometry"),
    LAB + "stress/labels.py": (OWNER, "scene labels and main-subject rule"),
    LAB + "stress/lighting.py": (OWNER, "lighting, blur, JPEG, rescale stressors"),
    LAB + "stress/occluders.py": (OWNER, "hands, glasses, masks and other occluders"),
    LAB + "stress/scene.py": (OWNER, "scene composer with faces and stressors"),
    LAB + "stress/scoring.py": (OWNER, "IoU matching and bucketed recall and precision"),
    LAB + "stress/stream.py": (OWNER, "lazy shard streaming and disk writer"),
    LAB + "stress/throughput.py": (OWNER, "detector throughput harness"),
    LAB + "stress/tone.py": (OWNER, "continuous skin tone and bands"),
    LAB + "stress/trait_plan.py": (OWNER, "declared trait sampling for stress faces"),
    LAB + "stress/trait_source.py": (OWNER, "TraitSource for S20 manifests"),
    LAB + "stress/traits_draw.py": (OWNER, "coded trait shapes, stress approximation"),
    LAB + "gan/__init__.py": (OWNER, "seeded-generator wrapper public API"),
    LAB + "gan/boxconfig.py": (OWNER, "box-side weights and code settings"),
    LAB + "gan/dedupe.py": (OWNER, "batch near-duplicate search on 64-bit hashes"),
    LAB + "gan/job.py": (OWNER, "Kaggle-only generation job script"),
    LAB + "gan/kernel.py": (OWNER, "private Kaggle kernel folder writer"),
    LAB + "gan/manifest.py": (OWNER, "seeded manifest reader and duplicate report"),
    LAB + "gan/seedplan.py": (OWNER, "2M unique seed plan with psi and shards"),
    LAB + "fairness/__init__.py": (OWNER, "fairness-slice harness public API"),
    LAB + "fairness/export.py": (OWNER, "numbers-only beljour-fairness/1 export"),
    LAB + "fairness/facescale.py": (OWNER, "exact per-image rows from C13 shard results and failure rows"),
    LAB + "fairness/fixnotes.py": (OWNER, "fix notes per lane with no-leak checks"),
    LAB + "fairness/report.py": (OWNER, "per-trait report, status, parity, Holm"),
    LAB + "fairness/rows.py": (OWNER, "result rows and join with trait tags"),
    LAB + "fairness/stats.py": (OWNER, "Wilson, Newcombe gap and Holm statistics"),
    LAB + "fairness/traits.py": (OWNER, "trait tags, schema and TraitSource protocol"),
    TESTS + "test_fssynth_cli.py": (OWNER, "command line tests"),
    TESTS + "test_fssynth_end_to_end.py": (OWNER, "end-to-end fairness run on drawn faces"),
    TESTS + "test_fssynth_face.py": (OWNER, "stress face tests"),
    TESTS + "test_fssynth_facescale.py": (OWNER, "C13 result reading and CLI tests"),
    TESTS + "test_fssynth_fixnotes.py": (OWNER, "fix note and export tests"),
    TESTS + "test_fssynth_gan_job.py": (OWNER, "Kaggle job and dedupe tests"),
    TESTS + "test_fssynth_gan_plan.py": (OWNER, "seed plan and kernel writer tests"),
    TESTS + "test_fssynth_policy.py": (OWNER, "test-only rule and source tests"),
    TESTS + "test_fssynth_registry.py": (OWNER, "this registry's own tests"),
    TESTS + "test_fssynth_report.py": (OWNER, "fairness report tests"),
    TESTS + "test_fssynth_scene.py": (OWNER, "scene composer tests"),
    TESTS + "test_fssynth_scoring.py": (OWNER, "expectation and scoring tests"),
    TESTS + "test_fssynth_seeds.py": (OWNER, "seed and shard tests"),
    TESTS + "test_fssynth_stats.py": (OWNER, "interval and Holm tests"),
    TESTS + "test_fssynth_stream.py": (OWNER, "streaming and writer tests"),
    TESTS + "test_fssynth_stretch.py": (OWNER, "curriculum, contact sheet, extra stressors"),
    TESTS + "test_fssynth_stressors.py": (OWNER, "occluder, lighting and clutter tests"),
    TESTS + "test_fssynth_throughput.py": (OWNER, "throughput harness tests"),
    TESTS + "test_fssynth_traits.py": (OWNER, "trait schema and source tests"),
    TESTS + "test_fssynth_traits_draw.py": (OWNER, "trait drawing tests"),
}


def owned_files(root: Path = REPO_ROOT) -> list[str]:
    """Every .py file under the owned folders, as repo-relative POSIX paths."""
    found: list[str] = []
    for folder in OWNED_FOLDERS:
        base = root / folder
        if base.is_dir():
            found.extend(
                path.relative_to(root).as_posix()
                for path in base.rglob("*.py")
                if "__pycache__" not in path.parts
            )
    return sorted(found)


def registry_problems(
    root: Path = REPO_ROOT, modules: Mapping[str, tuple[str, str]] = MODULES
) -> list[str]:
    """Missing, unlisted or wrongly owned files; empty when the registry is complete."""
    problems: list[str] = []
    for path in owned_files(root):
        if path not in modules:
            problems.append(f"{path}: not listed in {THIS_FILE}")
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            problems.append(f"{path}: listed but missing")
        if owner != OWNER:
            problems.append(f"{path}: owner must be {OWNER}, got {owner}")
        if not purpose.strip():
            problems.append(f"{path}: purpose is empty")
    return problems
