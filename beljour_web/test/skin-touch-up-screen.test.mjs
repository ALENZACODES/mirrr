// Skin screen touch-up controls (#26 spot healing with tap-to-heal, #27 line softening,
// #28 under-eye brightening) run the local engines on original drawn pixels; no network,
// original untouched, alpha kept, coded messages when nothing changes. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSkin } from '../dist/js/screens/skin.js';
import { previewPoint } from '../dist/js/screens/skin-touch-up.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

function environment() {
  const dom = installDOM(), previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Local screen attempted a network request'); };
  return { restore() { dom.restore(); globalThis.fetch = previous; } };
}
const px = (p, i) => [p.context.face.points[i].x * p.image.width, p.context.face.points[i].y * p.image.height];
function paint(p, cx, cy, radius, [dr, dg, db]) {
  const { width, data } = p.image;
  for (let y = Math.floor(cy - 3 * radius); y <= cy + 3 * radius; y++) for (let x = Math.floor(cx - 3 * radius); x <= cx + 3 * radius; x++) {
    const k = Math.exp(-((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) / (2 * radius * radius)), i = (y * width + x) * 4;
    data[i] += dr * k; data[i + 1] += dg * k; data[i + 2] += db * k;
  }
}
function setup() {
  const p = localPhoto(), [ax, ay] = px(p, 50), [bx, by] = px(p, 205);
  const blemish = [(ax + bx) / 2, (ay + by) / 2];
  paint(p, blemish[0], blemish[1], 2.5, [45, -30, -25]);
  const [mx, my] = px(p, 9);
  const mole = [mx, my - 14];
  paint(p, mole[0], mole[1], 2.5, [-70, -60, -50]);
  for (let i = 3; i < p.image.data.length; i += 4) p.image.data[i] = 120 + (i % 97);
  const main = new Element('main');
  renderSkin(main, p.context, p.dependencies);
  return { p, main, blemish, mole, original: p.image.data.slice() };
}
const red = (img, [x, y]) => { const i = (Math.floor(y) * img.width + Math.floor(x)) * img.channels; return img.data[i] - img.data[i + 1]; };
const luma = (img, [x, y]) => { const i = (Math.floor(y) * img.width + Math.floor(x)) * img.channels; return img.data[i] + img.data[i + 1] + img.data[i + 2]; };

test('spot healing heals a red spot, keeps a mole and keeps the original and its alpha', async () => {
  const env = environment(); try {
    const { p, main, blemish, mole, original } = setup();
    await buttonNamed(main, 'Preview spot healing').click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image;
    assert.ok(red(out, blemish) < red(p.image, blemish) - 20, 'red spot not healed');
    assert.equal(luma(out, mole), luma(p.image, mole), 'mole changed without being marked');
    for (let i = 3; i < original.length; i += 4) assert.equal(out.data[i], original[i]);
    assert.deepEqual(p.image.data, original);
    assert.match(p.rendered[0].label, /Natural marks kept unless you mark them/);
    assert.match(main.textContent, /Nothing was uploaded/);
    assert.match(main.textContent, /not medical advice/);
  } finally { env.restore(); }
});

test('tap-to-heal: tapping the mole on the preview heals it; keep mode spares a spot', async () => {
  const env = environment(); try {
    const { p, main, mole, blemish } = setup();
    await buttonNamed(main, 'Preview spot healing').click();
    const map = main.querySelector('.touch-map');
    const at = ([x, y]) => ({ clientX: x * 100 / p.image.width, clientY: y * 100 / p.image.height });
    await map.dispatch('click', at(mole));
    assert.equal(p.rendered.length, 2);
    assert.ok(luma(p.rendered[1].image, mole) > luma(p.image, mole) + 60, 'tapped mole not healed');
    assert.match(main.textContent, /1 marked to heal, 0 marked to keep/);
    await buttonNamed(main, 'Clear marked spots').click();
    main.querySelector('#touch-up-mode').value = 'keep';
    await map.dispatch('click', at(blemish));
    const last = p.rendered[p.rendered.length - 1];
    assert.equal(red(last.image, blemish), red(p.image, blemish), 'kept spot was healed');
    assert.match(last.label, /No spot to heal was found or marked/);
    assert.match(main.textContent, /0 marked to heal, 1 marked to keep/);
  } finally { env.restore(); }
});

test('line softening and under-eye previews run locally; strength zero leaves the photo alone', async () => {
  const env = environment(); try {
    const { p, main, original } = setup();
    await buttonNamed(main, 'Preview line softening').click();
    await buttonNamed(main, 'Preview under-eye brightening').click();
    assert.ok(p.reads.length >= 2);
    for (const r of p.rendered) for (let i = 3; i < original.length; i += 4) assert.equal(r.image.data[i], original[i]);
    main.querySelector('#touch-up-strength').value = '0';
    const before = p.rendered.length;
    await buttonNamed(main, 'Preview spot healing').click();
    assert.equal(p.rendered.length, before);
    assert.match(main.textContent, /Strength is zero, so the photo is unchanged/);
    assert.match(main.textContent, /Your photo was not changed/);
    assert.deepEqual(p.image.data, original);
  } finally { env.restore(); }
});

test('no touch-up controls without measured face points; preview taps map to photo pixels', () => {
  const env = environment(); try {
    const p = localPhoto(), main = new Element('main'); p.context.face = null;
    renderSkin(main, p.context, p.dependencies);
    assert.equal(buttonNamed(main, 'Preview spot healing'), undefined);
    assert.deepEqual(previewPoint({ clientX: 60, clientY: 30 }, { left: 10, top: 10, width: 100, height: 200 }, { width: 200, height: 400 }), [100, 40]);
    assert.equal(previewPoint({ clientX: 5, clientY: 30 }, { left: 10, top: 10, width: 100, height: 200 }, { width: 200, height: 400 }), null);
  } finally { env.restore(); }
});
