// Group best-face merge: each person gets the shot where their eyes are most open, only that
// person's face oval changes, other people and the rest keep exact bytes, choices and refusals
// are coded. Shots are drawn: two faces made from the portrait sample's recorded points, with
// lids closed in one shot or the other. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { regionMask, EYE_LIDS, EYE_CLOSED_RATIO } from '../dist/js/data/regions/index.js';
import * as G from '../dist/js/save/group-merge.js';
import { faceRegions } from '../dist/js/save/multi-face.js';
import { eyeOpening } from '../dist/js/save/blink-rescue.js';
import { groupFacesScreen } from '../dist/js/screens/group-faces.js';
import { MultiFaceEdit } from '../dist/js/save/multi-face.js';
import { installDOM, buttonNamed } from './helpers/dom.mjs';

const W = 600, H = 336;
const sample = new Editor('portrait', new ShellGpuRenderer(null));
const placed = (dx, dy = 40) => sample.source.face.map(([x, y]) => [x * 0.8 + dx, y * 0.8 + dy]);
function shut(points) {
  const out = points.map(([x, y]) => [x, y]);
  for (const side of ['right', 'left']) { const [u, l] = EYE_LIDS[side]; out[u] = [out[u][0], out[l][1] - 0.4]; }
  return out;
}
function paint(data, mask, colour) { for (let i = 0; i < W * H; i++) if (mask[i] > 0.5) for (let c = 0; c < 3; c++) data[i * 4 + c] = colour[c]; }
function shot(faces, eyesOpen) {
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { const x = i % W, y = (i / W) | 0; data[i * 4] = 40 + (x % 9) * 3; data[i * 4 + 1] = 60 + (y % 7) * 4; data[i * 4 + 2] = 90; data[i * 4 + 3] = 255; }
  faces.forEach((points, k) => {
    const m = (name) => regionMask(name, points, W, H, { normalized: false, supersample: 2 }).data;
    paint(data, m('face_oval'), [196 - k * 20, 150 - k * 10, 124]);
    paint(data, m('brows'), [60, 42, 32]);
    if (eyesOpen[k]) { paint(data, m('eyes'), [238, 236, 230]); paint(data, m('irises'), [52, 40, 30]); }
  });
  return { image: { width: W, height: H, channels: 4, data }, faces };
}
const P1 = placed(10), P2 = placed(310), P1b = P1.map(([x, y]) => [x + 3, y - 2]), P2b = P2.map(([x, y]) => [x - 2, y + 2]);
const A = shot([shut(P1), P2], [false, true]);
const B = shot([P1b, shut(P2b)], [true, false]);

test('faces are matched by seat, both ways', () => {
  assert.deepEqual(G.matchFaces(A.faces, B.faces), [0, 1]);
  assert.deepEqual(G.matchFaces(A.faces, [B.faces[1]]), [null, 0]);
  assert.deepEqual(G.matchFaces(A.faces, [placed(160)]), [null, null], 'a face halfway between seats matches no one');
});

test('each person gets their open-eyed shot; only that face changes', () => {
  const before = Uint8Array.from(A.image.data);
  const result = G.mergeBestFaces([A, B]);
  assert.deepEqual(result.people.map((p) => p.shot), [1, 0]);
  assert.match(result.people[0].reason, /^Face 1 from shot 2 \(eyes open [\d.]+; shot 1: eyes closed\)\.$/);
  assert.match(result.people[1].reason, /^Face 2 kept from shot 1 \(eyes open/);
  const [r1, r2] = faceRegions(A.faces, W, H);
  let changed = 0;
  for (let i = 0; i < W * H; i++) {
    const differs = [0, 1, 2].some((c) => result.image.data[i * 4 + c] !== before[i * 4 + c]);
    if (differs) { changed++; assert.equal(r1.hard[i], 1, 'only face 1 changes'); }
    if (r2.hard[i]) assert.equal(differs, false, 'face 2 keeps its exact pixels');
    assert.equal(result.image.data[i * 4 + 3], 255);
  }
  assert.equal(changed, result.changedPixels); assert.ok(changed > 500);
  assert.deepEqual(A.image.data, before, 'the base shot is never written');
  assert.ok(eyeOpening(result.faces[0], 'right') >= EYE_CLOSED_RATIO, 'face 1 points now describe open eyes');
  assert.deepEqual(result.faces[1], A.faces[1]);
  assert.deepEqual(result.labels, [G.LABEL]);
});

test('her choice wins, and a person who cannot be lined up keeps the base face with the reason', () => {
  const chosen = G.mergeBestFaces([A, B], { choices: { 1: 1 } });
  assert.deepEqual(chosen.people.map((p) => p.shot), [1, 1]);
  assert.match(chosen.people[1].reason, /your choice/);
  const twisted = { ...B, faces: [B.faces[0].map(([x, y], i) => (i === 1 || i === 168 ? [x + 25, y + 20] : [x, y])), B.faces[1]] };
  const kept = G.mergeBestFaces([A, twisted]);
  assert.equal(kept.people[0].shot, 0);
  assert.match(kept.people[0].reason, /Face 1 kept from shot 1: The two photos do not line up/);
  const already = G.mergeBestFaces([shot([P1, P2], [true, true]), B]);
  assert.equal(already.changedPixels, 0); assert.deepEqual(already.labels, []);
});

test('refusals are coded', () => {
  const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof G.MergeError, e.message); assert.equal(e.message, G.MERGE_REFUSALS[e.code]); return e.code; } return null; };
  assert.equal(code(() => G.mergeBestFaces([A])), 'too_few_shots');
  assert.equal(code(() => G.mergeBestFaces(Array.from({ length: 7 }, () => A))), 'too_many_shots');
  assert.equal(code(() => G.mergeBestFaces([A, { image: { ...A.image, width: 300, data: new Uint8Array(300 * H * 4) }, faces: B.faces }])), 'size_mismatch');
  assert.equal(code(() => G.mergeBestFaces([{ ...A, faces: [A.faces[0]] }, B])), 'too_few_faces');
  assert.equal(code(() => G.mergeBestFaces([A, { ...B, faces: [B.faces[1]] }], { choices: { 0: 1 } })), 'invalid_choice');
});

test('the Group photo panel merges other shots and opens the result', async () => {
  const dom = installDOM();
  try {
    const source = { ...sample.source, id: 'upload:drawn-group', kind: 'uploaded', image: A.image, face: A.faces[0], faces: A.faces };
    const session = new MultiFaceEdit(source, A.faces), opened = [];
    const panel = groupFacesScreen(session, 0, () => {}, { paint() {}, consent: () => true, read: async () => B.image,
      shotFaces: async () => B.faces, openSource: (s) => opened.push(s) });
    const input = panel.querySelectorAll('input').find((i) => i.getAttribute('aria-label') === 'Other shots of this group');
    input.files = [{ name: 'b.jpg', type: 'image/jpeg', size: 10 }];
    await input.dispatch('change');
    assert.match(panel.textContent, /Face 1 from shot 2/); assert.match(panel.textContent, /Face 2 kept from shot 1/);
    await buttonNamed(panel, 'Use merged photo').click();
    assert.equal(opened.length, 1); assert.equal(opened[0].faces.length, 2); assert.notDeepEqual(opened[0].image.data, A.image.data);
    const none = groupFacesScreen(session, 0, () => {}, { paint() {}, consent: () => true, read: async () => B.image, shotFaces: async () => null });
    const other = none.querySelectorAll('input').find((i) => i.getAttribute('aria-label') === 'Other shots of this group');
    other.files = [{ name: 'b.jpg', type: 'image/jpeg', size: 10 }];
    await other.dispatch('change');
    assert.match(none.textContent, /No face points for shot 2.*Your photo is unchanged/);
  } finally { dom.restore(); }
});
