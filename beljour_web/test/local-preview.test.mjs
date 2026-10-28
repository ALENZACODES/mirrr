// Shared local boundary: mesh validation, identity, alpha and bounded decoding.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measuredMesh, texturePreview, readPreview, paintPreview, PREVIEW_SIDE } from '../dist/js/screens/local-preview.js';
import { installDOM } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';

test('Measured mesh requires a complete finite normalized face with usable size', () => {
  const p = localPhoto(), valid = p.context.face.points;
  assert.equal(measuredMesh(valid, p.image.width, p.image.height).length, 478);
  for (const points of [null, valid.slice(0, -1), valid.map((pt, i) => i === 7 ? { ...pt, x: NaN } : pt),
    valid.map((pt, i) => i === 4 ? { ...pt, y: 1.1 } : pt), valid.map(() => ({ x: .5, y: .5 }))]) {
    assert.throws(() => measuredMesh(points, p.image.width, p.image.height));
  }
  assert.throws(() => measuredMesh(valid, 10, 12), /small/);
});
test('Texture zero is an independent exact copy and out-of-range strengths fail', () => {
  const p = localPhoto(), mesh = measuredMesh(p.context.face.points, p.image.width, p.image.height);
  const result = texturePreview(p.image, mesh, 0);
  assert.deepEqual(result.data, p.image.data); assert.notEqual(result.data, p.image.data);
  for (const strength of [-.01, 1.01, NaN, Infinity]) assert.throws(() => texturePreview(p.image, mesh, strength), RangeError);
});
test('Local decode caps the long side before reading pixels and releases its canvas', async () => {
  const dom = installDOM(), oldImage = globalThis.Image, previous = dom.document.createElement;
  const canvases = [], calls = [];
  globalThis.Image = class { naturalWidth = 1600; naturalHeight = 800; async decode() {} };
  dom.document.createElement = tag => {
    const element = previous(tag);
    if (tag === 'canvas') { canvases.push(element); element.getContext = () => ({
      drawImage(...args) { calls.push(args); }, getImageData(_x, _y, width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; },
    }); }
    return element;
  };
  try {
    const result = await readPreview('blob:synthetic');
    assert.equal(result.width, PREVIEW_SIDE); assert.equal(result.height, 256);
    assert.equal(result.data.length, 512 * 256 * 4);
    assert.deepEqual(calls[0].slice(-2), [512, 256]);
    assert.equal(canvases[0].width, 1); assert.equal(canvases[0].height, 1);
  } finally { dom.restore(); if (oldImage === undefined) delete globalThis.Image; else globalThis.Image = oldImage; }
});
test('Every painted preview carries a visible French-blue simulation label and accessible caption', () => {
  const dom = installDOM(), previous = dom.document.createElement, calls = [];
  dom.document.createElement = tag => {
    const element = previous(tag);
    if (tag === 'canvas') {
      const context = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {},
        fillRect() { calls.push(this.fillStyle); }, fillText(text) { calls.push(text, this.fillStyle); } };
      element.getContext = () => context;
    }
    return element;
  };
  try {
    const p = localPhoto(), original = p.image.data.slice(), result = paintPreview(p.image, 'Texture preview');
    assert.deepEqual(calls, ['#000091', 'Local simulation', '#FFFFFF']);
    assert.match(result.querySelector('canvas').getAttribute('aria-label'), /Local simulation/);
    assert.match(result.textContent, /Local simulation. Texture preview/);
    assert.deepEqual(p.image.data, original);
  } finally { dom.restore(); }
});
