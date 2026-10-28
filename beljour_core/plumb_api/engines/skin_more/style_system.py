'Editable W83-W92 style and consent contracts. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass


@dataclass(frozen=True)
class StyleControl:
    key: str
    label: str
    minimum: float
    maximum: float
    default: float
    unit: str = 'ratio'
    editable: bool = True

@dataclass(frozen=True)
class StyleRecipe:
    id: str
    feature: str
    name: str
    controls: tuple[StyleControl, ...]
    assumptions: tuple[str, ...]
    warnings: tuple[str, ...]
    requires_checked_region: bool = False
    requires_health_consent: bool = False
    cultural_review_required: bool = False

_RECIPES = {'W83': StyleRecipe('cycle_observation', 'W83', 'Skin observation diary', (StyleControl('dryness', 'Dryness', 0, 1, 0.3), StyleControl('oiliness', 'Oiliness', 0, 1, 0.3), StyleControl('sensitivity', 'Sensitivity', 0, 1, 0.2)), ('Entries are self-observations.',), ('No fertility or medical prediction.',), False, True), 'W84': StyleRecipe('mature_texture', 'W84', 'Mature-skin texture first', (StyleControl('colour', 'Colour', 0, 1, 0.25), StyleControl('microcontrast', 'Texture', 0, 1, 0.6)), ('Visible texture is intentional.',), ('No anti-ageing or age-reversal claim.',)), 'W85': StyleRecipe('jewellery_scale', 'W85', 'Jewellery scale guide', (StyleControl('scale', 'Scale', 0.5, 1.5, 1), StyleControl('shine', 'Shine', 0, 1, 0.4)), ('Geometry is procedural.',), ('No product weight or fit guarantee.',), True), 'W86': StyleRecipe('glasses_fit', 'W86', 'Glasses fit guide', (StyleControl('width', 'Frame width', 0.7, 1.3, 1), StyleControl('height', 'Frame height', 0.7, 1.3, 1)), ('Geometry is procedural.',), ('No face-shape flaw score.',), True), 'W87': StyleRecipe('nail_colour', 'W87', 'Nail colour only', (StyleControl('opacity', 'Opacity', 0, 1, 0.75),), ('Nail region is checked by the user.',), ('Shape and length remain unchanged.',), True), 'W88': StyleRecipe('hijab_colour', 'W88', 'Scarf colour preview', (StyleControl('opacity', 'Colour opacity', 0, 1, 0.55),), ('Scarf region is checked by the user.',), ('Never reveal or remove hair.',), True, False, True), 'W89': StyleRecipe('occasion_bundle', 'W89', 'Editable occasion bundle', (StyleControl('complexion', 'Complexion', 0, 1, 0.3), StyleControl('lip', 'Lip', 0, 1, 0.3), StyleControl('eye', 'Eye', 0, 1, 0.25)), ('Presets are starting points only.',), ('Interview mode does not equate makeup with competence.',)), 'W90': StyleRecipe('freckle_choice', 'W90', 'Freckle choice', (StyleControl('density', 'Faux density', 0, 1, 0.25),), ('Natural freckles are preserved by default.',), ('Faux marks are labelled simulation.',), True), 'W91': StyleRecipe('neck_chest', 'W91', 'Neck and chest continuity', (StyleControl('correction', 'Correction', 0, 0.5, 0.15),), ('Regions are compared within one image.',), ('Lighting can dominate colour difference.',), True), 'W92': StyleRecipe('texture_first', 'W92', 'Texture-first mature beauty', (StyleControl('colour', 'Colour', 0, 1, 0.2), StyleControl('texture', 'Texture retention', 0.7, 1, 1)), ('Lines and pores remain visible.',), ('No age ranking or erasure goal.',))}

def recipe(feature: str) -> StyleRecipe:
    if feature not in _RECIPES:
        raise KeyError(feature)
    return _RECIPES[feature]

def controls(feature: str) -> dict[str, float]:
    return {c.key: c.default for c in recipe(feature).controls}

def validate_values(feature: str, values: Mapping[str, float]) -> dict[str, float]:
    r = recipe(feature)
    result = {}
    allowed = {c.key: c for c in r.controls}
    unknown = set(values) - set(allowed)
    if unknown:
        raise ValueError(f'unknown controls: {sorted(unknown)}')
    for key, c in allowed.items():
        value = float(values.get(key, c.default))
        if not c.minimum <= value <= c.maximum:
            raise ValueError(f'{key} must be in [{c.minimum},{c.maximum}]')
        result[key] = value
    return result

def with_defaults(feature: str, values: Mapping[str, float] | None=None) -> dict[str, float]:
    return validate_values(feature, values or {})

def release_requirements(feature: str) -> tuple[str, ...]:
    r = recipe(feature)
    items = ['simulation label', 'local processing']
    if r.requires_checked_region:
        items.append('checked region')
    if r.requires_health_consent:
        items.append('explicit local health-data consent')
    if r.cultural_review_required:
        items.append('cultural co-design review')
    return tuple(items)

def safety_copy(feature: str) -> str:
    return ' '.join(recipe(feature).warnings)

def catalogue() -> tuple[StyleRecipe, ...]:
    return tuple(_RECIPES[k] for k in sorted(_RECIPES))

def audit() -> dict[str, object]:
    rows = []
    for r in catalogue():
        rows.append({'feature': r.feature, 'controls': len(r.controls), 'checked_region': r.requires_checked_region, 'health_consent': r.requires_health_consent, 'cultural_review': r.cultural_review_required, 'warnings': list(r.warnings)})
    return {'count': len(rows), 'rows': rows, 'all_editable': all(all(c.editable for c in r.controls) for r in catalogue())}
