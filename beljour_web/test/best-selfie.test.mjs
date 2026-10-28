// Best selfie picker: photos are ranked by the pre-check plus eyes open from face points, and
// every place has a plain reason. Photos are the drawn portrait sample and drawn variants of
// it (blurred, darkened, flat, eyes closed by moving the lid points). Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { blur } from '../dist/js/engines/local/enhance.js';
import { EYE_LIDS, EYE_CLOSED_RATIO } from '../dist/js/data/regions/index.js';
import * as S from '../dist/js/ui/shell/best-selfie.js';

const editor = new Editor('portrait', new ShellGpuRenderer(null));
const sharp = editor.source.image, face = editor.source.face;
const copy = (img, map) => ({ ...img, data: Uint8Array.from(img.data, map) });
const soft = blur(sharp, 4);
const dark = copy(sharp, (v) => Math.round(v * 0.3));
const flat = copy(sharp, () => 128);
function closed(which = ['right', 'left']) {
  const out = face.map(([x, y]) => [x, y]);
  for (const side of which) { const [upper, lower] = EYE_LIDS[side]; out[upper] = [...out[lower]]; }
  return out;
}
const photo = (id, image, points = face) => ({ id, label: `Photo ${id}`, image, face: points });

test('eyes open is read from the lid points with the editor\'s closed-eye ratio', () => {
  const open = S.eyeReading(face);
  assert.equal(open.state, 'open'); assert.ok(open.right >= EYE_CLOSED_RATIO && open.left >= EYE_CLOSED_RATIO);
  assert.equal(S.eyeReading(closed()).state, 'closed');
  assert.equal(S.eyeReading(closed(['left'])).state, 'one_closed');
  assert.deepEqual(S.eyeReading(null), { state: 'not_checked', right: null, left: null });
});

test('the order follows usable, eyes, checks to look at, then sharpness, with a reason for each', () => {
  const ranking = S.rankSelfies([photo('A', soft), photo('B', sharp, closed()), photo('C', sharp), photo('D', flat), photo('E', dark)]);
  const ids = ranking.rows.map((r) => r.id);
  assert.equal(ranking.best, 'C'); assert.equal(ids[0], 'C');
  assert.equal(ids.at(-1), 'D', 'a flat photo is not usable and goes last');
  assert.ok(ids.indexOf('B') > ids.indexOf('A'), 'closed eyes rank below open eyes, even when sharper');
  const row = (id) => ranking.rows.find((r) => r.id === id);
  assert.match(row('C').why, /^Best pick: \d+ of \d+ checks passed, both eyes open/);
  assert.match(row('B').why, /both eyes look closed, against both eyes open/);
  assert.equal(row('D').usable, false); assert.match(row('D').why, /^Not usable: Content/);
  assert.ok(row('A').sharpness > row('C').sharpness, 'the blurred copy measures less sharp');
  assert.match(row('A').why, /Ranked below Photo C/);
  assert.equal(row('E').usable, true); assert.ok(row('E').report.checks.some((c) => c.id === 'light' && c.level === 'warn'));
  assert.match(row('E').why, /Light: The photo is dark/);
  assert.match(ranking.summary, /Photo C is the best of 5 photos/);
  assert.ok(ranking.notes.some((n) => /does not judge looks/.test(n)));
  assert.deepEqual(ranking.rows.map((r) => r.rank), [1, 2, 3, 4, 5]);
});

test('ranking is deterministic; ties keep the order she added them', () => {
  const inputs = [photo('first', sharp), photo('second', sharp)];
  const a = S.rankSelfies(inputs), b = S.rankSelfies(inputs);
  assert.deepEqual(a.rows.map((r) => [r.id, r.why]), b.rows.map((r) => [r.id, r.why]));
  assert.equal(a.best, 'first'); assert.match(a.rows[1].why, /Level with Photo first on every check; Photo first was added first/);
  assert.equal(S.rankSelfies([...inputs].reverse()).best, 'second');
});

test('without face points eyes are not checked, and the result says so', () => {
  const ranking = S.rankSelfies([photo('X', sharp, null), photo('Y', soft, null)]);
  assert.ok(ranking.rows.every((r) => r.eyes.state === 'not_checked'));
  assert.ok(ranking.notes.some((n) => /only on photos with face points/.test(n)));
  assert.equal(ranking.best, 'X');
  assert.match(ranking.rows[0].why, /eyes not checked/);
});

test('when no photo is usable there is no best pick', () => {
  const ranking = S.rankSelfies([photo('F', flat), photo('G', copy(sharp, () => 4))]);
  assert.equal(ranking.best, null); assert.match(ranking.summary, /None of these photos can be used/);
  assert.ok(ranking.rows.every((r) => /^Not usable/.test(r.why)));
});

test('the input photos are not changed and refusals are coded', () => {
  const before = Uint8Array.from(sharp.data);
  S.rankSelfies([photo('A', sharp), photo('B', soft)]);
  assert.deepEqual(Uint8Array.from(sharp.data), before);
  const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof S.SelfieError); return e.code; } return null; };
  assert.equal(code(() => S.rankSelfies([photo('A', sharp)])), 'too_few_photos');
  assert.equal(code(() => S.rankSelfies(Array.from({ length: 13 }, (_, i) => photo(String(i), sharp)))), 'too_many_photos');
  assert.equal(code(() => S.rankSelfies([photo('A', sharp), photo('A', soft)])), 'duplicate_id');
});
