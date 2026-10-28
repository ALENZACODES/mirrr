'Deterministic makeup recipe serialization and generic look steps. Author: John Khan.'
from __future__ import annotations

import json
from collections.abc import Mapping
from typing import Any

SCHEMA = 'beljour.makeup-r17b.recipe.v1'

def normalize(recipe: Mapping[str, Any]) -> dict[str, Any]:
    allowed = {'feature', 'shade', 'accent', 'finish', 'face_shape', 'undertone', 'look', 'amount'}
    unknown = set(recipe) - allowed
    if unknown:
        raise ValueError(f'unsupported recipe fields: {sorted(unknown)}')
    out = {key: recipe[key] for key in sorted(recipe) if key in allowed}
    out['schema'] = SCHEMA
    return out

def encode(recipe: Mapping[str, Any]) -> str:
    return json.dumps(normalize(recipe), sort_keys=True, separators=(',', ':'), ensure_ascii=True)

def decode(text: str) -> dict[str, Any]:
    raw = json.loads(text)
    if not isinstance(raw, dict) or raw.get('schema') != SCHEMA:
        raise ValueError('unsupported recipe')
    result = dict(raw)
    result.pop('schema')
    return result

def generic_steps(name: str) -> tuple[str, ...]:
    steps = {'gallery_glow': ('Even only where needed.', 'Soft cheek colour high on the cheek.', 'Satin lip and restrained eye definition.'), 'midnight_line': ('Keep complexion natural.', 'Define the lash line with a soft charcoal tone.', 'Use a muted lip with a clean edge.'), 'soft_flash': ('Use a thin skin tint.', 'Add warm cheek colour and controlled highlight.', 'Choose a satin lip that reads under flash.'), 'velvet_evening': ('Keep skin depth unchanged.', 'Use plum-brown eye colour close to the lash line.', 'Finish with a deeper muted lip.')}
    if name not in steps:
        raise ValueError('unknown original look')
    return steps[name]

def contains_brand_name(text: str) -> bool:
    banned = ('sephora', 'ulta', 'mac cosmetics', 'dior', 'chanel', 'nars', 'fenty', 'rare beauty')
    lowered = text.casefold()
    return any(name in lowered for name in banned)
