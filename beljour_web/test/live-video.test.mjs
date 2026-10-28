// Video and live-camera effects on synthetic frame sequences (test/helpers/frames.mjs): each
// effect changes only what it should, keeps alpha, is a no-op at strength 0, streams frames
// to the sink without keeping them, and its temporal smoothing measurably steadies jittery
// inputs. No camera, video file or network. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processSequence, NO_INPUTS } from '../dist/js/reel/live/frames.js';
import { MaskSmoother, PixelSmoother, PointSmoother } from '../dist/js/reel/live/temporal.js';
import { VideoRetouch } from '../dist/js/reel/live/retouch.js';
import { BACKDROPS, VideoBackground } from '../dist/js/reel/live/background.js';
import { VideoEnhance } from '../dist/js/reel/live/enhance.js';
import { scene } from '../dist/js/engines/local/enhance.js';
import { LIVE_FILTERS, LiveArFilter } from '../dist/js/reel/live/ar-filters.js';
import { rgbToLab } from '../dist/js/reel/colour.js';
import { render } from '../dist/js/filters/runtime/engine.js';
import { fromLandmarks } from '../dist/js/filters/masks/blend.js';
import { regionMask } from '../dist/js/data/regions/index.js';
import { sequence, W, H } from './helpers/frames.mjs';

const fetchTrap = () => { const previous = globalThis.fetch; globalThis.fetch = () => { throw new Error('network used'); }; return () => { globalThis.fetch = previous; }; };
const same = (a, b) => a.data.length === b.data.length && a.data.every((v, i) => v === b.data[i]);
const alphaKept = (a, b) => { for (let i = 3; i < a.data.length; i += 4) if (a.data[i] !== b.data[i]) return false; return true; };

test('processSequence streams each output once, in order, and rejects frames out of order', async () => {
  const { frames, inputs } = sequence(5);
  const seen = [];
  const report = await processSequence(frames, new VideoRetouch(), (_, i) => inputs[i], (out, frame, i) => { seen.push([i, frame.t]); });
  assert.equal(report.frames, 5);
  assert.deepEqual(seen.map((s) => s[0]), [0, 1, 2, 3, 4]);
  await assert.rejects(processSequence([frames[1], frames[0]], new VideoRetouch(), () => NO_INPUTS, () => {}), /increasing time order/);
});

test('One Euro point smoothing steadies jittered face points on a still face', () => {
  const { inputs, frames } = sequence(20, { drift: 0, jitter: 2 });
  const smoother = new PointSmoother();
  let rawDev = 0, smoothDev = 0;
  inputs.forEach((inp, f) => {
    const s = smoother.smooth(inp.points, frames[f].t);
    if (f < 5) return;
    for (let i = 0; i < 478; i += 7) {
      rawDev += Math.hypot(inp.points[i][0] - inp.truth[i][0], inp.points[i][1] - inp.truth[i][1]);
      smoothDev += Math.hypot(s[i][0] - inp.truth[i][0], s[i][1] - inp.truth[i][1]);
    }
  });
  assert.ok(smoothDev < rawDev * 0.6, `smoothed ${smoothDev} vs raw ${rawDev}`);
});

test('#71 video retouch smooths only inside the tracked skin, keeps alpha and the marks, and needs a face', async () => {
  const restore = fetchTrap(); try {
    const { frames, inputs } = sequence(6);
    const effect = new VideoRetouch();
    await processSequence(frames, effect, (_, i) => inputs[i], (out, frame) => {
      assert.ok(out.changed);
      assert.ok(alphaKept(out.image, frame.image));
      const skin = regionMask('skin', effect.lastPoints, W, H, { normalized: false }).data;
      let inside = 0;
      for (let i = 0; i < W * H; i++) {
        const moved = [0, 1, 2].some((k) => out.image.data[i * 4 + k] !== frame.image.data[i * 4 + k]);
        if (moved) { assert.ok(skin[i] > 0, 'changed outside the skin'); inside++; }
      }
      assert.ok(inside > 200);
      const mark = inputs[0].truth[205], j = (Math.round(mark[1]) * W + Math.round(mark[0])) * 4;
      assert.ok(out.image.data[j] < frame.image.data[j] * 1.25, 'mark removed');
    }, 80);
    const blank = await processSequence(frames.slice(0, 2), new VideoRetouch(), () => NO_INPUTS, (out, frame) => {
      assert.deepEqual(out.image.data, frame.image.data);
    });
    assert.equal(blank.changed, 0);
    assert.match(blank.notes[0], /No face/);
    const zero = await processSequence(frames.slice(0, 2), new VideoRetouch(), (_, i) => inputs[i], (out, frame) => {
      assert.deepEqual(out.image.data, frame.image.data);
    }, 0);
    assert.equal(zero.changed, 0);
  } finally { restore(); }
});

test('mask and pixel smoothers average flicker but follow real changes at once', () => {
  const m = new MaskSmoother();
  m.smooth(Float32Array.from([0, 1, 0.5]));
  const s = m.smooth(Float32Array.from([0.2, 0, 0.6]));
  assert.ok(Math.abs(s[0] - 0.07) < 1e-6 && s[1] === 0 && Math.abs(s[2] - 0.535) < 1e-6);
  const p = new PixelSmoother();
  const a = { width: 2, height: 1, channels: 3, data: Uint8ClampedArray.from([100, 100, 100, 100, 100, 100]) };
  p.smooth(a);
  const b = p.smooth({ ...a, data: Uint8ClampedArray.from([110, 110, 110, 200, 30, 30]) });
  assert.deepEqual(Array.from(b.data), [104, 104, 104, 200, 30, 30]);
});

test('#80 background change replaces only what is behind her, keeps alpha, and steadies a flickering mask', async () => {
  const restore = fetchTrap(); try {
    const { frames, inputs } = sequence(8, { noise: 0.5, drift: 0 });
    const effect = new VideoBackground({ kind: 'colour', name: 'ardoise' }), outs = [];
    await processSequence(frames, effect, (_, i) => inputs[i], (out, frame, i) => {
      assert.ok(alphaKept(out.image, frame.image));
      const person = inputs[i].person;
      for (let p = 0; p < W * H; p += 13) {
        const x = p % W, y = Math.floor(p / W);
        let inside = true, outside = true;
        for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
          const q = Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx));
          if (person[q] < 1) inside = false; if (person[q] > 0) outside = false;
        }
        const px = Array.from(out.image.data.slice(p * 4, p * 4 + 3));
        if (inside) assert.deepEqual(px, Array.from(frame.image.data.slice(p * 4, p * 4 + 3)), 'person changed');
        if (outside) assert.deepEqual(px, [...BACKDROPS.ardoise], 'background kept');
      }
      outs.push(effect.lastMask);
    });
    const raw = new MaskSmoother(1, 2);
    let rawFlips = 0, steadyFlips = 0;
    for (let f = 1; f < inputs.length; f++) for (let p = 0; p < W * H; p++) {
      rawFlips += Math.abs(inputs[f].person[p] - inputs[f - 1].person[p]);
      steadyFlips += Math.abs(outs[f][p] - outs[f - 1][p]);
    }
    assert.ok(steadyFlips < rawFlips * 0.5, `steady ${steadyFlips} vs raw ${rawFlips}`);
    const none = await processSequence(frames.slice(0, 2), new VideoBackground(), () => NO_INPUTS, (out, frame) => assert.deepEqual(out.image.data, frame.image.data));
    assert.match(none.notes[0], /No person outline/);
    assert.throws(() => new VideoBackground({ kind: 'colour', name: 'magenta' }), /unknown backdrop/);
  } finally { restore(); }
});

test('#80 the soft background blurs only what is behind her', async () => {
  const { frames, inputs } = sequence(2, { drift: 0 });
  const effect = new VideoBackground({ kind: 'soft' });
  await processSequence(frames, effect, (_, i) => inputs[i], (out, frame, i) => {
    let diff = 0;
    for (let p = 0; p < W * H; p++) if (inputs[i].person[p] === 0 && out.image.data[p * 4] !== frame.image.data[p * 4]) diff++;
    assert.ok(diff > 1000);
  });
});

function darkNoisy(frames) {
  return frames.map((f, n) => {
    const data = new Uint8ClampedArray(f.image.data);
    let s = 1234 + n;
    for (let i = 0; i < data.length; i += 4) for (let k = 0; k < 3; k++) {
      s = (s * 1103515245 + 12345) >>> 0;
      data[i + k] = Math.max(0, Math.min(255, Math.round(data[i + k] * 0.22 + ((s >>> 16) % 13) - 6)));
    }
    return { image: { ...f.image, data }, t: f.t };
  });
}

test('#81 video enhance lifts dark noisy frames, keeps alpha, steadies flicker, and keeps normal frames as filmed', async () => {
  const { frames } = sequence(6, { drift: 0 });
  const dark = darkNoisy(frames), effect = new VideoEnhance(), outs = [];
  const report = await processSequence(dark, effect, () => NO_INPUTS, (out, frame) => {
    assert.ok(alphaKept(out.image, frame.image));
    outs.push(out.image);
  });
  assert.equal(report.changed, 6);
  assert.equal(effect.lastCondition, 'low_light');
  const mean = (img) => { let s = 0; for (let i = 0; i < img.data.length; i += 4) s += img.data[i + 1]; return s / (img.data.length / 4); };
  // The enhance pipeline bounds exposure gain (1.65x linear at most), so the lift is real but modest.
  assert.ok(mean(outs[5]) > mean(dark[5].image) + 3, 'not brighter');
  // Frame-to-frame change on a still scene is smaller after the temporal smoothing than per frame alone.
  const single = new VideoEnhance();
  const alone = dark.map((f) => { single.reset(); return single.apply(f, NO_INPUTS, 100).image; });
  const flicker = (list) => { let s = 0; for (let f = 1; f < list.length; f++) for (let i = 0; i < list[f].data.length; i += 4) s += Math.abs(list[f].data[i] - list[f - 1].data[i]); return s; };
  assert.ok(flicker(outs) < flicker(alone) * 0.8, `smoothed ${flicker(outs)} vs alone ${flicker(alone)}`);
  // The enhance module's own clean scene: its condition gate reads it as normal.
  const clean = [0, 1, 2].map((n) => ({ image: scene(96, 80), t: n / 10 }));
  const normal = await processSequence(clean, new VideoEnhance(), () => NO_INPUTS, (out, frame) => assert.ok(same(out.image, frame.image)));
  assert.equal(normal.changed, 0);
  assert.match(normal.notes[0], /kept as filmed/);
  const zero = await processSequence(dark.slice(0, 2), new VideoEnhance(), () => NO_INPUTS, (out, frame) => assert.ok(same(out.image, frame.image)), 0);
  assert.equal(zero.changed, 0);
});

const skinL = (img, points) => {
  const skin = regionMask('skin', points, W, H, { normalized: false }).data;
  let s = 0, n = 0;
  for (let i = 0; i < W * H; i++) if (skin[i] >= 0.5) { s += rgbToLab(img.data[i * 4], img.data[i * 4 + 1], img.data[i * 4 + 2])[0]; n++; }
  return s / n;
};

test('#82 live filters apply our looks with the skin guard, follow the face, keep alpha and never lighten skin', async () => {
  const restore = fetchTrap(); try {
    const { frames, inputs } = sequence(5);
    for (const f of LIVE_FILTERS) {
      const effect = new LiveArFilter(f.id);
      await processSequence(frames, effect, (_, i) => inputs[i], (out, frame, i) => {
        assert.ok(out.changed, f.id);
        assert.ok(alphaKept(out.image, frame.image), f.id);
        if (f.layer !== 'stars') assert.ok(skinL(out.image, inputs[i].truth) <= skinL(frame.image, inputs[i].truth) + 1, `${f.id} lightened skin`);
      }, 100);
    }
    // Stars sit near the cheeks, within one eye distance: compare with the same look without its layer.
    const stars = new LiveArFilter('etoiles');
    const withStars = stars.apply(frames[0], inputs[0], 100).image;
    const lookOnly = render(frames[0].image, 'C03', { strength: 100 }, fromLandmarks(stars.lastPoints, W, H)).image;
    const p = stars.lastPoints, iod = Math.hypot(p[473][0] - p[468][0], p[473][1] - p[468][1]);
    let drawn = 0;
    for (let i = 0; i < W * H; i++) {
      if ([0, 1, 2].every((k) => withStars.data[i * 4 + k] === lookOnly.data[i * 3 + k])) continue;
      const x = i % W, y = Math.floor(i / W);
      assert.ok([205, 425].some((c) => Math.hypot(x - p[c][0], y - p[c][1]) < iod), 'star away from the cheeks');
      assert.ok(withStars.data[i * 4] >= lookOnly.data[i * 3], 'a star darkened a pixel');
      drawn++;
    }
    assert.ok(drawn > 20);
    // The cheek tint is a multiply: it never makes a pixel lighter than the look alone.
    const cheeks = new LiveArFilter('joues');
    const tinted = cheeks.apply(frames[0], inputs[0], 100).image;
    const cheekLook = render(frames[0].image, 'C07', { strength: 100 }, fromLandmarks(cheeks.lastPoints, W, H)).image;
    let deeper = 0;
    for (let i = 0; i < W * H; i++) for (let k = 0; k < 3; k++) {
      assert.ok(tinted.data[i * 4 + k] <= cheekLook.data[i * 3 + k], 'cheek tint lightened a pixel');
      if (tinted.data[i * 4 + k] < cheekLook.data[i * 3 + k]) deeper++;
    }
    assert.ok(deeper > 50);
    const none = await processSequence(frames.slice(0, 2), new LiveArFilter(), () => NO_INPUTS, (out, frame) => assert.ok(same(out.image, frame.image)));
    assert.equal(none.changed, 0);
    assert.throws(() => new LiveArFilter('hollywood'), /no live filter/);
  } finally { restore(); }
});
