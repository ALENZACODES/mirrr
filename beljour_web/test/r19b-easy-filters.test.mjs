// R19B Lane B EASY filters: Python/TypeScript parity and identity locks. Author: John Khan.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";

import * as Bridal from "../dist/js/filters/easy/bridal.js";
import * as Eye from "../dist/js/filters/easy/eye-colour.js";
import * as Fun from "../dist/js/filters/easy/fun.js";
import * as Glasses from "../dist/js/filters/easy/glasses.js";
import * as Retro from "../dist/js/filters/easy/retro.js";
import * as Summer from "../dist/js/filters/easy/summer.js";

const V = JSON.parse(readFileSync(new URL("../../parity/r19b-easy-filters.json", import.meta.url), "utf8"));
const bytes = value => new Uint8ClampedArray(Buffer.from(value, "base64"));
const mask = value => new Uint8Array(Buffer.from(value, "base64"));
const point = value => ({ x: value[0], y: value[1] });
const hash = value => createHash("sha256").update(value).digest("hex");
const maxGap = (left, right) => {
  let gap = 0;
  for (let i = 0; i < left.length; i += 1) gap = Math.max(gap, Math.abs(left[i] - right[i]));
  return gap;
};
const unchanged = (before, after, region) => {
  for (let i = 0; i < region.length; i += 1) {
    if (region[i] === 0) continue;
    for (let c = 0; c < 4; c += 1) assert.equal(after[i * 4 + c], before[i * 4 + c]);
  }
};

const image = bytes(V.image);
const M = Object.fromEntries(Object.entries(V.masks).map(([key, value]) => [key, mask(value)]));
const P = Object.fromEntries(Object.entries(V.points).map(([key, value]) => [key, point(value)]));

function expectParity(name, actual) {
  const expected = bytes(V.outputs[name].bytes);
  assert.ok(maxGap(actual, expected) <= V.tolerance.byte, `${name} parity gap`);
  assert.equal(hash(actual), V.outputs[name].sha256, `${name} exact hash`);
}

test("retro photo treatment matches Python and keeps iris/identity pixels", () => {
  const out = Retro.renderRetro(image, V.width, V.height, { strength: .68, grain: .32, backdrop: .22, seed: 31 }, M.protected, M.background, M.iris);
  expectParity("retro", out);
  unchanged(image, out, M.protected);
  unchanged(image, out, M.iris);
});

test("local eye colour matches Python and preserves pupil plus catchlight", () => {
  const out = Eye.renderEyeColour(image, V.width, V.height, M.iris, M.pupil, M.highlight, { colour: [88, 126, 144], amount: .70 }, M.protected);
  expectParity("eye_colour", out);
  unchanged(image, out, M.pupil);
  unchanged(image, out, M.highlight);
  unchanged(image, out, M.protected);
});

test("front-view frames match Python and preserve iris colour", () => {
  const out = Glasses.renderGlasses(image, V.width, V.height, P.left_eye, P.right_eye, { style: "round", colour: [44, 39, 37], scale: 1.02, thickness: .055 }, M.iris, M.protected);
  expectParity("glasses", out);
  unchanged(image, out, M.iris);
});

test("original ears/tongue artwork matches Python", () => {
  const out = Fun.renderFun(image, V.width, V.height, P.left_eye, P.right_eye, P.nose, P.mouth, { amount: .92, mouthOpen: .72 }, M.iris, M.protected);
  expectParity("fun", out);
  unchanged(image, out, M.iris);
});

test("tongue is gated by mouth openness", () => {
  const closed = Fun.renderFun(image, V.width, V.height, P.left_eye, P.right_eye, P.nose, P.mouth, { amount: 1, mouthOpen: .1 }, M.iris);
  const open = Fun.renderFun(image, V.width, V.height, P.left_eye, P.right_eye, P.nose, P.mouth, { amount: 1, mouthOpen: .8 }, M.iris);
  assert.notDeepEqual(open, closed);
});

test("summer glow matches Python and does not brighten skin average", () => {
  const out = Summer.renderSummer(image, V.width, V.height, M.skin, { undertone: "olive", amount: .30, freckles: .65, seed: 27 }, M.cheek_nose, M.iris, M.protected);
  expectParity("summer", out);
  let before = 0; let after = 0; let n = 0;
  for (let i = 0; i < M.skin.length; i += 1) {
    if (M.skin[i] === 0) continue;
    for (let c = 0; c < 3; c += 1) { before += image[i * 4 + c]; after += out[i * 4 + c]; }
    n += 3;
  }
  assert.ok(after / n <= before / n + .01);
  unchanged(image, out, M.iris);
  unchanged(image, out, M.protected);
});

test("ceremony bundle and flash check match Python", () => {
  const out = Bridal.renderBridal(image, V.width, V.height, M.skin, M.lips, M.eyes, M.cheeks, { complexion: .14, lip: .34, eye: .24, cheek: .16 }, M.iris, M.protected);
  expectParity("bridal", out);
  const report = Bridal.flashCheck(out, M.skin, M.lips);
  assert.ok(Math.abs(report.daylightDrift - V.flash.daylight) <= V.tolerance.float);
  assert.ok(Math.abs(report.venueDrift - V.flash.venue) <= V.tolerance.float);
  assert.ok(Math.abs(report.flashDrift - V.flash.flash) <= V.tolerance.float);
  assert.equal(report.passed, V.flash.passed);
  unchanged(image, out, M.iris);
  unchanged(image, out, M.protected);
});

test("all six labels are plain one-line original names", () => {
  const labels = [Retro.LABEL, Eye.LABEL, Glasses.LABEL, Fun.LABEL, Summer.LABEL, Bridal.LABEL];
  const names = labels.map(label => label.split(" — ", 1)[0]);
  assert.deepEqual(names, ["Archive Flash", "Iris Tint", "Atelier Frames", "Playful Paws", "Sunlit Skin", "Ceremony Light Check"]);
  for (const label of labels) {
    assert.equal(label.includes("\n"), false);
    assert.ok(label.length >= 20 && label.length <= 120);
  }
});

test("machine-readable pass definitions stay complete and strict", async () => {
  const E = await import("../dist/js/filters/easy/evaluation.js");
  assert.deepEqual(E.validateDefinitions(), []);
  assert.equal(E.PASS_DEFINITIONS.length, 6);
  for (const item of E.PASS_DEFINITIONS) {
    assert.equal(item.protectedUnchanged, 1);
    assert.equal(item.alphaUnchanged, 1);
  }
});

test("identity evaluator accepts retro and rejects missing iris evidence", async () => {
  const E = await import("../dist/js/filters/easy/evaluation.js");
  const out = Retro.renderRetro(image, V.width, V.height, Retro.DEFAULT_RETRO, M.protected, M.background, M.iris);
  const pass = E.evaluate("archive_flash", image, out, M.protected, M.iris);
  assert.equal(pass.passed, true);
  assert.equal(pass.metrics.protectedUnchanged, 1);
  assert.equal(pass.metrics.irisUnchanged, 1);
  const missing = E.evaluate("archive_flash", image, out, M.protected);
  assert.equal(missing.passed, false);
  assert.ok(missing.failures.includes("iris evidence missing"));
});

test("identity evaluator reserves iris changes for Iris Tint", async () => {
  const E = await import("../dist/js/filters/easy/evaluation.js");
  const out = Eye.renderEyeColour(image, V.width, V.height, M.iris, M.pupil, M.highlight, Eye.DEFAULT_EYE_COLOUR, M.protected);
  const result = E.evaluate("iris_tint", image, out, M.protected);
  assert.equal(result.passed, true);
  assert.equal(result.metrics.irisUnchanged, null);
});

test("catalogue maps exactly the six built and two skipped gap rows", async () => {
  const C = await import("../dist/js/filters/easy/catalogue.js");
  assert.deepEqual(C.validateCatalogue(), []);
  assert.deepEqual(C.FILTERS.map(item => item.gapRow), [14, 20, 25, 26, 27, 30]);
  assert.deepEqual(C.SKIPPED.map(item => item.gapRow), [4, 28]);
  assert.ok(C.FILTERS.every(item => item.provider === "local" && item.adultOnly));
});

test("catalogue reserves eye-colour change policy for Iris Tint", async () => {
  const C = await import("../dist/js/filters/easy/catalogue.js");
  for (const item of C.FILTERS) {
    const expected = item.filterId === "iris_tint" ? "change_iris_preserve_marks" : "preserve_iris_and_marks";
    assert.equal(item.identityPolicy, expected);
    assert.equal(C.byId(item.filterId), item);
    assert.equal(C.byGapRow(item.gapRow), item);
  }
  assert.throws(() => C.byGapRow(4), /not built/);
});
