'Checked reference-photo analysis for W13 without learned face parsing. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .colourspace import lab_to_lch, rgb_to_lab


@dataclass(frozen=True)
class RegionSummary:
    name: str
    median_rgb: tuple[int, int, int]
    median_l: float
    median_chroma: float
    hue: float
    pixel_count: int
    texture: float

def _texture(grey: np.ndarray, active: np.ndarray) -> float:
    gx = np.zeros_like(grey)
    gy = np.zeros_like(grey)
    gx[:, 1:-1] = (grey[:, 2:] - grey[:, :-2]) * 0.5
    gy[1:-1] = (grey[2:] - grey[:-2]) * 0.5
    return float(np.mean(np.hypot(gx, gy)[active])) if np.any(active) else 0.0

def summarize_region(image: np.ndarray, mask: np.ndarray, name: str) -> RegionSummary:
    active = np.asarray(mask) > 0.2
    if active.shape != image.shape[:2] or np.count_nonzero(active) < 4:
        raise ValueError(f'checked {name} region is too small')
    rgb = image[..., :3].astype(np.float64)
    pixels = rgb[active]
    median = np.median(pixels, axis=0)
    lab = rgb_to_lab(pixels)
    lch = lab_to_lch(lab)
    grey = np.mean(rgb, axis=2)
    return RegionSummary(name=name, median_rgb=(int(round(median[0])), int(round(median[1])), int(round(median[2]))), median_l=float(np.median(lch[:, 0])), median_chroma=float(np.median(lch[:, 1])), hue=float(np.median(lch[:, 2])), pixel_count=int(np.count_nonzero(active)), texture=_texture(grey, active))

def compare_reference(reference: np.ndarray, target: np.ndarray, reference_mask: np.ndarray, target_mask: np.ndarray, name: str) -> dict[str, float | str | tuple[int, int, int]]:
    source = summarize_region(reference, reference_mask, name)
    destination = summarize_region(target, target_mask, name)
    hue_delta = abs(source.hue - destination.hue) % 360
    hue_delta = min(hue_delta, 360 - hue_delta)
    return {'region': name, 'source_rgb': source.median_rgb, 'target_rgb': destination.median_rgb, 'lightness_delta': source.median_l - destination.median_l, 'chroma_ratio': source.median_chroma / max(destination.median_chroma, 1e-09), 'hue_delta': hue_delta, 'texture_ratio': source.texture / max(destination.texture, 1e-09), 'label': 'user-checked reference comparison; lighting affects colour'}

def recipe(reference: np.ndarray, target: np.ndarray, reference_masks: dict[str, np.ndarray], target_masks: dict[str, np.ndarray]) -> dict[str, object]:
    required = ('eye', 'cheek', 'lip')
    missing = [name for name in required if name not in reference_masks or name not in target_masks]
    if missing:
        raise ValueError(f'missing checked reference regions: {missing}')
    regions = [compare_reference(reference, target, reference_masks[name], target_masks[name], name) for name in required]
    return {'source': 'user_checked_reference', 'automatic_face_parsing': False, 'regions': regions, 'network': False, 'brand_data': False}
