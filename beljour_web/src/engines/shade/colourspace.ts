/** Colour conversions for the W6 shade finder and W98 lighting simulator.
 * Mirrors api/plumb_api/engines/shade/colourspace.py: sRGB <-> linear light <-> XYZ (D65)
 * <-> CIELAB, with the same matrices and CIE breakpoints. Author: John Khan.
 */
export type Vec3 = [number, number, number];
export type Mat3 = [Vec3, Vec3, Vec3];

export const RGB_TO_XYZ: Mat3 = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];
export const WHITE: Vec3 = [0.95047, 1.0, 1.08883];
const D = 6 / 29;

export function invert3(m: Mat3): Mat3 {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-15) throw new RangeError("matrix is not invertible");
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}
export const XYZ_TO_RGB: Mat3 = invert3(RGB_TO_XYZ);

export function mul(m: Mat3, v: readonly number[]): Vec3 {
  return [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
}
export function matmul(a: Mat3, b: Mat3): Mat3 {
  const out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]] as Mat3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r][c] = a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c];
  return out;
}
export function scaleMat(m: Mat3, s: number): Mat3 {
  return m.map((row) => row.map((v) => v * s)) as Mat3;
}

export function decode(v: number): number {
  const c = Math.min(1, Math.max(0, v / 255));
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
export function encode(linear: number): number {
  const c = Math.min(1, Math.max(0, linear));
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
}
/** Round half to even, clipped to a byte, as NumPy rint does. */
export function toByte(v: number): number {
  const c = Math.min(255, Math.max(0, v));
  const f = Math.floor(c), d = c - f;
  if (d > 0.5) return Math.min(255, f + 1);
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}
function f(t: number): number { return t > D ** 3 ? Math.cbrt(t) : t / (3 * D * D) + 4 / 29; }
function finv(t: number): number { return t > D ? t ** 3 : 3 * D * D * (t - 4 / 29); }

export function xyzToLab(xyz: readonly number[], white: readonly number[] = WHITE): Vec3 {
  const fx = f(xyz[0] / white[0]), fy = f(xyz[1] / white[1]), fz = f(xyz[2] / white[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function labToXyz(lab: readonly number[], white: readonly number[] = WHITE): Vec3 {
  if (lab.length !== 3 || !lab.every(Number.isFinite)) throw new RangeError("expected a finite Lab triple");
  const fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200;
  return [finv(fx) * white[0], finv(fy) * white[1], finv(fz) * white[2]];
}
export function linearToXyz(lin: readonly number[]): Vec3 { return mul(RGB_TO_XYZ, lin); }
export function xyzToLinear(xyz: readonly number[]): Vec3 { return mul(XYZ_TO_RGB, xyz); }
export function srgbToLab(rgb: readonly number[]): Vec3 {
  return xyzToLab(linearToXyz([decode(rgb[0]), decode(rgb[1]), decode(rgb[2])]));
}
export function labToSrgb(lab: readonly number[]): Vec3 {
  const lin = xyzToLinear(labToXyz(lab));
  return [encode(lin[0]), encode(lin[1]), encode(lin[2])];
}
export function luminance(lin: readonly number[]): number {
  return RGB_TO_XYZ[1][0] * lin[0] + RGB_TO_XYZ[1][1] * lin[1] + RGB_TO_XYZ[1][2] * lin[2];
}
