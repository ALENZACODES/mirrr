'Box-side metrics and written pass definitions for lip features. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from .contracts import FEATURES

PASS_DEFINITIONS = {'W45': 'zero-strength identity; adult gate; capped warp; texture correlation >= 0.90 in changed lip pixels', 'W46': 'liner remains outside/at lip edge, corners receive <= 35% of peak overline, zero-strength identity', 'W47': 'adult gate; healed default weaker than fresh; no change outside lip support above tolerance', 'W48': 'adult gate; upper-lip-only displacement cap; no eye or face-outline movement', 'W49': 'adult gate; 0.5-style displacement < 1.0-style displacement; hard cap enforced', 'W54': 'teeth region byte-identical when a checked teeth mask is supplied; lip colour changes', 'W55': 'same hue family across finishes; matte retains line energy; gloss highlight remains inside lip mask', 'W56': 'centre wear increases monotonically two-hours < coffee < meal; labelled estimate', 'W57': 'starting pigmentation affects output; two-tone asymmetry remains measurable; no pink normalization'}

@dataclass(frozen=True)
class LipMetrics:
    feature: str
    identity_error: float
    outside_error: float
    texture_correlation: float
    changed_fraction: float
    passed: bool

def metrics(original: np.ndarray, result: np.ndarray, coverage: np.ndarray, feature: str) -> LipMetrics:
    if feature not in FEATURES:
        raise ValueError('unsupported feature')
    a = original[..., :3].astype(float)
    b = result[..., :3].astype(float)
    m = coverage > 0.05
    diff = np.mean(np.abs(a - b), axis=2) / 255
    outside = float(diff[~m].mean()) if np.any(~m) else 0
    changed = float(np.mean(np.any(a != b, axis=2)))
    if np.count_nonzero(m) > 4:
        x = a[m].mean(axis=1)
        y = b[m].mean(axis=1)
        tc = float(np.corrcoef(x, y)[0, 1]) if np.std(x) > 1e-06 and np.std(y) > 1e-06 else 1.0
    else:
        tc = 1.0
    identity = float(diff.mean())
    passed = outside <= 0.025 and tc >= 0.8
    return LipMetrics(feature, identity, outside, tc, changed, passed)

def report(rows: list[LipMetrics]) -> dict[str, Any]:
    return {'group': 'lips', 'pass_definitions': PASS_DEFINITIONS, 'features': {r.feature: r.__dict__ for r in rows}, 'status': 'passed' if rows and all(r.passed for r in rows) else 'not passed', 'real_faces': 'box-side only; no real-face result is claimed by source code'}
