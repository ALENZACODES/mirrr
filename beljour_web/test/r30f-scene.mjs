/** Drawn hair scene shared by the r30f fibre-colour browser tests: no photographs.
 * Author: John Khan.
 */
import { decode, encode, toByte } from "../dist/js/engines/shade/colourspace.js";

export const WARM = [1.18, 1, 0.72], COOL = [0.8, 0.97, 1.25], DAY = [1, 1, 1];

/** Grey card on the left third, a lightly striped hair patch elsewhere, under one cast. */
export function drawnHair(cast, hair = [92, 66, 48], width = 30, height = 20) {
  const data = new Uint8Array(width * height * 3), hairMask = new Uint8Array(width * height);
  const card = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x, isCard = x < Math.floor(width / 3);
      card[i] = isCard ? 1 : 0;
      hairMask[i] = isCard ? 0 : 1;
      const shift = ((x * 7 + y * 3) % 9) - 4;
      const rgb = isCard ? [150, 150, 150] : hair.map((v) => v + shift);
      for (let c = 0; c < 3; c++) data[i * 3 + c] = toByte(encode(decode(rgb[c]) * cast[c]));
    }
  }
  return { image: { width, height, channels: 3, data }, hair: hairMask, card };
}
