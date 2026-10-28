/** Audited Quality Generator export: release only, labelled, scrubbed. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { cpuResizer, renderQuality } from "../../../../dist/js/engines/upscale/quality-generator.js";
import { checkQualityAudit, exportQualityRender } from "../../../../dist/js/engines/upscale/quality-export.js";
import { planFixedTier } from "../../../../dist/js/engines/upscale/quality-tier.js";
import { hasMetadata } from "../../../../dist/js/save/export.js";

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x45, 0x78, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = (calls = []) => ({ calls, encode: async (pixels, options) => { calls.push(options); return JPEG; } });

async function release(extra = {}) {
  const source = { width: 480, height: 270, data: new Uint8ClampedArray(480 * 270 * 4).fill(128) };
  const mask = new Uint8Array(480 * 270);
  mask.fill(255, 2000, 4000);
  return renderQuality(source, { mask, confirmed: true }, planFixedTier(480, 270),
    { detailLevel: 3, lockLevel: 5 }, { resizer: cpuResizer, ...extra });
}

test("a release exports with the label on and metadata removed", async () => {
  const calls = [];
  const file = await exportQualityRender(await release(), "BELJOUR_HD1080", {}, encoder(calls));
  assert.equal(file.name, "BELJOUR_HD1080.jpg");
  assert.equal(calls[0].label, "Simulation");
  assert.equal(hasMetadata(new Uint8Array(await file.blob.arrayBuffer())), false);
  const plain = await exportQualityRender(await release(), "Plain", { simulationLabel: false }, encoder());
  assert.equal(plain.label, null);
});

test("previews and edited or mismatched audits are refused", async () => {
  await assert.rejects(exportQualityRender(await release({ release: false }), "x", {}, encoder()), /preview/);
  const render = await release();
  const cases = [
    [{ ...render, audit: { ...render.audit, label: "Better than the reference app" } }, /label/],
    [{ ...render, audit: { ...render.audit, tier: "uhd4k", width: 3840, height: 2160 } }, /tier/],
    [{ ...render, audit: { ...render.audit, protectedPixels: 10 ** 9 } }, /fit/],
    [{ ...render, audit: { ...render.audit, lockLevel: 7 } }, /levels/],
    [{ ...render, audit: { ...render.audit, extra: 1 } }, /complete/],
    [{ ...render, audit: { ...render.audit, noPerson: true } }, /no-person/],
    [{ ...render, image: { ...render.image, width: 1080, height: 1920 } }, /frame/],
    [{ image: render.image }, /complete/],
  ];
  for (const [value, pattern] of cases) assert.throws(() => checkQualityAudit(value), pattern);
});
