// UI endpoints must be supported by the actual artistic dispatch. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { CONTROLS, initialControls } from "../dist/js/ui/eyes-brows/controls.js";
import { featureById } from "../dist/js/ui/eyes-brows/catalogue.js";
import { renderJob } from "../dist/js/ui/eyes-brows/render.js";
import { fixture } from "./artistic-helpers.mjs";

const effects = ["ink-study", "pigment-oil", "rain-expression", "meadow-crown"];

function artJob(feature) {
  const { image, options } = fixture();
  return { id: 1, image, landmarks: options.landmarks, feature, amount: 0.65, style: "", angle: 0,
    adultConfirmed: true, anatomy: { right: "open", left: "open" }, hairMask: options.hairMask,
    lashes: [], controls: initialControls(feature) };
}

for (const feature of effects) {
  for (const control of CONTROLS[feature]) {
    for (const edge of ["min", "max"]) {
      test(`${feature}: UI ${control.key} ${edge} reaches a working render`, () => {
        const job = artJob(feature);
        job.controls[control.key] = control[edge];
        const original = job.image.data.slice();
        const output = renderJob(job);
        assert.equal(output.pixels.length, job.image.data.length);
        assert.ok(output.pixels.every(Number.isFinite));
        assert.match(output.label, /simulation/);
        assert.deepEqual(job.image.data, original);
      });
    }
  }
  test(`${feature}: UI amount zero preserves every byte`, () => {
    const job = artJob(feature);
    job.amount = 0;
    assert.deepEqual(renderJob(job).pixels, job.image.data);
  });
}

test("Rain UI requires explicit adult confirmation at all strengths", () => {
  assert.equal(featureById("rain-expression").requiresAdult, true);
  for (const amount of [0, 0.5, 1]) {
    const job = artJob("rain-expression");
    job.adultConfirmed = false;
    job.amount = amount;
    assert.throws(() => renderJob(job), /Adult confirmation/);
  }
});

test("ink and crown UI bridges require observed hair and preserve protected hair", () => {
  for (const feature of ["ink-study", "meadow-crown"]) {
    const job = artJob(feature);
    assert.throws(() => renderJob({ ...job, hairMask: null }), /hair evidence/);
    job.amount = 1;
    const output = renderJob(job);
    for (let i = 0; i < job.hairMask.length; i++) {
      const locked = feature === "ink-study" ? job.hairMask[i] > 0 : job.hairMask[i] === 1;
      if (!locked) continue;
      for (let c = 0; c < 4; c++) assert.equal(output.pixels[i * 4 + c], job.image.data[i * 4 + c]);
    }
  }
});
