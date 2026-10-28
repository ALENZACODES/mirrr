/** Count-only local Save System proof tests. Drawn buffers only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { PROOF_CHECKS, PROOF_FORMAT, proveReplay, safeProof } from "../dist/js/save/proof.js";

function look(steps = [{ tool: "enhance", strength: 40, settings: { mode: "gentle" }, provider: "local" }]) {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-1234abcd",
    name: "Daily Review",
    created,
    versions: [{ version: 1, created, steps }],
  };
}

function frame(width = 7, height = 5, channels = 4) {
  const data = new Uint8Array(width * height * channels);
  for (let index = 0; index < data.length; index++) data[index] = (index * 11 + 19) % 256;
  return { width, height, channels, data };
}

const normal = {
  enhance: (p, step, dose) => {
    const data = new Uint8Array(p.data);
    for (let index = 0; index < data.length; index += p.channels) {
      data[index] = Math.min(255, data[index] + Math.round(step.strength * dose / 10));
    }
    return { ...p, data };
  },
};

test("complete local replay generates only registered count-only fields", () => {
  const source = frame();
  const before = new Uint8Array(source.data);
  const proof = proveReplay(look(), source, normal);
  assert.equal(proof.format, PROOF_FORMAT);
  assert.equal(proof.status, "PASS");
  assert.equal(proof.expectedSteps, 1);
  assert.equal(proof.executedSteps, 1);
  assert.equal(proof.skippedSteps, 0);
  assert.equal(proof.iterations, 2);
  assert.equal(proof.pixels, 35);
  assert.deepEqual(proof.checks.map((part) => part.check), [...PROOF_CHECKS]);
  assert(proof.checks.every((part) => part.status === "PASS"));
  assert.deepEqual(source.data, before);
  assert.deepEqual(safeProof(proof), proof);
  const serialized = JSON.stringify(proof);
  assert(!serialized.includes("filename"));
  assert(!serialized.includes("landmarks"));
  assert(!serialized.includes("imageData"));
  assert(!serialized.includes("face_id"));
  assert(!serialized.includes("Daily Review"));
});

test("deterministic replay also supports three-channel source", () => {
  const proof = proveReplay(look(), frame(8, 3, 3), normal);
  assert.equal(proof.status, "PASS");
  assert.equal(proof.pixels, 24);
});

test("a second identical engine succeeds when there are multiple steps", () => {
  const steps = [
    { tool: "enhance", strength: 10, settings: {}, provider: "local" },
    { tool: "enhance", strength: 20, settings: {}, provider: "local" },
    { tool: "enhance", strength: 30, settings: {}, provider: "local" },
  ];
  const proof = proveReplay(look(steps), frame(), normal);
  assert.equal(proof.status, "PASS");
  assert.equal(proof.expectedSteps, 3);
  assert.equal(proof.executedSteps, 3);
});

test("an unavailable local tool is UNPROVEN, never silently passed", () => {
  const proof = proveReplay(look(), frame(), {});
  assert.equal(proof.status, "UNPROVEN");
  assert.equal(proof.skippedSteps, 1);
  assert.equal(proof.executedSteps, 0);
  assert.equal(proof.checks.at(-1).reason, "step_unavailable");
});

test("a missing provider is UNPROVEN instead of replay success", () => {
  const step = { tool: "makeup", strength: 50, settings: {}, provider: "youcam" };
  const proof = proveReplay(look([step]), frame(), {});
  assert.equal(proof.status, "UNPROVEN");
  assert.equal(proof.skippedSteps, 1);
  assert.equal(proof.checks.at(-1).status, "UNPROVEN");
});

test("a disabled provider takes precedence over a present injected renderer", () => {
  let runs = 0;
  const step = { tool: "makeup", strength: 50, settings: {}, provider: "youcam" };
  const mock = { makeup(p) { runs++; return p; } };
  const proof = proveReplay(look([step]), frame(), mock);
  assert.equal(proof.status, "UNPROVEN");
  assert.equal(runs, 0);
});

test("an explicitly available, deterministic provider adapter can pass mechanics only", () => {
  const step = { tool: "makeup", strength: 50, settings: {}, provider: "youcam" };
  const proof = proveReplay(look([step]), frame(), { makeup: (p) => ({ ...p, data: new Uint8Array(p.data) }) }, {
    youcamAvailable: true,
  });
  assert.equal(proof.status, "PASS");
  assert.equal(proof.executedSteps, 1);
});

test("random or stateful transforms fail the repeatability check", () => {
  let calls = 0;
  const nondeterministic = {
    enhance(p) {
      const data = new Uint8Array(p.data);
      data[0] = calls++;
      return { ...p, data };
    },
  };
  const proof = proveReplay(look(), frame(), nondeterministic);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "replay_equal").reason, "different_replay");
  assert.equal(calls, 2);
});

test("alpha modification fails without exposing image content", () => {
  const engine = {
    enhance(p) {
      const data = new Uint8Array(p.data);
      data[3] = 0;
      return { ...p, data };
    },
  };
  const proof = proveReplay(look(), frame(), engine);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "alpha_preserved").reason, "alpha_changed");
  assert(!JSON.stringify(proof).includes('"data"'));
});

test("an engine that edits its captured source fails immutability", () => {
  const source = frame();
  const original = new Uint8Array(source.data);
  const engine = {
    enhance(p) {
      source.data[0] = 255;
      return { ...p, data: new Uint8Array(p.data) };
    },
  };
  const proof = proveReplay(look(), source, engine);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "source_unchanged").reason, "source_changed");
  assert.notDeepEqual(source.data, original);
});

test("an output that aliases the caller's buffer fails ownership", () => {
  const source = frame();
  const engine = { enhance: () => source };
  const proof = proveReplay(look(), source, engine);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "output_detached").reason, "output_alias");
});

test("unexpected resize fails closed", () => {
  const engine = {
    enhance(p) {
      return { ...p, width: p.width + 1, data: new Uint8Array(p.data) };
    },
  };
  const proof = proveReplay(look(), frame(), engine);
  assert.equal(proof.status, "FAIL");
  assert(proof.checks.some((part) => part.reason === "engine_error"));
});

test("exception messages remain redacted", () => {
  const engine = { enhance() { throw new Error("secret-face.jpg customer-123 private-data"); } };
  const proof = proveReplay(look(), frame(), engine);
  assert.equal(proof.status, "FAIL");
  assert(!JSON.stringify(proof).includes("customer-123"));
  assert(!JSON.stringify(proof).includes("secret-face"));
  assert(proof.checks.every((part) => part.reason === "engine_error"));
});

for (const [label, source] of [
  ["zero width", frame(0, 3)],
  ["zero height", frame(3, 0)],
  ["wrong channels", frame(3, 4, 2)],
  ["large dimensions", { width: 999999999, height: 999999999, channels: 4, data: new Uint8Array(4) }],
  ["wrong byte count", { width: 3, height: 3, channels: 4, data: new Uint8Array(3) }],
  ["nonintegral dimensions", { width: 3.1, height: 2, channels: 4, data: new Uint8Array(32) }],
]) {
  test(`input validation refuses ${label}`, () => {
    const proof = proveReplay(look(), source, normal);
    assert.equal(proof.status, "FAIL");
    assert.equal(proof.checks[0].reason, "invalid_input");
  });
}

test("source guard rejects an unexpectedly large buffer without rendering", () => {
  let called = false;
  const engine = { enhance() { called = true; throw new Error("should not run"); } };
  const proof = proveReplay(look(), frame(2, 2), engine, { maxPixels: 3 });
  assert.equal(proof.status, "FAIL");
  assert.equal(called, false);
});

for (const dose of [NaN, Infinity, -0.1, 1.1]) {
  test(`invalid local dose ${String(dose)} fails before executing an engine`, () => {
    let called = false;
    const proof = proveReplay(look(), frame(), { enhance(p) { called = true; return p; } }, { dose });
    assert.equal(proof.status, "FAIL");
    assert.equal(called, false);
  });
}

test("invalid version does not select the most recent version", () => {
  const proof = proveReplay(look(), frame(), normal, { version: 99 });
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.iterations, 0);
});

test("settings tampering cannot create a passing proof", () => {
  const raw = look();
  raw.versions[0].steps[0].strength = 9999;
  const proof = proveReplay(raw, frame(), normal);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.expectedSteps, 0);
});

test("safeProof rejects forged PASS claims", () => {
  const proof = proveReplay(look(), frame(), {});
  assert.equal(proof.status, "UNPROVEN");
  const forged = { ...proof, status: "PASS" };
  assert.throws(() => safeProof(forged), /contradicts/);
});

test("safeProof rejects photographic fields", () => {
  const proof = proveReplay(look(), frame(), normal);
  assert.throws(() => safeProof({ ...proof, photo: new Uint8Array([1, 2, 3]) }), /unregistered fields/);
  assert.throws(() => safeProof({ ...proof, file: "face.jpg" }), /unregistered fields/);
  assert.throws(() => safeProof({ ...proof, landmarks: [] }), /unregistered fields/);
});

test("safeProof rejects reordering and missing checks", () => {
  const proof = proveReplay(look(), frame(), normal);
  const reordered = structuredClone(proof);
  [reordered.checks[0], reordered.checks[1]] = [reordered.checks[1], reordered.checks[0]];
  assert.throws(() => safeProof(reordered), /registered order/);
  assert.throws(() => safeProof({ ...proof, checks: proof.checks.slice(1) }), /incomplete/);
});

test("safeProof rejects bogus success counts", () => {
  const proof = proveReplay(look(), frame(), normal);
  assert.throws(() => safeProof({ ...proof, skippedSteps: 2 }), /more steps/);
  assert.throws(() => safeProof({ ...proof, iterations: 1 }), /incomplete/);
  assert.throws(() => safeProof({ ...proof, executedSteps: 0 }), /incomplete/);
});

test("safeProof checks reason and status consistency", () => {
  const proof = proveReplay(look(), frame(), normal);
  const forged = structuredClone(proof);
  forged.checks[0].reason = "source_changed";
  assert.throws(() => safeProof(forged), /contradicts/);
  forged.checks[0].reason = "ok";
  forged.checks[1].status = "FAIL";
  assert.throws(() => safeProof(forged), /contradicts/);
});

test("a valid proof JSON round-trip remains count-only", () => {
  const first = proveReplay(look(), frame(), normal);
  const again = safeProof(JSON.parse(JSON.stringify(first)));
  assert.deepEqual(first, again);
  assert.equal(again.pixels, 35);
});

test("a one-time source alias cannot be hidden by a later detached replay", () => {
  const source = frame();
  let calls = 0;
  const engine = {
    enhance(p) {
      calls++;
      if (calls === 1) return source;
      return { ...p, data: new Uint8Array(p.data) };
    },
  };
  const proof = proveReplay(look(), source, engine);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "output_detached").reason, "output_alias");
});

test("a shared scratch buffer rewritten on replay is caught by first-pass snapshots", () => {
  const source = frame();
  let calls = 0;
  const scratch = new Uint8Array(source.data.length);
  const engine = {
    enhance(p) {
      scratch.set(p.data);
      scratch[0] = calls++;
      return { ...p, data: scratch };
    },
  };
  const proof = proveReplay(look(), source, engine);
  assert.equal(proof.status, "FAIL");
  assert.equal(proof.checks.find((part) => part.check === "replay_equal").reason, "different_replay");
});
