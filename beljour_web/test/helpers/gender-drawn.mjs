// Same 2D head and hard-edged pixels as the existing Python drawn_head fixture.
// The Python-only synthetic depth noise is irrelevant to this 2D render.
// Coordinates and colours are invented; no person or downloaded photo.
// Author: John Khan.
import { symmetricFace, rolledFace } from '../../dist/js/engines/local/face-synthetic.js';
import { regionMask } from '../../dist/js/data/regions/index.js';
import { byteImage } from '../../dist/js/engines/core/buffer.js';

export function drawnGenderHead(seed, width = 220, height = width) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 11) throw new RangeError('drawn seed must be 0..11');
  const faceWidth = width * (.60 + .03 * (seed % 3));
  const faceLength = height * (.66 + .02 * (seed % 4));
  let points = symmetricFace(width, height, faceWidth, faceLength).map(([x, y]) =>
    [x + (seed % 5 - 2) * .03 * width, y + (seed % 3 - 1) * .02 * height]);
  const roll = (seed % 7 - 3) * 2;
  if (roll) points = rolledFace(points, roll);
  const oval = regionMask('face_oval', points, width, height, { normalized: false, supersample: 2 });
  const image = byteImage(width, height, 3), tint = [1, .85 + .01 * seed, .7];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const stripes = (Math.floor(x / (6 + seed % 4)) % 2) * 70;
    const backdrop = y < height * .55 ? 200 - stripes : 30 + Math.floor(stripes / 2);
    const face = 150 + 25 * Math.sin(x / 9) + 15 * Math.cos(y / 7);
    const lum = oval.data[y * width + x] >= .5 ? face : backdrop;
    for (let c = 0; c < 3; c++) image.data[(y * width + x) * 3 + c] = Math.max(0, Math.min(255, Math.trunc(lum * tint[c])));
  }
  return { image, points, oval };
}
