// W98 acceptance: native controls change the live layer and actual pixels; numbers
// reflect the current image; labels never promise calibration. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { Editor } from '../dist/js/ui/shell/controller.js';
import { lightingScreen, chooseLighting } from '../dist/js/screens/lighting.js';
import { ShellGpuRenderer } from '../dist/js/ui/shell/gpu-renderer.js';
import { relightImage } from '../dist/js/engines/shade/lighting.js';

test('Daylight Office Evening controls operate on the current image without a server', async () => {
  const dom = installDOM(), editor = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    let renders = 0;
    const screen = lightingScreen(editor, () => renders++);
    assert.deepEqual(screen.querySelectorAll('button').map(b => b.textContent), ['Daylight', 'Office', 'Evening']);
    assert.match(screen.textContent, /Local simulation/);
    assert.match(screen.textContent, /not colour-calibrated/);
    const before = editor.source.image.data.slice();
    await buttonNamed(screen, 'Office').click();
    assert.equal(renders, 1);
    assert.equal(editor.document.layers.length, 1);
    assert.notDeepEqual(editor.rendered().image.data, before);
    assert.deepEqual(editor.rendered().image.data, Uint8Array.from(relightImage(editor.source.image, 'office')));
    await buttonNamed(screen, 'Evening').click();
    assert.equal(editor.document.layers.length, 1, 'changing light edits the same layer');
    const result = lightingScreen(editor, () => {});
    assert.match(result.textContent, /ΔE \d+\.\d{2}/);
    assert.deepEqual(editor.source.image.data, before, 'original unchanged');
    await buttonNamed(screen, 'Daylight').click();
    assert.deepEqual(editor.rendered().image.data, before);
  } finally { editor.dispose(); dom.restore(); }
});

test('a lighting selection validates before modifying the history', () => {
  const editor = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    assert.throws(() => chooseLighting(editor, 'made-up'), /unknown lighting preset/);
    assert.equal(editor.document.layers.length, 0);
    chooseLighting(editor, 'office'); editor.undo();
    assert.equal(editor.document.layers.length, 0, 'normal history owns lighting edits');
  } finally { editor.dispose(); }
});

test('choosing a lighting thumbnail applies the exact strength its preview shows', async () => {
  const { optionsFor } = await import('../dist/js/ui/shell/thumbnails.js');
  const editor = new Editor('portrait', new ShellGpuRenderer(null));
  try {
    const option = optionsFor('lighting', editor.source).find(item => item.params.preset === 'office');
    editor.applyOption(option.kind, option.params, option.label, option.strength);
    assert.equal(editor.selected.strength, option.strength);
    assert.equal(editor.selected.parameters.preset, 'office');
  } finally { editor.dispose(); }
});
