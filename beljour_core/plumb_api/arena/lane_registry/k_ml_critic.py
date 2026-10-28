"""Owner registry for the Realism Critic and identity-loss lab packages (task C4).

Lists every Python file in lab/ml/critic, lab/ml/identity and api/tests/ml_critic
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
OWNED_FOLDERS: tuple[str, ...] = ("lab/ml/critic", "lab/ml/identity", "api/tests/ml_critic")
THIS_FILE = "api/plumb_api/arena/lane_registry/k_ml_critic.py"

MODULES: Mapping[str, tuple[str, str]] = {
    THIS_FILE: (OWNER, "owner registry and check for task C4 files"),
    "api/tests/ml_critic/test_mlcritic_ablation.py": (OWNER, "ablation and ensemble tests"),
    "api/tests/ml_critic/test_mlcritic_alignment.py": (OWNER, "artifact-feature alignment tests"),
    "api/tests/ml_critic/test_mlcritic_batch.py": (OWNER, "batch scoring tests"),
    "api/tests/ml_critic/test_mlcritic_cli.py": (OWNER, "critic command-line tests"),
    "api/tests/ml_critic/test_mlcritic_critic.py": (OWNER, "critic score and file tests"),
    "api/tests/ml_critic/test_mlcritic_evaluate.py": (OWNER, "evaluation maths tests"),
    "api/tests/ml_critic/test_mlcritic_fairness.py": (OWNER, "skin-tone fairness tests"),
    "api/tests/ml_critic/test_mlcritic_features_edges.py": (OWNER, "edge feature tests"),
    "api/tests/ml_critic/test_mlcritic_features_grid.py": (OWNER, "grid feature tests"),
    "api/tests/ml_critic/test_mlcritic_features_region.py": (OWNER, "region feature tests"),
    "api/tests/ml_critic/test_mlcritic_features_tone.py": (OWNER, "tone feature tests"),
    "api/tests/ml_critic/test_mlcritic_inputs.py": (OWNER, "input checking and fuzz tests"),
    "api/tests/ml_critic/test_mlcritic_model.py": (OWNER, "model numerics tests"),
    "api/tests/ml_critic/test_mlcritic_registry.py": (OWNER, "this registry's own tests"),
    "api/tests/ml_critic/test_mlcritic_robustness.py": (OWNER, "critic robustness tests"),
    "api/tests/ml_critic/test_mlcritic_speed.py": (OWNER, "critic speed budget test"),
    "api/tests/ml_critic/test_mlcritic_synth.py": (OWNER, "synthetic generator tests"),
    "api/tests/ml_critic/test_mlcritic_threshold.py": (OWNER, "cost threshold tests"),
    "api/tests/ml_critic/test_mlidentity_admission.py": (OWNER, "admission gate tests"),
    "api/tests/ml_critic/test_mlidentity_calibration.py": (OWNER, "limit calibration tests"),
    "api/tests/ml_critic/test_mlidentity_cli.py": (OWNER, "admission CLI tests"),
    "api/tests/ml_critic/test_mlidentity_drift.py": (OWNER, "drift report tests"),
    "api/tests/ml_critic/test_mlidentity_fuzz.py": (OWNER, "identity fuzz and edge-case tests"),
    "api/tests/ml_critic/test_mlidentity_loss.py": (OWNER, "identity loss tests"),
    "api/tests/ml_critic/test_mlidentity_proxy.py": (OWNER, "proxy embedder tests"),
    "lab/ml/critic/__init__.py": (OWNER, "Realism Critic public API"),
    "lab/ml/critic/__main__.py": (OWNER, "python -m lab.ml.critic entry point"),
    "lab/ml/critic/ablation.py": (OWNER, "drop-one-feature ablation and ensembles"),
    "lab/ml/critic/batch.py": (OWNER, "batch scoring from a JSON manifest"),
    "lab/ml/critic/cli.py": (OWNER, "score / train / report command line"),
    "lab/ml/critic/critic.py": (OWNER, "calibrated critic, reasons, save and load"),
    "lab/ml/critic/evaluate.py": (OWNER, "ROC AUC, reliability, per-artifact report"),
    "lab/ml/critic/fairness.py": (OWNER, "score gaps across six drawn skin tones"),
    "lab/ml/critic/features.py": (OWNER, "ordered artifact feature list"),
    "lab/ml/critic/features_edges.py": (OWNER, "seam, halo, fringing, ghosting features"),
    "lab/ml/critic/features_grid.py": (OWNER, "checkerboard, JPEG block, symmetry features"),
    "lab/ml/critic/features_region.py": (OWNER, "clipping and edit-leak features"),
    "lab/ml/critic/features_tone.py": (OWNER, "texture, noise, banding, colour features"),
    "lab/ml/critic/images.py": (OWNER, "input checks and image helpers"),
    "lab/ml/critic/linear.py": (OWNER, "scaling, logistic regression, Platt scaling"),
    "lab/ml/critic/mlp.py": (OWNER, "small MLP with hand-written backprop"),
    "lab/ml/critic/pair.py": (OWNER, "validated before/after pair"),
    "lab/ml/critic/pipeline.py": (OWNER, "draw, featurise, train, evaluate"),
    "lab/ml/critic/speed.py": (OWNER, "CPU timing of the critic"),
    "lab/ml/critic/synth.py": (OWNER, "drawn portraits and controlled artifacts"),
    "lab/ml/critic/threshold.py": (OWNER, "cost-based threshold selection"),
    "lab/ml/identity/__init__.py": (OWNER, "identity loss public API"),
    "lab/ml/identity/__main__.py": (OWNER, "python -m lab.ml.identity entry point"),
    "lab/ml/identity/admission.py": (OWNER, "embedder admission record and gate"),
    "lab/ml/identity/calibration.py": (OWNER, "identity distance-limit calibration"),
    "lab/ml/identity/cli.py": (OWNER, "admission table command line"),
    "lab/ml/identity/drift.py": (OWNER, "identity drift report for an edit batch"),
    "lab/ml/identity/embedder.py": (OWNER, "embedder protocol and admitted wrapper"),
    "lab/ml/identity/excluded.py": (OWNER, "hashed excluded-data list"),
    "lab/ml/identity/faces.py": (OWNER, "drawn test faces with known landmarks"),
    "lab/ml/identity/loss.py": (OWNER, "guarded identity loss and gradients"),
    "lab/ml/identity/proxy.py": (OWNER, "PROXY geometry embedder, tests only"),
}


def present_files(root: Path = REPO_ROOT) -> list[str]:
    """Every .py file under the owned folders, as repo-relative POSIX paths."""
    found: list[str] = []
    for folder in OWNED_FOLDERS:
        base = root / folder
        if base.is_dir():
            found.extend(
                path.relative_to(root).as_posix()
                for path in sorted(base.rglob("*.py"))
                if "__pycache__" not in path.parts
            )
    if (root / THIS_FILE).is_file():
        found.append(THIS_FILE)
    return sorted(found)


def registry_problems(root: Path = REPO_ROOT,
                      modules: Mapping[str, tuple[str, str]] = MODULES) -> list[str]:
    """Plain-words problems; an empty list means the registry matches the tree."""
    problems: list[str] = []
    listed = set(modules)
    for path in present_files(root):
        if path not in listed:
            problems.append(f"{path}: file exists but is not listed in k_ml_critic.MODULES")
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            problems.append(f"{path}: listed in k_ml_critic.MODULES but does not exist")
        if owner != OWNER:
            problems.append(f"{path}: owner {owner!r} is not {OWNER!r}")
        if not purpose.strip():
            problems.append(f"{path}: purpose is empty")
    return problems


def owner_rows() -> list[dict[str, str]]:
    """Rows in the shape other lane registries use: module, owner, purpose."""
    return [
        {"module": path, "owner": owner, "purpose": purpose}
        for path, (owner, purpose) in sorted(MODULES.items())
    ]
