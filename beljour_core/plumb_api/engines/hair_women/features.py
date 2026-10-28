'Feature-specific R17B women hair planning and claim boundaries. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .contracts import HairGeometry, HairRequest
from .extensions import attachment_rows, length_estimate, sensitive_limits, topper_profile, wig_profile
from .style import fringe_options, haircut_options, heat_style_profile
from .timeline import grey_transition, humidity_forecast, postpartum_regrowth


@dataclass(frozen=True)
class FeaturePlan:
    feature: str
    title: str
    controls: tuple[str, ...]
    outputs: tuple[str, ...]
    caveats: tuple[str, ...]
    metrics: tuple[str, ...]
    local_only: bool = True

def _common(feature: str, title: str, controls: tuple[str, ...], outputs: tuple[str, ...], caveats: tuple[str, ...], metrics: tuple[str, ...]) -> FeaturePlan:
    return FeaturePlan(feature, title, controls, outputs, caveats, metrics, True)

def plan_w19(request: HairRequest, geometry: HairGeometry, image_height: int) -> dict[str, Any]:
    estimate = length_estimate(image_height, request.length_ratio, request.curl_strength)
    return {'spec': _common('W19', 'Clip-In Extensions Preview', ('length_ratio', 'volume', 'curl_strength'), ('stretched_length', 'worn_length', 'blend'), ('worn length varies with curl and shrinkage', 'fit requires physical product'), ('outside_error', 'texture_ratio', 'blend_score')), 'length': estimate, 'attachments': attachment_rows(geometry, 'clip', 4)}

def plan_w20(request: HairRequest, geometry: HairGeometry, image_height: int) -> dict[str, Any]:
    estimate = length_estimate(image_height, request.length_ratio, request.curl_strength)
    method = 'sew' if request.volume >= 0.5 else 'tape'
    return {'spec': _common('W20', 'Tape-In / Sew-In Extensions Preview', ('length_ratio', 'volume', 'curl_strength'), ('attachment_rows', 'worn_length'), ('installation method is illustrative', 'tension and scalp suitability need a professional'), ('outside_error', 'texture_ratio', 'row_spacing')), 'method': method, 'length': estimate, 'attachments': attachment_rows(geometry, method, 5)}

def plan_w21(request: HairRequest, geometry: HairGeometry) -> dict[str, Any]:
    return {'spec': _common('W21', 'Hair Topper Preview', ('volume', 'colour'), ('crown_base', 'lift'), ('fit and attachment security are not predicted',), ('outside_error', 'crown_coverage', 'texture_ratio')), 'profile': topper_profile(geometry, request.volume)}

def plan_w22(request: HairRequest, geometry: HairGeometry) -> dict[str, Any]:
    return {'spec': _common('W22', 'Fashion Wig Preview', ('volume', 'colour', 'scalp_sensitivity'), ('cap_extent', 'hairline_softness'), ('fashion preview only', 'comfort and cap fit require in-person verification'), ('outside_error', 'hairline_overlap', 'texture_ratio')), 'profile': wig_profile(geometry, request.amount, request.scalp_sensitivity)}

def plan_w23(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W23', 'Root Touch-Up Preview', ('colour', 'amount'), ('root_band',), ('temporary cosmetic appearance only',), ('outside_error', 'root_colour_delta', 'texture_ratio')), 'opacity': request.amount * 0.55, 'preserve_luma': 0.95}

def plan_w24(request: HairRequest) -> dict[str, Any]:
    cap = 0.35 if request.scalp_sensitivity else 0.55
    return {'spec': _common('W24', 'Hairline Filler + Scalp Concealer', ('colour', 'amount', 'scalp_sensitivity'), ('hairline_band', 'scalp_blend'), ('density is a photo appearance estimate', 'not a diagnosis'), ('outside_error', 'scalp_delta', 'edge_continuity')), 'effective_opacity': min(request.amount, cap), 'concept_import': 'engines/concealer'}

def plan_w25(request: HairRequest) -> dict[str, Any]:
    density = 0.15 + request.volume * 0.7
    return {'spec': _common('W25', 'Density Fibres Simulation', ('volume', 'colour', 'seed'), ('procedural_fibres', 'coverage_estimate'), ('does not predict hair growth', 'fibre adhesion not simulated'), ('outside_error', 'strand_density', 'texture_ratio')), 'strand_density': density, 'seed': request.seed}

def plan_w26(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W26', 'Semi-Permanent Tint Preview', ('colour', 'amount'), ('tint',), ('actual porosity and starting colour alter results',), ('outside_error', 'texture_ratio', 'chroma_energy')), 'opacity': request.amount * 0.65, 'preserve_luma': 0.82}

def plan_w29(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W29', 'Money Piece Preview', ('accent', 'amount'), ('face_frame_map',), ('placement is an artistic guide',), ('outside_error', 'placement_centroid', 'texture_ratio')), 'stripe_count': 4, 'phase': 0.15}

def plan_w30(request: HairRequest) -> dict[str, Any]:
    density = int(round(8 + request.volume * 12))
    return {'spec': _common('W30', 'Lowlights / Babylights / Foil Maps', ('accent', 'volume'), ('foil_map', 'section_count'), ('map is a consultation guide, not an installation instruction',), ('outside_error', 'placement_coverage', 'section_spacing')), 'stripe_count': density, 'phase': 0.0}

def plan_w31(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W31', 'Chunky Highlights + Lived-In Colour', ('accent', 'amount', 'volume'), ('chunk_map', 'root_fade'), ('placement is illustrative',), ('outside_error', 'root_fade_monotonicity', 'texture_ratio')), 'chunkiness': 0.35 + request.volume * 0.55, 'root_softness': 0.1 + request.amount * 0.12}

def plan_w32(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W32', 'Grey Blending Preview', ('grey_share', 'amount'), ('blended_grey',), ('observed grey is a photo estimate', 'neutral choice framing'), ('outside_error', 'grey_share', 'root_contrast')), 'requested_share': request.grey_share, 'neutral_copy': ('blend grey', 'keep current colour', 'grow natural grey')}

def plan_w33(request: HairRequest) -> dict[str, Any]:
    timeline = grey_transition(request.grey_share, 18)
    return {'spec': _common('W33', 'Grey Transition Timeline', ('grey_share', 'month'), ('month_by_month_share', 'estimated_regrowth'), ('timeline is illustrative', 'continue colouring and grow-out are shown neutrally'), ('monotone_natural_share', 'root_contrast', 'outside_error')), 'timeline': timeline, 'selected': timeline[min(request.month, 18)]}

def plan_w34(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W34', 'Colour Melt / Ombré', ('accent', 'amount'), ('vertical_melt',), ('actual lift and porosity are not predicted',), ('outside_error', 'blend_smoothness', 'texture_ratio')), 'start_ratio': 0.46 + 0.08 * (1 - request.amount), 'softness': 0.14 + 0.08 * request.amount}

def plan_w35(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W35', 'Split Dye', ('colour', 'accent', 'amount'), ('left_right_partition',), ('part location is an editable visual guide',), ('outside_error', 'split_balance', 'texture_ratio')), 'split': 0.5, 'feather': 0.012}

def plan_w36(request: HairRequest) -> dict[str, Any]:
    side = 'right' if request.seed % 2 else 'left'
    return {'spec': _common('W36', 'Peekaboo Colour', ('accent', 'amount', 'seed'), ('hidden_colour_region',), ('placement depends on styling and movement',), ('outside_error', 'hidden_region_share', 'texture_ratio')), 'side': side, 'depth_start': 0.48}

def plan_w37(request: HairRequest, geometry: HairGeometry) -> dict[str, Any]:
    return {'spec': _common('W37', 'Bangs / Fringe Previews', ('amount', 'curl_strength'), ('fringe_geometry', 'worn_length'), ('hairline and density can change the real cut',), ('outside_error', 'fringe_overlap', 'texture_ratio')), 'options': fringe_options(geometry)}

def plan_w38(request: HairRequest, geometry: HairGeometry) -> dict[str, Any]:
    return {'spec': _common('W38', 'Haircut Previews By Face Shape', ('curl_strength', 'length_ratio'), ('cut_options',), ('face shape is a geometry proxy, not a beauty ranking',), ('identity_geometry_unchanged', 'texture_ratio', 'outside_error')), 'options': haircut_options(geometry, request.curl_strength)}

def plan_w40(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W40', 'Frizz Control + Curl Definition', ('amount', 'curl_strength'), ('detail_definition',), ('does not claim chemical or weather protection',), ('curl_frequency_delta', 'texture_ratio', 'outside_error')), 'definition_amount': request.amount, 'minimum_texture_ratio': 0.8}

def plan_w41(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W41', 'Postpartum Regrowth Simulation', ('month', 'amount'), ('estimated_density', 'estimated_length'), ('not medical advice', 'not a growth prediction', 'consult a clinician for health concerns'), ('outside_error', 'density_monotonicity', 'label_present')), 'regrowth': postpartum_regrowth(request.month, request.amount)}

def plan_w42(request: HairRequest, geometry: HairGeometry) -> dict[str, Any]:
    opacity, contact = sensitive_limits(request.amount)
    return {'spec': _common('W42', 'Chemo-Sensitive Wig + Scalp Tools', ('amount', 'colour', 'scalp_sensitivity'), ('gentle_wig_profile', 'scalp_contact_guide'), ('optional visual aid', 'not medical advice', 'comfort takes priority over coverage'), ('outside_error', 'scalp_delta', 'copy_safety')), 'profile': wig_profile(geometry, opacity, True), 'maximum_opacity': opacity, 'maximum_scalp_contact': contact}

def plan_w43(request: HairRequest) -> dict[str, Any]:
    style = str(request.metadata.get('heat_style', 'wave'))
    return {'spec': _common('W43', 'Heat Styling Previews', ('heat_shape', 'curl_strength', 'heat_style'), ('style_profile',), ('preview is not a heat-temperature recommendation',), ('texture_retention', 'outside_error', 'alpha_error')), 'profile': heat_style_profile(style, request.heat_shape, request.curl_strength)}

def plan_w44(request: HairRequest) -> dict[str, Any]:
    return {'spec': _common('W44', 'Humidity-Proof Hair Forecast', ('humidity', 'curl_strength'), ('frizz_risk', 'definition_retention'), ('estimate from user-entered humidity', 'product efficacy is not predicted'), ('forecast_bounds', 'label_present', 'curl_pattern_retained')), 'forecast': humidity_forecast(request.humidity, request.curl_strength)}
PLANNERS = {'W19': plan_w19, 'W20': plan_w20, 'W21': plan_w21, 'W22': plan_w22, 'W23': plan_w23, 'W24': plan_w24, 'W25': plan_w25, 'W26': plan_w26, 'W29': plan_w29, 'W30': plan_w30, 'W31': plan_w31, 'W32': plan_w32, 'W33': plan_w33, 'W34': plan_w34, 'W35': plan_w35, 'W36': plan_w36, 'W37': plan_w37, 'W38': plan_w38, 'W40': plan_w40, 'W41': plan_w41, 'W42': plan_w42, 'W43': plan_w43, 'W44': plan_w44}
