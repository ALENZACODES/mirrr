// W39 UI is wired to the existing geometry-preserving renderer and a usable
// manual hair mask. Synthetic drawings only. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { recolourScreen, CURL_PATTERNS } from '../dist/js/screens/recolour.js';
import { HairPainter, hairPainterSection } from '../dist/js/screens/hair-painter.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { uploadedSource } from '../dist/js/ui/shell/demo.js';

const drawn = () => ({ width: 32, height: 32, channels: 3, data: Uint8Array.from({ length: 32 * 32 * 3 }, (_, i) => 30 + (i % 21)) });

test('recolour screen shows every curl pattern and creates a real colour layer', async () => {
  const dom = installDOM(), editor = new Editor('crown', new ShellGpuRenderer(null));
  try {
    const screen = recolourScreen(editor, () => {});
    assert.ok(CURL_PATTERNS.includes('4C'));
    assert.match(screen.textContent, /without moving strands/);
    assert.match(screen.textContent, /Real colour results are not tested/);
    const before = editor.source.image.data.slice();
    await buttonNamed(screen, 'Preview this hair colour').click();
    const preview = editor.rendered();
    assert.notDeepEqual(preview.image.data, before);
    assert.equal(preview.metrics[0].outside_unchanged, true);
    assert.deepEqual(editor.source.image.data, before);
  } finally { editor.dispose(); dom.restore(); }
});

test('unmarked uploaded hair is unavailable until she paints an area herself', () => {
  const dom = installDOM(), editor = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    editor.load(uploadedSource(drawn(), 'upload:drawn'), 'recolour');
    const screen = recolourScreen(editor, () => {});
    assert.equal(buttonNamed(screen, 'Preview this hair colour'), undefined);
    assert.equal(editor.canApply, false);
    const painter = new HairPainter(32, 32);
    painter.begin(); painter.dab(10, 10, 6, 'hair'); painter.end();
    const masks = painter.masks(); editor.setHair(masks.hair);
    assert.equal(editor.canApply, true);
    assert.equal(editor.source.image.data[0], 30);
  } finally { editor.dispose(); dom.restore(); }
});

test('manual brush interpolates fast pointer movement, erases placement with hair, and undoes', () => {
  const painter = new HairPainter(32, 32);
  painter.begin(); painter.line(5, 5, 4, 'hair'); painter.line(25, 5, 4, 'hair'); painter.end();
  for (let x = 5; x <= 25; x++) assert.equal(painter.hair[5 * 32 + x], 1);
  const old = painter.hair.slice();
  painter.begin(); painter.dab(15, 5, 3, 'placement'); painter.end();
  assert.ok(painter.paintedPixels > 0);
  painter.begin(); painter.dab(15, 5, 5, 'hair', true); painter.end();
  assert.equal(painter.placement[5 * 32 + 15], 0);
  painter.undo(); assert.deepEqual(painter.hair, old);
  painter.clear('hair'); assert.equal(painter.hairPixels, 0); assert.equal(painter.paintedPixels, 0);
});

test('the hair painter supports keyboard painting and explicit commit', async () => {
  const dom = installDOM();
  try {
    const painter = new HairPainter(32, 32), commits = [];
    const section = hairPainterSection(drawn(), painter, (hair, placement) => commits.push({ hair, placement }));
    assert.equal(buttonNamed(section, 'Use these markings').disabled, true);
    const canvas = section.querySelector('canvas');
    await canvas.dispatch('keydown', { key: ' ' });
    assert.ok(painter.hairPixels >= 16);
    await buttonNamed(section, 'Use these markings').click();
    assert.equal(commits.length, 1);
    assert.equal(commits[0].hair.width, 32);
    assert.notEqual(commits[0].hair.data, painter.hair, 'committed copy cannot be mutated by the brush');
  } finally { dom.restore(); }
});

test('mask inputs reject wrong sizes, invalid values and out-of-range brush settings', () => {
  assert.throws(() => new HairPainter(0, 32), /image/);
  assert.throws(() => new HairPainter(32, 32, { width: 4, height: 4, data: new Float32Array(16) }), /match/);
  const painter = new HairPainter(32, 32);
  assert.throws(() => painter.dab(0, 0, 0, 'hair'), /radius/);
  painter.begin(); painter.dab(-100, -100, 3, 'hair'); painter.end();
  assert.equal(painter.hairPixels, 0, 'off-image brush cannot grow the array');
});

test('committing a different hair mask invalidates both strip and compare preview keys', async () => {
  const { StripCache } = await import('../dist/js/ui/shell/thumbnails.js');
  const editor = new Editor('crown', new ShellGpuRenderer(null)), cache = new StripCache();
  try {
    editor.add('recolour', { colour: '#713d32' }, 60);
    const before = editor.rendered().image.data.slice(), key = cache.key(editor.source, 'recolour');
    const renderVersion = editor.renderVersion;
    cache.set(editor.source, 'recolour', [{ label: 'old pixels' }]);
    const hair = { ...editor.source.hair, data: Float32Array.from(editor.source.hair.data) };
    for (let i = 0; i < hair.data.length; i++) if (i % hair.width < hair.width / 2) hair.data[i] = 0;
    editor.setHair(hair);
    assert.notEqual(editor.renderVersion, renderVersion);
    assert.notEqual(cache.key(editor.source, 'recolour'), key);
    assert.equal(cache.get(editor.source, 'recolour'), undefined);
    assert.notDeepEqual(editor.rendered().image.data, before);
    const invalid = { ...hair, data: new Float32Array(1) };
    assert.throws(() => editor.setHair(invalid), /match the photo/);
  } finally { editor.dispose(); }
});
