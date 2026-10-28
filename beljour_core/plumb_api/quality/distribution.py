"""FID/KID computations on *cleared* feature activations, not image pixels.

No pretrained weights are bundled, downloaded or guessed. FID means Gaussian
Fréchet distance on a separately licensed Inception-v3 pool3 feature model;
KID is an unbiased polynomial-kernel MMD on those features. Scores on a
home-made proxy embedding MUST NOT be presented as FID or KID.

The public interface accepts ephemeral activations and a verified provenance
record. All training sets are disallowed until they have explicit commercial
clearance, and the prohibited source list is always rejected.
Author: John Khan.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from plumb_api.arena.constants import BANNED_SOURCES as PROHIBITED

PERMITTED_LICENCES = frozenset({"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "Own work"})


@dataclass(frozen=True)
class FeatureProvenance:
    """Evidence is supplied by a human-reviewed licence manifest, not inferred."""

    feature_family: str
    code_licence: str
    weights_licence: str
    weights_sha256: str
    training_data: tuple[str, ...]
    data_commercial_cleared: bool
    evidence_reference: str

    def problems(self) -> list[str]:
        issues: list[str] = []
        if self.feature_family != "inception-v3-pool3":
            issues.append("not Inception-v3 pool3 activations")
        if self.code_licence not in PERMITTED_LICENCES:
            issues.append("feature model code licence not approved")
        if self.weights_licence not in PERMITTED_LICENCES:
            issues.append("model weights licence not approved")
        if (len(self.weights_sha256) != 64 or
                any(letter not in "0123456789abcdef" for letter in self.weights_sha256)):
            issues.append("model weights need an exact SHA-256")
        if not self.training_data or not self.data_commercial_cleared:
            issues.append("training-data rights not verified for commercial use")
        if not self.evidence_reference.strip():
            issues.append("human-reviewable provenance reference missing")
        if any(re.sub("[^a-z0-9]", "", bad) in re.sub("[^a-z0-9]", "", item.lower())
               for item in self.training_data for bad in PROHIBITED):
            issues.append("banned face dataset in model provenance")
        return issues


@dataclass(frozen=True)
class DistributionResult:
    fid: float | None
    kid: float | None
    fid_status: Literal["MEASURED", "UNPROVEN"]
    kid_status: Literal["MEASURED", "UNPROVEN"]
    samples_reference: int
    samples_edited: int
    reason: str

    def json(self) -> dict[str, str | int | float | None]:
        return {"fid": self.fid, "kid": self.kid, "fid_status": self.fid_status,
                "kid_status": self.kid_status, "samples_reference": self.samples_reference,
                "samples_edited": self.samples_edited, "reason": self.reason}


def _features(array: NDArray[np.floating] | NDArray[np.integer]) -> NDArray[np.float64]:
    arr = np.asarray(array, dtype=np.float64)
    if arr.ndim != 2 or not arr.shape[0] or not arr.shape[1] or arr.shape[1] > 4096:
        raise ValueError("features must be a nonempty 2D activation array")
    if not np.isfinite(arr).all():
        raise ValueError("feature activations must be finite")
    return arr


def _cov(arr: NDArray[np.float64]) -> NDArray[np.float64]:
    """Biased population covariance (defined for one sample), symmetric PSD."""
    centered = arr - np.mean(arr, axis=0, keepdims=True)
    return (centered.T @ centered) / len(arr)


def _sqrt_psd(matrix: NDArray[np.float64]) -> NDArray[np.float64]:
    sym = (matrix + matrix.T) / 2
    values, vectors = np.linalg.eigh(sym)
    values = np.maximum(values, 0.0)
    return (vectors * np.sqrt(values)) @ vectors.T


def frechet_activations(first: NDArray[np.float64], second: NDArray[np.float64]) -> float:
    """Numerically stable Fréchet distance of two Gaussian feature clouds."""
    a, b = _features(first), _features(second)
    if a.shape[1] != b.shape[1]:
        raise ValueError("embedding dimension mismatch")
    cov_a, cov_b = _cov(a), _cov(b)
    root_a = _sqrt_psd(cov_a)
    # A^(1/2) B A^(1/2) is PSD, unlike A @ B: stable real eigenvalues.
    cross = root_a @ cov_b @ root_a
    trace_root = float(np.sqrt(np.maximum(np.linalg.eigvalsh((cross + cross.T) / 2), 0.0)).sum())
    mean_delta = np.mean(a, axis=0) - np.mean(b, axis=0)
    score = float(mean_delta @ mean_delta + np.trace(cov_a) + np.trace(cov_b) - 2 * trace_root)
    return max(0.0, score)  # tiny negative values are floating-point roundoff


def polynomial_kid(first: NDArray[np.float64], second: NDArray[np.float64]) -> float:
    """Unbiased cubic polynomial KID estimate, n>=2 in both cohorts.

    Negative estimates are valid for unbiased MMD² and MUST NOT be clipped.
    For very small groups, return UNPROVEN through `measure_distribution`.
    """
    a, b = _features(first), _features(second)
    if a.shape[1] != b.shape[1] or min(len(a), len(b)) < 2:
        raise ValueError("KID requires 2 or more samples in each matching feature space")
    dim = a.shape[1]
    kernel_aa = (a @ a.T / dim + 1.0) ** 3
    kernel_bb = (b @ b.T / dim + 1.0) ** 3
    kernel_ab = (a @ b.T / dim + 1.0) ** 3
    m, n = len(a), len(b)
    result = ((kernel_aa.sum() - np.trace(kernel_aa)) / (m * (m - 1))
              + (kernel_bb.sum() - np.trace(kernel_bb)) / (n * (n - 1))
              - 2.0 * kernel_ab.mean())
    if not math.isfinite(float(result)):
        raise ValueError("KID result is nonfinite")
    return float(result)


def measure_distribution(reference: NDArray[np.float64], edited: NDArray[np.float64],
                         provenance: FeatureProvenance | None) -> DistributionResult:
    """No licence evidence => no published FID/KID, even if numbers are easy."""
    a, b = _features(reference), _features(edited)
    if a.shape[1] != b.shape[1]:
        raise ValueError("feature dimension mismatch")
    problems = ["no commercially cleared Inception feature extractor"] if provenance is None else provenance.problems()
    if problems:
        return DistributionResult(None, None, "UNPROVEN", "UNPROVEN", len(a), len(b), "; ".join(problems))
    fid = frechet_activations(a, b)
    if min(len(a), len(b)) < 2:
        return DistributionResult(fid, None, "MEASURED", "UNPROVEN", len(a), len(b),
                                  "KID requires at least two independent observations per cohort")
    return DistributionResult(fid, polynomial_kid(a, b), "MEASURED", "MEASURED", len(a), len(b),
                              "screening scores only; no identity or human-quality decision")
