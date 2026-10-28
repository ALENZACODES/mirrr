'Feature-specific R17B makeup planners. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .contracts import MakeupRequest
from .corrections import plan as correction_plan
from .oxidation import oxidation_curve, seasonal_mix
from .palette import custom_palette, outfit_harmony, recommend
from .recipes import generic_steps
from .undertone import rank


@dataclass(frozen=True)
class MakeupPlan:
    feature: str
    title: str
    controls: tuple[str, ...]
    outputs: tuple[str, ...]
    caveats: tuple[str, ...]
    metrics: tuple[str, ...]

def _spec(feature: str, title: str, controls: tuple[str, ...], outputs: tuple[str, ...], caveats: tuple[str, ...], metrics: tuple[str, ...]) -> MakeupPlan:
    return MakeupPlan(feature, title, controls, outputs, caveats, metrics)

def plan_w1(request: MakeupRequest) -> dict[str, Any]:
    palette = custom_palette([request.shade, request.accent], request.undertone)
    return {'spec': _spec('W1', 'Custom Palette Builder', ('shade', 'accent', 'undertone'), ('personal_palette',), ('digital colour is not a product swatch',), ('deep_skin_guard', 'palette_roundtrip')), 'palette': palette}

def plan_w2(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W2', 'Palette Extraction From Any Photo', ('checked_region',), ('local_palette',), ('source photo remains local', 'lighting affects extracted colour'), ('deterministic_palette', 'no_network')), 'count': 6, 'seed': request.seed}

def plan_w4(request: MakeupRequest) -> dict[str, Any]:
    candidates = (request.shade, request.accent, (96, 54, 82), (166, 95, 72), (115, 86, 54))
    return {'spec': _spec('W4', 'Undertone-Based Palette Recommendations', ('undertone',), ('ranked_palette',), ('undertone is an appearance estimate', 'olive is preserved as a first-class option'), ('undertone_score', 'deep_skin_guard')), 'recommendations': recommend(candidates, request.undertone)}

def plan_w5(request: MakeupRequest) -> dict[str, Any]:
    outfit = request.metadata.get('outfit_colour', request.accent)
    if not isinstance(outfit, (tuple, list)) or len(outfit) != 3:
        raise ValueError('outfit_colour must be RGB')
    colour = (int(outfit[0]), int(outfit[1]), int(outfit[2]))
    return {'spec': _spec('W5', 'Palette For An Outfit', ('outfit_colour', 'undertone'), ('harmonies',), ('harmony is a colour suggestion, not a rule',), ('local_colour_math', 'no_network')), 'harmonies': outfit_harmony(colour, request.undertone)}

def plan_w7(request: MakeupRequest, observed_skin: tuple[int, int, int]) -> dict[str, Any]:
    ranked = rank(observed_skin, (request.shade, request.accent), request.undertone)
    return {'spec': _spec('W7', 'Concealer Shade + Placement Maps', ('shade', 'face_shape', 'undertone'), ('placement_map', 'shade_guard'), ('never lighten skin to force a match',), ('mean_luminance_shift', 'deep_chroma_ratio', 'outside_error')), 'ranked_shades': ranked}

def plan_w8(request: MakeupRequest, skin_depth: float=0.5) -> dict[str, Any]:
    issue = str(request.metadata.get('issue', 'redness'))
    return {'spec': _spec('W8', 'Colour Correction Maps', ('issue', 'skin_depth', 'undertone'), ('corrector', 'placement_map'), ('cosmetic appearance only', 'no diagnosis'), ('outside_error', 'deep_skin_guard', 'label_present')), 'correction': correction_plan(issue, skin_depth, request.undertone)}

def plan_w9(request: MakeupRequest) -> dict[str, Any]:
    finish = request.finish if request.finish in {'cream', 'powder'} else 'cream'
    return {'spec': _spec('W9', 'Cream vs Powder Finish Simulator', ('finish', 'amount'), ('texture_finish',), ('does not claim wear time or product chemistry',), ('texture_variance_ratio', 'deep_skin_guard')), 'finish': finish, 'texture_target': 0.88 if finish == 'cream' else 0.68}

def plan_w10(request: MakeupRequest) -> dict[str, Any]:
    finish = request.finish if request.finish in {'dewy', 'matte', 'skin_tint'} else 'skin_tint'
    return {'spec': _spec('W10', 'Finish Switcher', ('finish', 'amount'), ('dewy_matte_skin_tint',), ('skin depth and texture remain visible',), ('highlight_share', 'texture_ratio', 'deep_skin_guard')), 'finish': finish}

def plan_w11(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W11', 'Blush Placement By Face Shape', ('face_shape', 'accent'), ('placement_map',), ('face shape is a geometry hint, not a beauty ranking',), ('outside_error', 'symmetry_error', 'no_geometry_change')), 'face_shape': request.face_shape, 'colour': request.accent}

def plan_w12(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W12', 'Bronzer / Contour Maps Per Face Shape', ('face_shape', 'shade'), ('placement_map',), ('no face slimming or reshaping',), ('identity_pins', 'outside_error', 'deep_skin_guard')), 'face_shape': request.face_shape, 'geometry_change': False}

def plan_w13(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W13', 'Reference Photo Makeup Recreator', ('checked_eye', 'checked_cheek', 'checked_lip'), ('local_reference_recipe',), ('requires user-checked regions', 'no automatic face parser', 'source lighting affects colour'), ('checked_region_complete', 'outside_error', 'no_network')), 'reference_source': 'user_checked', 'automatic_face_parsing': False}

def plan_w14(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W14', 'Original Event Look Recreator', ('look', 'amount'), ('step_by_step_recipe',), ('generic original looks only', 'no celebrity names or likenesses'), ('brand_name_scan', 'outside_error', 'deep_skin_guard')), 'look': request.look, 'steps': generic_steps(request.look)}

def plan_w16(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W16', 'No-Makeup Makeup Calibrator', ('amount', 'shade', 'accent'), ('minimal_recipe',), ('minimum product is a preference, not a requirement',), ('changed_fraction', 'texture_ratio', 'deep_skin_guard')), 'maximum_layers': 3, 'maximum_opacity': min(request.amount, 0.35)}

def plan_w17(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W17', 'Foundation Oxidation Simulator', ('oxidation_delta',), ('hourly_estimate',), ('user-entered formula behaviour only', 'not a product promise'), ('timeline_monotone', 'estimate_label')), 'timeline': oxidation_curve(request.oxidation_delta)}

def plan_w18(request: MakeupRequest) -> dict[str, Any]:
    return {'spec': _spec('W18', 'Seasonal Shade Rematch + Mixing Ratio', ('season_shift', 'undertone'), ('mix_ratio',), ('mixing ratio is an estimate', 'verify on skin'), ('ratio_sum', 'deep_skin_guard', 'estimate_label')), 'mix': seasonal_mix(request.season_shift)}
PLANNERS = {'W1': plan_w1, 'W2': plan_w2, 'W4': plan_w4, 'W5': plan_w5, 'W7': plan_w7, 'W8': plan_w8, 'W9': plan_w9, 'W10': plan_w10, 'W11': plan_w11, 'W12': plan_w12, 'W13': plan_w13, 'W14': plan_w14, 'W16': plan_w16, 'W17': plan_w17, 'W18': plan_w18}
