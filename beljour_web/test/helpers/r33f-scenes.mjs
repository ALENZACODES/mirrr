// Drawn r33f shade scenes, the same as api/tests/r33f_shade_scenes.py: a symmetric face,
// a 16-pixel grey card at (4, 4) and optional unit-luminance light. Author: John Khan.
import { decode, encode, labToSrgb, toByte } from "../../dist/js/engines/shade/colourspace.js";
import { zoneMasks } from "../../dist/js/engines/shade/finder.js";
import { symmetricFace } from "../../dist/js/engines/local/face-synthetic.js";
import { CASTS } from "../../dist/js/engines/shade/reference-study.js";

export const WIDTH = 160, HEIGHT = 192;
export const POINTS = symmetricFace(WIDTH, HEIGHT, 88, 126);
export const ZONES = zoneMasks(POINTS, WIDTH, HEIGHT);
export const SKIN = [63, 13.29, 17.64]; // LG-07N
export const NEXT_SKIN = [60, 13.79, 18.3]; // LG-08N
export const WARM = CASTS.warm_light_checked_neutral;
export const COOL = CASTS.cool_light_checked_neutral;
const inSquare = (i, size, top = 4) => {
  const x = i % WIDTH, y = Math.floor(i / WIDTH);
  return x >= 4 && x < 4 + size && y >= top && y < 4 + size;
};

export const card = (size = 16) => Uint8Array.from({ length: WIDTH * HEIGHT }, (_, i) => inSquare(i, size) ? 1 : 0);

export function paint(data, mask, lab) {
  const rgb = labToSrgb(lab).map(toByte);
  mask.forEach((on, i) => { if (on) data.set(rgb, i * 3); });
}

export function scene({ skin = SKIN, cast = null, cardRgb = 128, lowerRgb = null } = {}) {
  const data = new Uint8Array(WIDTH * HEIGHT * 3).fill(128);
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    if (inSquare(i, 16)) data.fill(lowerRgb !== null && inSquare(i, 16, 12) ? lowerRgb : cardRgb, i * 3, i * 3 + 3);
  }
  for (const mask of Object.values(ZONES)) paint(data, mask, skin);
  if (cast) for (let i = 0; i < data.length; i++) data[i] = toByte(encode(decode(data[i]) * cast[i % 3]));
  return { width: WIDTH, height: HEIGHT, channels: 3, data };
}
