/** Public short-sides render must change real pixels, never just concept records. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderStyleForFace } from "../dist/js/engines/menshair/public-render.js";
import { DEFAULT_ANCHORS } from "../dist/js/engines/menshair/render.js";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const catalogue = JSON.parse(readFileSync(resolve(root, "api/plumb_api/engines/menshair/presets.json"), "utf8"));

function scene(w = 96, h = 96) {
  const pixels = new Uint8Array(w * h * 4), mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, hair = ((x - 48) / 26) ** 2 + ((y - 33) / 26) ** 2 <= 1;
    mask[i] = hair ? 255 : 0;
    pixels.set(hair ? [56 + (x % 11), 34 + (y % 9), 27, 220] : [174, 135, 101, 220], i * 4);
  }
  return { pixels, mask, w, h };
}

test("all 18 original short-sides concepts truly render masked pixels", () => {
  const { pixels, mask, w, h } = scene();
  let changed = 0;
  for (const style of catalogue.styles.slice(0, 18)) {
    const output = renderStyleForFace(pixels, w, h, mask, DEFAULT_ANCHORS, style.id, 4, catalogue);
    assert.equal(output.rendered, true, style.id + ": " + output.reason);
    assert.ok(output.changedPixelShare > 0);
    assert.ok(output.sideRevealShare > 0);
    assert.equal(output.providerCalls, 0);
    changed++;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) assert.deepEqual(output.pixels.slice(i * 4, i * 4 + 4), pixels.slice(i * 4, i * 4 + 4));
      assert.equal(output.pixels[i * 4 + 3], pixels[i * 4 + 3]);
    }
  }
  assert.equal(changed, 18);
});

test("level-one identity, monotone side reveal and missing-mesh refusal", () => {
  const { pixels, mask, w, h } = scene();
  let last = -1;
  for (const level of [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
    const out = renderStyleForFace(pixels, w, h, mask, DEFAULT_ANCHORS, "local-high-fade", level, catalogue);
    assert.equal(out.rendered, true);
    assert.ok(out.sideRevealShare >= last);
    if (level === 1) assert.deepEqual(out.pixels, pixels);
    last = out.sideRevealShare;
  }
  const refused = renderStyleForFace(pixels, w, h, mask, null, "local-high-fade", 3, catalogue);
  assert.equal(refused.code, "no_mesh");
  for (const invalid of [.95, 5.1, 2.25, true]) {
    assert.throws(() => renderStyleForFace(pixels, w, h, mask, DEFAULT_ANCHORS, "local-high-fade", invalid, catalogue));
  }
});

test("public render equals Python committed vectors within one colour channel", () => {
  const fixture = JSON.parse(readFileSync(resolve(root, "parity/menshair-r26f.json"), "utf8"));
  const source = new Uint8Array(Buffer.from(fixture.source, "base64"));
  const hairMask = new Uint8Array(Buffer.from(fixture.mask, "base64"));
  const guard = { guard(_before, after, level) {
    assert.equal(level, 5);
    return { data: new Uint8Array(after), similarity: 1, blended: false };
  } };
  for (const row of fixture.cases) {
    const expected = new Uint8Array(Buffer.from(row.pixels, "base64"));
    const actual = renderStyleForFace(source, fixture.width, fixture.height, hairMask,
      fixture.anchors, row.id, row.level, catalogue, { guard });
    assert.equal(actual.rendered, true, row.id);
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff = Math.max(diff, Math.abs(expected[i] - actual.pixels[i]));
    assert.ok(diff <= 1, `${row.id}/${row.level}: maximum parity difference ${diff}`);
    assert.ok(Math.abs(actual.changedPixelShare - row.changed_pixel_share) <= .005);
  }
});
