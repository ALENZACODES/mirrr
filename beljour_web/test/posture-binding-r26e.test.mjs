/** R26E screen binding: frames reach onFrame only after the final-pixel gate passes.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { REFUSED_OUTPUT_MESSAGE, checkedPostureRender, installPostureScreen,
  publicPostureError } from "../dist/js/body/posture-binding.js";
import { PostureOutputRefused, inspectPostureOutput } from "../dist/js/body/posture-output.js";
import { drawnPostureFrame, echoGuard, settle, withFakeDocument } from "./posture-dom-fake.mjs";

const DIGEST = "c".repeat(64);
const photoOf = (frame, view) => ({ digest: DIGEST, width: frame.image.width, height: frame.image.height, view,
  personMask: true, headMask: true });

test("drag previews are bounded and release frames pass the output gate", () => withFakeDocument(async (document) => {
  const frame = await drawnPostureFrame("side");
  const frames = [], errors = [];
  const screen = installPostureScreen(document.createElement("div"), {
    resolveFrame: (digest) => { assert.equal(digest, DIGEST); return frame; },
    identityGuard: echoGuard(0.99), onFrame: (item) => frames.push(item), onError: (message) => errors.push(message),
  });
  screen.setPhoto(photoOf(frame, "side"));
  screen.panel.element.button("J14").click();
  await settle();
  const level = screen.panel.element.byTag("input")[0];
  level.input("5", "change");
  await settle();
  assert.deepEqual(errors, []);
  assert.deepEqual(frames.map((item) => item.stage), ["preview", "release"]);
  for (const item of frames) {
    assert.equal(item.inspection.passed, true);
    assert.equal(item.inspection.headChanged, 0);
    assert.equal(item.inspection.outsideBandChanged, 0);
  }
  assert.equal(screen.latest().stage, "release");
  screen.dispose();
}));

test("a frame for another photo size is refused with fixed copy", () => withFakeDocument(async (document) => {
  const frame = await drawnPostureFrame("side");
  const errors = [];
  const screen = installPostureScreen(document.createElement("div"), {
    resolveFrame: () => frame, identityGuard: null, onFrame: () => assert.fail("must not render"),
    onError: (message) => errors.push(message),
  });
  screen.setPhoto({ ...photoOf(frame, "side"), width: frame.image.width + 2 });
  screen.panel.element.button("J14").click();
  await settle();
  assert.deepEqual(errors, ["This posture edit could not be made."]);
  screen.dispose();
}));

test("the gate refuses a result whose final pixels changed the head", async () => {
  const frame = await drawnPostureFrame("front");
  const request = { fix: "uneven_shoulders", level: 5, lockLevel: 5, stage: "release" };
  const good = checkedPostureRender(frame, request, null);
  assert.equal(good.inspection.passed, true);
  const tampered = { ...good.result, image: { ...good.result.image, data: new Uint8Array(good.result.image.data) } };
  const headPixel = frame.head.data.findIndex((value) => value >= 0.5);
  tampered.image.data[headPixel * 3] ^= 255;
  const report = inspectPostureOutput(good.frame.image, tampered, good.frame.head);
  assert.deepEqual(report.reasons, ["protected_head_changed"]);
  assert.match(publicPostureError(new PostureOutputRefused(report.reasons)), new RegExp(REFUSED_OUTPUT_MESSAGE));
});

test("export needs a released frame of the current photo", () => withFakeDocument(async (document) => {
  const frame = await drawnPostureFrame("side");
  const screen = installPostureScreen(document.createElement("div"), {
    resolveFrame: () => frame, identityGuard: null, onFrame: () => {}, onError: () => {},
  });
  screen.setPhoto(photoOf(frame, "side"));
  await assert.rejects(screen.export(), /Release a full-size edit/);
  screen.panel.element.button("J14").click();
  screen.panel.element.byTag("input")[0].input("4", "change");
  await settle();
  const encoder = { async encode() { return new Uint8Array([255, 216, 255, 218, 0, 2, 0, 7, 255, 217]); } };
  const saved = await screen.export({}, encoder);
  assert.equal(saved.name, "Posture_J14.jpg");
  screen.setPhoto({ ...photoOf(frame, "side"), digest: "d".repeat(64) });
  await assert.rejects(screen.export({}, encoder), /Release a full-size edit/);
  screen.dispose();
  await assert.rejects(screen.export({}, encoder), /disposed/);
}));
