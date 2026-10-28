/**
 * Position light: vignette, centre light and a top-to-bottom graded tint, mirroring
 * api/plumb_api/filters/light/position.py. Each pixel changes by where it sits in the whole
 * photo (the Frame), never by its neighbours, so these tile without a halo. Light is
 * multiplied in linear light; the graded tint pushes OKLab a, b.
 * Author: John Khan.
 */
import { type Block, type Frame, type Resolved, angle, fixed, num, register } from "../colour/ops.js";
import { RAD, decode1, encode1, oklabToSrgb, smoothstep, srgbToOklab } from "../colour/space.js";

const HALF_DIAGONAL = Math.hypot(0.5, 0.5);

function each(block: Block, frame: Frame, fn: (data: Float64Array, i: number, x: number, y: number) => void): Block {
  const out = Float64Array.from(block.data);
  for (let row = 0; row < block.height; row++) {
    const y = row + frame.y0 + 0.5;
    for (let col = 0; col < block.width; col++) fn(out, (row * block.width + col) * 3, col + frame.x0 + 0.5, y);
  }
  return { width: block.width, height: block.height, data: out };
}

export function vignetteFactor(p: Resolved, frame: Frame, x: number, y: number): number {
  const u = x / frame.width - 0.5, v = y / frame.height - 0.5;
  const d = Math.hypot(u, v) / HALF_DIAGONAL;
  const k = smoothstep(p.inner as number, p.outer as number, d);
  return Math.max(0, 1 - 0.6 * (p.amount as number) * k);
}

export function vignette(block: Block, p: Resolved, frame: Frame): Block {
  return each(block, frame, (d, i, x, y) => {
    const f = vignetteFactor(p, frame, x, y);
    for (let c = 0; c < 3; c++) d[i + c] = encode1(decode1(d[i + c]) * f);
  });
}

export function centrePoint(p: Resolved, frame: Frame): [number, number] {
  if ((p.follow as number) >= 0.5 && frame.faceCentre) return [frame.faceCentre[0], frame.faceCentre[1]];
  return [(p.cx as number) * frame.width, (p.cy as number) * frame.height];
}

export function centre(block: Block, p: Resolved, frame: Frame): Block {
  const [cx, cy] = centrePoint(p, frame);
  const reach = (p.radius as number) * Math.min(frame.width, frame.height);
  const amount = p.amount as number, warmth = p.warmth as number;
  return each(block, frame, (d, i, x, y) => {
    const g = 1 - smoothstep(0, 1, Math.hypot(x - cx, y - cy) / reach);
    const factor = 1 + 0.5 * amount * g;
    d[i] = encode1(decode1(d[i]) * (factor * (1 + 0.25 * warmth * g)));
    d[i + 1] = encode1(decode1(d[i + 1]) * factor);
    d[i + 2] = encode1(decode1(d[i + 2]) * (factor * (1 - 0.25 * warmth * g)));
  });
}

export function grade(block: Block, p: Resolved, frame: Frame): Block {
  const s = new Float64Array(3);
  const top = (p.topHue as number) * RAD, bottom = (p.bottomHue as number) * RAD;
  const ta = p.topAmount as number, ba = p.bottomAmount as number;
  return each(block, frame, (d, i, _x, y) => {
    const t = y / frame.height;
    srgbToOklab(d[i], d[i + 1], d[i + 2], s);
    const pt = ta * (1 - t), pb = ba * t;
    s[1] += pt * Math.cos(top); s[2] += pt * Math.sin(top);
    s[1] += pb * Math.cos(bottom); s[2] += pb * Math.sin(bottom);
    oklabToSrgb(s[0], s[1], s[2], s);
    d[i] = s[0]; d[i + 1] = s[1]; d[i + 2] = s[2];
  });
}

register({ name: "light.vignette", family: "light", skinHue: false, image: vignette,
  params: { amount: num(0, -1, 1, "darker edges +, lighter edges -"), inner: fixed(0.35, 0, 0.95), outer: fixed(1, 0.3, 1.5) },
  help: "Edge darkening by distance from the centre" });
register({ name: "light.centre", family: "light", skinHue: false, image: centre,
  params: { amount: num(0, 0, 1), warmth: num(0, -1, 1), radius: fixed(0.45, 0.1, 1.5), cx: fixed(0.5, 0, 1), cy: fixed(0.45, 0, 1),
    follow: fixed(0, 0, 1, "1 = follow the face centre when known") },
  help: "A pool of light around the face or a point" });
register({ name: "light.grade", family: "light", skinHue: true, image: grade,
  params: { topHue: angle(), topAmount: num(0, 0, 0.1), bottomHue: angle(), bottomAmount: num(0, 0, 0.1) },
  help: "A tint graded from the top of the photo to the bottom" });
