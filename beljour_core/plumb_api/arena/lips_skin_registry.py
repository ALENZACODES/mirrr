'R16 Lane B append-only effective registry for W45-W58 and W77-W92. Author: John Khan.'

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

LIP_IDS = tuple(f'W{i}' for i in range(45, 59))

SKIN_IDS = tuple(f'W{i}' for i in range(77, 93))

IDS = LIP_IDS + SKIN_IDS

MODULE = {**{wid: 'lips' for wid in ('W45', 'W46', 'W47', 'W48', 'W49', 'W54', 'W55', 'W56', 'W57')}, **{wid: 'smile' for wid in ('W50', 'W51', 'W52', 'W53', 'W58')}, **{wid: 'skin_more' for wid in SKIN_IDS}}

NOTES = {'W45': 'Adult-gated bounded zone-aware lip geometry; texture retained; no clinical prediction.', 'W46': 'Conservative overline with corner suppression and daylight limitation.', 'W47': 'Adult-gated fresh/healed/fade appearance states; retention is explicitly illustrative.', 'W48': 'Adult-gated subtle upper-lip eversion preview with capped geometry.', 'W49': 'Adult-gated 0.5-style and 1.0-style bounded settled-volume comparisons.', 'W50': 'Checked teeth/gum annotations replace uncleared dental segmentation; static consult comparison only.', 'W51': 'Checked teeth polygon drives shape/shade consultation preview; irreversibility warning retained.', 'W52': 'Checked tooth region and optional midline support keep/partial/visual-close gap comparison.', 'W53': 'Checked teeth/gum geometry supports tooth-character and gum-line discussion without automatic segmentation.', 'W54': 'Lip-colour optical comparison; tooth pixels are not whitened.', 'W55': 'Texture-aware matte, satin, gloss and stain families on measured lip region.', 'W56': 'Finish-class wear patterns for time/coffee/meal; estimates, not product promises.', 'W57': 'Colour is composited over observed lip pigmentation; no pink normalization.', 'W58': 'Checked per-frame annotations provide motion stability reporting without uncleared tracking models.', 'W77': 'Sheer tint matching preview with explicit undertone honesty and limited opacity.', 'W78': 'Colour-only self-tan depth/undertone simulation with dry-zone visualization and no health framing.', 'W79': 'Checked face/neck/chest/hand regions support continuity preview and over-absorption warnings.', 'W80': 'Checked skin-region cosmetic cast simulation only; no SPF efficacy or dosing claim.', 'W81': 'User-marked deeper-pigmentation cosmetic correction; no diagnosis or treatment inference.', 'W82': 'User-marked persistent-redness cosmetic correction; sensitivity-first, non-diagnostic copy.', 'W83': 'Explicit-consent local diary visualization; exportable observations, no fertility/medical prediction.', 'W84': 'Pro-age finish mode retaining texture and avoiding anti-age/erase framing.', 'W85': 'Original procedural jewellery guides with scale controls and no third-party assets.', 'W86': 'Original procedural frame guides with neutral fit language and scale controls.', 'W87': 'Checked nail/hand region colour-only preview; no hand-shape edit or learned segmentation.', 'W88': 'Checked scarf-region colour/drape simulation; never reveals hair; co-design remains release validation dependency.', 'W89': 'Editable context bundles with lower default interview intensity and neutral competence framing.', 'W90': 'Freckle preservation default plus explicitly labelled procedural faux freckles in checked region.', 'W91': 'Checked face/neck/chest regions yield colour continuity score only; no body score.', 'W92': 'Texture-first mature-skin finish preserving visible lines and texture; pro-age copy.'}

def built_entries() -> dict[str, dict[str, Any]]:
    out = {}
    for wid in IDS:
        pkg = MODULE[wid]
        out[wid] = {'status': 'built', 'tested': 'Not tested', 'implementation_provider': 'local procedural fallback', 'evidence_status': 'synthetic_verified_realface_unproven', 'modules': [f'api/plumb_api/engines/{pkg}', f'web/src/engines/{pkg}', 'web/src/ui/r16b'], 'tests': ['api/tests/r16b/test_lips_smile_skin.py', 'web/test/r16b-lips-skin.test.mjs', 'web/test/r16b-studio.test.mjs'], 'note': NOTES[wid] + ' Built means implementation + synthetic tests; frozen real-face quality remains Not tested.'}
    return out

def effective_women_rows(base: Sequence[Mapping[str, Any]]) -> list[dict[str, Any]]:
    if [str(x.get('id')) for x in base] != [f'W{i}' for i in range(1, 101)]:
        raise ValueError('complete ordered W1..W100 base required')
    built = built_entries()
    result = []
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
    return [{'id': 'r16b-lips-smile-skin-more', 'name': 'R16B lips, smile and Skin & More local simulations', 'status': 'Built', 'tested': 'Not tested', 'provider': 'local', 'modules': ['api/plumb_api/engines/lips', 'api/plumb_api/engines/smile', 'api/plumb_api/engines/skin_more', 'web/src/engines/lips', 'web/src/engines/smile', 'web/src/engines/skin_more', 'web/src/ui/r16b'], 'tests': ['api/tests/r16b/test_lips_smile_skin.py', 'web/test/r16b-lips-skin.test.mjs', 'web/test/r16b-studio.test.mjs'], 'note': 'Append-only R16 Lane B overlay. No real-face pass is claimed.'}]
