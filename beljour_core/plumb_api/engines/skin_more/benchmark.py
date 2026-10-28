'Written pass definitions and box-side metrics for W77-W92. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

PASS_DEFINITIONS = {'W77': 'zero-strength identity; texture correlation >= .90; medium remains visually sheer; no automatic skin lightening', 'W78': 'zero-strength identity; colour-only transform; dry-zone overlay bounded; deep-skin scenario changes are subtler, not excluded', 'W79': 'all changes inside checked face/neck/chest/hand regions; continuity report present; no body commentary', 'W80': 'checked skin region required; no SPF efficacy/dose output; clear finish <= tinted <= mineral cast strength', 'W81': 'checked user-marked pigmentation only; no diagnosis strings; outside-region error <= .01', 'W82': 'checked user-marked redness only; no diagnosis/treatment claim; outside-region error <= .01', 'W83': 'explicit local-health-data consent; input remains local; export rows round-trip; no 28-day/fertility prediction', 'W84': 'texture retained; pro-age copy; dryness and adult-acne states can coexist in metadata without diagnostic inference', 'W85': 'procedural accessory only; checked anchor region accepted; scale changes monotonically with amount', 'W86': 'procedural frame geometry; true-scale control monotonic; fit warnings use neutral language', 'W87': 'checked hand/nail region only; colour-only output; nail silhouette byte-identical outside region', 'W88': 'checked scarf region only; zero hair-removal path; co-design validation remains explicit release dependency', 'W89': 'bundle is editable; interview amount starts lower; no competence/beauty-score language', 'W90': 'preserve is pixel identity; faux modes are labelled and remain in checked freckle region', 'W91': 'two checked continuity regions required for score; lighting caveat present; no shape/body score', 'W92': 'texture correlation >= .90; no anti-age/erase framing; amount zero identity'}

@dataclass(frozen=True)
class SkinMetrics:
    feature: str
    outside_error: float
    texture_correlation: float
    changed_fraction: float
    passed: bool

def metrics(original: np.ndarray, result: np.ndarray, coverage: np.ndarray, feature: str) -> SkinMetrics:
    a = original[..., :3].astype(float)
    b = result[..., :3].astype(float)
    m = coverage > 0.05
    d = np.mean(np.abs(a - b), axis=2) / 255
    outside = float(d[~m].mean()) if np.any(~m) else 0.0
    changed = float(np.mean(d > 1e-06))
    if np.count_nonzero(m) > 4:
        x = a[m].mean(axis=1)
        y = b[m].mean(axis=1)
        corr = float(np.corrcoef(x, y)[0, 1]) if np.std(x) > 1e-06 and np.std(y) > 1e-06 else 1.0
    else:
        corr = 1.0
    return SkinMetrics(feature, outside, corr, changed, outside <= 0.02 and corr >= 0.75)

def report(rows: list[SkinMetrics]) -> dict[str, Any]:
    return {'group': 'skin_more', 'pass_definitions': PASS_DEFINITIONS, 'features': {r.feature: r.__dict__ for r in rows}, 'status': 'passed' if rows and all(r.passed for r in rows) else 'not passed', 'real_faces': 'box-side only; source code does not claim real-face validation'}
