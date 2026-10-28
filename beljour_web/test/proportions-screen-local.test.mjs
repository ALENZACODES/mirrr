// Ratios are measured from the selected mesh; references are never beauty scores.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderProportions } from '../dist/js/screens/proportions.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

test('Proportions produces eight actual finite ratios without an API or uploaded image', async () => {
  const dom = installDOM(), oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Ratios must not use the server'); };
  try {
    const p = localPhoto(), main = new Element('main'), original = structuredClone(p.context.face.points);
    renderProportions(main, p.context);
    await buttonNamed(main, 'Measure ratios on this device').click();
    assert.equal(main.querySelectorAll('.ratio').length, 8);
    assert.match(main.textContent, /Local simulation. Measured on this device/);
    assert.doesNotMatch(main.textContent, /NaN|Infinity/);
    assert.match(main.textContent, /do not rate your appearance and are not targets/);
    assert.deepEqual(p.context.face.points, original);
    assert.equal(p.context.redirected, undefined);
  } finally { dom.restore(); globalThis.fetch = oldFetch; }
});
test('Proportion measurements change when the actual mouth landmarks change', async () => {
  const dom = installDOM(); try {
    const p = localPhoto(), main = new Element('main'); renderProportions(main, p.context);
    await buttonNamed(main, 'Measure ratios on this device').click();
    const before = main.querySelector('.ratios').textContent;
    p.context.face.points[61].x -= .02; p.context.face.points[291].x += .02;
    await buttonNamed(main, 'Measure ratios on this device').click();
    assert.notEqual(main.querySelector('.ratios').textContent, before);
  } finally { dom.restore(); }
});
test('Missing or degenerate mesh has a refusal and no borrowed measurements', async () => {
  const dom = installDOM(); try {
    for (const points of [null, Array.from({ length: 478 }, () => ({ x: .5, y: .5 }))]) {
      const p = localPhoto(), main = new Element('main');
      p.context.face = points === null ? null : { points, blendshapes: {} };
      renderProportions(main, p.context);
      await buttonNamed(main, 'Measure ratios on this device').click();
      assert.equal(main.querySelectorAll('.ratio').length, 0);
      assert.ok(main.querySelector('[role="alert"]'), 'typed error is displayed');
    }
  } finally { dom.restore(); }
});
