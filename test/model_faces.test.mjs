/** Built-in model faces (audit 2026-10-30, Fix 3): the try-on is playable with no upload, and
 * Taste Leap shows real photographic faces instead of cartoons. Run: node --test test/model_faces.test.mjs */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { MODEL_FACES, nearestModelFace } from '../public/model-faces.js';

const COMMUNITIES = ['west-african', 'east-african', 'south-african', 'black-american', 'caribbean', 'south-asian', 'arab', 'latina', 'east-asian'];

test('nine model faces, one per community, shipped as WebP', () => {
  assert.deepEqual([...MODEL_FACES.map(f => f.id)].sort(), [...COMMUNITIES].sort());
  for (const f of MODEL_FACES) {
    const b = fs.readFileSync(`public${f.src}`);
    assert.equal(b.subarray(0, 4).toString(), 'RIFF', f.id);
    assert.equal(b.subarray(8, 12).toString(), 'WEBP', f.id);
    assert.ok(b.length > 10_000 && b.length < 200_000, `${f.id} ${b.length}`);
  }
});

test('the faces span light to deep, and the nearest face follows the tone', () => {
  const Ls = MODEL_FACES.map(f => f.L);
  assert.ok(Math.max(...Ls) - Math.min(...Ls) >= 35);
  assert.equal(nearestModelFace(90).L, Math.max(...Ls));
  assert.equal(nearestModelFace(20).L, Math.min(...Ls));
});

test('the try-on dialog offers the model faces next to Upload and Camera', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  const step = html.slice(html.indexOf('id="tryonUploadStep"'), html.indexOf('id="tryonPreviewStep"'));
  assert.match(step, /Or try a model face/); assert.match(step, /id="tryonModelFaces"/); assert.doesNotMatch(step, /not real people/);
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.match(app, /import \{ MODEL_FACES \} from '\.\/model-faces\.js'/);
  assert.match(app, /data-model-face/);
});

test('Taste Leap paints model photos, not cartoon faces', () => {
  const leap = fs.readFileSync('public/leap.js', 'utf8');
  assert.match(leap, /nearestModelFace/); assert.match(leap, /applyLook/);
  assert.doesNotMatch(leap, /<ellipse cx="120" cy="134"/); // the old cartoon head
});
