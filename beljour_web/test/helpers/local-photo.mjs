// Original synthetic pixels and measured mesh for local-screen interaction tests.
// No photograph, fixture face or network. Author: John Khan.
import { symmetricFace } from '../../dist/js/engines/local/face-synthetic.js';
import { Element } from './dom.mjs';
export function localPhoto() {
  const width = 320, height = 384, data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4, grain = ((x * 17 + y * 31) % 19) - 9;
    data[i] = 150 + x / 5 + grain; data[i + 1] = 115 + y / 9 + grain; data[i + 2] = 100 + grain;
    data[i + 3] = 255;
  }
  const image = { width, height, channels: 4, data };
  const points = symmetricFace(width, height, width * .55, height * .66).map(([x, y]) => ({ x: x / width, y: y / height, z: 0 }));
  const context = { consent: true, photo: null, photoSrc: 'blob:original-drawn-photo', face: { points, blendshapes: {} },
    size: { w: width, h: height }, shade: null, tryon: {}, faceShape: null, body: null,
    go(route) { this.redirected = route; }, refreshPhotoPanel() {} };
  const rendered = [], reads = [];
  const dependencies = { async read(source) { reads.push(source); return image; }, paint(output, label) {
    rendered.push({ image: output, label }); const figure = new Element('figure'); figure.textContent = `Local simulation. ${label}`; return figure;
  } };
  return { image, context, dependencies, rendered, reads };
}
