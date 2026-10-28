// Lane D r22d: synthetic Canvas operations, image ownership and labeled exports.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { SIMULATION_MARK } from '../dist/js/layout/judge-contract.js';
import {
  burnJudgeLabel,
  drawJudgeComparison,
  drawSyntheticPortrait,
  paintJudgeLook,
} from '../dist/js/ui/shell/judge-canvas.js';
import { JudgeImage } from '../dist/js/ui/shell/judge-image.js';
import {
  encodeJudgeCanvas,
  judgeExportDescription,
  prepareJudgeDownload,
  startJudgeDownload,
} from '../dist/js/ui/shell/judge-export.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function sampleState() {
  const session = new JudgeSession();
  session.selectSource('sample');
  session.consent('local', true);
  session.consent('hair', true);
  session.consent('face', true);
  session.consent('mock', true);
  session.setHair('chestnut');
  session.setFace('warm');
  session.setMock(true);
  return session;
}

test('synthetic portrait is generated at runtime with no downloaded face assets', () => {
  const a = judgeDOM();
  try {
    const source = a.document.createElement('canvas');
    drawSyntheticPortrait(source);
    assert.deepEqual([source.width, source.height], [512, 640]);
    assert.ok(a.calls.some(row => row[0] === 'ellipse'));
    assert.ok(a.calls.some(row => row.includes('DRAWN SAMPLE · NO REAL PERSON')));
  } finally { a.close(); }
});

test('output painter changes hair, face and mock accessory, then burns permanent mark', () => {
  const a = judgeDOM();
  try {
    const source = a.document.createElement('canvas');
    drawSyntheticPortrait(source);
    const target = a.document.createElement('canvas');
    paintJudgeLook(source, target, sampleState().snapshot, 'standard');
    assert.deepEqual([target.width, target.height], [512, 640]);
    assert.ok(a.calls.some(row => row[0] === 'scale'));
    assert.ok(a.calls.some(row => row[0] === 'ellipse'));
    assert.ok(a.calls.some(row => row[0] === 'fillText' && row[1] === SIMULATION_MARK));
  } finally { a.close(); }
});

test('large output remains bounded and carries label at increased resolution', () => {
  const a = judgeDOM();
  try {
    const target = a.document.createElement('canvas');
    paintJudgeLook(a.document.createElement('canvas'), target, sampleState().snapshot, 'large');
    assert.deepEqual([target.width, target.height], [768, 960]);
    assert.ok(a.calls.some(row => row.includes(SIMULATION_MARK)));
  } finally { a.close(); }
});

test('before/after compare uses a real clipping region and rejects unbounded ratio', () => {
  const a = judgeDOM();
  try {
    const first = a.document.createElement('canvas');
    const second = a.document.createElement('canvas');
    const target = a.document.createElement('canvas');
    drawJudgeComparison(first, second, target, 30);
    assert.ok(a.calls.some(row => row[0] === 'clip'));
    assert.ok(a.calls.some(row => row[0] === 'rect' && row[3] === 154));
    assert.throws(() => drawJudgeComparison(first, second, target, -1), RangeError);
    assert.throws(() => drawJudgeComparison(first, second, target, 101), RangeError);
  } finally { a.close(); }
});

test('painter fails closed on missing selection rather than fabricating a photo', () => {
  const a = judgeDOM();
  try {
    const state = new JudgeSession().snapshot;
    assert.throws(() => paintJudgeLook(
      a.document.createElement('canvas'), a.document.createElement('canvas'), state,
    ), /Choose/);
  } finally { a.close(); }
});

test('a generated sample can be discarded and clears the source canvas', () => {
  const a = judgeDOM();
  try {
    const image = new JudgeImage(a.document);
    assert.equal(image.hasImage, false);
    image.sample();
    assert.equal(image.hasImage, true);
    image.invalidate();
    assert.equal(image.hasImage, false);
    assert.deepEqual([image.original.width, image.original.height], [0, 0]);
    image.dispose();
    assert.throws(() => image.sample(), /ended/);
  } finally { a.close(); }
});

test('local upload draws decoded bitmap and closes decoded resources', async () => {
  const a = judgeDOM();
  try {
    const image = new JudgeImage(a.document);
    let closed = 0;
    const file = { size: 800, type: 'image/png' };
    const accepted = await image.upload(file, async () => ({ width: 128, height: 200, close() { closed++; } }));
    assert.equal(accepted, true);
    assert.equal(closed, 1);
    assert.equal(image.hasImage, true);
    assert.ok(a.calls.some(row => row[0] === 'drawImage'));
    image.dispose();
  } finally { a.close(); }
});

test('invalid bitmap dimensions reject and always close the bitmap', async () => {
  const a = judgeDOM();
  try {
    const image = new JudgeImage(a.document);
    let closed = 0;
    await assert.rejects(image.upload({ size: 300, type: 'image/jpeg' }, async () => ({
      width: 13_000, height: 400, close() { closed++; },
    })), /too large/);
    assert.equal(closed, 1);
    assert.equal(image.hasImage, false);
    image.dispose();
  } finally { a.close(); }
});

test('late decode after exit is discarded without retaining image', async () => {
  const a = judgeDOM();
  try {
    const image = new JudgeImage(a.document);
    let finish;
    const decode = () => new Promise(resolve => { finish = resolve; });
    const pending = image.upload({ size: 300, type: 'image/png' }, decode);
    image.dispose();
    let closed = 0;
    finish({ width: 200, height: 200, close() { closed++; } });
    assert.equal(await pending, false);
    assert.equal(image.hasImage, false);
    assert.equal(closed, 1);
  } finally { a.close(); }
});

test('save canvas encodes PNG or JPEG without calling network or provider', async () => {
  const a = judgeDOM();
  try {
    const png = await encodeJudgeCanvas(a.document.createElement('canvas'), 'image/png');
    const jpeg = await encodeJudgeCanvas(a.document.createElement('canvas'), 'image/jpeg');
    assert.equal(png.type, 'image/png');
    assert.equal(jpeg.type, 'image/jpeg');
    assert.ok(a.calls.some(row => row[0] === 'toBlob' && row[1] === 'image/jpeg'));
    await assert.rejects(encodeJudgeCanvas(a.document.createElement('canvas'), 'image/svg+xml'), RangeError);
  } finally { a.close(); }
});

test('prepared download is labelled, correctly sized and does not leak a canvas', async () => {
  const a = judgeDOM();
  try {
    const s = sampleState();
    s.setExport('image/jpeg', 'large');
    const result = await prepareJudgeDownload(a.document, a.document.createElement('canvas'), s.snapshot);
    assert.equal(result.filename, 'beljour-illustrative-demo.jpg');
    assert.deepEqual([result.width, result.height], [768, 960]);
    assert.ok(a.calls.some(row => row[0] === 'fillText' && row[1] === SIMULATION_MARK));
    assert.match(judgeExportDescription('image/jpeg', 'large'), /768 × 960/);
  } finally { a.close(); }
});

test('download object URL is revoked and anchor is removed after activation', () => {
  const a = judgeDOM();
  try {
    const events = [];
    const port = {
      createObjectURL() {
        events.push('create');
        return 'blob:synthetic';
      },
      revokeObjectURL(uri) { events.push(['revoke', uri]); },
    };
    let deferred;
    const result = { file: new Blob(['test']), filename: 'sample.png', width: 512, height: 640 };
    const before = a.root.children.length;
    startJudgeDownload(a.document, result, port, task => { deferred = task; });
    assert.equal(a.root.children.length, before);
    assert.deepEqual(events, ['create']);
    deferred();
    assert.deepEqual(events, ['create', ['revoke', 'blob:synthetic']]);
  } finally { a.close(); }
});

test('image modules contain no direct networking or persistent photo storage', async () => {
  const fs = await import('node:fs');
  for (const name of ['judge-image.ts', 'judge-canvas.ts', 'judge-export.ts']) {
    const raw = fs.readFileSync(new URL('../src/ui/shell/' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(raw, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sessionStorage|localStorage/);
  }
});
