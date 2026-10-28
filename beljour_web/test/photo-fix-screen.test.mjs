// Skin screen photo-fix controls run the local engines on original drawn pixels; no network,
// original untouched, alpha kept, coded messages when nothing changes. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSkin } from '../dist/js/screens/skin.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

function environment() {
  const dom = installDOM(), previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Local screen attempted a network request'); };
  return { restore() { dom.restore(); globalThis.fetch = previous; } };
}
const px = (p, i) => [p.context.face.points[i].x * p.image.width, p.context.face.points[i].y * p.image.height];
function disk(p, [cx, cy], r, rgb) {
  const { width, data } = p.image;
  for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
    if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) continue;
    const i = (y * width + x) * 4; data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
  }
}
export function setup({ glow = true } = {}) {
  const p = localPhoto();
  for (const [c, ring] of [[468, 469], [473, 474]]) {
    const centre = px(p, c), edge = px(p, ring), r = Math.hypot(edge[0] - centre[0], edge[1] - centre[1]);
    disk(p, centre, r, [92, 120, 70]);
    disk(p, centre, r * 0.4, glow ? [205, 48, 42] : [22, 18, 16]);
  }
  for (let i = 3; i < p.image.data.length; i += 4) p.image.data[i] = 120 + (i % 97);
  const main = new Element('main');
  renderSkin(main, p.context, p.dependencies);
  return { p, main, original: p.image.data.slice() };
}
const redness = (img, [x, y]) => { const i = (Math.floor(y) * img.width + Math.floor(x)) * img.channels; return img.data[i] - img.data[i + 1]; };

test('red-eye fix darkens the glow, keeps the original and its alpha', async () => {
  const env = environment(); try {
    const { p, main, original } = setup();
    await buttonNamed(main, 'Preview red-eye fix').click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image, centre = px(p, 468);
    assert.ok(redness(out, centre) < redness(p.image, centre) - 100, 'glow not darkened');
    for (let i = 3; i < original.length; i += 4) assert.equal(out.data[i], original[i]);
    assert.deepEqual(p.image.data, original);
    assert.match(p.rendered[0].label, /only the red flash glow/);
    assert.match(main.textContent, /Nothing was uploaded/);
  } finally { env.restore(); }
});

test('a photo without red eye gets a coded message and no preview image', async () => {
  const env = environment(); try {
    const { p, main } = setup({ glow: false });
    await buttonNamed(main, 'Preview red-eye fix').click();
    assert.equal(p.rendered.length, 0);
    assert.match(main.textContent, /No red pupil glow was found/);
    assert.match(main.textContent, /Your photo was not changed/);
  } finally { env.restore(); }
});

test('eye colour recolours the iris ring with the chosen shade and keeps the pupil', async () => {
  const env = environment(); try {
    const { p, main, original } = setup({ glow: false });
    main.querySelector('#photo-fix-shade').value = 'ocean';
    await buttonNamed(main, 'Preview eye colour').click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image, centre = px(p, 468), edge = px(p, 469);
    const ring = [centre[0] + (edge[0] - centre[0]) * 0.7, centre[1] + (edge[1] - centre[1]) * 0.7];
    const at = (img, [x, y]) => (Math.floor(y) * img.width + Math.floor(x)) * img.channels;
    assert.notDeepEqual(Array.from(out.data.slice(at(out, ring), at(out, ring) + 3)), Array.from(p.image.data.slice(at(p.image, ring), at(p.image, ring) + 3)));
    assert.deepEqual(Array.from(out.data.slice(at(out, centre), at(out, centre) + 4)), Array.from(p.image.data.slice(at(p.image, centre), at(p.image, centre) + 4)));
    for (let i = 3; i < original.length; i += 4) assert.equal(out.data[i], original[i]);
    assert.match(p.rendered[0].label, /Eye colour simulation/);
  } finally { env.restore(); }
});

test('glasses glare beside an eye is filled and the eye opening is kept', async () => {
  const env = environment(); try {
    const { p, main, original } = setup({ glow: false });
    const [ax, ay] = px(p, 33), [bx, by] = px(p, 133), ew = Math.hypot(ax - bx, ay - by);
    const spot = [(ax + bx) / 2 - 0.45 * ew, (ay + by) / 2 + 0.38 * ew];
    disk(p, spot, 0.1 * ew, [248, 248, 246]);
    const before = p.image.data.slice();
    await buttonNamed(main, 'Preview glasses glare removal').click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image, i = (Math.floor(spot[1]) * out.width + Math.floor(spot[0])) * 4;
    assert.ok(out.data[i] < 230, 'glare not filled');
    const iris = px(p, 468), k = (Math.floor(iris[1]) * out.width + Math.floor(iris[0])) * 4;
    assert.deepEqual(Array.from(out.data.slice(k, k + 4)), Array.from(before.slice(k, k + 4)));
    for (let j = 3; j < original.length; j += 4) assert.equal(out.data[j], original[j]);
    assert.match(p.rendered[0].label, /eyes themselves are not changed/);
  } finally { env.restore(); }
});

test('old photo repair fills a bright scratch and keeps the original', async () => {
  const env = environment(); try {
    const { p, main, original } = setup({ glow: false });
    for (let y = 30; y < 300; y++) { const i = (y * p.image.width + 40) * 4; p.image.data[i] = p.image.data[i + 1] = p.image.data[i + 2] = 245; }
    const before = p.image.data.slice();
    await buttonNamed(main, 'Preview old photo repair').click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image, i = (150 * out.width + 40) * 4;
    assert.ok(out.data[i + 2] < 200, 'scratch not filled');
    assert.deepEqual(p.image.data, before);
    for (let j = 3; j < original.length; j += 4) assert.equal(out.data[j], original[j]);
    assert.match(p.rendered[0].label, /No face detail is invented/);
  } finally { env.restore(); }
});

test('object removal: tap the preview to mark a blob, it is filled and the face is protected', async () => {
  const env = environment(); try {
    const { p, main, original } = setup({ glow: false });
    disk(p, [30, 350], 6, [210, 40, 190]);
    const before = p.image.data.slice();
    await buttonNamed(main, 'Preview object removal').click();
    assert.equal(p.rendered.length, 1, 'photo shown for tapping');
    assert.match(main.textContent, /Nothing is marked for removal/);
    const map = main.querySelector('.photo-fix-map');
    await map.dispatch('click', { clientX: 30 * 100 / p.image.width, clientY: 350 * 100 / p.image.height });
    assert.equal(p.rendered.length, 2);
    const out = p.rendered[1].image, i = (350 * out.width + 30) * 4;
    assert.ok(out.data[i] - out.data[i + 1] < 100, 'blob not removed');
    assert.deepEqual(p.image.data, before);
    for (let j = 3; j < original.length; j += 4) assert.equal(out.data[j], original[j]);
    assert.match(main.textContent, /1 marked to remove/);
    const nose = px(p, 1);
    await map.dispatch('click', { clientX: nose[0] * 100 / p.image.width, clientY: nose[1] * 100 / p.image.height });
    assert.match(main.textContent, /covers the face/);
  } finally { env.restore(); }
});

test('the ID crop guide shows a labelled crop without any compliance claim, or a coded refusal', async () => {
  const env = environment(); try {
    const { p, main } = setup({ glow: false });
    await buttonNamed(main, 'Show ID photo crop guide').click();
    assert.match(main.textContent, /too little space around the head|Crop guide ready/);
    if (p.rendered.length) {
      assert.match(p.rendered[0].label, /does not check any official rules/);
      assert.doesNotMatch(main.textContent, /compliant|approved/i);
    }
  } finally { env.restore(); }
});
