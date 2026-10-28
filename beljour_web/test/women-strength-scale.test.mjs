/** R24c local women's strength and identity-guard contracts.
 * All arrays are arithmetic rectangles, not faces. Author: John Khan.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkedLevel, fromLegacyStrength, StrengthMemory, presetLevel, opacityForLevel,
} from '../dist/js/engines/women_styling/strength.js';
import {
  ConservativeGuard, guardedEdit,
} from '../dist/js/engines/women_styling/identity.js';
import { WomenPreviewSession } from '../dist/js/engines/women_styling/previewCache.js';

const makeFrame = () => {
  const width = 34, height = 22, channels = 4;
  const data = new Uint8Array(width * height * channels);
  for (let p = 0; p < width * height; p++) {
    for (let c = 0; c < 3; c++) data[p * channels + c] = 76;
    data[p * channels + 3] = 201;
  }
  return { width, height, channels, data };
};
const makeMask = frame => {
  const mask = new Uint8Array(frame.width * frame.height);
  for (let y = 3; y < frame.height - 3; y++) {
    for (let x = 3; x < frame.width - 3; x++) mask[y * frame.width + x] = 255;
  }
  return mask;
};
const paint = (source, mask, opacity, width, height, channels) => {
  const out = source.slice();
  for (let p = 0; p < width * height; p++) {
    if (mask[p] === 0) continue;
    for (let c = 0; c < 3; c++) out[p * channels + c] = 76 + Math.round(155 * opacity);
  }
  return out;
};

test('all 41 tenth steps are valid and off-step values fail', () => {
  for (let tick = 10; tick <= 50; tick++) {
    assert.equal(checkedLevel(tick / 10), tick / 10);
    assert.ok(opacityForLevel(tick / 10) <= 1);
  }
  for (const value of [0.95, 5.1, 2.25, 2.00001, NaN, Infinity, true, '2.0']) {
    assert.throws(() => checkedLevel(value));
  }
  assert.equal(presetLevel('normal'), 3);
  assert.equal(presetLevel('hyper'), 5);
  assert.equal(fromLegacyStrength(0), 1);
  assert.equal(fromLegacyStrength(100), 5);
  assert.throws(() => fromLegacyStrength(33.3));
});

test('each effect remembers its own chosen strength locally', () => {
  const memory = new StrengthMemory();
  assert.equal(memory.select('W28').level, 3);
  assert.equal(memory.select('W28', 4.4).level, 4.4);
  assert.equal(memory.select('W39', 1.1).level, 1.1);
  assert.equal(memory.select('W28').level, 4.4);
  memory.clear();
  assert.equal(memory.current('W28'), 3);
});

test('guard runs by default and blends back unless user explicitly lowers lock', () => {
  const source = makeFrame();
  const mask = makeMask(source);
  const before = source.data.slice();
  const locked = guardedEdit(source, mask, paint, 5);
  const loose = guardedEdit(source, mask, paint, 5, 1);
  assert.equal(locked.blended, true);
  assert.ok(loose.similarity < locked.similarity);
  assert.deepEqual(source.data, before);
  assert.equal(locked.stillHerScore, 100);
  for (let p = 0; p < mask.length; p++) {
    if (mask[p] === 0) {
      for (let c = 0; c < 4; c++) {
        assert.equal(locked.pixels[p * 4 + c], before[p * 4 + c]);
      }
    }
    assert.equal(locked.pixels[p * 4 + 3], before[p * 4 + 3]);
  }
});

test('even neutral strength still invokes provided guard', () => {
  const frame = makeFrame(), mask = makeMask(frame);
  let calls = 0;
  const guard = {
    guard(before, after, lock, channels) {
      calls++;
      assert.equal(lock, 5);
      return new ConservativeGuard().guard(before, after, lock, channels);
    },
  };
  for (let n = 10; n <= 50; n += 10) {
    guardedEdit(frame, mask, paint, n / 10, 5, guard);
  }
  assert.equal(calls, 5);
});

test('malicious guard modifications are rejected at mask and alpha boundaries', () => {
  const frame = makeFrame(), mask = makeMask(frame);
  const guard = {
    guard(before, after) {
      const pixels = after.slice();
      pixels[3] = 0;
      return { pixels, similarity: .99, blended: false, source: 'bad' };
    },
  };
  assert.throws(() => guardedEdit(frame, mask, paint, 5, 5, guard), /breached/);
});

test('one computed mask is reused across five level changes', () => {
  const frame = makeFrame();
  let computations = 0;
  const session = new WomenPreviewSession(image => {
    computations++;
    return makeMask(image);
  });
  const photoHash = 'a'.repeat(64);
  for (const level of [1, 2, 3, 4, 5]) {
    const result = session.render(frame, 'W28', paint, { level, photoHash });
    assert.equal(result.level, level);
  }
  assert.equal(computations, 1);
  session.render(frame, 'W28', paint, { level: 3, photoHash });
  assert.equal(computations, 1);
  session.render(frame, 'W39', paint, { level: 3, photoHash });
  assert.equal(computations, 2);
  assert.throws(() => session.render(frame, 'W28', paint, { level: 3, photoHash: 'not-sha' }));
  session.release();
  session.render(frame, 'W28', paint, { level: 3, photoHash });
  assert.equal(computations, 3);
});

test('preview uses downsampled buffers and release preserves full resolution', () => {
  const frame = makeFrame();
  const session = new WomenPreviewSession(makeMask);
  const photoHash = 'b'.repeat(64);
  const preview = session.render(frame, 'W39', paint, { photoHash, level: 4, previewEdge: 12 });
  const final = session.render(frame, 'W39', paint, { photoHash, level: 4, previewEdge: null });
  assert.ok(preview.pixels.length < final.pixels.length);
  assert.equal(final.pixels.length, frame.data.length);
  assert.equal(session.maskComputations, 1);
});

test('a corrected manual mask refreshes one effect without changing stored strength', () => {
  const frame = makeFrame();
  const photoHash = 'c'.repeat(64);
  let left = 3;
  let computations = 0;
  const session = new WomenPreviewSession(image => {
    computations++;
    const mask = makeMask(image);
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        if (x < left) mask[y * image.width + x] = 0;
      }
    }
    return mask;
  });
  const first = session.render(frame, 'W28', paint, { photoHash, level: 4, previewEdge: null });
  const secondEdit = session.render(frame, 'W39', paint, { photoHash, level: 2, previewEdge: null });
  assert.equal(computations, 2);
  left = 10;
  const stale = session.render(frame, 'W28', paint, { photoHash, level: 4, previewEdge: null });
  assert.deepEqual(stale.pixels, first.pixels);
  session.invalidateMask(photoHash, 'W28');
  const corrected = session.render(frame, 'W28', paint, { photoHash, previewEdge: null });
  assert.equal(corrected.level, 4);
  const site = (8 * frame.width + 6) * frame.channels;
  assert.notEqual(first.pixels[site], corrected.pixels[site]);
  assert.equal(corrected.pixels[site], frame.data[site]);
  assert.equal(computations, 3);
  const unchanged = session.render(frame, 'W39', paint, { photoHash, level: 2, previewEdge: null });
  assert.deepEqual(unchanged.pixels, secondEdit.pixels);
  assert.equal(computations, 3);
});

test('recipe invalidation clears one effect across photos without clearing preferences', () => {
  const frame = makeFrame();
  const photoHashes = ['d'.repeat(64), 'e'.repeat(64)];
  let count = 0;
  const session = new WomenPreviewSession(image => {
    count++;
    return makeMask(image);
  });
  for (const photoHash of photoHashes) {
    session.render(frame, 'W28', paint, { photoHash, level: 4 });
    session.render(frame, 'W39', paint, { photoHash, level: 2 });
  }
  assert.equal(count, 4);
  session.invalidateEdit('W28');
  for (const photoHash of photoHashes) {
    const changed = session.render(frame, 'W28', paint, { photoHash });
    assert.equal(changed.level, 4);
    session.render(frame, 'W39', paint, { photoHash });
  }
  assert.equal(count, 6);
  session.invalidateEdit('W39');
  for (const photoHash of photoHashes) {
    const changed = session.render(frame, 'W39', paint, { photoHash });
    assert.equal(changed.level, 2);
  }
  assert.equal(count, 8);
});

test('photo revocation clears only the selected photo, not every cached photo', () => {
  const frame = makeFrame();
  const firstHash = '1'.repeat(64);
  const secondHash = '2'.repeat(64);
  let count = 0;
  const session = new WomenPreviewSession(image => {
    count++;
    return makeMask(image);
  });
  for (const photoHash of [firstHash, secondHash]) {
    for (const edit of ['W28', 'W39']) {
      session.render(frame, edit, paint, { photoHash, level: 3 });
    }
  }
  assert.equal(count, 4);
  session.invalidatePhoto(firstHash);
  for (const edit of ['W28', 'W39']) {
    session.render(frame, edit, paint, { photoHash: secondHash, level: 3 });
  }
  assert.equal(count, 4);
  for (const edit of ['W28', 'W39']) {
    session.render(frame, edit, paint, { photoHash: firstHash, level: 3 });
  }
  assert.equal(count, 6);
});

test('invalid invalidation requests cannot evict another photo or effect', () => {
  const frame = makeFrame();
  const photoHash = 'f'.repeat(64);
  let count = 0;
  const session = new WomenPreviewSession(image => {
    count++;
    return makeMask(image);
  });
  session.render(frame, 'W28', paint, { photoHash, level: 3 });
  for (const wrong of ['', 'X'.repeat(65)]) {
    assert.throws(() => session.invalidateEdit(wrong));
    assert.throws(() => session.invalidateMask(photoHash, wrong));
  }
  assert.throws(() => session.invalidatePhoto('bogus'));
  assert.throws(() => session.invalidateMask('bogus', 'W28'));
  session.render(frame, 'W28', paint, { photoHash, level: 3 });
  assert.equal(count, 1);
});
