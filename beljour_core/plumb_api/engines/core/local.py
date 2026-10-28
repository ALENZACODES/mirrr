"""Reference local edit engines for tone and solid overlays.

These are deliberately deterministic building blocks rather than claimed
procedural or medical simulations. Author: John Khan.
"""
from __future__ import annotations

from typing import Any

import numpy as np
from numpy.typing import NDArray

from .composite import difference_mask, exposure, solid
from .engine import EngineResult
from .masks import as_mask, full


class ExposureEngine:
    version = "1.0.0"

    def run(self, image: NDArray[np.uint8], landmarks: Any,
            masks: dict[str, NDArray[np.float32]], params: dict[str, Any], seed: int) -> EngineResult:
        stops = float(params.get("stops", 0))
        mask = as_mask(masks["selection"], image.shape[:2]) if "selection" in masks else full(*image.shape[:2])
        output = exposure(image, stops, mask)
        changed = difference_mask(image, output)
        return EngineResult(output, changed, {"exposure_stops": stops, "coverage": float(changed.mean())},
                            "local", self.version)


class TintEngine:
    version = "1.0.0"

    def run(self, image: NDArray[np.uint8], landmarks: Any,
            masks: dict[str, NDArray[np.float32]], params: dict[str, Any], seed: int) -> EngineResult:
        rgb = params["rgb"]
        if not isinstance(rgb, (tuple, list)) or len(rgb) != 3:
            raise ValueError("expected RGB triple")
        strength = float(params.get("strength", 0.5))
        if "selection" not in masks:
            raise ValueError("selection mask required for tint")
        output = solid(image, tuple(rgb), masks["selection"], strength)
        changed = difference_mask(image, output)
        return EngineResult(output, changed, {"strength": strength, "coverage": float(changed.mean())},
                            "local", self.version)
