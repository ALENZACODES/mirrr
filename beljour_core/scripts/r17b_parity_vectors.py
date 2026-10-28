'Emit deterministic R17B parity vectors for Python/browser mirrors. Author: John Khan.'
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.gender_look import render as render_gender
from plumb_api.engines.hair_women import render as render_hair
from plumb_api.engines.hair_women.contracts import FEATURES as HAIR_FEATURES
from plumb_api.engines.makeup_w import render as render_makeup
from plumb_api.engines.makeup_w.contracts import FEATURES as MAKEUP_FEATURES
from plumb_api.engines.shave import render as render_shave
from plumb_api.engines.upscale import upscale
from plumb_api.engines.workflow_w import run as run_workflow


def fixture(width: int=64, height: int=72) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[str, np.ndarray], dict[str, Any]]:
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 4), dtype=np.uint8)
    image[..., 0] = np.clip(70 + xx * 38 / width + yy * 5 / height, 0, 255)
    image[..., 1] = np.clip(50 + yy * 28 / height + xx * 4 / width, 0, 255)
    image[..., 2] = np.clip(43 + (xx + yy) * 12 / (width + height), 0, 255)
    image[..., 3] = 255

    def ellipse(cx: float, cy: float, rx: float, ry: float) -> np.ndarray:
        dx = (xx / width - cx) / rx
        dy = (yy / height - cy) / ry
        return (dx * dx + dy * dy <= 1).astype(np.float64)
    hair = ellipse(0.5, 0.28, 0.36, 0.31)
    scalp = ellipse(0.5, 0.25, 0.2, 0.16)
    masks = {'skin': ellipse(0.5, 0.52, 0.3, 0.38), 'cheek': np.maximum(ellipse(0.34, 0.58, 0.1, 0.07), ellipse(0.66, 0.58, 0.1, 0.07)), 'eye': np.maximum(ellipse(0.39, 0.44, 0.07, 0.035), ellipse(0.61, 0.44, 0.07, 0.035)), 'lip': ellipse(0.5, 0.69, 0.1, 0.04), 'brow': np.maximum(ellipse(0.39, 0.39, 0.08, 0.022), ellipse(0.61, 0.39, 0.08, 0.022)), 'stubble': ellipse(0.5, 0.66, 0.18, 0.11), 'beard': ellipse(0.5, 0.7, 0.21, 0.14), 'palette_region': ellipse(0.25, 0.55, 0.12, 0.12)}
    geometry = {'crown': (0.5, 0.13), 'left_temple': (0.27, 0.33), 'right_temple': (0.73, 0.33), 'chin': (0.5, 0.84)}
    return (image, hair, scalp, masks, geometry)

def digest(array: np.ndarray) -> str:
    return hashlib.sha256(np.ascontiguousarray(array).tobytes()).hexdigest()

def summary(array: np.ndarray) -> dict[str, Any]:
    rgb = array[..., :3].astype(np.float64)
    return {'shape': list(array.shape), 'sha256': digest(array), 'mean_rgb': [round(float(rgb[..., c].mean()), 6) for c in range(3)], 'min_rgb': [int(rgb[..., c].min()) for c in range(3)], 'max_rgb': [int(rgb[..., c].max()) for c in range(3)]}

def hair_rows(image: np.ndarray, hair: np.ndarray, scalp: np.ndarray, geometry: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for feature in HAIR_FEATURES:
        request = {'feature': feature, 'amount': 0.0, 'colour': (92, 58, 40), 'accent': (176, 122, 78), 'length_ratio': 0.45, 'volume': 0.42, 'grey_share': 0.38, 'month': 12, 'curl_strength': 0.64, 'heat_shape': 0.55, 'humidity': 55.0, 'seed': 17}
        result = render_hair(image, hair, scalp, geometry, request)
        rows.append({'feature': feature, 'amount': 0.0, **summary(result.image), 'coverage_sha256': digest((result.coverage * 255).astype(np.uint8))})
        request['amount'] = 0.61
        active = render_hair(image, hair, scalp, geometry, request)
        rows.append({'feature': feature, 'amount': 0.61, **summary(active.image), 'coverage_sha256': digest((active.coverage * 255).astype(np.uint8))})
    return rows

def makeup_rows(image: np.ndarray, masks: dict[str, np.ndarray]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for feature in MAKEUP_FEATURES:
        request: dict[str, Any] = {'feature': feature, 'amount': 0.0, 'shade': (117, 67, 62), 'accent': (156, 91, 80), 'finish': 'satin', 'face_shape': 'balanced', 'undertone': 'olive', 'oxidation_delta': -6.0, 'season_shift': 0.22, 'look': 'gallery_glow', 'metadata': {'issue': 'redness', 'outfit_colour': (72, 88, 112)}}
        kwargs: dict[str, Any] = {}
        if feature == 'W13':
            kwargs = {'reference': image.copy(), 'reference_masks': {name: masks[name] for name in ('eye', 'cheek', 'lip')}}
        result = render_makeup(image, masks, request, **kwargs)
        rows.append({'feature': feature, 'amount': 0.0, **summary(result.image), 'coverage_sha256': digest((result.coverage * 255).astype(np.uint8))})
        request['amount'] = 0.59
        if feature == 'W9':
            request['finish'] = 'cream'
        elif feature == 'W10':
            request['finish'] = 'matte'
        active = render_makeup(image, masks, request, **kwargs)
        rows.append({'feature': feature, 'amount': 0.59, **summary(active.image), 'coverage_sha256': digest((active.coverage * 255).astype(np.uint8))})
    return rows

def workflow_rows() -> list[dict[str, Any]]:
    requests = [{'feature': 'W94', 'city': 'Local', 'service': 'Example', 'price_low': 80, 'price_high': 140, 'sessions': 1, 'maintenance_weeks': 8}, {'feature': 'W96', 'occasion': 'evening', 'look_id': 'gallery_glow'}, {'feature': 'W99', 'maintenance_weeks': 8, 'metadata': {'start_date': '2026-10-24'}}, {'feature': 'W100', 'depth': 42, 'undertone': 'olive', 'hair_base': 'medium brown', 'allergens': ['fragrance'], 'measured_on': '2026-10-24'}]
    rows: list[dict[str, Any]] = []
    for request in requests:
        result = run_workflow(request)
        canonical = json.dumps(result, sort_keys=True, separators=(',', ':'))
        rows.append({'feature': request['feature'], 'sha256': hashlib.sha256(canonical.encode()).hexdigest(), 'result': result})
    return rows

def auxiliary_rows(image: np.ndarray, masks: dict[str, np.ndarray]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for scale in (2, 4):
        output = upscale(image, scale=scale, detail=0.55)
        rows.append({'feature': f'UPSCALE{scale}', **summary(output)})
    for direction in ('neutral', 'feminine', 'masculine'):
        for level in ('normal', 'extra', 'hyper'):
            output, report = render_gender(image, masks, {'direction': direction, 'level': level, 'amount': 0.65})
            rows.append({'feature': 'GENDER', 'direction': direction, 'level': level, **summary(output), 'report': report})
    shaved, report = render_shave(image, masks['beard'], masks['cheek'], 0.8)
    rows.append({'feature': 'SHAVE', **summary(shaved), 'report': report})
    return rows

def main(argv: list[str] | None=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--pretty', action='store_true')
    args = parser.parse_args(argv)
    image, hair, scalp, masks, geometry = fixture()
    payload = {'format': 'beljour-r17b-parity/1', 'author': 'John Khan', 'source_sha256': digest(image), 'hair': hair_rows(image, hair, scalp, geometry), 'makeup': makeup_rows(image, masks), 'workflow': workflow_rows(), 'auxiliary': auxiliary_rows(image, masks)}
    print(json.dumps(payload, indent=2 if args.pretty else None, sort_keys=True))
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
