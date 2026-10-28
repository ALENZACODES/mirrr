'Neutral consultation summaries for hair previews. Author: John Khan.'
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .contracts import HairRequest
from .safety import label_for, no_pressure_copy


@dataclass(frozen=True)
class ConsultationCard:
    title: str
    summary: str
    questions: tuple[str, ...]
    alternatives: tuple[str, ...]
    warnings: tuple[str, ...]
    estimate_fields: tuple[str, ...]

def card_for(feature: str, request: HairRequest) -> ConsultationCard:
    if feature in {'W19', 'W20'}:
        return ConsultationCard('Extension consultation', 'Compare added length and volume while keeping the observed curl pattern visible.', ('What attachment method suits the hair and scalp?', 'How will the added hair be blended at the perimeter?', 'What is the safe maintenance interval?'), ('keep current length', 'temporary clip-in trial', 'lower volume'), ('tension and weight are not evaluated from a photo', 'worn length varies with shrinkage'), ('stretched_length_ratio', 'worn_length_ratio'))
    if feature in {'W21', 'W22', 'W42'}:
        warnings = ['cap/topper fit requires physical verification', 'comfort and scalp contact are not inferred']
        if feature == 'W42':
            warnings.append('not medical advice')
        return ConsultationCard('Topper or wig preview', 'A local visual aid for silhouette, colour and approximate coverage.', ('Is comfort acceptable for the intended wear time?', 'Does the hairline placement feel natural to you?', 'Would a lower-density option feel better?'), ('no change', 'lighter density', 'different parting'), tuple(warnings), ('cap_width_ratio', 'hairline_softness'))
    if feature in {'W23', 'W24', 'W25'}:
        return ConsultationCard('Temporary coverage preview', 'A conservative local simulation for roots, scalp contrast or fibres.', ('Should coverage be more sheer?', 'Does the shade match the observed hair?', 'Is the scalp sensitive?'), ('no coverage', 'lower opacity', 'different shade'), ('density is a photo appearance estimate', 'no hair-growth claim'), ('effective_opacity', 'visible_scalp_share'))
    if feature in {'W26', 'W29', 'W30', 'W31', 'W34', 'W35', 'W36'}:
        return ConsultationCard('Colour placement preview', 'Colour placement is shown inside the supplied hair mask with texture preservation.', ('Is the placement wide enough?', 'Should the root transition be softer?', 'Does the tone work in the intended lighting?'), ('no colour', 'lower saturation', 'different placement'), ('porosity, lift and chemistry are not predicted',), ('placement_coverage', 'texture_ratio'))
    if feature in {'W32', 'W33'}:
        return ConsultationCard('Grey transition preview', 'Natural grey, blending and continued colouring are shown as equal choices.', ('Which option best fits your maintenance preference?', 'Do you want a faster or slower visual transition?'), no_pressure_copy(feature), ('timeline is illustrative', 'actual growth and grey distribution vary'), ('natural_grey_share', 'visible_regrowth_cm'))
    if feature in {'W37', 'W38'}:
        return ConsultationCard('Cut and fringe preview', 'Geometry-informed options are presented without ranking face shapes.', ('How much daily styling do you want?', 'How does your texture behave when air-dried?', 'How much shrinkage do you usually see?'), ('keep current cut', 'longer option', 'lower-maintenance option'), ('face shape is only a geometry proxy', 'real density and movement can change the result'), ('worn_length_ratio', 'texture_retention'))
    if feature == 'W40':
        return ConsultationCard('Curl definition preview', 'Enhances visible local detail without changing the declared hair region.', ('Do you want more definition or more softness?', 'How much volume do you want to retain?'), ('no definition change', 'lighter definition'), ('no product-efficacy claim',), ('texture_ratio', 'curl_frequency_delta'))
    if feature == 'W41':
        return ConsultationCard('Regrowth appearance simulation', 'A hypothetical visual timeline only.', ('Would you prefer to hide this feature?', 'Do you want to compare no-change and visual-regrowth states?'), ('no simulation', 'lower density', 'later month'), ('not medical advice', 'not a growth prediction'), ('estimated_density', 'estimated_length_cm'))
    if feature == 'W43':
        return ConsultationCard('Heat-style preview', 'Shows a styling direction without recommending a tool temperature.', ('Do you usually air-dry or heat-style?', 'How much of the natural pattern should remain?'), ('no heat-style change', 'lower shape amount'), ('heat safety depends on hair condition and the tool',), ('texture_retention_target',))
    if feature == 'W44':
        return ConsultationCard('Humidity response estimate', 'Uses only the humidity value you entered and the curl-strength control.', ('Is the humidity value representative of the day?', 'Does your hair usually expand or lose definition in humidity?'), ('no forecast', 'edit humidity', 'edit curl strength'), ('estimate only', 'no product efficacy prediction'), ('frizz_risk', 'definition_retention'))
    raise ValueError('unsupported hair feature')

def export_card(card: ConsultationCard) -> dict[str, Any]:
    return {'title': card.title, 'summary': card.summary, 'questions': list(card.questions), 'alternatives': list(card.alternatives), 'warnings': list(card.warnings), 'estimate_fields': list(card.estimate_fields)}

def labelled(feature: str, report: dict[str, Any]) -> dict[str, Any]:
    out = dict(report)
    out['safety_label'] = label_for(feature)
    out['consultation'] = export_card(card_for(feature, HairRequest(feature=feature)))
    return out
