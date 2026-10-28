'Local-only R16B real-face evaluator. No image or metric leaves the box. Author: John Khan.\n\nManifest format: JSON object with `cases`, each containing an `image` path and optional\n`landmarks`, `regions`, `adult_confirmed`, and `diary_values`. Images are local .npy RGB/RGBA\nuint8 arrays. Landmarks/regions are checked evidence, never inferred by this evaluator.\n'

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.engines.lips import render as render_lip
from plumb_api.engines.lips.benchmark import PASS_DEFINITIONS as LIP_PASS
from plumb_api.engines.lips.benchmark import metrics as lip_metrics
from plumb_api.engines.skin_more import render as render_skin
from plumb_api.engines.skin_more.benchmark import PASS_DEFINITIONS as SKIN_PASS
from plumb_api.engines.skin_more.benchmark import metrics as skin_metrics
from plumb_api.engines.smile import render as render_smile
from plumb_api.engines.smile.benchmark import PASS_DEFINITIONS as SMILE_PASS
from plumb_api.engines.smile.benchmark import metrics as smile_metrics

FEATURES = tuple(f'W{i}' for i in range(45, 59)) + tuple(f'W{i}' for i in range(77, 93))
MANUAL = {'W50', 'W51', 'W52', 'W53', 'W58', 'W79', 'W80', 'W81', 'W82', 'W85', 'W86', 'W87', 'W88', 'W90', 'W91'}

def _read(path: Path) -> dict[str, Any]:
    raw = json.loads(path.read_text())
    if not isinstance(raw, dict) or not isinstance(raw.get('cases'), list):
        raise ValueError('manifest must contain cases array')
    return raw

def _safe(root: Path, value: str) -> Path:
    p = (root / value).resolve()
    r = root.resolve()
    if not p.is_relative_to(r):
        raise ValueError('case path escapes manifest directory')
    return p

def _array(path: Path) -> np.ndarray:
    a = np.load(path, allow_pickle=False)
    if a.dtype != np.uint8 or a.ndim != 3 or a.shape[2] not in (3, 4):
        raise ValueError(f'{path.name}: expected uint8 RGB/RGBA .npy')
    return a

def _landmarks(case: dict[str, Any]) -> np.ndarray:
    p = np.asarray(case.get('landmarks'), float)
    if p.shape not in ((468, 2), (478, 2)) or not np.all(np.isfinite(p)):
        raise ValueError('checked landmarks required for lip features')
    return p

def _regions(case: dict[str, Any]) -> list[dict[str, Any]]:
    r = case.get('regions', [])
    if not isinstance(r, list):
        raise ValueError('regions must be an array')
    return r

def _request(feature: str, case: dict[str, Any]) -> dict[str, Any]:
    styles = {'W45': 'natural_plump', 'W46': 'balanced', 'W47': 'healed', 'W48': 'rest', 'W49': '0.5_ml_style', 'W54': 'blue_based', 'W55': 'matte', 'W56': 'coffee', 'W57': 'medium', 'W77': 'sheer', 'W78': 'olive', 'W79': 'match_face', 'W80': 'mineral_cast', 'W81': 'orange_corrector', 'W82': 'green_micro', 'W83': 'irregular', 'W84': 'dewy_base', 'W85': 'both', 'W86': 'soft_round', 'W87': 'berry', 'W88': 'soft_drape', 'W89': 'interview', 'W90': 'faux_subtle', 'W91': 'continuity', 'W92': 'texture_first'}
    req = {'feature': feature, 'amount': float(case.get('amount', 0.5)), 'style': styles.get(feature, '')}
    if feature in {'W45', 'W47', 'W48', 'W49', 'W50', 'W51', 'W52', 'W53', 'W58'}:
        req['adult_confirmed'] = bool(case.get('adult_confirmed', False))
    if feature.startswith('W') and 77 <= int(feature[1:]) <= 92:
        req['masks'] = _regions(case)
        if feature == 'W83':
            req.update(consent_local_health_data=bool(case.get('health_consent', False)), diary_values=case.get('diary_values', []))
    return req

def evaluate_case(root: Path, case: dict[str, Any], features: list[str]) -> dict[str, Any]:
    image_path = _safe(root, str(case['image']))
    src = _array(image_path)
    out = {'id': str(case.get('id', image_path.stem)), 'image_sha256': hashlib.sha256(src.tobytes()).hexdigest(), 'features': {}}
    for f in features:
        try:
            if f in {'W45', 'W46', 'W47', 'W48', 'W49', 'W54', 'W55', 'W56', 'W57'}:
                r = render_lip(src, _landmarks(case), _request(f, case))
                m = lip_metrics(src, r.image, r.coverage, f)
                out['features'][f] = {**m.__dict__, 'status': 'passed' if m.passed else 'failed', 'report': r.report}
            elif f in {'W50', 'W51', 'W52', 'W53'}:
                regions = _regions(case)
                teeth = next((x['points'] for x in regions if x.get('name') == 'teeth'), None)
                gum = next((x['points'] for x in regions if x.get('name') == 'gum'), [])
                if teeth is None:
                    raise ValueError('checked teeth region required')
                req = _request(f, case)
                req['annotation'] = {'teeth': teeth, 'gum': gum, 'midline_x': case.get('midline_x')}
                r = render_smile(src, req)
                m = smile_metrics(src, r.image, r.coverage, f)
                out['features'][f] = {**m.__dict__, 'status': 'passed' if m.passed else 'failed', 'report': r.report}
            elif f == 'W58':
                out['features'][f] = {'status': 'not_tested', 'reason': 'W58 needs a multi-frame case; use sequence_cases in the manifest.'}
            else:
                r = render_skin(src, _request(f, case))
                m = skin_metrics(src, r.image, r.coverage, f)
                out['features'][f] = {**m.__dict__, 'status': 'passed' if m.passed else 'failed', 'report': r.report}
        except (ValueError, PermissionError) as exc:
            out['features'][f] = {'status': 'not_tested', 'reason': str(exc)}
    return out

def summarize(cases: list[dict[str, Any]], features: list[str]) -> dict[str, Any]:
    groups = {'lips': {}, 'smile': {}, 'skin_more': {}}
    for f in features:
        vals = [c['features'].get(f, {}) for c in cases]
        tested = [v for v in vals if v.get('status') in {'passed', 'failed'}]
        passed = sum(v.get('status') == 'passed' for v in tested)
        metrics = {}
        for key in ('identity_error', 'outside_error', 'texture_correlation', 'changed_fraction'):
            numbers = [float(v[key]) for v in tested if key in v]
            if numbers:
                metrics[key] = {'mean': sum(numbers) / len(numbers), 'max': max(numbers), 'min': min(numbers)}
        group = 'lips' if f in LIP_PASS else 'smile' if f in SMILE_PASS else 'skin_more'
        groups[group][f] = {'tested': len(tested), 'passed': passed, 'failed': len(tested) - passed, 'not_tested': len(vals) - len(tested), 'metrics': metrics}
    return groups

def main(argv: list[str] | None=None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument('manifest', type=Path)
    p.add_argument('--features', nargs='*', default=list(FEATURES))
    p.add_argument('--output', type=Path)
    args = p.parse_args(argv)
    unknown = set(args.features) - set(FEATURES)
    if unknown:
        p.error(f'unknown features: {sorted(unknown)}')
    raw = _read(args.manifest)
    root = args.manifest.parent
    cases = [evaluate_case(root, c, args.features) for c in raw['cases']]
    result = {'format': 'beljour-r16b-realface/1', 'author': 'John Khan', 'privacy': 'local-only; no network calls', 'manifest_sha256': hashlib.sha256(args.manifest.read_bytes()).hexdigest(), 'features': args.features, 'groups': summarize(cases, args.features), 'pass_definitions': {'lips': LIP_PASS, 'smile': SMILE_PASS, 'skin_more': SKIN_PASS}, 'cases': cases, 'release_claim': 'No public release gate is implied by this evaluator; frozen-set acceptance is separate.'}
    text = json.dumps(result, indent=2, sort_keys=True)
    print(text)
    if args.output:
        args.output.write_text(text + '\n')
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
