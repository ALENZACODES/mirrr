// R4 region parity: every pixel of every canonical Python mask is recomputed in TS.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import * as regions from '../dist/js/data/regions/index.js';
import { coverage } from '../dist/js/engines/core/mask.js';
const vectors = JSON.parse(readFileSync(new URL('../../parity/face-regions-r4.json', import.meta.url)));
const cases = vectors.cases;

 test('generated region IDs agree with the canonical source', () => {
  assert.equal(vectors.format, 'beljour-regions-parity/1');
  assert.equal(vectors.source, 'api/plumb_api/engines/core/regions.py');
  assert.equal(regions.REGIONS.length, 13);
  assert.equal(regions.CONTOURS.face_oval.length, 36);
  assert.equal(regions.IRIS_SEGMENTS, 32);
  assert.equal(regions.IRISES.right_iris[0], 468);
  assert.equal(regions.IRISES.left_iris[0], 473);
  assert.ok(regions.CONTOURS.right_eye.includes(33));
});

test('39 whole alpha fields: Python and TypeScript are within 1/255 everywhere', () => {
  let compared = 0;
  let worst = 0;
  for (const vector of cases) {
    assert.equal(vector.landmarks.length, 478);
    for (const name of regions.REGIONS) {
      const mask = regions.regionMask(name, vector.landmarks, vector.width, vector.height, { supersample: vector.supersample });
      const expected = vector.expected[name];
      assert.deepEqual(expected.shape, [vector.height, vector.width]);
      assert.equal(mask.data.length, expected.data.length);
      for (let i = 0; i < expected.data.length; i++) {
        const diff = Math.abs(mask.data[i] - expected.data[i]);
        worst = Math.max(worst, diff);
        assert.ok(diff <= vectors.tolerance, `${vector.id}/${name} pixel ${i}: ${mask.data[i]} != ${expected.data[i]}`);
        compared++;
      }
    }
  }
  assert.ok(compared > 100_000);
  assert.ok(worst < 2e-6, `measured maximum error ${worst}`);
});

test('absolute pixel landmarks agree with normalized landmarks', () => {
  const { landmarks, width, height } = cases[0];
  const pixels = regions.pixelPoints(landmarks, width, height, true);
  for (const name of regions.REGIONS) {
    const a = regions.regionMask(name, landmarks, width, height, { supersample: 2 });
    const b = regions.regionMask(name, pixels, width, height, { normalized: false, supersample: 2 });
    assert.deepEqual(Array.from(a.data), Array.from(b.data));
  }
});

test('missing irises, invalid coordinates and unknown names fail before drawing', () => {
  const sample = cases[0];
  assert.throws(() => regions.regionMask('irises', sample.landmarks.slice(0,468), 40,40), /478-point/);
  assert.throws(() => regions.regionMask('face_oval', [[0,0],[0,1]], 40,40), /3..478/);
  assert.throws(() => regions.regionMask('nose', sample.landmarks, 40,40), /unknown region/);
  const bad = sample.landmarks.map((p) => [...p]); bad[10][0] = Infinity;
  assert.throws(() => regions.regionMask('skin', bad, 40,40), /finite/);
});

test('single-face selection never unions another face', () => {
  const mesh = cases[0].landmarks;
  const moved = mesh.map(([x,y,z]) => [x + 0.3, y, z]);
  const faces = [{ id:'face-1', landmarks:mesh }, { id:'face-2', landmarks:moved }];
  const actual = regions.maskForSelectedFace(faces,'face-1','face_oval',100,100);
  const direct = regions.regionMask('face_oval',mesh,100,100);
  assert.deepEqual(Array.from(actual.data),Array.from(direct.data));
  assert.ok(coverage(actual) > 0);
  assert.throws(() => regions.maskForSelectedFace(faces, 'face-9', 'skin',100,100),/not detected/);
});
