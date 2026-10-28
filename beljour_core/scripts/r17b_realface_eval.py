'Local-only R17B box evaluator and pass-definition validator. Author: John Khan.\n\nThis command intentionally does not discover faces and does not modify the shared\nreal-face runner owned by Lane A. A caller supplies a manifest that points to\nlocal ``.npy`` images and checked evidence. Missing evidence is ``not_tested``;\nit is never converted into a pass. ``--validate-definitions`` validates the\npreregistered R17B criteria without loading images and without implying a\nreal-face quality result.\n'
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from plumb_api.arena.r17b_definitions import DEFINITIONS, EXPECTED_IDS
from plumb_api.arena.r17b_evidence import definitions_fingerprint, validate_definition_set
from plumb_api.engines.gender_look import render as render_gender
from plumb_api.engines.gender_look.evaluation import cheek_delta, identity_pins
from plumb_api.engines.hair_women import render as render_hair
from plumb_api.engines.hair_women.contracts import FEATURES as HAIR_FEATURES
from plumb_api.engines.hair_women.evaluation import metrics as hair_metrics
from plumb_api.engines.hair_women.evaluation import passed as hair_passed
from plumb_api.engines.makeup_w import render as render_makeup
from plumb_api.engines.makeup_w.contracts import FEATURES as MAKEUP_FEATURES
from plumb_api.engines.makeup_w.evaluation import metrics as makeup_metrics
from plumb_api.engines.makeup_w.evaluation import passed as makeup_passed
from plumb_api.engines.shave import render as render_shave
from plumb_api.engines.shave.evaluation import metrics as shave_metrics
from plumb_api.engines.shave.evaluation import passed as shave_passed
from plumb_api.engines.upscale import upscale
from plumb_api.engines.upscale.evaluation import evaluate_pair as upscale_metrics
from plumb_api.engines.workflow_w import run as run_workflow
from plumb_api.engines.workflow_w.contracts import FEATURES as WORKFLOW_FEATURES

FEATURES = EXPECTED_IDS
MAX_CASES = 100000
MAX_FILE_BYTES = 12000000 * 4 + 4096

def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def _load_manifest(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ValueError('manifest file does not exist')
    if path.stat().st_size > 8000000:
        raise ValueError('manifest is unexpectedly large')
    raw = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(raw, dict) or not isinstance(raw.get('cases'), list):
        raise ValueError('manifest must contain a cases array')
    cases = raw['cases']
    if not 1 <= len(cases) <= MAX_CASES:
        raise ValueError(f'manifest cases must be 1..{MAX_CASES}')
    if not all(isinstance(item, Mapping) for item in cases):
        raise ValueError('every manifest case must be an object')
    return raw

def _safe(root: Path, value: str) -> Path:
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('manifest path escapes its directory')
    if not path.is_file():
        raise ValueError(f'local evidence file missing: {value}')
    if path.stat().st_size > MAX_FILE_BYTES:
        raise ValueError(f'local evidence file too large: {value}')
    return path

def _image(path: Path) -> np.ndarray:
    image = np.load(path, allow_pickle=False)
    if image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError(f'{path.name}: expected uint8 RGB/RGBA .npy')
    if min(image.shape[:2]) < 16 or image.shape[0] * image.shape[1] > 12000000:
        raise ValueError('image dimensions outside supported evaluator range')
    return np.asarray(image, dtype=np.uint8)

def _mask(root: Path, case: Mapping[str, Any], name: str, shape: tuple[int, int]) -> np.ndarray:
    masks = case.get('masks')
    if not isinstance(masks, Mapping) or not isinstance(masks.get(name), str):
        raise ValueError(f'checked {name} mask required')
    value = np.load(_safe(root, str(masks[name])), allow_pickle=False)
    if value.shape != shape or not np.issubdtype(value.dtype, np.number):
        raise ValueError(f'{name} mask must match image shape')
    result = np.asarray(value, dtype=np.float64)
    if not np.all(np.isfinite(result)) or np.any(result < 0) or np.any(result > 1):
        raise ValueError(f'{name} mask values must be finite 0..1')
    return result

def _geometry(case: Mapping[str, Any]) -> dict[str, tuple[float, float]]:
    raw = case.get('head_landmarks')
    if not isinstance(raw, Mapping):
        raise ValueError('checked head_landmarks required')
    output: dict[str, tuple[float, float]] = {}
    for name in ('crown', 'left_temple', 'right_temple', 'chin'):
        point = raw.get(name)
        if not isinstance(point, Sequence) or isinstance(point, (str, bytes)) or len(point) != 2:
            raise ValueError(f'head_landmarks.{name} must be xy')
        x = float(point[0])
        y = float(point[1])
        if not np.isfinite(x) or not np.isfinite(y):
            raise ValueError('head landmark must be finite')
        output[name] = (x, y)
    return output

def _points(case: Mapping[str, Any], name: str) -> np.ndarray:
    raw = case.get(name)
    if not isinstance(raw, Sequence) or isinstance(raw, (str, bytes)):
        raise ValueError(f'checked {name} required')
    value = np.asarray(raw, dtype=np.float64)
    if value.ndim != 2 or value.shape[1] != 2 or (not np.all(np.isfinite(value))):
        raise ValueError(f'{name} must be finite Nx2 points')
    return value

def _hair_request(feature: str, case: Mapping[str, Any]) -> dict[str, Any]:
    return {'feature': feature, 'amount': float(case.get('amount', 0.55)), 'colour': case.get('hair_colour', [92, 58, 40]), 'accent': case.get('hair_accent', [176, 122, 78]), 'length_ratio': float(case.get('length_ratio', 0.45)), 'volume': float(case.get('volume', 0.42)), 'grey_share': float(case.get('grey_share', 0.38)), 'month': int(case.get('month', 12)), 'curl_strength': float(case.get('curl_strength', 0.64)), 'heat_shape': float(case.get('heat_shape', 0.55)), 'humidity': float(case.get('humidity', 55.0)), 'scalp_sensitivity': bool(case.get('scalp_sensitivity', feature == 'W42')), 'seed': int(case.get('seed', 17)), 'metadata': case.get('hair_metadata', {})}

def _makeup_request(feature: str, case: Mapping[str, Any]) -> dict[str, Any]:
    return {'feature': feature, 'amount': float(case.get('amount', 0.55)), 'shade': case.get('shade', [117, 67, 62]), 'accent': case.get('accent', [156, 91, 80]), 'finish': case.get('finish', 'satin'), 'face_shape': case.get('face_shape', 'balanced'), 'undertone': case.get('undertone', 'neutral'), 'oxidation_delta': float(case.get('oxidation_delta', -6.0)), 'season_shift': float(case.get('season_shift', 0.22)), 'look': case.get('look', 'gallery_glow'), 'metadata': case.get('makeup_metadata', {'issue': 'redness'})}

def _evaluate_hair(root: Path, case: Mapping[str, Any], image: np.ndarray, feature: str) -> dict[str, Any]:
    hair = _mask(root, case, 'hair', image.shape[:2])
    scalp = _mask(root, case, 'scalp', image.shape[:2])
    result = render_hair(image, hair, scalp, _geometry(case), _hair_request(feature, case))
    measured = hair_metrics(image, result.image, result.coverage)
    return {**measured.__dict__, 'status': 'passed' if hair_passed(measured, feature) else 'failed', 'report': result.report}

def _evaluate_makeup(root: Path, case: Mapping[str, Any], image: np.ndarray, feature: str) -> dict[str, Any]:
    names = ('skin', 'cheek', 'eye', 'lip', 'palette_region')
    masks = {name: _mask(root, case, name, image.shape[:2]) for name in names}
    kwargs: dict[str, Any] = {}
    if feature == 'W13':
        reference_name = case.get('reference_image')
        if not isinstance(reference_name, str):
            raise ValueError('W13 requires a local checked reference_image')
        reference = _image(_safe(root, reference_name))
        if reference.shape != image.shape:
            raise ValueError('reference image shape must match source')
        kwargs['reference'] = reference
        kwargs['reference_masks'] = {name: _mask(root, case, f'reference_{name}', image.shape[:2]) for name in ('eye', 'cheek', 'lip')}
    result = render_makeup(image, masks, _makeup_request(feature, case), **kwargs)
    measured = makeup_metrics(image, result.image, result.coverage)
    return {**measured.__dict__, 'status': 'passed' if makeup_passed(measured) else 'failed', 'report': result.report}

def _evaluate_workflow(case: Mapping[str, Any], feature: str) -> dict[str, Any]:
    raw = case.get('workflow', {})
    request = dict(raw) if isinstance(raw, Mapping) else {}
    request['feature'] = feature
    result = run_workflow(request)
    encoded = json.dumps(result, sort_keys=True, separators=(',', ':'))
    return {'status': 'passed', 'sha256': _sha256_bytes(encoded.encode('utf-8')), 'network': False, 'result': result}

def _evaluate_upscale(root: Path, case: Mapping[str, Any], image: np.ndarray, feature: str) -> dict[str, Any]:
    scale = 2 if feature == 'UPSCALE2' else 4
    result = upscale(image, scale=scale, detail=0.55)
    target_name = case.get(f'upscale_{scale}x_target')
    if not isinstance(target_name, str):
        return {'status': 'not_tested', 'reason': f'checked upscale_{scale}x_target required for quality scoring', 'output_shape': list(result.shape)}
    target = _image(_safe(root, target_name))
    measured = upscale_metrics(target, result)
    return {**measured.__dict__, 'status': 'passed' if measured.passed else 'failed'}

def _evaluate_gender(root: Path, case: Mapping[str, Any], image: np.ndarray) -> dict[str, Any]:
    masks = {name: _mask(root, case, name, image.shape[:2]) for name in ('brow', 'skin', 'stubble', 'cheek')}
    before_pins = _points(case, 'identity_pins_before')
    after_pins = _points(case, 'identity_pins_after')
    output, report = render_gender(image, masks, {'direction': case.get('gender_direction', 'neutral'), 'level': case.get('gender_level', 'normal'), 'amount': float(case.get('amount', 0.55))})
    delta = cheek_delta(image, output, masks['cheek'])
    pins = identity_pins(before_pins, after_pins)
    alpha_error = 0.0
    if image.shape[2] == 4:
        alpha_error = float(np.max(np.abs(output[..., 3].astype(np.int16) - image[..., 3].astype(np.int16))))
    passed = pins and delta <= 4.0 and (alpha_error == 0.0) and (not bool(report.get('identity_geometry_changed', True)))
    return {'status': 'passed' if passed else 'failed', 'cheek_delta_e': delta, 'identity_pins_exact': pins, 'alpha_error': alpha_error, 'geometry_changed': bool(report.get('identity_geometry_changed', True)), 'report': report}

def _evaluate_shave(root: Path, case: Mapping[str, Any], image: np.ndarray) -> dict[str, Any]:
    scope = case.get('beard_length_scope')
    if scope not in {'stubble', 'short_beard'}:
        raise ValueError('beard_length_scope must be stubble or short_beard')
    beard = _mask(root, case, 'beard', image.shape[:2])
    cheek = _mask(root, case, 'cheek', image.shape[:2])
    output, report = render_shave(image, beard, cheek, float(case.get('amount', 0.8)))
    measured = shave_metrics(image, output, beard, cheek)
    return {**measured.__dict__, 'status': 'passed' if shave_passed(measured) else 'failed', 'report': report}

def evaluate_case(root: Path, case: Mapping[str, Any], features: Sequence[str]) -> dict[str, Any]:
    image_name = case.get('image')
    if not isinstance(image_name, str):
        raise ValueError('case image is required')
    image = _image(_safe(root, image_name))
    output: dict[str, Any] = {'id': str(case.get('id', Path(image_name).stem)), 'image_sha256': _sha256_bytes(image.tobytes()), 'features': {}}
    for feature in features:
        try:
            if feature in HAIR_FEATURES:
                value = _evaluate_hair(root, case, image, feature)
            elif feature in MAKEUP_FEATURES:
                value = _evaluate_makeup(root, case, image, feature)
            elif feature in WORKFLOW_FEATURES:
                value = _evaluate_workflow(case, feature)
            elif feature in {'UPSCALE2', 'UPSCALE4'}:
                value = _evaluate_upscale(root, case, image, feature)
            elif feature == 'GENDER':
                value = _evaluate_gender(root, case, image)
            elif feature == 'SHAVE':
                value = _evaluate_shave(root, case, image)
            else:
                raise ValueError(f'unsupported feature {feature}')
            output['features'][feature] = value
        except (ValueError, KeyError, TypeError, PermissionError, OSError) as exc:
            output['features'][feature] = {'status': 'not_tested', 'reason': f'{type(exc).__name__}: {exc}'}
    return output

def _numeric_summary(values: Sequence[Mapping[str, Any]], key: str) -> dict[str, float] | None:
    numbers = [float(value[key]) for value in values if isinstance(value.get(key), (int, float)) and (not isinstance(value.get(key), bool))]
    if not numbers:
        return None
    return {'mean': sum(numbers) / len(numbers), 'min': min(numbers), 'max': max(numbers)}

def _group(feature: str) -> str:
    if feature in HAIR_FEATURES:
        return 'hair_women'
    if feature in MAKEUP_FEATURES:
        return 'makeup_w'
    if feature in WORKFLOW_FEATURES:
        return 'workflow_w'
    if feature.startswith('UPSCALE'):
        return 'upscale'
    if feature == 'GENDER':
        return 'gender_look'
    return 'shave'

def summarize(cases: Sequence[Mapping[str, Any]], features: Sequence[str]) -> dict[str, Any]:
    groups: dict[str, dict[str, Any]] = {'hair_women': {}, 'makeup_w': {}, 'workflow_w': {}, 'upscale': {}, 'gender_look': {}, 'shave': {}}
    metric_names = ('outside_error', 'alpha_error', 'texture_ratio', 'deep_chroma_ratio', 'mean_luminance_shift', 'psnr', 'ssim', 'ringing', 'cheek_delta_e', 'cheek_delta_e_proxy', 'beard_darkness_reduction')
    for feature in features:
        values = [case.get('features', {}).get(feature, {}) for case in cases if isinstance(case.get('features'), Mapping)]
        tested = [value for value in values if value.get('status') in {'passed', 'failed'}]
        metrics: dict[str, Any] = {}
        for name in metric_names:
            value = _numeric_summary(tested, name)
            if value is not None:
                metrics[name] = value
        groups[_group(feature)][feature] = {'tested': len(tested), 'passed': sum(value.get('status') == 'passed' for value in tested), 'failed': sum(value.get('status') == 'failed' for value in tested), 'not_tested': len(values) - len(tested), 'metrics': metrics, 'definition_sha256': DEFINITIONS[feature].sha256}
    return groups

def _validate_only() -> int:
    result = validate_definition_set(DEFINITIONS, expected_ids=EXPECTED_IDS)
    print(json.dumps(result, indent=2, sort_keys=True))
    print('Criteria validation only. No real-face quality result has been measured.')
    return 0

def main(argv: list[str] | None=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path, nargs='?')
    parser.add_argument('--features', nargs='*', default=list(FEATURES))
    parser.add_argument('--output', type=Path)
    parser.add_argument('--validate-definitions', action='store_true', help='validate R17B criteria only; no image processing and no quality PASS')
    args = parser.parse_args(argv)
    if args.validate_definitions:
        return _validate_only()
    if args.manifest is None:
        parser.error('manifest is required unless --validate-definitions is used')
    unknown = set(args.features) - set(FEATURES)
    if unknown:
        parser.error(f'unknown features: {sorted(unknown)}')
    manifest = _load_manifest(args.manifest)
    root = args.manifest.parent
    cases = [evaluate_case(root, case, args.features) for case in manifest['cases']]
    payload = {'format': 'beljour-r17b-realface/2', 'author': 'John Khan', 'privacy': 'local-only; no network calls; paths and pixel data are not emitted', 'manifest_sha256': _sha256_bytes(args.manifest.read_bytes()), 'definitions_sha256': definitions_fingerprint(DEFINITIONS), 'features': list(args.features), 'groups': summarize(cases, args.features), 'cases': cases, 'release_claim': 'No public release gate is implied. Frozen 100,000-face acceptance remains separate.'}
    text = json.dumps(payload, indent=2, sort_keys=True)
    print(text)
    if args.output is not None:
        args.output.write_text(text + '\n', encoding='utf-8')
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
