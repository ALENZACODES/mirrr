'Emit deterministic R16B Python zero-strength parity vectors. Author: John Khan.'

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.lips import render as render_lip
from plumb_api.engines.skin_more import render as render_skin
from plumb_api.engines.smile import render as render_smile


def image() -> np.ndarray:
    h, w = (48, 48)
    yy, xx = np.mgrid[:h, :w]
    a = np.zeros((h, w, 4), np.uint8)
    a[..., 0] = 140 + xx % 40
    a[..., 1] = 100 + yy % 35
    a[..., 2] = 85 + (xx + yy) % 25
    a[..., 3] = 255
    return a

def mesh() -> np.ndarray:
    p = np.full((478, 2), 0.5, float)
    lip = np.array([[0.39, 0.66], [0.43, 0.64], [0.47, 0.635], [0.5, 0.64], [0.53, 0.635], [0.57, 0.64], [0.61, 0.66], [0.58, 0.69], [0.54, 0.705], [0.5, 0.71], [0.46, 0.705], [0.42, 0.69]])
    for i, j in enumerate([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308]):
        p[j] = lip[i]
    for i, j in enumerate([324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415]):
        p[j] = lip[i % len(lip)]
    return p

def ann():
    return {'teeth': [[0.42, 0.64], [0.58, 0.64], [0.57, 0.7], [0.43, 0.7]], 'gum': [[0.43, 0.635], [0.57, 0.635], [0.56, 0.655], [0.44, 0.655]], 'midline_x': 0.5}

def region(name='region'):
    return {'name': name, 'points': [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]]}

def digest(a: np.ndarray) -> str:
    return hashlib.sha256(a.tobytes()).hexdigest()

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--pretty', action='store_true')
    args = parser.parse_args()
    src = image()
    m = mesh()
    rows = []
    lip_styles = {'W45': 'natural_plump', 'W46': 'balanced', 'W47': 'healed', 'W48': 'rest', 'W49': '0.5_ml_style', 'W54': 'blue_based', 'W55': 'matte', 'W56': 'coffee', 'W57': 'medium'}
    for f, style in lip_styles.items():
        r = render_lip(src, m, {'feature': f, 'style': style, 'amount': 0, 'adult_confirmed': f in {'W45', 'W47', 'W48', 'W49'}})
        rows.append({'feature': f, 'sha256': digest(r.image), 'label': r.report['label'], 'shape': list(r.image.shape)})
    for f in ('W50', 'W51', 'W52', 'W53'):
        r = render_smile(src, {'feature': f, 'amount': 0, 'adult_confirmed': True, 'annotation': ann()})
        rows.append({'feature': f, 'sha256': digest(r.image), 'label': r.report['label'], 'shape': list(r.image.shape)})
    frames = [ann(), ann()]
    r = render_smile(src, {'feature': 'W58', 'amount': 0, 'adult_confirmed': True, 'frame_annotations': frames})
    rows.append({'feature': 'W58', 'sha256': digest(r.image), 'label': r.report['label'], 'shape': list(r.image.shape)})
    styles = {'W77': 'sheer', 'W78': 'olive', 'W79': 'match_face', 'W80': 'mineral_cast', 'W81': 'orange_corrector', 'W82': 'green_micro', 'W83': 'irregular', 'W84': 'dewy_base', 'W85': 'both', 'W86': 'soft_round', 'W87': 'berry', 'W88': 'soft_drape', 'W89': 'interview', 'W90': 'faux_subtle', 'W91': 'continuity', 'W92': 'texture_first'}
    manual = {'W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'}
    for f, style in styles.items():
        req = {'feature': f, 'style': style, 'amount': 0}
        if f in manual:
            req['masks'] = [region('a'), region('b')]
        if f == 'W83':
            req.update(consent_local_health_data=True, diary_values=[0.2, 0.3])
        r = render_skin(src, req)
        rows.append({'feature': f, 'sha256': digest(r.image), 'label': r.report['label'], 'shape': list(r.image.shape)})
    print(json.dumps({'format': 'beljour-r16b-parity/1', 'author': 'John Khan', 'source_sha256': digest(src), 'rows': rows}, indent=2 if args.pretty else None, sort_keys=True))
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
