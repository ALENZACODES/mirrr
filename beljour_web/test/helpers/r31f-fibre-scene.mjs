// Drawn r31f fibre scene, the same as api/tests/r31f_fibre_scene.py: a striped hair block
// with a visible scalp patch; no photographs. Author: John Khan.
import { requireShade } from "../../dist/js/engines/hair_palette/index.js";
import { fibreReading } from "../../dist/js/commerce/shade-support.js";

export const SIZE = 96;
export const SWATCH = "natural-04-n";
export const HEAD = { left_temple: [.28, .34], right_temple: [.72, .34], crown: [.5, .11],
  left_ear: [.24, .59], right_ear: [.76, .59], nape: [.5, .83] };
const inside = (x, y, [x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1;

export function scene(alpha = false) {
  const channels = alpha ? 4 : 3, n = SIZE * SIZE;
  const data = new Uint8Array(n * channels);
  const region = new Float64Array(n), scalp = new Float64Array(n);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    let rgb = [205, 177, 145];
    if (inside(x, y, [22, 12, 74, 62])) {
      region[i] = 1;
      rgb = [70, 52 + (Math.floor(x / 2) % 4), 40];
    }
    if (inside(x, y, [28, 39, 69, 59])) {
      scalp[i] = 1;
      rgb = [196, 154, 124];
    }
    data.set(rgb, i * channels);
    if (alpha) data[i * channels + 3] = 255;
  }
  const mask = (values) => ({ width: SIZE, height: SIZE, channels: 1, data: values });
  return { image: { width: SIZE, height: SIZE, channels, data }, region: mask(region), scalp: mask(scalp) };
}

export function readings(offsets = [-0.3, 0.3], mode = "neutral", swatch = SWATCH) {
  const lab = requireShade(swatch).lab;
  return offsets.map((d) => fibreReading([lab[0] + d, lab[1], lab[2]], mode));
}

export function allowedOf({ region, scalp }) {
  return Uint8Array.from(region.data, (v, i) => v >= .5 && scalp.data[i] >= .5 ? 1 : 0);
}
