// Blink rescue: eyes from a second drawn photo of the same drawn face, aligned, colour matched and
// seam-blended; only the eye areas change, brows and the rest keep exact bytes, alpha is kept,
// and refusals are coded. Faces are drawn from the portrait sample's recorded points: the
// donor is that face scaled, turned and moved with eyes open, the target has its lids closed.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { regionMask } from '../dist/js/data/regions/index.js';
import { EYE_LIDS, EYE_CLOSED_RATIO } from '../dist/js/data/regions/index.js';
import * as B from '../dist/js/save/blink-rescue.js';
import { fitSimilarity, mapPoint, TransferError } from '../dist/js/save/region-transfer.js';
import { blinkRescueScreen } from '../dist/js/screens/blink-rescue.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { EditorChrome } from '../dist/js/layout/editor-chrome.js';

const W = 300, H = 360;
const sample = new Editor('portrait', new ShellGpuRenderer(null));
const open = sample.source.face.map(([x, y]) => [x + 14, y + 12]);
function closedLids(points) {
  const out = points.map(([x, y]) => [x, y]);
  for (const side of ['right', 'left']) {
    const [upper, lower] = EYE_LIDS[side];
    out[upper] = [out[upper][0], out[lower][1] - 0.4];
  }
  return out;
}
const turned = (points, s = 1.08, deg = 4, dx = 9, dy = -6) => {
  const r = deg * Math.PI / 180, cx = W / 2, cy = H / 2;
  return points.map(([x, y]) => [cx + s * (Math.cos(r) * (x - cx) - Math.sin(r) * (y - cy)) + dx, cy + s * (Math.sin(r) * (x - cx) + Math.cos(r) * (y - cy)) + dy]);
};
const SKIN = [196, 150, 124], WHITE = [238, 236, 230], IRIS = [52, 40, 30], BROW = [60, 42, 32];
function paint(data, mask, colour) { for (let i = 0; i < W * H; i++) if (mask[i] > 0.5) for (let c = 0; c < 3; c++) data[i * 4 + c] = colour[c]; }
/** A drawn face: backdrop, skin oval, brows, and eyes (white with an iris) or closed lids. */
function drawn(points, eyesOpen) {
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { const x = i % W, y = (i / W) | 0; data[i * 4] = 40 + (x % 9) * 3; data[i * 4 + 1] = 60 + (y % 7) * 4; data[i * 4 + 2] = 90; data[i * 4 + 3] = x < 6 ? 140 : 255; }
  const mask = (name) => regionMask(name, points, W, H, { normalized: false, supersample: 2 }).data;
  const oval = mask('face_oval');
  paint(data, oval, SKIN);
  for (let i = 0; i < W * H; i++) if (oval[i] > 0.5) data[i * 4 + 1] = SKIN[1] + ((i * 7) % 5);
  paint(data, mask('brows'), BROW);
  if (eyesOpen) { paint(data, mask('eyes'), WHITE); paint(data, mask('irises'), IRIS); }
  return { width: W, height: H, channels: 4, data };
}
const target = closedLids(open), donorPoints = turned(open);
const targetImage = drawn(target, false), donorImage = drawn(donorPoints, true);

test('the similarity fit recovers a known scale, turn and shift', () => {
  const fit = fitSimilarity(open, donorPoints);
  assert.ok(Math.abs(fit.scale - 1.08) < 1e-9 && fit.rms < 1e-9);
  const p = mapPoint(fit, open[1]);
  assert.ok(Math.abs(p[0] - donorPoints[1][0]) < 1e-9 && Math.abs(p[1] - donorPoints[1][1]) < 1e-9);
});

test('closed eyes are replaced by the aligned open eyes; nothing else changes', () => {
  const before = Uint8Array.from(targetImage.data);
  const result = B.rescueBlink(targetImage, target, donorImage, donorPoints, { samePerson: true });
  assert.deepEqual(result.eyes, ['right', 'left']);
  assert.deepEqual(targetImage.data, before, 'the input photo is never written');
  const areas = ['right', 'left'].map((side) => B.eyeArea(target, side, W, H, result.points).data);
  const brows = regionMask('brows', target, W, H, { normalized: false, supersample: 2 }).data;
  let changed = 0;
  for (let i = 0; i < W * H; i++) {
    const differs = [0, 1, 2].some((c) => result.image.data[i * 4 + c] !== before[i * 4 + c]);
    if (differs) { changed++; assert.ok(areas[0][i] > 0 || areas[1][i] > 0, `pixel ${i} changed outside the eyes`); }
    if (brows[i] > 0) assert.equal(differs, false, 'brows keep their exact pixels');
    assert.equal(result.image.data[i * 4 + 3], before[i * 4 + 3], 'alpha untouched');
  }
  assert.equal(changed, result.changed); assert.ok(changed > 100);
  for (const pupil of [468, 473]) {  // the iris is back where the eye is, and dark
    const [x, y] = result.points[pupil].map(Math.round), i = (y * W + x) * 4;
    assert.ok(result.image.data[i] < 110 && result.image.data[i + 1] < 110, `iris at ${pupil}`);
  }
  for (const side of ['right', 'left']) assert.ok(B.eyeOpening(result.points, side) >= EYE_CLOSED_RATIO, 'the points now describe open eyes');
  assert.match(result.labels[0], /from two of your photos/);
});

test('only the closed eye is rescued when one eye is open', () => {
  const oneClosed = open.map(([x, y]) => [x, y]); const [u, l] = EYE_LIDS.left; oneClosed[u] = [oneClosed[u][0], oneClosed[l][1] - 0.4];
  const result = B.rescueBlink(drawn(oneClosed, true), oneClosed, donorImage, donorPoints, { samePerson: true });
  assert.deepEqual(result.eyes, ['left']);
  const left = B.eyeArea(oneClosed, 'left', W, H, result.points).data, base = drawn(oneClosed, true).data;
  for (let i = 0; i < W * H; i++) if ([0, 1, 2].some((c) => result.image.data[i * 4 + c] !== base[i * 4 + c])) assert.ok(left[i] > 0, 'only the left eye area changes');
});

test('refusals are coded and keep the photo', () => {
  const code = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof B.BlinkError || e instanceof TransferError, e.message); return e.code; } return null; };
  assert.equal(code(() => B.rescueBlink(targetImage, target, donorImage, donorPoints)), 'not_confirmed');
  assert.equal(code(() => B.rescueBlink(targetImage, target, donorImage, donorPoints.slice(0, 100), { samePerson: true })), 'invalid_points');
  assert.equal(code(() => B.rescueBlink(donorImage, donorPoints, donorImage, donorPoints, { samePerson: true })), 'eyes_already_open');
  assert.equal(code(() => B.rescueBlink(targetImage, target, targetImage, target, { samePerson: true })), 'donor_eyes_closed');
  const otherPose = donorPoints.map(([x, y], i) => (i === 33 || i === 133 ? [x + 18, y + 14] : [x, y]));
  assert.equal(code(() => B.rescueBlink(targetImage, target, donorImage, otherPose, { samePerson: true })), 'pose_mismatch');
  const offPhoto = turned(open, 1, 0, -150, 0);
  assert.equal(code(() => B.rescueBlink(targetImage, target, donorImage, offPhoto, { samePerson: true })), 'outside_photo');
});

test('the Blink rescue panel needs her confirmation, then opens the result with open-eye points', async () => {
  const dom = installDOM();
  try {
    const source = { ...sample.source, id: 'upload:drawn-blink', kind: 'uploaded', image: targetImage, face: target };
    const opened = [];
    const panel = blinkRescueScreen(() => source, (s) => opened.push(s), { consent: () => true, paint() {},
      read: async () => donorImage, points: async () => donorPoints });
    const input = panel.querySelector('input[type="file"]') ?? panel.querySelectorAll('input').find((i) => i.getAttribute('type') === 'file');
    input.files = [{ name: 'other.jpg', type: 'image/jpeg', size: 10 }];
    await input.dispatch('change');
    assert.match(panel.textContent, /Confirm that both photos are of you.*Your photo is unchanged/);
    assert.equal(buttonNamed(panel, 'Use this result').disabled, true);
    panel.querySelectorAll('input').find((i) => i.getAttribute('type') === 'checkbox').checked = true;
    input.files = [{ name: 'other.jpg', type: 'image/jpeg', size: 10 }];
    await input.dispatch('change');
    assert.match(panel.textContent, /Both eyes now come from your other photo/);
    await buttonNamed(panel, 'Use this result').click();
    assert.equal(opened.length, 1);
    assert.notDeepEqual(opened[0].image.data, targetImage.data);
    assert.ok(B.eyeOpening(opened[0].face, 'right') >= EYE_CLOSED_RATIO);
    const none = blinkRescueScreen(() => source, () => {}, { consent: () => true, read: async () => donorImage, points: async () => null });
    const other = none.querySelectorAll('input').find((i) => i.getAttribute('type') === 'file');
    other.files = [{ name: 'x.jpg', type: 'image/jpeg', size: 1 }];
    await other.dispatch('change');
    assert.match(none.textContent, /No face points for the other photo/);
    for (const id of ['lg-deliverable', 'lg-close-deliverable', 'lg-chrome-status', 'lg-faces']) { const n = new Element('div'); n.setAttribute('id', id); document.body.append(n); }
    const e = new Editor('portrait', new ShellGpuRenderer(null));
    new EditorChrome({ editor: e, draw() {}, afterSource() {} }, document).openDeliverable('blink');
    assert.match(document.getElementById('lg-deliverable').textContent, /Blink rescue/);
    e.dispose();
  } finally { dom.restore(); }
});
