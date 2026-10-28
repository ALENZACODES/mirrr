'Finish-class lip wear scenarios for W56. Author: John Khan.'

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class WearScenario:
    name: str
    centre_loss: float
    inner_ring_loss: float
    transfer_loss: float
    edge_loss: float
    label: str

SCENARIOS = {'two_hours': WearScenario('two_hours', 0.25, 0.08, 0.04, 0.02, 'Broad two-hour finish-class estimate.'), 'coffee': WearScenario('coffee', 0.46, 0.14, 0.12, 0.03, 'Coffee-contact finish-class estimate.'), 'meal': WearScenario('meal', 0.68, 0.24, 0.2, 0.08, 'Meal-contact finish-class estimate.')}

def scenario(name: str) -> WearScenario:
    try:
        return SCENARIOS[name]
    except KeyError as exc:
        raise ValueError('unknown lip wear scenario') from exc

def field(mask: np.ndarray, name: str, seed: int=17) -> np.ndarray:
    cfg = scenario(name)
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    cx = w * 0.5
    cy = h * 0.59
    centre = np.exp(-(((xx - cx) / (w * 0.09 + 1.0)) ** 2 + ((yy - cy) / (h * 0.035 + 1.0)) ** 2) * 2.0)
    ring_r = np.sqrt(((xx - cx) / (w * 0.13 + 1.0)) ** 2 + ((yy - cy) / (h * 0.05 + 1.0)) ** 2)
    ring = np.exp(-(ring_r - 1.0) ** 2 * 7.0)
    transfer = np.clip(np.sin(xx * 0.13 + seed * 0.31) * 0.5 + 0.5, 0.0, 1.0)
    edge = np.maximum(np.maximum(np.abs(mask - np.roll(mask, 1, axis=0)), np.abs(mask - np.roll(mask, -1, axis=0))), np.maximum(np.abs(mask - np.roll(mask, 1, axis=1)), np.abs(mask - np.roll(mask, -1, axis=1))))
    loss = cfg.centre_loss * centre + cfg.inner_ring_loss * ring + cfg.transfer_loss * transfer * centre + cfg.edge_loss * edge
    return np.clip(mask * (1.0 - np.clip(loss, 0.0, 0.95)), 0.0, 1.0).astype(np.float32)

def centre_retention(mask: np.ndarray, worn: np.ndarray) -> float:
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w]
    centre = ((xx - w * 0.5) / (w * 0.1 + 1)) ** 2 + ((yy - h * 0.59) / (h * 0.04 + 1)) ** 2 < 1
    active = centre & (mask > 0.1)
    if not np.any(active):
        return 1.0
    denom = float(np.mean(mask[active]))
    return float(np.mean(worn[active]) / max(denom, 1e-08))

def monotonic_wear(mask: np.ndarray, seed: int=17) -> dict[str, float | bool]:
    retention = {name: centre_retention(mask, field(mask, name, seed)) for name in SCENARIOS}
    ordered = retention['two_hours'] > retention['coffee'] > retention['meal']
    return {**retention, 'monotonic': ordered}

def report(mask: np.ndarray, name: str, seed: int=17) -> dict[str, object]:
    worn = field(mask, name, seed)
    cfg = scenario(name)
    return {'scenario': cfg.name, 'label': cfg.label, 'centre_retention': centre_retention(mask, worn), 'coverage_retention': float(np.sum(worn) / max(float(np.sum(mask)), 1e-08)), 'product_claim': False, 'estimate_class': 'finish-class'}
