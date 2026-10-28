// W93: consultation bytes are made from the current original and actual layers.
// All faces here are drawn synthetic examples. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { buildSalonPack, packText } from '../dist/js/salon/pack.js';
import { renderPackPdf, wrapText } from '../dist/js/salon/pdf.js';
import { salonPackScreen, packArchive } from '../dist/js/screens/salon-pack.js';
import { hasMetadata } from '../dist/js/save/export.js';

const date = '2026-10-23';
function editorWithLook() {
  const editor = new Editor('crown', new ShellGpuRenderer(null));
  editor.add('recolour', { colour: '#713d32', pattern: '3C' }, 30);
  return editor;
}
// Synthetic encoder boundary fixture: marker segments exercise EXIF removal;
// its pixels are checked independently at the encoder interface, never used as art.
const jpeg = () => Uint8Array.from([255,216,255,225,0,8,69,120,105,102,0,0,255,218,0,2,1,2,3,255,217]);
const encoder = { async encode(pixels, options) {
  assert.equal(pixels.data.length, pixels.width * pixels.height * 4);
  assert.equal(options.type, 'image/jpeg');
  return jpeg();
} };

test('pack starts with an immutable unedited photo and measured, qualified facts', () => {
  const editor = editorWithLook();
  try {
    const original = editor.source.image.data.slice();
    const pack = buildSalonPack(editor.source, editor.document.layers, { name: 'Copper curls', date });
    assert.deepEqual(pack.photos[0].image.data, original);
    assert.notDeepEqual(pack.photos[1].image.data, original);
    assert.notDeepEqual(pack.photos[2].image.data, pack.photos[1].image.data);
    assert.match(pack.target.source, /Chosen hair colour swatch/);
    assert.ok(pack.facts.some(fact => fact.label === 'Starting hair level'));
    assert.ok(pack.limitations.some(note => /Drawn example/.test(note)));
    assert.ok(pack.limitations.some(note => /No side view/.test(note)));
    assert.match(pack.footer, /Professional assessment in person governs suitability, formula and price\./);
    assert.equal(pack.hosted, false);
    pack.photos[0].image.data[0] ^= 255;
    assert.deepEqual(editor.source.image.data, original);
  } finally { editor.dispose(); }
});

test('allergy notes are opt-in and Unicode is preserved in the text companion', () => {
  const editor = editorWithLook();
  try {
    const options = { name: 'Été', description: 'Des boucles naturelles', date, allergies: 'Nitrile, parfum' };
    const hidden = buildSalonPack(editor.source, editor.document.layers, options);
    assert.deepEqual(hidden.allergies, []); assert.doesNotMatch(packText(hidden), /Nitrile/);
    const included = buildSalonPack(editor.source, editor.document.layers, { ...options, includeAllergies: true });
    assert.deepEqual(included.allergies, ['Nitrile', 'parfum']);
    assert.match(packText(included), /Été/);
    assert.doesNotMatch(JSON.stringify(included.steps), /Nitrile|parfum/);
  } finally { editor.dispose(); }
});

test('pack refuses absent edits, unavailable provider output and invalid dates', () => {
  const editor = new Editor('low-light', new ShellGpuRenderer(null));
  try {
    assert.throws(() => buildSalonPack(editor.source, [], { name: 'Empty', date }), /Add a/);
    editor.add('enhance');
    const layers = editor.document.layers;
    assert.throws(() => buildSalonPack(editor.source, layers, { name: 'Date', date: '2026-02-30' }), /calendar/);
    assert.throws(() => buildSalonPack(editor.source, [{ ...layers[0], provenance: 'youcam' }], { name: 'Cloud', date }), /actual approved provider result/);
    assert.throws(() => buildSalonPack(editor.source, layers, { name: 'x'.repeat(81), date }), /80/);
  } finally { editor.dispose(); }
});

test('PDF has two pages, exact byte xrefs, the original first and metadata-free previews', async () => {
  const editor = editorWithLook();
  try {
    const pack = buildSalonPack(editor.source, editor.document.layers, { name: 'Copper (curls)', date });
    const labels = [];
    const document = await renderPackPdf(pack, { async encode(pixels, options) { labels.push(options.label); return encoder.encode(pixels, options); } });
    assert.deepEqual(labels, [null, 'Simulation', 'Simulation']);
    const text = new TextDecoder().decode(document.pdf);
    assert.ok(text.startsWith('%PDF-1.4'));
    assert.equal((text.match(/\/Type \/Page\b/g) ?? []).length, 2);
    assert.match(text, /\/Author \(John Khan\)/);
    assert.equal((text.match(/Professional assessment in person/g) ?? []).length, 2);
    const offset = Number(/startxref\n(\d+)/.exec(text)[1]);
    assert.equal(new TextDecoder().decode(document.pdf.slice(offset, offset + 4)), 'xref');
    const xref = text.slice(text.indexOf('xref\n')).split('\n');
    for (let i = 1; i <= 11; i++) {
      const at = Number(xref[i + 2].slice(0, 10));
      assert.ok(new TextDecoder().decode(document.pdf.slice(at, at + 12)).startsWith(`${i} 0 obj`));
    }
    assert.ok(document.photos.every(photo => !hasMetadata(photo.bytes)));
    const zip = packArchive(pack, document);
    assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
    assert.match(new TextDecoder().decode(zip), /01-original\.jpg/);
    assert.deepEqual(wrapText('one two three', 7), ['one two', 'three']);
    assert.ok(wrapText('x'.repeat(90), 20).every(line => line.length <= 20));
  } finally { editor.dispose(); }
});

test('screen previews and downloads actual pack outputs, without a hosted link', async () => {
  const dom = installDOM(), editor = editorWithLook(), downloads = [], paints = [];
  try {
    const screen = salonPackScreen(editor, 'Copper curls', {
      date: () => date, render: pack => renderPackPdf(pack, encoder),
      download: (name, type, bytes) => downloads.push({ name, type, bytes }),
      paint: (_canvas, image, options) => paints.push({ image, options }),
    });
    await buttonNamed(screen, 'Preview pack').click();
    assert.equal(paints.length, 3); assert.equal(paints[0].options.simulate, false);
    assert.match(screen.textContent, /View-only link and QR are unavailable/);
    assert.equal(screen.querySelectorAll('a').length, 0);
    await buttonNamed(screen, 'Save PDF').click();
    await buttonNamed(screen, 'Save pack ZIP').click();
    assert.equal(downloads.length, 2);
    assert.equal(downloads[0].type, 'application/pdf');
    assert.equal(downloads[1].type, 'application/zip');
    assert.match(screen.textContent, /Check your downloads/);
    assert.equal(buttonNamed(screen, 'Save PDF').disabled, false);
  } finally { editor.dispose(); dom.restore(); }
});

test('failed export keeps the current photo and lets the user retry', async () => {
  const dom = installDOM(), editor = editorWithLook();
  try {
    const original = editor.source.image.data.slice(); let calls = 0;
    const screen = salonPackScreen(editor, 'Retry', { paint() {}, render: async () => { calls++; throw new Error('Encoder unavailable'); } });
    await buttonNamed(screen, 'Save PDF').click();
    assert.match(screen.textContent, /Encoder unavailable/);
    assert.equal(buttonNamed(screen, 'Save PDF').disabled, false);
    await buttonNamed(screen, 'Save PDF').click();
    assert.equal(calls, 2); assert.deepEqual(editor.source.image.data, original);
  } finally { editor.dispose(); dom.restore(); }
});
