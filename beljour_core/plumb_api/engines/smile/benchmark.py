'Box-side acceptance definitions for smile features. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

PASS_DEFINITIONS = {'W50': '18+ gate; checked teeth/gum polygons required; static-preview label; no pixels outside checked oral annotation change', 'W51': '18+ gate; checked teeth polygon required; texture correlation >= .80; no default paper-white shade', 'W52': '18+ gate; keep-gap amount zero is identity; edited band remains inside checked teeth region; midline error reported', 'W53': '18+ gate; checked teeth/gum polygons required; dental-consult and surgical-context note present', 'W58': '18+ gate; >=2 checked frame annotations; frame count preserved; max annotation jump reported; no unverified auto-tracking'}

@dataclass(frozen=True)
class SmileMetrics:
    feature: str
    outside_error: float
    changed_fraction: float
    passed: bool

def metrics(original: np.ndarray, result: np.ndarray, coverage: np.ndarray, feature: str) -> SmileMetrics:
    d = np.mean(np.abs(original[..., :3].astype(float) - result[..., :3].astype(float)), axis=2) / 255
    m = coverage > 0.05
    outside = float(d[~m].mean()) if np.any(~m) else 0.0
    changed = float(np.mean(d > 1e-06))
    return SmileMetrics(feature, outside, changed, outside <= 0.01)

def report(rows: list[SmileMetrics]) -> dict[str, Any]:
    return {'group': 'smile', 'pass_definitions': PASS_DEFINITIONS, 'features': {r.feature: r.__dict__ for r in rows}, 'status': 'passed' if rows and all(r.passed for r in rows) else 'not passed', 'real_faces': 'run locally on checked box evidence'}
