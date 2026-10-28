'R17 Lane B additive registry overlay. Author: John Khan.'
from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

HAIR_IDS = ('W19', 'W20', 'W21', 'W22', 'W23', 'W24', 'W25', 'W26', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W40', 'W41', 'W42', 'W43', 'W44')
MAKEUP_IDS = ('W1', 'W2', 'W4', 'W5', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W16', 'W17', 'W18')
WORKFLOW_IDS = ('W94', 'W96', 'W99', 'W100')
IDS = HAIR_IDS + MAKEUP_IDS + WORKFLOW_IDS
NOTES: dict[str, str] = {'W1': 'Local custom palette builder with undertone scoring and deep-skin luminance guardrails.', 'W2': 'Local palette extraction from user-selected regions; no cloud upload.', 'W4': 'Undertone recommendations use Lab/LCh colour maths and preserve olive as a first-class option.', 'W5': 'Outfit harmony is computed locally from the user-supplied colour and undertone.', 'W7': 'Concealer shade/placement map is non-geometric and never lightens skin to force a match.', 'W8': 'Cosmetic correction maps use user intent only; no redness or pigmentation diagnosis.', 'W9': 'Cream/powder finish simulation retains observed texture and skin depth.', 'W10': 'Dewy, matte and skin-tint finish switching is local and texture-bounded.', 'W11': 'Face-shape blush maps are optional geometry-informed placement guides, not beauty rules.', 'W12': 'Bronzer/contour maps do not reshape the face or claim slimming.', 'W13': 'Reference recreation requires user-checked eye/cheek/lip regions; no uncleared parser.', 'W14': 'Original generic event looks only; no celebrity names, likenesses or third-party assets.', 'W16': 'Minimum-product calibrator uses a restrained local recipe and preserves skin texture.', 'W17': 'Oxidation timeline is an estimate from user-entered formula behaviour, never a product claim.', 'W18': 'Seasonal rematch returns an estimated mixing ratio and prompts verification on skin.', 'W19': 'Clip-in preview shows stretched and curl-adjusted worn length separately.', 'W20': 'Tape/sew-in preview uses local attachment geometry and texture-preserving blending.', 'W21': 'Topper preview uses crown geometry and a bounded density/volume simulation.', 'W22': 'Fashion wig preview is local; fit and comfort remain in-person checks.', 'W23': 'Root touch-up is restricted to a root/scalp band and preserves outside pixels.', 'W24': 'Hairline filler/scalp concealer imports the established concealer concept and uses conservative opacity.', 'W25': 'Density fibres are procedural strands within supplied scalp/hair regions; no growth claim.', 'W26': 'Semi-permanent tint preserves luminance structure and curl texture.', 'W29': 'Money-piece placement is procedural and local with no third-party hairstyle asset.', 'W30': 'Lowlights/babylights/foil placement maps are procedural, deterministic guides.', 'W31': 'Chunky/lived-in colour uses explicit placement masks and preserves texture.', 'W32': 'Grey blending keeps a declared observed/natural share and neutral framing.', 'W33': 'Grey transition timeline is monotone and offers colouring/grow-out choices neutrally.', 'W34': 'Colour melt/ombré uses a bounded vertical blend and preserves the hair mask.', 'W35': 'Split dye uses explicit left/right mask partitions.', 'W36': 'Peekaboo colour is confined to a lower side region.', 'W37': 'Bangs/fringe preview uses head landmarks and preserves outside-hair pixels.', 'W38': 'Haircut preview uses geometry-informed suggestions without claiming an objectively best face shape.', 'W40': 'Frizz/curl-definition preview preserves curl-frequency and edge structure.', 'W41': 'Postpartum regrowth is a visual simulation only, with no medical advice or growth prediction.', 'W42': 'Calm sensitive mode caps intensity, avoids pressure language and is not medical advice.', 'W43': 'Heat-style preview includes a safety caveat and preserves a texture-retention target.', 'W44': 'Humidity forecast is an estimate derived only from user-entered humidity and curl strength.', 'W94': 'Salon price range uses user-entered/sourced bands, labels estimates and avoids affiliate steering.', 'W96': 'Occasion looks save as local recipe references without network activity.', 'W99': 'Grow-out/maintenance calendar is deterministic, local and explicitly estimated.', 'W100': 'Shade Passport is a canonical local integrity-protected export; encryption is not falsely claimed.'}

def built_entries() -> dict[str, dict[str, Any]]:
    entries: dict[str, dict[str, Any]] = {}
    for wid in IDS:
        if wid in HAIR_IDS:
            package = 'hair_women'
        elif wid in MAKEUP_IDS:
            package = 'makeup_w'
        else:
            package = 'workflow_w'
        entries[wid] = {'status': 'built', 'tested': 'Not tested', 'implementation_provider': 'local procedural fallback', 'evidence_status': 'synthetic_verified_realface_unproven', 'modules': [f'api/plumb_api/engines/{package}', f'web/src/engines/{package}', 'web/src/ui/r17b'], 'tests': ['api/tests/r17b', 'web/test/r17b-engine.test.mjs', 'web/test/r17b-studio.test.mjs'], 'note': NOTES[wid] + ' Built means implementation + synthetic tests; frozen realface quality remains Not tested.'}
    return entries

def effective_women_rows(base: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    if [str(row.get('id')) for row in base] != [f'W{i}' for i in range(1, 101)]:
        raise ValueError('complete ordered W1..W100 base required')
    built = built_entries()
    result: list[dict[str, Any]] = []
    for item in base:
        row = dict(item)
        entry = built.get(str(row['id']))
        if entry:
            if row.get('status') == 'built' and row.get('result'):
                result.append(row)
                continue
            row.update(entry)
            row.pop('blocked_reason', None)
        result.append(row)
    return result

def module_entries() -> list[dict[str, Any]]:
    return [{'id': 'r17b-hair-makeup-workflow-upscale-gender-shave', 'name': 'R17B women hair, makeup, workflow, classical upscale and full-look signals', 'status': 'Built', 'tested': 'Not tested', 'provider': 'local', 'owner': 'B', 'modules': ['api/plumb_api/engines/hair_women', 'api/plumb_api/engines/makeup_w', 'api/plumb_api/engines/workflow_w', 'api/plumb_api/engines/upscale', 'api/plumb_api/engines/gender_look', 'api/plumb_api/engines/shave', 'api/plumb_api/engines/r18b_shared', 'web/src/engines/hair_women', 'web/src/engines/makeup_w', 'web/src/engines/workflow_w', 'web/src/engines/upscale', 'web/src/engines/gender_look', 'web/src/engines/shave', 'web/src/ui/r17b'], 'tests': ['api/tests/r17b', 'web/test/r17b-engine.test.mjs', 'web/test/r17b-studio.test.mjs'], 'note': 'Additive R17 Lane B overlay. Real-face and frozen-set quality remain Not tested until box evidence exists.'}]
