// Group photo and best selfie wiring: the hero screen hands every found face to the editor,
// the face chips keep each face's own edits, the Group photo panel shows and saves the
// combined photo, and the Best selfie panel ranks photos and opens the chosen one. Drawn photos
// and the drawn portrait sample's recorded points only. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { regionMask } from '../dist/js/data/regions/index.js';
import { EditorChrome, faceCount } from '../dist/js/layout/editor-chrome.js';
import { heroAppearanceScreen } from '../dist/js/screens/hero-appearance.js';
import { groupFacesScreen } from '../dist/js/screens/group-faces.js';
import { bestSelfieScreen } from '../dist/js/screens/best-selfie.js';
import { MultiFaceEdit } from '../dist/js/save/multi-face.js';
import { blur } from '../dist/js/engines/local/enhance.js';

const W = 600, H = 336;
const sample = new Editor('portrait', new ShellGpuRenderer(null));
const base = sample.source.face, portraitImage = sample.source.image;
const placed = (dx) => base.map(([x, y]) => [x * 0.8 + dx, y * 0.8 + 40]);
const TWO = [placed(10), placed(310)];

function groupSource() {
  const data = new Uint8Array(W * H * 3);
  for (let i = 0; i < W * H; i++) { data[i * 3] = 30 + ((i % W) >> 3) % 2 * 20; data[i * 3 + 1] = 28; data[i * 3 + 2] = 40; }
  for (const face of TWO) {
    const oval = regionMask('face_oval', face, W, H, { normalized: false, supersample: 2 }).data;
    for (let i = 0; i < W * H; i++) if (oval[i] > 0.5) { data[i * 3] = 124 + (i % 5) * 4; data[i * 3 + 1] = 86; data[i * 3 + 2] = 66; }
  }
  return { ...sample.source, id: 'upload:drawn-group', kind: 'uploaded', image: { width: W, height: H, channels: 3, data }, face: undefined };
}
function chromeFor(editor) {
  for (const id of ['lg-faces', 'lg-deliverable', 'lg-close-deliverable', 'lg-chrome-status']) {
    const node = new Element(id === 'lg-deliverable' ? 'section' : 'div'); node.setAttribute('id', id); document.body.append(node);
  }
  const view = { editor, drawn: 0, after: 0, draw() { this.drawn++; }, afterSource() { this.after++; } };
  return { chrome: new EditorChrome(view, document), view };
}
const chip = (name) => buttonNamed(document.getElementById('lg-faces'), name);

test('the editor keeps every face of a group photo and refuses bad sets', () => {
  const e = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    e.load(groupSource(), 'older'); e.add('enhance');
    e.setFaces(TWO);
    assert.equal(e.source.faces.length, 2); assert.deepEqual(e.source.face, TWO[0]);
    assert.equal(e.document.layers.length, 0, 'attaching geometry resets edits');
    assert.equal(faceCount(e), 2);
    e.setFace(TWO[1]); assert.equal(e.source.faces.length, 2, 'switching faces keeps the group');
    assert.throws(() => e.setFaces([TWO[0]]), /2 to 6/);
    assert.throws(() => e.setFaces([TWO[0], TWO[1].slice(0, 10)]), /478/);
    e.load(groupSource()); assert.equal(e.source.faces, undefined, 'a new photo starts without faces');
  } finally { e.dispose(); }
});

test('the hero screen offers per-face editing when it finds two or more faces', async () => {
  const dom = installDOM(), e = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    e.load(groupSource(), 'older');
    const ui = heroAppearanceScreen(e, () => {}, { consent: () => true, detect: async () => ({ ok: true, source: 'local-model',
      faces: TWO.map((face, i) => ({ id: `f${i}`, landmarks: face.map(([x, y]) => ({ x: x / W, y: y / H, z: 0 })) })) }) });
    await buttonNamed(ui, 'Find face points on this device').click();
    assert.match(ui.textContent, /or edit each face separately/);
    await buttonNamed(ui, 'Edit each face separately').click();
    assert.equal(e.source.faces.length, 2);
    for (let i = 0; i < 478; i++) assert.ok(Math.abs(e.source.faces[1][i][0] - TWO[1][i][0]) < 1e-9);
    assert.match(ui.textContent, /2 faces ready/);
  } finally { e.dispose(); dom.restore(); }
});

test('face chips keep each face\'s own edits and the Group photo panel keeps them apart', async () => {
  const dom = installDOM(), e = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    e.load(groupSource(), 'older'); e.setFaces(TWO);
    const { chrome } = chromeFor(e);
    chrome.refresh();
    assert.deepEqual(document.getElementById('lg-faces').querySelectorAll('button').map((b) => [b.textContent, b.disabled]), [['1', false], ['2', false], ['All', false]]);
    assert.match(document.getElementById('lg-faces').textContent, /2 faces\. Pick a face/);
    e.add('enhance', { mode: 'natural' }, 100);
    await chip('2').click();
    assert.deepEqual(e.source.face, TWO[1]); assert.equal(e.document.layers.length, 0);
    assert.match(document.getElementById('lg-chrome-status').textContent, /Editing face 2/);
    e.add('older', { stop: 3 }, 80);
    await chip('1').click();
    assert.deepEqual(e.document.layers.map((l) => [l.kind, l.strength]), [['enhance', 100]], 'face 1 gets its own edit back');
    await chip('2').click();
    assert.deepEqual(e.document.layers.map((l) => [l.kind, l.parameters.stop]), [['older', 3]]);
    chrome.openDeliverable('faces');
    const panel = document.getElementById('lg-deliverable');
    assert.equal(panel.hidden, false);
    assert.match(panel.textContent, /Face 1: 1 edit, \d+ pixels changed inside this face/);
    assert.match(panel.textContent, /Face 2 \(editing now\): 1 edit/);
    assert.match(panel.textContent, /2 faces edited, 0 left as they were/);
    await chip('All').click();
    assert.match(document.getElementById('lg-chrome-status').textContent, /Face 2's edits now apply to every face/);
  } finally { e.dispose(); dom.restore(); }
});

test('the Group photo panel saves one PNG with the simulation label and explains refusals', async () => {
  const dom = installDOM();
  try {
    const source = groupSource(), session = new MultiFaceEdit(source, TWO);
    const older = new Editor('portrait', new ShellGpuRenderer(null)); older.add('older', { stop: 2 }, 70);
    session.setEdits(1, older.document.layers); older.dispose();
    const downloads = [], labels = [];
    const panel = groupFacesScreen(session, 1, () => {}, { paint() {}, download: (name, type, bytes) => downloads.push({ name, type, bytes }),
      encoder: { async encode(pixels, options) { labels.push(options.label); assert.equal(pixels.data.length, W * H * 4); return Uint8Array.of(137, 80, 78, 71); } } });
    assert.match(panel.textContent, /Face 1: no edits; its pixels are exactly as in your photo/);
    await buttonNamed(panel, 'Save group photo').click();
    assert.deepEqual(downloads.map((d) => [d.name, d.type]), [['Group-photo.png', 'image/png']]);
    assert.deepEqual(labels, ['Simulation']);
    const faces = new Element('div');
    const failing = groupFacesScreen({ faces: TWO, editsFor: () => [], render() { throw new Error('Renderer unavailable.'); } }, 0, () => {}, { paint() {} });
    faces.append(failing);
    assert.match(failing.textContent, /Renderer unavailable\. Your original is unchanged\./);
  } finally { dom.restore(); }
});

test('the Best selfie panel ranks photos, explains each and opens the chosen one', async () => {
  const dom = installDOM();
  try {
    const images = { sharp: portraitImage, soft: blur(portraitImage, 4), flat: { ...portraitImage, data: new Uint8Array(portraitImage.data.length).fill(128) } };
    const opened = [];
    const screen = bestSelfieScreen((source) => opened.push(source), { consent: () => true, paint() {},
      read: async (file) => images[file.name], points: async (image) => image === images.flat ? null : base });
    const input = screen.querySelector('input');
    input.files = ['soft', 'sharp', 'flat'].map((name) => ({ name, type: 'image/jpeg', size: 1000 }));
    await input.dispatch('change');
    const items = screen.querySelectorAll('li');
    assert.equal(items.length, 3);
    assert.match(items[0].textContent, /^1\. Photo 2/); assert.match(items[0].textContent, /Best pick/);
    assert.match(screen.textContent, /Photo 2 is the best of 3 photos/);
    assert.match(screen.textContent, /does not judge looks/);
    assert.equal(buttonNamed(screen, 'Use Photo 3').disabled, true, 'a photo that fails a check cannot be opened');
    await buttonNamed(screen, 'Use Photo 2').click();
    assert.equal(opened.length, 1); assert.equal(opened[0].image, images.sharp); assert.equal(opened[0].kind, 'uploaded');
    const refused = bestSelfieScreen(() => {}, { consent: () => false, read: async () => portraitImage, points: async () => null });
    const other = refused.querySelector('input'); other.files = [{ name: 'a', type: 'image/jpeg', size: 1 }, { name: 'b', type: 'image/jpeg', size: 1 }];
    await other.dispatch('change');
    assert.match(refused.textContent, /Confirm adult photo consent/);
    const one = bestSelfieScreen(() => {}, { consent: () => true, read: async () => portraitImage, points: async () => null, paint() {} });
    const single = one.querySelector('input'); single.files = [{ name: 'a', type: 'image/jpeg', size: 1 }];
    await single.dispatch('change');
    assert.match(one.textContent, /Add at least two photos/);
  } finally { dom.restore(); }
});

test('the chrome opens the Best selfie panel and refuses a group panel without faces', () => {
  const dom = installDOM(), e = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    const { chrome } = chromeFor(e);
    chrome.openDeliverable('selfie');
    assert.match(document.getElementById('lg-deliverable').textContent, /Best selfie/);
    chrome.openDeliverable('faces');
    assert.match(document.getElementById('lg-chrome-status').textContent, /Find two or more faces first/);
    chrome.refresh();
    assert.deepEqual(document.getElementById('lg-faces').querySelectorAll('button').map((b) => b.disabled), [true, true]);
  } finally { e.dispose(); dom.restore(); }
});
