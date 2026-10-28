// W6 screen acceptance: on-device finder before server results; no server id/API
// needed; evidence limit visible. Synthetic data only. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { renderShade } from '../dist/js/screens/shade.js';
import { localShadeSection } from '../dist/js/screens/shade-local.js';
function context(changes = {}) { return { photo: null, photoSrc: 'blob:local-drawn-photo', face: null, shade: null, go(route) { this.redirected = route; }, ...changes }; }

test('Shade mounts W6 with no API and no server photo id, with no network', async () => {
  const dom = installDOM(), priorFetch = globalThis.fetch;
  delete globalThis.BELJOUR_API; delete globalThis.PLUMB_API;
  globalThis.fetch = () => { throw new Error('A local finder must not fetch'); };
  try {
    const main = new Element('main'), ctx = context(); renderShade(main, ctx);
    assert.equal(ctx.redirected, undefined);
    const section = main.querySelector('.local-shade'); assert.ok(section);
    assert.match(section.textContent, /Not tested against real products/);
    assert.match(section.textContent, /never choose a lighter shade/);
    assert.ok(buttonNamed(main, 'Find my shade on this device'));
    assert.equal(main.querySelectorAll('button').length, 1, 'no server quote button offline');
    await buttonNamed(main, 'Find my shade on this device').click();
    assert.match(section.textContent, /Add a photo with a face first/);
  } finally { dom.restore(); globalThis.fetch = priorFetch; }
});
test('Shade without a photo returns to Photo', () => {
  const dom = installDOM(); try {
    const ctx = context({ photoSrc: null }), main = new Element('main'); renderShade(main, ctx);
    assert.equal(ctx.redirected, 'photo'); assert.equal(main.children.length, 0);
  } finally { dom.restore(); }
});
test('a local decode failure stays in W6 and preserves the photo', async () => {
  const dom = installDOM(); try {
    const section = localShadeSection('blob:drawn', Array.from({ length: 478 }, () => ({ x: .5, y: .5 })),
      async () => { throw new Error('The photo is not readable.'); });
    await buttonNamed(section, 'Find my shade on this device').click();
    assert.match(section.textContent, /photo is not readable/);
    assert.ok(buttonNamed(section, 'Find my shade on this device'));
    assert.match(section.textContent, /Not tested against real products/);
  } finally { dom.restore(); }
});

test('W6 shares only a successful current-photo reading with the local palette flow', async () => {
  const dom = installDOM(); try {
    const fixture = JSON.parse(readFileSync(new URL('../../parity/shade-w6.json', import.meta.url), 'utf8')).faces[0];
    const data = new Uint8ClampedArray(fixture.width * fixture.height * 4), rgb = Buffer.from(fixture.image, 'base64');
    for (let p = 0; p < fixture.width * fixture.height; p++) { data.set(rgb.subarray(p * 3, p * 3 + 3), p * 4); data[p * 4 + 3] = 255; }
    const readings = [], points = fixture.points.map(([x, y]) => ({ x, y }));
    const section = localShadeSection('blob:synthetic-parity-face', points,
      async () => ({ width: fixture.width, height: fixture.height, channels: 4, data }), value => readings.push(value));
    await buttonNamed(section, 'Find my shade on this device').click();
    assert.equal(readings[0], null, 'the old reading is cleared before a new measurement');
    assert.equal(readings.at(-1).refused, false); assert.equal(readings.at(-1).measured_lab.length, 3);
    const refused = [], missing = localShadeSection('blob:synthetic-parity-face', points.slice(0, 468), async () => { throw new Error('must not decode an incomplete mesh'); }, value => refused.push(value));
    await buttonNamed(missing, 'Find my shade on this device').click(); assert.deepEqual(refused, [null]);
    assert.match(missing.textContent, /Add a photo with a face first/);
  } finally { dom.restore(); }
});
