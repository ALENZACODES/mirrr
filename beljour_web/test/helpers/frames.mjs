// Synthetic frame sequences for the video and live-camera tests: a drawn face (made-up mesh,
// flat skin with grain and two dark marks) on a textured backdrop, moving and with jittered
// face points, plus an optional drawn person mask and a hard scene cut. No camera, no video
// file, no real face. Author: John Khan.
import { symmetricFace } from '../../dist/js/engines/local/face-synthetic.js';
import { regionMask } from '../../dist/js/data/regions/index.js';

export const W = 160, H = 200;
const rand = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

export function facePoints(dx = 0, dy = 0) {
  return symmetricFace(W, H, W * 0.55, H * 0.6).map(([x, y]) => [x + dx, y + dy]);
}

/** One drawn frame: backdrop, skin inside the face oval, grain, two marks; RGBA, alpha varies. */
export function drawFrame(points, { seed = 1, scene = 0, skin = [196, 150, 120] } = {}) {
  const data = new Uint8ClampedArray(W * H * 4), next = rand(seed);
  const oval = regionMask('face_oval', points, W, H, { normalized: false }).data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, grain = (next() - 0.5) * 16;
    const back = scene === 0 ? [60 + x / 3, 90 + y / 5, 120] : [170, 120 + x / 4, 60 + y / 6];
    const a = oval[i];
    for (let k = 0; k < 3; k++) data[i * 4 + k] = back[k] * (1 - a) + skin[k] * a + grain;
    data[i * 4 + 3] = 150 + ((x * 3 + y) % 100);
  }
  for (const [px, py] of [points[205], points[425]]) {
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      const i = (Math.round(py) + y) * W + Math.round(px) + x;
      for (let k = 0; k < 3; k++) data[i * 4 + k] *= 0.55;
    }
  }
  return { width: W, height: H, channels: 4, data };
}

/** A person mask: the face oval widened down to the bottom edge (head and shoulders). */
export function personMask(points, noise = 0, seed = 7) {
  const oval = regionMask('face_oval', points, W, H, { normalized: false }).data, next = rand(seed);
  const xs = points.map((p) => p[0]), left = Math.min(...xs) - 10, right = Math.max(...xs) + 10, chin = points[152][1];
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, body = y > chin - 4 && x > left && x < right ? 1 : 0;
    const v = Math.max(oval[i] >= 0.5 ? 1 : 0, body);
    const flip = noise && Math.abs(x - left) < 3 ? (next() < noise ? 1 : 0) : 0;
    out[i] = flip ? 1 - v : v;
  }
  return out;
}

/** n frames at fps; the face drifts right, points jitter by +-jitter px; optional cut at frame `cut`. */
export function sequence(n = 12, { fps = 10, drift = 1, jitter = 1.5, cut = -1, noise = 0 } = {}) {
  const next = rand(99), frames = [], inputs = [];
  for (let f = 0; f < n; f++) {
    const truth = facePoints(f * drift, 0), scene = cut >= 0 && f >= cut ? 1 : 0;
    const image = drawFrame(truth, { seed: 11 + f, scene });
    const seen = truth.map(([x, y]) => [x + (next() - 0.5) * 2 * jitter, y + (next() - 0.5) * 2 * jitter]);
    frames.push({ image, t: f / fps });
    inputs.push({ points: seen, person: personMask(truth, noise, 7 + f), truth });
  }
  return { frames, inputs };
}
