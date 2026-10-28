'Shade Passport canonical local export. Author: John Khan.'
from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from typing import Any

SCHEMA = 'beljour.shade-passport.v1'

def payload(depth: float, undertone: str, hair_base: str, allergens: tuple[str, ...], measured_on: str) -> dict[str, Any]:
    return {'schema': SCHEMA, 'depth': round(depth, 4), 'undertone': undertone, 'hair_base': hair_base, 'allergens': list(allergens), 'measured_on': measured_on, 'privacy': 'local export; no network transmission'}

def encode(data: Mapping[str, Any]) -> str:
    body = json.dumps(dict(data), sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    digest = hashlib.sha256(body.encode()).hexdigest()
    return json.dumps({'payload': json.loads(body), 'sha256': digest}, sort_keys=True, separators=(',', ':'))

def decode(text: str) -> dict[str, Any]:
    obj = json.loads(text)
    if not isinstance(obj, dict) or set(obj) != {'payload', 'sha256'} or (not isinstance(obj['payload'], dict)):
        raise ValueError('invalid passport envelope')
    body = json.dumps(obj['payload'], sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    if hashlib.sha256(body.encode()).hexdigest() != obj['sha256']:
        raise ValueError('passport integrity check failed')
    if obj['payload'].get('schema') != SCHEMA:
        raise ValueError('unsupported passport schema')
    return dict(obj['payload'])
