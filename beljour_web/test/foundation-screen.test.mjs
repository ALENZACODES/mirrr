// The Shade screen's local Foundation preview: after the on-device finder matches her shade,
// one tap shows that shade on her own drawn photo, never lighter, alpha and original kept,
// with coded messages when nothing changes. Drawn face from api/tests/goldens/local-makeup.json;
// no network, no photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installDOM, Element, buttonNamed } from "./helpers/dom.mjs";
import { localShadeSection, foundationSection } from "../dist/js/screens/shade-local.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";

const golden = JSON.parse(readFileSync(new URL("../../api/tests/goldens/local-makeup.json", import.meta.url)));
const face = golden.foundation.faces.medium;

/** The drawn face on a larger plain canvas, so every face point lies inside the photo. */
function drawn(pad = 16) {
  const rgb = Buffer.from(face.image, "base64"), width = face.width + 2 * pad, height = face.height + 2 * pad;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x, fx = x - pad, fy = y - pad;
    const inside = fx >= 0 && fy >= 0 && fx < face.width && fy < face.height;
    data.set(inside ? rgb.subarray((fy * face.width + fx) * 3, (fy * face.width + fx) * 3 + 3) : [96, 110, 124], i * 4);
    data[i * 4 + 3] = 200 + (i % 55);
  }
  const image = { width, height, channels: 4, data };
  const points = face.points.map(([x, y]) => ({ x: (x + pad) / width, y: (y + pad) / height, z: 0 }));
  const rendered = [];
  const preview = { async read() { return image; }, paint(output, label) {
    rendered.push({ image: output, label }); const figure = new Element("figure"); figure.textContent = label; return figure; } };
  return { image, points, rendered, preview, original: data.slice() };
}
function environment() {
  const dom = installDOM(), previous = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Local screen attempted a network request"); };
  return { restore() { dom.restore(); globalThis.fetch = previous; } };
}
const lightness = (d, i) => srgbToLab([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]])[0];

test("after a match, the Shade screen previews the foundation on her photo, never lighter", async () => {
  const env = environment(); try {
    const p = drawn();
    let matched = null;
    const section = localShadeSection("blob:drawn", p.points, async () => p.image, (r) => { matched = r; }, p.preview);
    await buttonNamed(section, "Find my shade on this device").click();
    assert.ok(matched && !matched.refused, "the finder matched the drawn face");
    const run = buttonNamed(section, "Preview this foundation on my photo");
    assert.ok(run, "the foundation preview is offered after a match");
    assert.equal(section.querySelector("#foundation-strength").value, "30", "gentle default coverage");
    await run.click();
    assert.equal(p.rendered.length, 1);
    const out = p.rendered[0].image.data;
    let changed = 0;
    for (let i = 0; i < p.image.width * p.image.height; i++) {
      assert.equal(out[i * 4 + 3], p.original[i * 4 + 3], "alpha kept");
      assert.ok(lightness(out, i) <= lightness(p.original, i) + 1e-9, `pixel ${i} got lighter`);
      if (out[i * 4] !== p.original[i * 4] || out[i * 4 + 1] !== p.original[i * 4 + 1] || out[i * 4 + 2] !== p.original[i * 4 + 2]) changed++;
    }
    assert.ok(changed > 100);
    assert.deepEqual(p.image.data, p.original, "the original is not changed");
    assert.match(p.rendered[0].label, new RegExp(`Foundation in ${matched.best.name}\\. .*never lighter`));
    assert.match(section.textContent, /Nothing was uploaded/);
  } finally { env.restore(); }
});

test("zero coverage and a refused shade leave the photo alone and say so", async () => {
  const env = environment(); try {
    const p = drawn();
    const result = { refused: false, measured_lab: face.measured_lab, best: face.best, alternative: face.alternative };
    const section = foundationSection("blob:drawn", p.points, result, p.preview);
    section.querySelector("#foundation-strength").value = "0";
    await buttonNamed(section, "Preview this foundation on my photo").click();
    assert.equal(p.rendered.length, 0);
    assert.match(section.textContent, /Strength is zero, so the photo is unchanged/);
    const lighter = { ...result, best: { ...face.best, lab: [face.measured_lab[0] + 4, face.measured_lab[1], face.measured_lab[2]] } };
    const refused = foundationSection("blob:drawn", p.points, lighter, p.preview);
    await buttonNamed(refused, "Preview this foundation on my photo").click();
    assert.equal(p.rendered.length, 0);
    assert.match(refused.textContent, /lighter than your skin reading, so it is not applied/);
    assert.match(refused.textContent, /Your photo was not changed/);
  } finally { env.restore(); }
});
