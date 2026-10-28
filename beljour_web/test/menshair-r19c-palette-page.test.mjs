/** Static contract of the opt-in, synthetic-only tint/fibre workshop. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { illustratedFibreGuide } from '../dist/js/commerce/hair-demo.js';
const root = resolve(new URL('../..', import.meta.url).pathname);
const html = readFileSync(resolve(root, 'web/commerce.html'), 'utf8');
const source = readFileSync(resolve(root, 'web/src/commerce/hair-demo.ts'), 'utf8');
const palette = readFileSync(resolve(root, 'web/src/engines/menshair/palette.ts'), 'utf8');
function maskFixture(w = 56, h = 52) {
  const image = new Uint8ClampedArray(w*h*4), mask = new Uint8Array(w*h);
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
    const p=y*w+x;
    image[p*4] = 214; image[p*4+1] = 182;
    image[p*4+2] = 149; image[p*4+3] = 255;
    if (x>=10 && x<=45 && y>=6 && y<=39) {
      image[p*4] = 85; image[p*4+1] = 64; image[p*4+2] = 56;
      mask[p] = 255;
    }
  }
  return { image, mask, w, h };
}
test('illustrated thinning patch uses only an explicit painted hair support and creates separate masks', () => {
  const {image,mask,w,h} = maskFixture();
  const prior = new Uint8ClampedArray(image), originalMask = new Uint8Array(mask);
  const guide = illustratedFibreGuide(image,mask,w,h);
  assert.ok(guide.illustratedPixels > 20);
  assert.deepEqual(image, prior);
  assert.deepEqual(mask, originalMask);
  assert.equal(guide.topicalScalp.reduce((n,v)=>n+(v>0),0),guide.illustratedPixels);
  for (let i=0;i<mask.length;i++) {
    if (!mask[i]) {
      assert.equal(guide.topicalScalp[i],0);
      assert.deepEqual(guide.before.slice(i*4,i*4+4),image.slice(i*4,i*4+4));
    }
    assert.equal(guide.before[i*4+3],image[i*4+3]);
    assert.ok(guide.topicalScalp[i] === 0 || guide.remainingHair[i] === 0);
  }
});
test('bad drawing or mask cannot be mistaken for authorized synthetic scalp support', () => {
  const {image,mask,w,h} = maskFixture();
  assert.throws(()=>illustratedFibreGuide(image,mask.slice(1),w,h));
  assert.throws(()=>illustratedFibreGuide(image,new Uint8Array(mask.length),w,h));
  assert.throws(()=>illustratedFibreGuide(new Uint8ClampedArray(image.length-4),mask,w,h));
});
test('workshop includes actual user controls, before/after image semantics and simulation disclosures', () => {
  for (const id of ['hair-colour-swatch','hair-colour-strength','hair-colour-region',
    'hair-fibre-strength','hair-colour-result','hair-fibre-original','hair-fibre-result',
    'hair-colour-status','hair-fibre-status']) {
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.match(html,/not hair restoration/i);
  assert.match(html,/does not predict professional dye colour/i);
  assert.match(source,/renderPaletteFibres\(/);
  assert.match(source,/renderColour\(/);
  assert.doesNotMatch(source,/\bfetch\s*\(/);
  assert.doesNotMatch(palette,/\bfetch\s*\(/);
  assert.doesNotMatch(source,/\.\s*sendBeacon\s*\(/);
});
