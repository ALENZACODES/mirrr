// Synthetic-only R10 pose/consent/provider transport QA, checksum assets and arena trace.
// Always uses a fake transport and a temporary clock; never a network dependency.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as P from "../dist/js/ui/studios/hair/pose.js";
import * as K from "../dist/js/ui/shell/consent.js";
import * as M from "../dist/js/ui/studios/hair/model.js";
import * as V from "../dist/js/ui/studios/hair/variants.js";
import { performStyling } from "../dist/js/ui/styling-tasks.js";
import { Editor } from "../dist/js/ui/shell/controller.js";

const anchor = {
  33: [0.38, 0.38], 263: [0.62, 0.38], 1: [0.5, 0.51],
  10: [0.5, 0.16], 152: [0.5, 0.88], 234: [0.22, 0.48], 454: [0.78, 0.48],
};
const photo = (changes = {}) => {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [id, [x, y]] of Object.entries({ ...anchor, ...changes })) points[+id] = { x, y };
  return { points, width: 900, height: 1100, faceCount: 1 };
};
const testClock = () => {
  let now = 1_700_000_000_000;
  return { at: () => now, advance: (ms) => { now += ms; } };
};
const quote = { feature: "hair-transfer", scope: "youcam", units: 3, cached: false, can_apply: true, live: true };
const mockTransport = () => {
  const requests = [];
  return { requests, quote: async (body) => { requests.push(["quote", body]); return quote; },
    startTask: async (body) => { requests.push(["start", body]); return { status: "running", request_key: "key01", ticket: null }; },
    task: async (key) => { requests.push(["poll", key]); return { status: "done", request_key: key,
      image: "data:image/jpeg;base64,QUJD", provenance: { provider: "youcam", synthetic: false } }; } };
};

for (const [label, change, pass] of [
  ["frontal", {}, true],
  ["turned", { 1: [0.67, 0.51] }, false],
  ["tilted", { 263: [0.62, 0.52] }, false],
  ["border", { 234: [0.001, 0.48] }, false],
  ["tiny", { 33: [0.496, 0.38], 263: [0.504, 0.38] }, false],
  ["invalid", { 1: [Infinity, 0.51] }, false],
]) {
  test(`pose guard ${label}: expected ${pass ? "suitable" : "retake"}`, () => {
    const result = P.evaluateHairPose(photo(change));
    assert.equal(result.acceptable, pass);
    if (!pass) assert.ok(P.poseMessage(result).length > 15);
    assert.equal(result.faceCount, 1);
  });
}

test("missing landmark model and multiface fall back to a blocked preview", () => {
  assert.equal(P.poseDecision(P.evaluateHairPose({ ...photo(), points: null })), "blocked");
  assert.equal(P.poseDecision(P.evaluateHairPose({ ...photo(), faceCount: 3 })), "blocked");
  assert.equal(P.poseDecision(P.evaluateHairPose(photo({ 1: [0.68, 0.5] }))), "retake");
  assert.equal(P.poseDecision(P.evaluateHairPose(photo())), "ok");
});

test("a hand-drawn fixture suitability report must not approve a live real photo", () => {
  assert.ok(P.syntheticHairPose().acceptable);
  assert.equal(P.evaluateHairPose({ points: null, width: 640, height: 800, faceCount: 0 }).acceptable, false);
  assert.throws(() => P.evaluateHairPose({ ...photo(), width: 0 }), RangeError);
  assert.throws(() => P.evaluateHairPose({ ...photo(), faceCount: -1 }), RangeError);
  assert.equal(P.DEFAULT_POSE_LIMITS.roll, 14);
  assert.equal(P.DEFAULT_POSE_LIMITS.yawProxy, 0.3);
});

test("pose method is a clean-room geometry proxy, not a beauty metric or medical diagnosis", () => {
  const result = P.evaluateHairPose(photo());
  assert.equal(result.confidence, "geometric proxy");
  assert.ok(result.faceShare > 0.3);
  for (const forbidden of ["age", "gender", "ethnicity", "attractiveness", "beauty"]) {
    assert.ok(!Object.keys(result).includes(forbidden));
  }
});

test("reference transfer is inside existing hair scope, NEVER a new local provider", () => {
  assert.equal(K.scopeFor("hair-transfer"), "hair");
  assert.ok(K.STYLING_ACTIONS.includes("hair-transfer"));
  assert.throws(() => K.scopeFor("face-reshape"), RangeError);
  assert.throws(() => K.scopeFor("skin-analysis"), RangeError);
  assert.equal(K.scopeFor("makeup"), "makeup");
});

test("reference bytes and rights checkbox cannot bypass consent before quote or start", async () => {
  const clock = testClock();
  const gate = new K.ConsentGate(clock.at);
  const transport = mockTransport();
  const request = { photo_id: "photo0001", action: "hair-transfer",
    options: {}, reference_photo_id: "ref-0001", reference_rights: true };
  await assert.rejects(performStyling(transport, request, { consent: gate }), /Confirm you're 18/);
  assert.equal(transport.requests.length, 0);
  gate.acceptVisit({ adult: true, understood: true });
  await assert.rejects(performStyling(transport, request, { consent: gate }), /Tick/);
  assert.equal(transport.requests.length, 0);
  gate.grantPhoto("photo0001", ["hair"]);
  const result = await performStyling(transport, request, { consent: gate });
  assert.equal(result.status, "done");
  assert.deepEqual(transport.requests.map(([op]) => op), ["quote", "start", "poll"]);
  assert.equal(transport.requests[0][1].consent, undefined);
  assert.equal(transport.requests[1][1].consent.scope, "hair");
  assert.equal(transport.requests[1][1].reference_rights, true);
  assert.equal(transport.requests[1][1].reference_photo_id, "ref-0001");
});

test("reference consent expires and on-device mode disables even a quote", async () => {
  const clock = testClock();
  const gate = new K.ConsentGate(clock.at);
  const req = { photo_id: "photo0001", action: "hair-transfer", options: {} };
  const transport = mockTransport();
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["hair"]);
  gate.setLocalOnly(true);
  await assert.rejects(performStyling(transport, req, { consent: gate }), /On-device only/);
  assert.equal(transport.requests.length, 0);
  gate.setLocalOnly(false);
  gate.grantPhoto("photo0001", ["hair"]);
  clock.advance(K.PHOTO_CONSENT_MS + 1000);
  await assert.rejects(performStyling(transport, req, { consent: gate }), /expired/i);
  assert.equal(transport.requests.length, 0);
});

test("a blocked quote does not start a paid task even with hair consent", async () => {
  const gate = new K.ConsentGate();
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["hair"]);
  const tr = mockTransport();
  tr.quote = async (payload) => { tr.requests.push(["quote", payload]); return { ...quote, can_apply: false, unavailable_reason: "Styling is off" }; };
  await assert.rejects(performStyling(tr, { photo_id: "photo0001", action: "hair-transfer", options: {} }, { consent: gate }), /Styling is off/);
  assert.deepEqual(tr.requests.map(([op]) => op), ["quote"]);
});

test("the R8 editor owns hair navigation; no new editor history is fabricated", () => {
  const editor = new Editor("portrait");
  const before = editor.history.length;
  editor.selectStudio("hair-style");
  assert.equal(editor.document.studio, "hair-style");
  assert.equal(editor.history.length, before + 1, "navigation follows R8 editor history semantics");
  assert.equal(editor.document.layers.length, 0);
});

test("2x2 and 3x3 boards have distinct cells without inventing photographic variants", () => {
  for (const gridSize of [4, 9]) {
    const selected = M.HAIR_STYLES.slice(0, gridSize).map((s) => s.id);
    const board = V.variants({ gridSize, selected, strength: 25 });
    assert.equal(board.size, gridSize);
    assert.equal(board.tiles.length, gridSize);
    assert.equal(board.unrendered, gridSize);
    assert.equal(board.ready, 0);
    assert.ok(board.tiles.every((tile) => tile.provenance === "none"));
  }
});

test("arena hair ids remain Built / Not tested, not an invented PASS score", () => {
  const data = JSON.parse(readFileSync("../api/plumb_api/arena/features.json", "utf8"));
  for (const id of [14, 15, 16, 22]) {
    const feature = data.features.find((f) => f.id === id);
    assert.ok(feature);
    assert.equal(feature.status, "Built");
    assert.equal(feature.plan.state, "built");
    assert.match(feature.plan.note, /NOT tested/i);
    assert.equal(Object.hasOwn(feature, "score"), false);
    assert.equal(Object.hasOwn(feature, "scores"), false);
  }
});

test("the hair view links to existing Trust Centre, and both shells load one CSS asset", () => {
  const source = readFileSync("src/ui/studios/hair/view.ts", "utf8");
  const shell = readFileSync("src/ui/shell/view.ts", "utf8");
  const classic = readFileSync("src/screens/hair.ts", "utf8");
  assert.match(source, /trust\.html/);
  assert.match(shell, /hairStudio\.element/);
  assert.match(classic, /sendConsentBox\(/);
  assert.match(classic, /applyStyling\(/);
  assert.doesNotMatch(classic, /new YouCamClient\(/);
  assert.doesNotMatch(classic, /fetch\(/);
  for (const page of ["studio.html", "index.html", "dist/studio.html", "dist/index.html"]) {
    assert.ok(readFileSync(page, "utf8").includes('href="hair.css"'), page);
  }
  assert.ok(existsSync("dist/hair.css"));
  assert.ok(existsSync("dist/js/screens/hair.js"));
});

test("catalogue build check detects drift without regenerating a manifest", () => {
  const output = execFileSync("node", ["scripts/build-hair-catalogue.mjs", "--check"], { encoding: "utf8" });
  const authored = JSON.parse(readFileSync("../api/plumb_api/styling/catalogue.json", "utf8")).styles.length;
  assert.match(output, new RegExp(String(authored)));
});
