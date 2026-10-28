"""Lane K ownership for the ML training framework (lab.ml.train) and its tests.

Lists every Python file added by task C3-ML-FRAMEWORK with owner "K" and a short
purpose. ml_train_ownership() reports files that are missing from the list or
listed but absent. Paths only: production code never imports lab code.
Author: John Khan.
"""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path

from . import LaneContribution

REPO_ROOT = Path(__file__).resolve().parents[4]
OWNER = "K"
FOLDERS: tuple[str, ...] = ("lab/ml/train", "api/tests/ml_train")
REGISTRY_FILE = "api/plumb_api/arena/lane_registry/k_ml_train.py"

K_ML_TRAIN_MODULES: Mapping[str, tuple[str, str]] = {
    REGISTRY_FILE: (OWNER, "ownership list for the ML training framework"),
    "lab/ml/train/__init__.py": (OWNER, "public exports of lab.ml.train"),
    "lab/ml/train/tensor.py": (OWNER, "tensor with reverse-mode autodiff"),
    "lab/ml/train/functional.py": (OWNER, "softmax, conv2d, pooling, layer norm"),
    "lab/ml/train/gradcheck.py": (OWNER, "central finite-difference gradient check"),
    "lab/ml/train/initializers.py": (OWNER, "Xavier and He initialisers"),
    "lab/ml/train/modules.py": (OWNER, "Module, Parameter, Linear, Conv2d, MLP"),
    "lab/ml/train/models.py": (OWNER, "tiny encoder-decoder, residual, attention"),
    "lab/ml/train/losses.py": (OWNER, "MSE, L1, Huber, BCE, cross-entropy, cosine"),
    "lab/ml/train/optim.py": (OWNER, "SGD, Adam, AdamW, clipping, EMA"),
    "lab/ml/train/schedules.py": (OWNER, "learning-rate schedules"),
    "lab/ml/train/data.py": (OWNER, "datasets, loader, augmentation, licence gate"),
    "lab/ml/train/fixtures.py": (OWNER, "synthetic images drawn in code"),
    "lab/ml/train/checkpoint.py": (OWNER, "atomic .npz checkpoints with hash sidecar"),
    "lab/ml/train/callbacks.py": (OWNER, "logging, early stopping, checkpoint, LR"),
    "lab/ml/train/trainer.py": (OWNER, "training loop, accumulation, NaN guard"),
    "lab/ml/train/config.py": (OWNER, "typed configs, JSON/TOML, overrides, hash"),
    "lab/ml/train/recipes.py": (OWNER, "build model, data and trainer from config"),
    "lab/ml/train/experiments.py": (OWNER, "SQLite run registry, sweeps, compare"),
    "lab/ml/train/report.py": (OWNER, "Markdown run and comparison reports"),
    "lab/ml/train/cli.py": (OWNER, "run, resume, list, compare, report, sweep"),
    "lab/ml/train/__main__.py": (OWNER, "python -m lab.ml.train entry point"),
    "lab/ml/train/lora.py": (OWNER, "LoRA adapters for Linear and Conv2d"),
    "lab/ml/train/amp.py": (OWNER, "mixed-precision simulation with loss scaling"),
    "lab/ml/train/search.py": (OWNER, "learning-rate finder, grid and random search"),
    "lab/ml/train/parallel.py": (OWNER, "in-process data-parallel simulation"),
    "lab/ml/train/profiler.py": (OWNER, "per-op time and memory profiling"),
    "lab/ml/train/denoise_example.py": (OWNER, "worked denoising example on drawn images"),
    "lab/ml/train/modelcard.py": (OWNER, "model card writer with licence check"),
    "api/tests/ml_train/test_mltrain_autodiff.py": (OWNER, "gradient checks of every op"),
    "api/tests/ml_train/test_mltrain_modules.py": (OWNER, "module system and models"),
    "api/tests/ml_train/test_mltrain_losses.py": (OWNER, "loss values and gradients"),
    "api/tests/ml_train/test_mltrain_optim.py": (OWNER, "optimisers and schedules"),
    "api/tests/ml_train/test_mltrain_data.py": (OWNER, "data loading and licence gate"),
    "api/tests/ml_train/test_mltrain_registry.py": (OWNER, "this ownership list"),
    "api/tests/ml_train/test_mltrain_checkpoint.py": (OWNER, "checkpoint format and corruption"),
    "api/tests/ml_train/test_mltrain_trainer.py": (OWNER, "trainer, callbacks, resume"),
    "api/tests/ml_train/test_mltrain_config.py": (OWNER, "config loading, overrides, fuzz"),
    "api/tests/ml_train/test_mltrain_experiments.py": (OWNER, "registry, sweeps, reports"),
    "api/tests/ml_train/test_mltrain_cli.py": (OWNER, "CLI and subprocess kill/resume"),
    "api/tests/ml_train/test_mltrain_lora.py": (OWNER, "LoRA inject, merge, save/load"),
    "api/tests/ml_train/test_mltrain_amp.py": (OWNER, "mixed precision and loss scaling"),
    "api/tests/ml_train/test_mltrain_search.py": (OWNER, "LR finder and hyperparameter search"),
    "api/tests/ml_train/test_mltrain_parallel_profile.py": (OWNER, "data parallel, profiler"),
    "api/tests/ml_train/test_mltrain_example_card.py": (OWNER, "denoise example, model card"),
    "api/tests/ml_train/test_mltrain_autodiff_fuzz.py": (OWNER, "random graph gradient checks"),
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


def ml_train_ownership(
    root: Path = REPO_ROOT,
    modules: Mapping[str, tuple[str, str]] = K_ML_TRAIN_MODULES,
) -> list[str]:
    """Problems: unlisted files, listed files that do not exist, wrong owner or purpose."""
    problems = []
    on_disk = set(files_on_disk(root))
    for path in sorted(on_disk - set(modules)):
        problems.append(f"{path}: not listed in k_ml_train.py")
    for path, (owner, purpose) in sorted(modules.items()):
        if not (root / path).is_file():
            problems.append(f"{path}: listed but missing")
        if owner != OWNER:
            problems.append(f"{path}: owner {owner!r}, expected {OWNER!r}")
        if not purpose.strip():
            problems.append(f"{path}: empty purpose")
    return problems
