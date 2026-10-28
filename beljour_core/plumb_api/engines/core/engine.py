"""Contract 13: local engine invocation and versioned result envelope.

The engine sees RGB/RGBA numpy arrays and named HxW alpha masks. It cannot
access providers or network services. The caller retains input ownership.
Author: John Khan.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

import numpy as np
from numpy.typing import NDArray

from .composite import difference_mask
from .masks import as_mask


@dataclass(frozen=True)
class EngineResult:
    image: NDArray[np.uint8]
    editMask: NDArray[np.float32]
    metrics: dict[str, float]
    provenance: str
    pipelineVersion: str

    def __post_init__(self) -> None:
        if self.provenance != "local":
            raise ValueError("local engine must declare local provenance")
        if not self.pipelineVersion:
            raise ValueError("pipelineVersion required")
        if self.image.dtype != np.uint8 or self.image.ndim != 3 or self.image.shape[2] not in (3, 4):
            raise ValueError("result image must be RGB/RGBA uint8")
        as_mask(self.editMask, self.image.shape[:2])
        for value in self.metrics.values():
            if not np.isfinite(value):
                raise ValueError("non-finite metric")


class LocalEngine(Protocol):
    """Public plug-in interface. No provider dependency permitted."""
    def run(self, image: NDArray[np.uint8], landmarks: Any,
            masks: dict[str, NDArray[np.float32]],
            params: dict[str, Any], seed: int) -> EngineResult: ...


def run_engine(engine: LocalEngine, image: NDArray[np.uint8], landmarks: Any,
               masks: dict[str, NDArray[np.float32]], params: dict[str, Any],
               seed: int = 0) -> EngineResult:
    """Check input and output invariants and reject edits outside editMask."""
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("input must be HxWx3/4 uint8")
    if not isinstance(seed, int) or isinstance(seed, bool) or not 0 <= seed < 2**64:
        raise ValueError("seed must be a 64-bit unsigned integer")
    original = image.copy()
    safe_masks = {k: as_mask(v, image.shape[:2]) for k, v in masks.items()}
    result = engine.run(original.copy(), landmarks, safe_masks, dict(params), seed)
    if not isinstance(result, EngineResult) or result.image.shape != image.shape:
        raise ValueError("engine returned an invalid result")
    if not np.array_equal(image, original):
        raise ValueError("engine mutated source image")
    actual = difference_mask(image, result.image)
    if np.any((actual > 0) & (result.editMask <= 0)):
        raise ValueError("engine edited pixels outside declared editMask")
    return result
