// R13 item 9: Skin match screen states, offline. The transport is a recording fake; the one
// test of the real API client mocks globalThis.fetch and checks the request it would send.
// No network, no units. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "../dist/js/screens/skin-match-model.js";

const PHOTO = "a".repeat(64);
const NOW = 1_800_000_000_000;

function result(over = {}) {
  return {
    photo_id: PHOTO,
    profile: { lightness: 48.2, a: 12.1, b: 24.3, hue_angle: 63.5, chroma: 27.1, depth: "tan", depth_label: "tan",
      undertone: "warm", undertone_label: "warm (golden)", pixels: 900, source: "Local estimate",
      note: "Measured from the centre of your photo." },
    concerns: [{ concern: "redness", label: "Redness", raw_score: 55.4, band: "worth focusing on" }],
    concerns_source: "YouCam Skin Analysis", source: "youcam", fallback: null, message: null,
    units_spent: 9, cached: false,
    products: [
      { id: "base-skin-tint:tan:warm", type: "Skin tint", name: "Skin tint, tan, golden", shade: "tan, golden", coverage: "sheer",
        why: "Evens tone.", for: "your measured depth and undertone", label: M.NOT_TESTED },
      { id: "correct-green-primer", type: "Green colour-correcting primer", name: "Green colour-correcting primer", shade: null,
        coverage: null, why: "A thin layer.", for: "Redness", label: M.NOT_TESTED },
    ],
    focus: ["Redness"], label: M.NOT_TESTED, catalogue_version: "2026-10-23", ...over,
  };
}

function transport(replies) {
  const calls = [];
  const queue = [...replies];
  return { calls, skinMatch: async (body) => {
    calls.push(structuredClone(body));
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next;
  } };
}

function apiError(code, message) { return Object.assign(new Error(message), { code }); }

test("opening without a photo is an error state, not a blank screen", () => {
  const c = new M.SkinMatchController(transport([]), () => NOW);
  const s = c.open(null);
  assert.equal(s.kind, "error");
  assert.equal(s.code, "photo_required");
  assert.match(M.view(s).message, /Choose a photo/);
  assert.deepEqual(M.view(s).actions, []);
});

test("consent state offers send and local, and nothing is sent without both ticks", async () => {
  const t = transport([]);
  const c = new M.SkinMatchController(t, () => NOW);
  assert.equal(c.open(PHOTO).kind, "consent");
  assert.deepEqual(M.view(c.state).actions, ["send", "local"]);
  for (const answers of [{ adult: false, agreed: true }, { adult: true, agreed: false }, { adult: "yes", agreed: true }]) {
    await assert.rejects(c.analyse(answers), (e) => e instanceof M.ConsentMissing && /Nothing was sent/.test(e.message));
  }
  assert.equal(t.calls.length, 0);
  assert.equal(c.state.kind, "consent");
});

test("send carries a skin-scope attestation for this photo and shows the result", async () => {
  const t = transport([result()]);
  const c = new M.SkinMatchController(t, () => NOW);
  c.open(PHOTO);
  const seen = [];
  c.subscribe((s) => seen.push(s.kind));
  const s = await c.analyse({ adult: true, agreed: true });
  assert.deepEqual(t.calls, [{ photo_id: PHOTO, consent: { version: "beljour-consent/1", adult: true, scope: "skin", photo_id: PHOTO, given_at: NOW } }]);
  assert.deepEqual(seen, ["loading", "result"]);
  assert.equal(s.kind, "result");
  const v = M.view(s);
  assert.equal(v.message, "Your skin analysis is ready.");
  assert.match(v.tone, /Depth: tan\. Undertone: warm \(golden\)\. \(Local estimate\)/);
  assert.deepEqual(v.concerns, ["Redness: 55 of 100, worth focusing on"]);
  assert.equal(v.sourceLine, "YouCam Skin Analysis · 9 units");
  assert.equal(v.notTested, true);
  assert.deepEqual(v.products.map((p) => p.name), ["Skin tint, tan, golden", "Green colour-correcting primer"]);
});

test("a repeat says no units were used", () => {
  const v = M.view({ kind: "result", photoId: PHOTO, result: result({ cached: true, units_spent: 0 }) });
  assert.equal(v.sourceLine, "YouCam Skin Analysis · repeat, no units used");
});

test("units exhausted shows the local estimate with the server's plain message", async () => {
  const msg = "This visit has used its share of live units. Showing a local estimate from your photo.";
  const t = transport([result({ source: "local", fallback: "session_cap", message: msg, concerns: [], concerns_source: null, units_spent: 0 })]);
  const c = new M.SkinMatchController(t, () => NOW);
  c.open(PHOTO);
  const s = await c.analyse({ adult: true, agreed: true });
  assert.equal(s.kind, "fallback");
  const v = M.view(s);
  assert.equal(v.message, msg);
  assert.equal(v.sourceLine, "Local estimate · no units used");
  assert.deepEqual(v.concerns, []);
  assert.ok(v.products.length > 0, "the local estimate still lists base product types");
  assert.deepEqual(v.actions, ["retry", "back"]);
});

test("local only sends local_only and no consent, and never offers a retry", async () => {
  const t = transport([result({ source: "local", fallback: "local_only", message: "You chose a local estimate. Nothing was sent.", concerns: [], units_spent: 0 })]);
  const c = new M.SkinMatchController(t, () => NOW);
  c.open(PHOTO);
  const s = await c.localOnly();
  assert.deepEqual(t.calls, [{ photo_id: PHOTO, local_only: true }]);
  assert.equal(s.kind, "fallback");
  assert.deepEqual(M.view(s).actions, ["back"]);
});

test("a second tap while loading is ignored, so one click is one request", async () => {
  let release;
  const pending = new Promise((r) => { release = r; });
  const calls = [];
  const c = new M.SkinMatchController({ skinMatch: async (b) => { calls.push(b); await pending; return result(); } }, () => NOW);
  c.open(PHOTO);
  const first = c.analyse({ adult: true, agreed: true });
  assert.equal(c.busy, true);
  const second = await c.analyse({ adult: true, agreed: true });
  assert.equal(second.kind, "loading");
  await c.localOnly();
  release();
  assert.equal((await first).kind, "result");
  assert.equal(calls.length, 1);
});

test("errors keep the photo and offer retry; a consent refusal returns to the consent form", async () => {
  const t = transport([apiError("offline", "Can't reach the BELJOUR server."), apiError("consent_expired", "x"), new Error("")]);
  const c = new M.SkinMatchController(t, () => NOW);
  c.open(PHOTO);
  let s = await c.analyse({ adult: true, agreed: true });
  assert.deepEqual([s.kind, s.code, s.photoId], ["error", "offline", PHOTO]);
  assert.deepEqual(M.view(s).actions, ["retry", "back"]);
  assert.equal(c.back().kind, "consent");
  s = await c.analyse({ adult: true, agreed: true });
  assert.equal(s.kind, "consent");
  s = await c.analyse({ adult: true, agreed: true });
  assert.equal(s.kind, "error");
  assert.match(s.message, /Your photo is still here/);
});

test("results without the not-tested label are not shown as labelled", () => {
  const r = result();
  r.products[1] = { ...r.products[1], label: "" };
  assert.equal(M.view({ kind: "result", photoId: PHOTO, result: r }).notTested, false);
});

test("the API client posts to /api/skin/match with the session header and no YouCam host", async () => {
  const seen = [];
  const realFetch = globalThis.fetch;
  globalThis.BELJOUR_API = "https://api.example.test";
  globalThis.fetch = async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify(result()), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const { api } = await import("../dist/js/api.js");
    const reply = await api.skinMatch({ photo_id: PHOTO, local_only: true });
    assert.equal(reply.label, M.NOT_TESTED);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].url, "https://api.example.test/api/skin/match");
    assert.equal(seen[0].init.method, "POST");
    assert.deepEqual(JSON.parse(seen[0].init.body), { photo_id: PHOTO, local_only: true });
    assert.match(Object.keys(seen[0].init.headers).join(","), /X-Beljour-Session/);
  } finally {
    globalThis.fetch = realFetch;
    delete globalThis.BELJOUR_API;
  }
  for (const file of ["../dist/js/screens/skin-match.js", "../dist/js/screens/skin-match-model.js"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /makeupar\.com|yce-api|perfectcorp/i);
    assert.doesNotMatch(source, /\bfetch\s*\(/, "the screen goes through the API client only");
  }
});
