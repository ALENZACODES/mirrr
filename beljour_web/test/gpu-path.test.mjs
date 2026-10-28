// Shell render-path acceptance. The no-GPU path equals the existing CPU pixels;
// WebGL execution is exercised by a recording GL, not claimed as a hardware test.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { renderLayers } from '../dist/js/ui/shell/pipeline.js';
import { ShellGpuRenderer, lightingStep } from '../dist/js/ui/shell/gpu-renderer.js';
import { fakeGL, fakeCanvas } from './helpers/fake-gl.mjs';
import { relightImage } from '../dist/js/engines/shade/lighting.js';
import { readFileSync } from 'node:fs';
const hash = data => createHash('sha256').update(data).digest('hex');
const image = { width: 12, height: 10, channels: 3, data: Uint8Array.from({ length: 360 }, (_, i) => 20 + i % 210) };

test('capability off gives the exact CPU hash through Editor.rendered', () => {
  const editor = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    editor.add('lighting', { preset: 'office' }, 100);
    const result = editor.rendered();
    const reference = renderLayers(editor.source, editor.document.layers);
    assert.equal(hash(result.image.data), hash(reference.image.data));
    assert.equal(result.metrics[0].backend, 'cpu');
    assert.equal(editor.rendered(), result, 'same revision reuses the rendered pixels');
  } finally { editor.dispose(); }
});

test('WebGL2 W98 uses the actual lighting matrix and same ordered shell layer', () => {
  const gl = fakeGL(), renderer = new ShellGpuRenderer(fakeCanvas(gl));
  try {
    const result = renderer.render(image, 'office');
    assert.equal(result.metrics.backend, 'webgl2');
    assert.deepEqual(gl.state.draws, ['matrix']);
    const reference = relightImage(image, 'office');
    for (let i = 0; i < reference.length; i++) assert.ok(Math.abs(result.image.data[i] - reference[i]) <= 1);
    assert.equal(lightingStep('office').op, 'matrix');
    const source = readFileSync(new URL('../src/ui/shell/controller.ts', import.meta.url), 'utf8');
    assert.match(source, /renderLayers\(this.photo, state.layers, this.renderer\)/);
  } finally { renderer.dispose(); }
  assert.equal(gl.state.created.texture, gl.state.deleted.texture);
  assert.equal(gl.state.created.program, gl.state.deleted.program);
});

test('lost context falls back, restored context rebuilds, original is retained', () => {
  const gl = fakeGL(), canvas = fakeCanvas(gl), renderer = new ShellGpuRenderer(canvas);
  try {
    const before = image.data.slice();
    renderer.render(image, 'evening');
    gl.state.lost = true; canvas.fire('webglcontextlost');
    assert.equal(renderer.render(image, 'office').metrics.backend, 'cpu');
    gl.state.lost = false; canvas.fire('webglcontextrestored');
    assert.equal(renderer.render(image, 'office').metrics.backend, 'webgl2');
    assert.deepEqual(image.data, before);
  } finally { renderer.dispose(); }
});

test('allocation/compile failure preserves the same CPU result and does not retry forever', () => {
  const gl = fakeGL(); let allocations = 0;
  gl.createTexture = () => { allocations++; throw new Error('allocation refused'); };
  const renderer = new ShellGpuRenderer(fakeCanvas(gl));
  try {
    const first = renderer.render(image, 'office');
    assert.equal(first.metrics.backend, 'cpu');
    assert.equal(hash(first.image.data), hash(relightImage(image, 'office')));
    renderer.render(image, 'evening');
    assert.equal(allocations, 1);
  } finally { renderer.dispose(); }
});

test('neutral daylight does not allocate and disposed renderer refuses new work', () => {
  const gl = fakeGL(), renderer = new ShellGpuRenderer(fakeCanvas(gl));
  assert.equal(hash(renderer.render(image, 'daylight').image.data), hash(image.data));
  assert.equal(gl.state.created.texture, 0);
  renderer.dispose(); renderer.dispose();
  assert.throws(() => renderer.render(image, 'office'), /closed/);
});
