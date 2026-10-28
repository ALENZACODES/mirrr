// Decision spec sheet: settings only unless she includes photos, the exact shade target, the
// placement on drawn masks, ASSUMED CAD estimates she can replace, a printable PDF, and the
// Salon Decision Pack wiring. Drawn sample photos and drawn masks only. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { hairDecision, foundationDecision, sheetText, servicesFor } from '../dist/js/salon/spec.js';
import { renderSheetPdf } from '../dist/js/salon/spec-pdf.js';
import { salonPackScreen } from '../dist/js/screens/salon-pack.js';
import { decisionSection } from '../dist/js/screens/decision-sheet.js';
import * as D from '../dist/js/engines/workflow_w/decision.js';

const date = '2026-10-28';
const jpeg = () => Uint8Array.from([255, 216, 255, 225, 0, 8, 69, 120, 105, 102, 0, 0, 255, 218, 0, 2, 1, 2, 3, 255, 217]);
const encoder = (labels = []) => ({ async encode(pixels, options) {
  assert.equal(pixels.data.length, pixels.width * pixels.height * 4); labels.push(options.label); return jpeg();
} });
const byLabel = (root, label) => root.querySelectorAll('input').find((i) => i.getAttribute('aria-label') === label);
function noNetwork() { const prior = globalThis.fetch; globalThis.fetch = () => { throw new Error('No network permitted'); }; return () => { globalThis.fetch = prior; }; }

/** Crown sample with a drawn hair rectangle; `paintEnds` paints exactly its lowest third. */
function hairEditor({ balayage = false, paintEnds = false } = {}) {
  const editor = new Editor('crown', new ShellGpuRenderer(null));
  const { width, height } = editor.source.image;
  const hair = new Float32Array(width * height), paint = new Float32Array(width * height);
  for (let y = 30; y < 150; y++) for (let x = 40; x < 180; x++) hair[y * width + x] = 1;
  for (let y = 110; y < 150; y++) for (let x = 40; x < 180; x++) paint[y * width + x] = 0.9;
  for (let x = 0; x < width; x++) paint[x] = 1;  // strokes off the hair never count
  editor.setHair({ width, height, channels: 1, data: hair }, paintEnds ? { width, height, channels: 1, data: paint } : undefined);
  if (balayage) editor.add('balayage', { target_level: 8, history: 'colour_treated', toner: 'ash', softness: 4 }, 60);
  else editor.add('recolour', { colour: '#713d32', curl_pattern: '3C' }, 40);
  return editor;
}

test('a hair sheet is settings only by default and names the exact target', () => {
  const restore = noNetwork(), editor = hairEditor();
  try {
    const sheet = hairDecision(editor.source, editor.document.layers, { name: 'Copper curls', date });
    assert.equal(sheet.photos.length, 0); assert.equal(sheet.photosIncluded, false);
    assert.equal(sheet.subject, 'hair'); assert.equal(sheet.spec.service, 'all_over_colour');
    assert.match(sheet.specLines[0], /^Hair target: level \d+ of 10/);
    assert.match(sheet.specLines[1], /^Nearest in-house swatch /);
    assert.ok(sheet.specLines.some((l) => /mixing recipe/.test(l)));
    assert.ok(sheet.spec.base_level !== null, 'base level measured from the drawn hair');
    assert.deepEqual(sheet.placementLines, ['Placement: all of your marked hair, roots to ends.']);
    assert.ok(sheet.costLines.every((l) => /CAD|estimate/i.test(l)));
    assert.match(sheet.costLines.at(-1), /not a quote/);
    assert.match(sheet.footer, /Professional assessment in person governs suitability, formula and price\./);
    const text = sheetText(sheet);
    assert.match(text, /Photos: none\. Settings only\./);
    assert.doesNotMatch(text, /data:|blob:|sha256|\.jpg/);
    assert.ok(sheet.limitations.some((l) => /Drawn example/.test(l)));
  } finally { editor.dispose(); restore(); }
});

test('a balayage sheet measures the painted placement on a drawn mask exactly', () => {
  const editor = hairEditor({ balayage: true, paintEnds: true });
  try {
    const sheet = hairDecision(editor.source, editor.document.layers, { name: 'Ash ends', date });
    assert.equal(sheet.spec.mode, 'balayage'); assert.equal(sheet.spec.toner, 'ash'); assert.equal(sheet.cost.service, 'balayage');
    assert.equal(sheet.cost.sessions, sheet.spec.sessions);
    assert.ok(Math.abs(sheet.placement.coverage - 1 / 3) < 1e-12);
    assert.deepEqual(sheet.placement.zones, { roots: 0, mid_lengths: 0, ends: 1 });
    assert.equal(sheet.placementLines[1], 'By height: roots 0%, mid-lengths 0%, ends 100%.');
    assert.ok(sheet.map && sheet.map.values.length === editor.source.image.width * editor.source.image.height);
  } finally { editor.dispose(); }
});

test('photos appear only when she includes them, her unedited photo first', () => {
  const editor = hairEditor();
  try {
    const original = editor.source.image.data.slice();
    const sheet = hairDecision(editor.source, editor.document.layers, { name: 'With photos', date, includePhotos: true });
    assert.deepEqual(sheet.photos.map((p) => p.role), ['original', 'preview']);
    assert.deepEqual(sheet.photos[0].image.data, original);
    assert.notDeepEqual(sheet.photos[1].image.data, original);
    sheet.photos[0].image.data[0] ^= 255;
    assert.deepEqual(editor.source.image.data, original);
    assert.match(sheetText(sheet), /included by your choice, your unedited photo first/);
  } finally { editor.dispose(); }
});

test('her own figures replace the ASSUMED ones; a non-hair service or bad figures are refused', () => {
  const editor = hairEditor();
  try {
    const layers = editor.document.layers;
    const mine = hairDecision(editor.source, layers, { name: 'Mine', date, figures: { price: [120, 150], upkeepPrice: [80, 90] } });
    assert.deepEqual(mine.cost.edited, ['price', 'upkeep_price']); assert.match(mine.costLines[0], /\$120 to \$150 CAD per session \(your figures\)/);
    const toner = hairDecision(editor.source, layers, { name: 'Toner', date, service: 'toner_gloss' });
    assert.equal(toner.cost.service, 'toner_gloss'); assert.equal(toner.cost.sessions, 1);
    assert.throws(() => hairDecision(editor.source, layers, { name: 'x', date, service: 'foundation_bottle' }), D.DecisionError);
    assert.throws(() => hairDecision(editor.source, layers, { name: 'x', date, figures: { price: [200, 100] } }), /low first/);
    assert.throws(() => hairDecision(editor.source, layers, { name: 'x', date: '2026-02-30' }), /calendar/);
    assert.deepEqual(servicesFor('makeup'), ['foundation_bottle', 'makeup_application']);
  } finally { editor.dispose(); }
});

test('a sheet needs a local hair colour look', () => {
  const plain = new Editor('low-light', new ShellGpuRenderer(null)), editor = hairEditor();
  try {
    assert.throws(() => hairDecision(plain.source, [], { name: 'Empty', date }), /Add a/);
    plain.add('enhance');
    assert.throws(() => hairDecision(plain.source, plain.document.layers, { name: 'No hair', date }), /hair colour or balayage/);
    const unmarked = hairDecision({ ...editor.source, hair: undefined }, editor.document.layers, { name: 'Unmarked', date });
    assert.equal(unmarked.spec.base_level, null); assert.equal(unmarked.placement, null);
    assert.match(unmarked.placementLines[0], /mark your hair/);
    assert.match(unmarked.specLines.at(-2), /Starting level unknown/);
    assert.throws(() => hairDecision(editor.source, [{ ...editor.document.layers[0], provenance: 'youcam' }], { name: 'Cloud', date }), /approved provider result/);
  } finally { plain.dispose(); editor.dispose(); }
});

test('a foundation sheet comes from a confident reading and never holds a photo', () => {
  const reading = { refused: false, measured_lab: [62, 12, 18], reason: null };
  const sheet = foundationDecision(reading, { name: 'Foundation shade', date, includePhotos: true });
  assert.equal(sheet.subject, 'makeup'); assert.equal(sheet.photos.length, 0);
  assert.equal(sheet.cost.service, 'foundation_bottle');
  assert.match(sheet.specLines[0], /^Foundation: measured depth band \d+ of 10/);
  assert.ok(sheet.specLines.some((l) => /never lighter than measured/.test(l)));
  assert.equal(foundationDecision(reading, { name: 'Day', date, service: 'makeup_application' }).cost.year_one, null);
  assert.throws(() => foundationDecision({ refused: true, measured_lab: null, reason: 'too dark to read' }, { name: 'x', date }), /too dark to read/);
});

test('the settings-only PDF has one page and no image; with photos it has two, original first', async () => {
  const editor = hairEditor({ balayage: true, paintEnds: true });
  try {
    const layers = editor.document.layers;
    const plain = await renderSheetPdf(hairDecision(editor.source, layers, { name: 'Plain (sheet)', date }), encoder());
    const text = new TextDecoder().decode(plain.pdf);
    assert.equal(plain.pages, 1); assert.ok(text.startsWith('%PDF-1.4'));
    assert.equal((text.match(/\/Type \/Page\b/g) ?? []).length, 1);
    assert.doesNotMatch(text, /\/Subtype \/Image|DCTDecode/);
    assert.match(text, /Decision spec sheet/); assert.match(text, /CAD/); assert.match(text, /\/Author \(John Khan\)/);
    assert.match(text, /Professional assessment in person/);
    const offset = Number(/startxref\n(\d+)/.exec(text)[1]);
    assert.equal(new TextDecoder().decode(plain.pdf.slice(offset, offset + 4)), 'xref');
    const xref = text.slice(text.indexOf('xref\n')).split('\n'), count = Number(/\/Size (\d+)/.exec(text)[1]) - 1;
    for (let i = 1; i <= count; i++) {
      const at = Number(xref[i + 2].slice(0, 10));
      assert.ok(new TextDecoder().decode(plain.pdf.slice(at, at + 12)).startsWith(`${i} 0 obj`), `object ${i}`);
    }
    const labels = [];
    const photos = await renderSheetPdf(hairDecision(editor.source, layers, { name: 'Photos', date, includePhotos: true }), encoder(labels));
    assert.equal(photos.pages, 2); assert.deepEqual(labels, [null, 'Simulation']);
    assert.equal((new TextDecoder().decode(photos.pdf).match(/\/Subtype \/Image/g) ?? []).length, 2);
  } finally { editor.dispose(); }
});

test('the Salon Decision Pack screen offers the spec sheet first, photos off, figures editable', async () => {
  const dom = installDOM(), restore = noNetwork(), editor = hairEditor(), downloads = [], paints = [];
  try {
    const screen = salonPackScreen(editor, 'Copper curls', { date: () => date, sheet: {
      date: () => date, render: (sheet) => renderSheetPdf(sheet, encoder()),
      download: (name, type, bytes) => downloads.push({ name, type, bytes }), paint: (_c, image, options) => paints.push({ image, options }) } });
    await buttonNamed(screen, 'Preview spec sheet').click();
    assert.equal(paints.length, 0);
    assert.match(screen.textContent, /No photo is included\. Settings only\./);
    assert.match(screen.textContent, /Hair target: level/);
    assert.match(screen.textContent, /\(ASSUMED estimate\)/);
    const low = byLabel(screen, 'Price per session, CAD, low'), high = byLabel(screen, 'Price per session, CAD, high');
    assert.equal(low.placeholder, '110'); assert.equal(high.placeholder, '190');
    low.value = '130'; await buttonNamed(screen, 'Preview spec sheet').click();
    assert.match(screen.textContent, /enter both a low and a high value/);
    high.value = '170'; await buttonNamed(screen, 'Preview spec sheet').click();
    assert.match(screen.textContent, /\$130 to \$170 CAD per session \(your figures\)/);
    await buttonNamed(screen, 'Save spec sheet').click();
    assert.equal(downloads.at(-1).type, 'application/pdf'); assert.match(downloads.at(-1).name, /^Spec-.*\.pdf$/);
    assert.doesNotMatch(new TextDecoder().decode(downloads.at(-1).bytes), /DCTDecode/);
    await buttonNamed(screen, 'Save spec sheet as text').click();
    assert.match(new TextDecoder().decode(downloads.at(-1).bytes), /Settings only/);
    const include = byLabel(screen, 'Include my photos');
    include.checked = true;
    await buttonNamed(screen, 'Preview spec sheet').click();
    assert.equal(paints.length, 2); assert.equal(paints[0].options.simulate, false);
    assert.ok(buttonNamed(screen, 'Save PDF'), 'the photo pack stays available below');
    assert.equal(screen.querySelectorAll('a').length, 0);
  } finally { editor.dispose(); dom.restore(); restore(); }
});

test('the makeup section never offers photos and explains a missing reading', async () => {
  const dom = installDOM(); try {
    const section = decisionSection('makeup', () => { throw new RangeError('Find your shade on this device first.'); }, { name: () => 'Foundation', photos: false });
    assert.match(section.textContent, /never includes a photo/);
    assert.equal(byLabel(section, 'Include my photos'), undefined);
    await buttonNamed(section, 'Preview spec sheet').click();
    assert.match(section.textContent, /Find your shade on this device first/);
  } finally { dom.restore(); }
});
