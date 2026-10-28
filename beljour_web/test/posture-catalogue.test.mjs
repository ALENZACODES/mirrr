/** Byte-identical seven-fix catalogue; no actual people or provider calls. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as Po from "../dist/js/engines/local/posture.js";

const P = JSON.parse(readFileSync(new URL("../../parity/posture-catalogue-r25e.json", import.meta.url), "utf8"));
const entries = Po.postureFixes();

test("J10-J16 catalogue matches Python's canonical JSON bytes", () => {
  assert.equal(P.format, "beljour-posture-catalogue-r25e/1");
  assert.equal(P.synthetic_only, true);
  assert.equal(JSON.stringify(entries), P.canonical_json);
  assert.deepEqual(entries, P.fixes);
});

test("seven unique operational entries include view, pins, moves and simulation label", () => {
  assert.deepEqual(entries.map((e) => e.id), ["J10", "J11", "J12", "J13", "J14", "J15", "J16"]);
  assert.equal(new Set(entries.map((e) => e.fix)).size, 7);
  assert.equal(entries.filter((e) => e.view === "front").length, 2);
  assert.equal(entries.filter((e) => e.view === "side").length, 5);
  for (const e of entries) {
    assert.equal(e.available, true);
    assert.equal(e.label, "Simulation. Photo edit only, not medical advice.");
    assert.ok(e.name && e.moves.length && e.pins.length);
    assert.deepEqual(e.moves.filter((p) => e.pins.includes(p)), []);
  }
});

test("front-only/side-only work refuses the wrong photo with a coded reason", () => {
  const front = Po.makeControls("front", {
    right_shoulder: [35, 45], left_shoulder: [85, 45], right_hip: [45, 110], left_hip: [75, 110],
    mid_chest: [60, 65], navel: [60, 90],
  }, 128, 160);
  const side = Po.makeControls("side", {
    ear: [70, 20], neck_base: [67, 30], shoulder: [63, 45], mid_back: [57, 80],
    hip: [60, 110], knee: [62, 140],
  }, 128, 160, 1);
  for (const e of entries) {
    const wrong = e.view === "front" ? side : front;
    assert.throws(() => Po.requirePostureView(wrong, e.fix), (error) =>
      error instanceof Po.PostureRefusal && error.code === "view_required");
  }
  assert.equal(Po.requirePostureView(front, "lean").id, "J10");
  assert.equal(Po.requirePostureView(side, "forward_head").id, "J13");
});

test("catalogue prevents viewing preliminary 2D results as diagnosis", () => {
  assert.match(entries.find((e) => e.id === "J16").reason, /not.*inferred/);
  assert.match(entries.find((e) => e.id === "J15").reason, /not measured/);
  for (const e of entries) {
    assert.ok(!e.name.toLowerCase().includes("medical"));
    assert.match(e.label, /Simulation/);
    assert.match(e.label, /not medical advice/);
  }
});
