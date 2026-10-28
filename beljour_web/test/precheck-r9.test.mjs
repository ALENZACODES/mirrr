// R9 photo pre-check: measurements on drawn degradations with known answers. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../dist/js/ui/shell/precheck.js";
import { scene, addNoise, lowLight, blur, motionBlur, cast } from "../dist/js/engines/local/enhance.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";

const level = (report, id) => report.checks.find((c) => c.id === id)?.level;
function solid(width, height, rgb) {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) data.set(rgb, i * 3);
  return { width, height, channels: 3, data };
}

test("a clean drawn scene is ready for local editing, and every check carries plain words", () => {
  const report = P.precheck(scene(640, 520));
  assert.equal(report.version, P.PRECHECK_VERSION);
  assert.equal(report.verdict, "ready");
  for (const id of ["size", "shape", "light", "highlights", "sharpness", "noise", "colour", "compression"]) assert.equal(level(report, id), "pass", id);
  assert.ok(report.checks.every((c) => c.message.length > 8 && c.title.length > 2));
  assert.ok(Math.max(report.analysed.width, report.analysed.height) <= P.PRECHECK_LIMITS.analysisSide);
  assert.equal(P.summarise(report), `${report.checks.length} of ${report.checks.length} checks passed.`);
});

test("dark, grainy, blurred, shaken and tinted photos each raise the matching warning", () => {
  const base = scene(512, 416);
  assert.equal(level(P.precheck(lowLight(base, 0.2)), "light"), "warn");
  assert.equal(level(P.precheck(addNoise(base, 14, 3)), "noise"), "warn");
  assert.equal(level(P.precheck(blur(base, 4)), "sharpness"), "warn");
  const shaken = P.precheck(motionBlur(base, 15, 1));
  assert.equal(level(shaken, "sharpness"), "warn");
  assert.match(shaken.checks.find((c) => c.id === "sharpness").message, /shaken|focus/);
  assert.equal(level(P.precheck(cast(base, [1.6, 1.0, 0.55])), "colour"), "warn");
  const dark = P.precheck(lowLight(base, 0.2));
  assert.equal(dark.verdict, "warn");
  assert.match(P.summarise(dark), /to look at/);
});

test("blank, tiny and very long photos are blocked for the uses they can't support", () => {
  const blank = P.precheck(solid(400, 400, [128, 128, 128]));
  assert.equal(blank.verdict, "blocked"); assert.equal(level(blank, "content"), "block");
  const tiny = P.precheck(scene(200, 160), { purpose: "styling" });
  assert.equal(level(tiny, "size"), "block");
  assert.equal(level(P.precheck(scene(200, 160)), "size"), "warn", "small is fine on the device, just less fine");
  assert.equal(level(P.precheck(scene(40, 40)), "size"), "block");
  const strip = P.sizeChecks(1600, 400, "styling");
  assert.equal(strip.find((c) => c.id === "shape").level, "block");
  assert.equal(P.sizeChecks(1600, 400, "local").find((c) => c.id === "shape").level, "warn");
  assert.match(P.summarise(blank), /Can't use this photo/);
});

test("file facts: only JPEG, PNG or WebP under 15 MB", () => {
  assert.equal(P.fileCheck(undefined), null);
  assert.equal(P.fileCheck({ type: "image/png", bytes: 1000 }).level, "pass");
  assert.equal(P.fileCheck({ type: "image/gif", bytes: 1000 }).level, "block");
  assert.equal(P.fileCheck({ type: "image/jpeg", bytes: 0 }).level, "block");
  assert.equal(P.fileCheck({ type: "image/webp", bytes: 16 * 1024 * 1024 }).level, "block");
  const r = P.precheck(scene(600, 500), { file: { type: "image/heic", bytes: 1 } });
  assert.equal(r.verdict, "blocked");
});

test("face framing runs only on a recorded fixture; styling without one says it isn't checked", () => {
  const portrait = makeSample("portrait");
  const withFace = P.precheck(portrait.image, { face: portrait.face });
  const faceRows = withFace.checks.filter((c) => c.id.startsWith("face-"));
  assert.ok(faceRows.length >= 3);
  assert.ok(faceRows.every((c) => c.level === "pass"), "the drawn portrait is centred, level and frontal");
  const styling = P.precheck(portrait.image, { purpose: "styling" });
  const face = styling.checks.find((c) => c.id === "face");
  assert.equal(face.level, "warn"); assert.equal(face.value, "not checked");
  assert.equal(P.faceChecks(portrait.face.slice(0, 10), 272, 336)[0].level, "warn");
});

test("pre-check is deterministic, records its ASSUMED limits and rejects odd purposes", () => {
  const img = addNoise(scene(300, 260), 5, 2);
  assert.deepEqual(P.precheck(img), P.precheck(img));
  const r = P.precheck(img);
  assert.equal(r.limits.minSideStyling, 320);
  assert.ok(Object.isFrozen(P.PRECHECK_LIMITS));
  assert.ok("noise_sigma" in r.measured && "ev_offset" in r.measured);
  assert.throws(() => P.precheck(img, { purpose: "medical" }), /purpose/);
});
