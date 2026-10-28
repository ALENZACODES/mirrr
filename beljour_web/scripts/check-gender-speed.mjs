// Isolated browser-engine preview budget. Pass definition, fixed before the run:
// each cold 512×512 drawn seed-2 stop (-66, +66, -100) finishes in <1500 ms, has no
// failed render rule, and returns one fully confirmed full-size raster. Run after
// the ordinary Node suite, never beside another CPU suite. Each stop runs in a
// fresh Node process, so neither JIT warmup nor a previous photo cache is assumed.
// This measures this machine's synthetic engine work, not real-face quality,
// browser canvas/detection, or performance on an untested user's device.
// Author: John Khan.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { renderGenderTargets } from '../dist/js/engines/shape/gender-render.js';
import { drawnGenderHead } from '../test/helpers/gender-drawn.mjs';

const STOPS = [-66, 66, -100], BUDGET_MS = 1500;
if (process.argv[2] === '--child') {
  const stop = Number(process.argv[3]);
  assert.ok(STOPS.includes(stop));
  const { image, points } = drawnGenderHead(2, 512), started = performance.now();
  const result = renderGenderTargets(image, points, stop), elapsedMs = performance.now() - started;
  assert.deepEqual(result.failed, []);
  assert.equal(result.searchMethod, 'sparse-seam-full-confirm');
  assert.equal(result.fullRasterEvaluations, 1);
  assert.equal(result.fullResolutionChecked, true);
  assert.equal(result.image.width, 512); assert.equal(result.image.height, 512);
  assert.equal(result.image.data.length, 512 * 512 * 3);
  console.log(JSON.stringify({ stop, elapsedMs, budgetMs: BUDGET_MS, fullRasterEvaluations: result.fullRasterEvaluations,
    seamSamples: result.seamSamples, seamRatio: result.seamRatio, effectRetention: result.effectRetention }));
  assert.ok(elapsedMs < BUDGET_MS, `cold 512px stop ${stop}: ${elapsedMs.toFixed(1)} ms exceeds the ${BUDGET_MS} ms preview budget`);
} else {
  for (const stop of STOPS) {
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', String(stop)], {
      encoding: 'utf8', timeout: 60_000, maxBuffer: 256 * 1024,
    });
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    if (child.error) throw child.error;
    assert.equal(child.status, 0, `isolated gender preview stop ${stop} failed`);
  }
  console.log('gender preview budget: 3 cold stops passed');
}
