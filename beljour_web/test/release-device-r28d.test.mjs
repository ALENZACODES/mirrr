import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  summarizeCanvasSamples, sampleDrawnCanvas, quantile, deviceCaveats,
} from '../dist/js/layout/release/device.js';
import { commandReadiness, commandsPending } from '../dist/js/layout/release/commands.js';
import { PRO_COMMANDS } from '../dist/js/layout/continuous/pro-commands.js';

function device(overrides = {}) {
  return { secureContext: true, online: true, reducedMotion: false,
    canvasAvailable: true, encodingAvailable: true, pixelRatio: 1,
    screenWidth: 390, ...overrides };
}

test('median and p95 use samples, not an asserted flaky time budget', () => {
  const got = summarizeCanvasSamples([5, 1, 3, 10, 6]);
  assert.equal(got.status, 'measured');
  assert.equal(got.medianMs, 5);
  assert.equal(got.p95Ms, 9.2);
  assert.equal(got.elapsedMs, 25);
  assert.equal(got.sampleCount, 5);
  assert.equal(got.label, 'drawn-canvas-only');
  assert.match(got.note, /Not a real-photo preview/);
});

test('sample quantile interpolates endpoints and rejects invalid callers', () => {
  assert.equal(quantile([1, 9], 0), 1);
  assert.equal(quantile([1, 9], 1), 9);
  assert.equal(quantile([1, 9], .5), 5);
  assert.throws(() => quantile([], .5), /Invalid/);
  assert.throws(() => quantile([1], 2), /Invalid/);
});

test('malformed readings cannot masquerade as performance success', () => {
  for (const values of [[1], [], [1, NaN, 3], [-1, 1, 2],
    [1, 2, Infinity], [1, 2, 300001], Array(21).fill(1)]) {
    const got = summarizeCanvasSamples(values);
    assert.equal(got.status, 'invalid');
    assert.equal(got.sampleCount, 0);
    assert.equal(got.medianMs, null);
    assert.equal(got.p95Ms, null);
  }
});

test('synthetic drawing uses exactly five bounded samples and releases Canvas', () => {
  let time = 10;
  let canvas = null;
  const commands = [];
  const adapter = {
    now: () => time++,
    createCanvas(width, height) {
      assert.equal(width, 384);
      assert.equal(height, 512);
      canvas = { width, height, getContext() { return {
        fillRect(...args) { commands.push(['fill', ...args]); },
        strokeRect(...args) { commands.push(['stroke', ...args]); },
        set fillStyle(value) { commands.push(['colour', value]); },
        set strokeStyle(value) { commands.push(['stroke-colour', value]); },
      }; } };
      return canvas;
    },
  };
  const got = sampleDrawnCanvas(adapter);
  assert.equal(got.status, 'measured');
  assert.equal(got.sampleCount, 5);
  assert.ok(commands.length >= 200);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('missing Canvas 2D returns a refusal without adding a server fallback', () => {
  const canvas = { width: 384, height: 512, getContext: () => null };
  const report = sampleDrawnCanvas({ now: () => 0, createCanvas: () => canvas });
  assert.equal(report.status, 'unavailable');
  assert.match(report.note, /No server processing/);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('throwing canvas releases owned resources and does not report a pass', () => {
  let calls = 0;
  const canvas = { width: 384, height: 512, getContext() { return {
    fillRect() { calls += 1; throw Error('GPU fault'); },
  }; } };
  const result = sampleDrawnCanvas({ now: () => calls++, createCanvas: () => canvas });
  assert.equal(result.status, 'invalid');
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('environment caveats never report unsupported browser facilities as ready', () => {
  const bad = device({ secureContext: false, online: false, canvasAvailable: false,
    encodingAvailable: false, screenWidth: 290 });
  const notes = deviceCaveats(bad);
  assert.equal(notes.length, 5);
  assert.match(notes.join(' '), /Secure browser|offline|Canvas 2D|Blob|narrower/);
  assert.deepEqual(deviceCaveats(device()), []);
});

test('no owner port means all five Pro Commands are unknown', () => {
  const result = commandReadiness(null);
  assert.equal(result.status, 'absent');
  assert.equal(result.rows.length, 5);
  assert.equal(result.allAvailable, false);
  assert.equal(result.productionVerified, false);
  assert.equal(commandsPending(result), 5);
  for (const row of result.rows) {
    assert.equal(row.availability, 'unknown');
    assert.equal(row.operatorTested, false);
    assert.equal(row.independentResult, false);
  }
});

test('public owner availability is visible without claiming successful rendering', () => {
  const result = commandReadiness({ kind: 'pro-command-catalogue',
    listCommands: () => PRO_COMMANDS.map(name => ({ name, available: true })),
  });
  assert.equal(result.allAvailable, true);
  assert.equal(result.productionVerified, false);
  assert.equal(commandsPending(result), 0);
  assert.ok(result.rows.every(row => row.independentResult === false));
});

test('partial public owner list has explicit unknown commands', () => {
  const result = commandReadiness({ kind: 'pro-command-catalogue',
    listCommands: () => [{ name: '/CLEANUP', available: true }],
  });
  assert.equal(result.status, 'catalogue-read');
  assert.equal(result.allAvailable, false);
  assert.equal(commandsPending(result), 4);
  assert.equal(result.rows.find(row => row.name === '/CLEANUP').availability, 'available');
});

test('invalid owner catalogue fails closed with no false success', () => {
  for (const list of [null, 1, [{ name: '/UPSCALE', available: 'yes' }],
    [{ name: '/UPSCALE', available: true }, { name: '/UPSCALE', available: true }]]) {
    const result = commandReadiness({ kind: 'pro-command-catalogue', listCommands: () => list });
    assert.equal(result.status, 'invalid');
    assert.equal(result.allAvailable, false);
    assert.equal(result.productionVerified, false);
    assert.equal(commandsPending(result), 5);
  }
});

test('command probe never invokes an execution endpoint', () => {
  let listed = 0;
  let executed = 0;
  const port = { kind: 'pro-command-catalogue', listCommands() { listed += 1;
    return [{ name: '/POSEONLY', available: true }]; }, executeCommand() { executed += 1; } };
  const result = commandReadiness(port);
  assert.equal(listed, 1);
  assert.equal(executed, 0);
  assert.equal(result.rows.find(row => row.name === '/POSEONLY').availability, 'available');
});
