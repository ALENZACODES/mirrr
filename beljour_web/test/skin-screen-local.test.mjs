// Real screen controls call the local image engines with original synthetic pixels.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSkin } from '../dist/js/screens/skin.js';
import { installDOM, Element, buttonNamed } from './helpers/dom.mjs';
import { localPhoto } from './helpers/local-photo.mjs';
function environment() {
  const dom = installDOM(), previous = { fetch: globalThis.fetch, api: globalThis.BELJOUR_API, old: globalThis.PLUMB_API };
  delete globalThis.BELJOUR_API; delete globalThis.PLUMB_API;
  globalThis.fetch = () => { throw new Error('Local screen attempted a network request'); };
  return { ...dom, restore() { dom.restore(); globalThis.fetch = previous.fetch;
    if (previous.api === undefined) delete globalThis.BELJOUR_API; else globalThis.BELJOUR_API = previous.api;
    if (previous.old === undefined) delete globalThis.PLUMB_API; else globalThis.PLUMB_API = previous.old; } };
}
test('Skin works without an uploaded photo and reports photo measurements without skin or age scores', async () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'), original = p.image.data.slice();
    renderSkin(main, p.context, p.dependencies);
    assert.equal(p.context.redirected, undefined);
    await buttonNamed(main, 'Check this photo locally').click();
    assert.match(main.textContent, /Mean light level/);
    assert.match(main.textContent, /Noise estimate/);
    assert.match(main.textContent, /No cosmetic concern score/);
    assert.match(main.textContent, /YouCam Skin Analysis product matching/);
    assert.deepEqual(p.image.data, original);
    assert.deepEqual(p.reads, ['blob:original-drawn-photo']);
    assert.equal(p.rendered.length, 0);
  } finally { dom.restore(); }
});
test('Skin texture control produces changed pixels and preserves original alpha and pixels', async () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'), original = p.image.data.slice();
    renderSkin(main, p.context, p.dependencies);
    await buttonNamed(main, 'Preview gentle texture smoothing').click();
    assert.equal(p.rendered.length, 1);
    assert.notDeepEqual(p.rendered[0].image.data, original);
    assert.deepEqual(p.image.data, original);
    assert.match(main.textContent, /Local simulation ready. Nothing was uploaded/);
    for (let i = 3; i < original.length; i += 4) assert.equal(p.rendered[0].image.data[i], original[i]);
  } finally { dom.restore(); }
});
test('Age-look controls require the adult confirmation and produce distinct procedural textures', async () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'), original = p.image.data.slice();
    renderSkin(main, p.context, p.dependencies);
    await buttonNamed(main, 'Preview older age-look texture').click();
    assert.equal(p.reads.length, 0); assert.equal(p.rendered.length, 0);
    assert.match(main.textContent, /Confirm that this is your adult photo/);
    main.querySelector('#local-age-adult').checked = true;
    await buttonNamed(main, 'Preview older age-look texture').click();
    await buttonNamed(main, 'Preview softer age-look texture').click();
    assert.equal(p.rendered.length, 2);
    assert.notDeepEqual(p.rendered[0].image.data, p.rendered[1].image.data);
    assert.match(p.rendered[0].label, /No biological age is inferred/);
    assert.deepEqual(p.image.data, original);
  } finally { dom.restore(); }
});
test('Skin permits camera-condition checks but exposes no face-dependent previews without a mesh', async () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'); p.context.face = null;
    renderSkin(main, p.context, p.dependencies);
    assert.equal(buttonNamed(main, 'Preview gentle texture smoothing'), undefined);
    assert.match(main.textContent, /No saved face will be substituted/);
    await buttonNamed(main, 'Check this photo locally').click();
    assert.match(main.textContent, /Mean light level/);
  } finally { dom.restore(); }
});
test('Skin rejects a pending decode when the source photo changed', async () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'); let finish;
    p.dependencies.read = () => new Promise(resolve => { finish = resolve; });
    renderSkin(main, p.context, p.dependencies);
    const waiting = buttonNamed(main, 'Preview gentle texture smoothing').click();
    p.context.photoSrc = 'blob:new-photo'; finish(p.image); await waiting;
    assert.equal(p.rendered.length, 0);
    assert.equal(buttonNamed(main, 'Preview gentle texture smoothing').disabled, false);
  } finally { dom.restore(); }
});
test('Skin redirects to Photo only when no local photo exists', () => {
  const dom = environment(); try {
    const p = localPhoto(), main = new Element('main'); p.context.photoSrc = null;
    renderSkin(main, p.context, p.dependencies);
    assert.equal(p.context.redirected, 'photo'); assert.equal(main.children.length, 0);
  } finally { dom.restore(); }
});
