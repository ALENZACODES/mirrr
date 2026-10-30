// Complexion Lab (src/makeup/complexion.js): correct, base, set and sculpt from the makeup guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildComplexionPlan, complexionOptions, swatches, zonesFrom, blushStroke, CORRECT, UNDERTONES, SKIN_TYPES, COVERAGE, FACE_SHAPES, OCCASIONS,
} from '../src/makeup/complexion.js';
import { CONTOUR_BY_FACE_SHAPE } from '../src/contouring_guide_ethnic.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { correct: 'dark_circles', fitzpatrick: 'V', undertone: 'warm', skinType: 'combination', coverage: 'medium', faceShape: 'oval', occasion: 'everyday', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = complexionOptions();
  assert.equal(o.communities.length, 9);
  assert.equal(o.tones.length, 10);
  assert.deepEqual(o.faceShapes.map(f => f.id), ['round', 'oval', 'square', 'heart', 'long', 'diamond']);
  assert.deepEqual(o.coverage.map(c => c.id), ['sheer', 'light', 'medium', 'full']);
  assert.equal(o.correct.length, 5);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildComplexionPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildComplexionPlan({ fitzpatrick: 'IX', faceShape: 'blob', coverage: 7, occasion: null }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    correct: CORRECT.map(x => x.id), fitzpatrick: FITZPATRICK, undertone: UNDERTONES.map(x => x.id), skinType: SKIN_TYPES.map(x => x.id),
    coverage: COVERAGE.map(x => x.id), faceShape: FACE_SHAPES.map(x => x.id), occasion: OCCASIONS.map(x => x.id),
    community: complexionOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildComplexionPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildComplexionPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('the corrector colour follows skin depth', () => {
  const at = fitz => buildComplexionPlan({ ...DEFAULTS, fitzpatrick: fitz }).correct;
  assert.deepEqual(at('I').swatches.map(s => s.word), ['peach']);
  assert.deepEqual(at('III').swatches.map(s => s.word), ['salmon', 'peach']);
  assert.deepEqual(at('VI').swatches.map(s => s.word), ['red-orange']);
  // The West African note names brick and red-orange: right for Type V-VI, left out for Type I.
  assert.equal(at('I').communityNote, null);
  assert.match(at('V').communityNote, /red-orange/);
  assert.ok(at('VI').deepNote);
  // The general guide's lighter or deeper option, by depth.
  assert.deepEqual(buildComplexionPlan({ ...DEFAULTS, correct: 'dark_marks', fitzpatrick: 'I' }).correct.swatches.map(s => s.word), ['peach']);
  assert.match(buildComplexionPlan({ ...DEFAULTS, correct: 'sallowness', fitzpatrick: 'IV' }).correct.colour, /^On medium to deep skin/);
  assert.match(buildComplexionPlan({ ...DEFAULTS, correct: 'sallowness', fitzpatrick: 'II' }).correct.colour, /lavender/i);
  assert.equal(buildComplexionPlan({ ...DEFAULTS, correct: 'none' }).correct, null);
});

test('formula and finish follow skin type, coverage and occasion', () => {
  const b = x => buildComplexionPlan({ ...DEFAULTS, ...x }).base;
  assert.equal(b({}).formula.id, 'liquid');
  assert.equal(b({ skinType: 'oily' }).formula.id, 'powder');
  assert.equal(b({ skinType: 'oily' }).finish.id, 'matte');
  assert.equal(b({ skinType: 'dry', coverage: 'sheer' }).formula.id, 'cushion');
  assert.equal(b({ coverage: 'full' }).formula.id, 'cream');
  assert.equal(b({ coverage: 'full', skinType: 'oily' }).formula.id, 'stick');
  assert.equal(b({ occasion: 'long_event' }).finish.id, 'transfer_proof');
  assert.equal(b({ fitzpatrick: 'II' }).oxidation, null);
  assert.ok(b({ fitzpatrick: 'IV' }).oxidation.who);
});

test('setting: tinted powder on deeper skin, flashback only for flash photos, longwear for long events', () => {
  const s = x => buildComplexionPlan({ ...DEFAULTS, ...x }).set;
  assert.equal(s({}).powder.id, 'tinted_setting_powder');
  assert.equal(s({ fitzpatrick: 'II' }).powder.id, 'translucent_powder');
  assert.equal(s({}).flashback, null);
  assert.ok(s({ occasion: 'photos' }).flashback.avoid.length > 0);
  assert.deepEqual(s({ occasion: 'photos', fitzpatrick: 'II' }).flashback.avoid, []);
  const long = buildComplexionPlan({ ...DEFAULTS, occasion: 'long_event' });
  assert.ok(long.set.primers.some(p => p.id === 'grip_primer'));
  assert.equal(long.set.spray.id, 'transfer_proof_spray');
  assert.ok(long.remove.longwear.technique.length > 0);
  assert.ok(long.remove.first.how.length > 0);
});

test('face zones and blush strokes are read from the guide placement lines', () => {
  assert.deepEqual(zonesFrom(['Light temple shading if forehead is wide']), ['temples']);
  assert.deepEqual(zonesFrom(['Hollows of cheeks (suck in cheeks to find — the hollow below the cheekbone)']), ['cheekHollow']);
  assert.deepEqual(zonesFrom(["Cupid's bow and center chin"]), ['chin', 'cupid']);
  assert.equal(blushStroke('round'), 'diagonal');
  assert.equal(blushStroke('long'), 'horizontal');
  assert.equal(blushStroke('square'), 'apples');
  assert.equal(blushStroke('diamond'), 'low');
  const p = buildComplexionPlan({ ...DEFAULTS, faceShape: 'long' });
  assert.deepEqual(p.sculpt.contour.where, CONTOUR_BY_FACE_SHAPE.long.where_to_contour);
  assert.ok(p.sculpt.contour.zones.includes('hairline'));
});

test('swatches name the guide colour words in order, without double-counting', () => {
  assert.deepEqual(swatches('True orange to red-orange').map(s => s.word), ['orange', 'red-orange']);
  assert.deepEqual(swatches('Deep terracotta, brick red, warm berry').map(s => s.word), ['terracotta', 'brick', 'berry']);
  assert.deepEqual(swatches(null), []);
});

test('face shape and undertone are never inferred from the community', () => {
  for (const c of complexionOptions().communities) {
    const p = buildComplexionPlan({ ...DEFAULTS, community: c.id });
    assert.equal(p.choices.faceShape, 'oval');
    assert.equal(p.choices.undertone, 'warm');
    assert.doesNotMatch(JSON.stringify(p.communityNotes), /common_face_shapes|commonFeatures|face shapes? (are|is) common/i);
  }
});
