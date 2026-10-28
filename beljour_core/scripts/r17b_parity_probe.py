'Emit compact-but-complete R17B Python pixel vectors for TS parity. Author: John Khan.\n\nThe fixture is synthetic. Pixel arrays are deliberately small enough for a test\nprocess while still exercising every R17B engine family. Browser tests compare\nall emitted bytes at a 1/255 tolerance; zero-strength identity is separately\nchecked for every W row.\n'
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.gender_look import render as render_gender
from plumb_api.engines.hair_women import render as render_hair
from plumb_api.engines.makeup_w import render as render_makeup
from plumb_api.engines.shave import render as render_shave
from plumb_api.engines.upscale import upscale
from plumb_api.engines.workflow_w import run as run_workflow

WIDTH = 24
HEIGHT = 28

def _ellipse(xx: np.ndarray, yy: np.ndarray, cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
    dx = (xx / WIDTH - cx) / rx
    dy = (yy / HEIGHT - cy) / ry
    return (dx * dx + dy * dy <= 1).astype(np.float64)

def fixture() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, np.ndarray], dict[str, Any]]:
    yy, xx = np.mgrid[:HEIGHT, :WIDTH]
    image = np.zeros((HEIGHT, WIDTH, 4), dtype=np.uint8)
    image[..., 0] = np.clip(70 + xx * 38 / WIDTH + yy * 5 / HEIGHT, 0, 255)
    image[..., 1] = np.clip(50 + yy * 28 / HEIGHT + xx * 4 / WIDTH, 0, 255)
    image[..., 2] = np.clip(43 + (xx + yy) * 12 / (WIDTH + HEIGHT), 0, 255)
    image[..., 3] = 255
    hair = _ellipse(xx, yy, 0.5, 0.28, 0.36, 0.31)
    scalp = _ellipse(xx, yy, 0.5, 0.25, 0.2, 0.16)
    masks = {'skin': _ellipse(xx, yy, 0.5, 0.52, 0.3, 0.38), 'cheek': np.maximum(_ellipse(xx, yy, 0.34, 0.58, 0.1, 0.07), _ellipse(xx, yy, 0.66, 0.58, 0.1, 0.07)), 'eye': np.maximum(_ellipse(xx, yy, 0.39, 0.44, 0.07, 0.035), _ellipse(xx, yy, 0.61, 0.44, 0.07, 0.035)), 'lip': _ellipse(xx, yy, 0.5, 0.69, 0.1, 0.04), 'brow': np.maximum(_ellipse(xx, yy, 0.39, 0.39, 0.08, 0.022), _ellipse(xx, yy, 0.61, 0.39, 0.08, 0.022)), 'stubble': _ellipse(xx, yy, 0.5, 0.66, 0.18, 0.11), 'beard': _ellipse(xx, yy, 0.5, 0.7, 0.21, 0.14), 'palette_region': _ellipse(xx, yy, 0.25, 0.55, 0.12, 0.12)}
    geometry = {'crown': (0.5, 0.13), 'left_temple': (0.27, 0.33), 'right_temple': (0.73, 0.33), 'chin': (0.5, 0.84)}
    return (image, hair, scalp, masks, geometry)

def _flat(array: np.ndarray) -> list[int]:
    return np.ascontiguousarray(array).reshape(-1).astype(np.uint8).tolist()

def _mask_flat(array: np.ndarray) -> list[float]:
    return [round(float(value), 6) for value in np.asarray(array).reshape(-1)]

def _hair_request(feature: str) -> dict[str, Any]:
    return {'feature': feature, 'amount': 0.61, 'colour': (92, 58, 40), 'accent': (176, 122, 78), 'length_ratio': 0.45, 'volume': 0.42, 'grey_share': 0.38, 'month': 12, 'curl_strength': 0.64, 'heat_shape': 0.55, 'humidity': 55.0, 'seed': 17}

def _makeup_request(feature: str) -> dict[str, Any]:
    finish = 'cream' if feature == 'W9' else 'satin'
    return {'feature': feature, 'amount': 0.59, 'shade': (117, 67, 62), 'accent': (156, 91, 80), 'finish': finish, 'face_shape': 'balanced', 'undertone': 'olive', 'oxidation_delta': -6.0, 'season_shift': 0.22, 'look': 'gallery_glow', 'metadata': {'issue': 'redness', 'outfit_colour': (72, 88, 112)}}

def main() -> int:
    image, hair, scalp, masks, geometry = fixture()
    hair_vectors: dict[str, Any] = {}
    for feature in ('W19', 'W23', 'W29', 'W33', 'W40', 'W44'):
        result = render_hair(image, hair, scalp, geometry, _hair_request(feature))
        hair_vectors[feature] = {'pixels': _flat(result.image), 'coverage': _mask_flat(result.coverage)}
    makeup_vectors: dict[str, Any] = {}
    for feature in ('W7', 'W8', 'W9', 'W11', 'W12', 'W14', 'W16', 'W17'):
        result = render_makeup(image, masks, _makeup_request(feature))
        makeup_vectors[feature] = {'pixels': _flat(result.image), 'coverage': _mask_flat(result.coverage)}
    upscaled = upscale(image, scale=2, detail=0.55)
    gender, gender_report = render_gender(image, masks, {'direction': 'masculine', 'level': 'hyper', 'amount': 0.65})
    shaved, shave_report = render_shave(image, masks['beard'], masks['cheek'], 0.8)
    workflow = {'W94': run_workflow({'feature': 'W94', 'city': 'Local', 'service': 'Example', 'price_low': 80, 'price_high': 140, 'sessions': 1, 'maintenance_weeks': 8}), 'W96': run_workflow({'feature': 'W96', 'occasion': 'evening', 'look_id': 'gallery_glow'}), 'W99': run_workflow({'feature': 'W99', 'maintenance_weeks': 8, 'metadata': {'start_date': '2026-10-24'}}), 'W100': run_workflow({'feature': 'W100', 'depth': 42, 'undertone': 'olive', 'hair_base': 'medium brown', 'allergens': ['fragrance'], 'measured_on': '2026-10-24'})}
    payload = {'format': 'beljour-r17b-parity-probe/1', 'author': 'John Khan', 'width': WIDTH, 'height': HEIGHT, 'source_sha256': hashlib.sha256(image.tobytes()).hexdigest(), 'source': _flat(image), 'hair_mask': _mask_flat(hair), 'scalp_mask': _mask_flat(scalp), 'masks': {name: _mask_flat(mask) for name, mask in masks.items()}, 'geometry': geometry, 'hair': hair_vectors, 'makeup': makeup_vectors, 'workflow': workflow, 'upscale2': {'shape': list(upscaled.shape), 'pixels': _flat(upscaled)}, 'gender': {'pixels': _flat(gender), 'report': gender_report}, 'shave': {'pixels': _flat(shaved), 'report': shave_report}}
    print(json.dumps(payload, sort_keys=True, separators=(',', ':')))
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
