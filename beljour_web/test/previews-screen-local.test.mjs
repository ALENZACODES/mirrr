// Neutral signed controls, local rendering, undo/reset and stale work cancellation.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPreviews } from '../dist/js/screens/previews.js';
import { CONTROLS } from '../dist/js/engines/shape/geometry.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

test('Previews uses every actual shape control at neutral and never needs an upload', async () => {
  const dom = installDOM(), oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('No network permitted'); };
  try {
    const p = localPhoto(), main = new Element('main');
    await renderPreviews(main, p.context, p.dependencies);
    const sliders = main.querySelectorAll('input');
    assert.equal(sliders.length, CONTROLS.length);
    assert.ok(sliders.every(s => s.value === '0' && s.getAttribute('min') === '-100' && s.getAttribute('max') === '100'));
    await buttonNamed(main, 'Show local preview').click();
    assert.deepEqual(new Uint8Array(p.rendered[0].image.data), new Uint8Array(p.image.data));
    assert.match(main.textContent, /Local simulation/);
    assert.equal(p.context.redirected, undefined);
  } finally { dom.restore(); globalThis.fetch = oldFetch; }
});
test('One shape change renders on the original, undo restores it, and reset is neutral', async () => {
  const dom = installDOM(); try {
    const p = localPhoto(), main = new Element('main'), original = p.image.data.slice();
    await renderPreviews(main, p.context, p.dependencies);
    const control = main.querySelector('#local-face_width');
    control.value = '33'; await control.dispatch('input'); await control.dispatch('change');
    await buttonNamed(main, 'Show local preview').click();
    assert.notDeepEqual(new Uint8Array(p.rendered.at(-1).image.data), new Uint8Array(original));
    assert.deepEqual(p.image.data, original);
    await buttonNamed(main, 'Undo').click();
    assert.equal(control.value, '0');
    await buttonNamed(main, 'Show local preview').click();
    assert.deepEqual(new Uint8Array(p.rendered.at(-1).image.data), new Uint8Array(original));
    control.value = '-40'; await control.dispatch('change');
    await buttonNamed(main, 'Reset to original').click();
    assert.ok(main.querySelectorAll('input').every(s => s.value === '0'));
    await buttonNamed(main, 'Show local preview').click();
    assert.deepEqual(new Uint8Array(p.rendered.at(-1).image.data), new Uint8Array(original));
  } finally { dom.restore(); }
});
test('Previews cannot substitute a fixture face when face detection is unavailable', async () => {
  const dom = installDOM(); try {
    const p = localPhoto(), main = new Element('main'); p.context.face = null;
    await renderPreviews(main, p.context, p.dependencies);
    assert.equal(main.querySelectorAll('input').length, 0);
    assert.equal(buttonNamed(main, 'Show local preview'), undefined);
    assert.match(main.textContent, /no example face will be substituted/);
    assert.equal(p.reads.length, 0);
  } finally { dom.restore(); }
});
test('Changing a control or mesh while decoding invalidates the old preview', async () => {
  const dom = installDOM(); try {
    for (const change of ['control', 'mesh']) {
      const p = localPhoto(), main = new Element('main'); let finish;
      p.dependencies.read = () => new Promise(resolve => { finish = resolve; });
      await renderPreviews(main, p.context, p.dependencies);
      const waiting = buttonNamed(main, 'Show local preview').click();
      if (change === 'control') { const input = main.querySelector('#local-face_width'); input.value = '50'; await input.dispatch('change'); }
      else p.context.face = { ...p.context.face, points: [...p.context.face.points] };
      finish(p.image); await waiting;
      assert.equal(p.rendered.length, 0, change);
      assert.equal(buttonNamed(main, 'Show local preview').disabled, false);
    }
  } finally { dom.restore(); }
});
test('A decoding failure has a plain message and leaves controls usable', async () => {
  const dom = installDOM(); try {
    const p = localPhoto(), main = new Element('main');
    p.dependencies.read = async () => { throw new Error('Choose this photo again.'); };
    await renderPreviews(main, p.context, p.dependencies);
    await buttonNamed(main, 'Show local preview').click();
    assert.match(main.textContent, /Choose a clear front-facing photo/);
    assert.equal(buttonNamed(main, 'Show local preview').disabled, false);
    assert.equal(p.rendered.length, 0);
  } finally { dom.restore(); }
});
