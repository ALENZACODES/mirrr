// Round 1: session id and pending tickets, the provenance badge wording, theme contrast.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  addPending, MAX_PENDING, MemoryStore, newSessionId, PENDING_KEY, pendingTickets, removePending, resumePending,
  SafeStore, SESSION_KEY, sessionId, validSessionId, waitForTask,
} from "../dist/js/session.js";
import { badgeModel, endpointName, fromLegacyMeta, provenanceOf, units } from "../dist/js/ui/provenance.js";
import { contrast, hexToRgb, luminance, passesAA, readTokens, textOn } from "../dist/js/ui/contrast.js";

const ticket = (n) => ({ request_key: `k2${String(n).padStart(46, "0")}`, task_id: `task-${n}`, feature: "hair-color",
  version: "v2.0", owner: "o", units: 1, sig: "s".repeat(32), v: 1 });

test("session id is made once per tab and is url safe", () => {
  const store = new MemoryStore();
  const id = sessionId(store);
  assert.ok(validSessionId(id), id);
  assert.equal(id.length, 24);
  assert.equal(sessionId(store), id);
  store.setItem(SESSION_KEY, "bad id!");
  assert.notEqual(sessionId(store), "bad id!");
  assert.equal(newSessionId((b) => b.fill(255)), "_".repeat(24));
});

test("storage that throws falls back to memory", () => {
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
  const store = new SafeStore(() => throwing);
  const id = sessionId(store);
  assert.equal(sessionId(store), id);   // remembered in memory
  const missing = new SafeStore(() => null);
  missing.setItem("a", "1");
  assert.equal(missing.getItem("a"), "1");
});

test("pending tickets: add, replace, cap, remove, ignore junk", () => {
  const store = new MemoryStore();
  addPending(store, ticket(1));
  addPending(store, ticket(2));
  addPending(store, { ...ticket(1), task_id: "task-1b" });
  const list = pendingTickets(store);
  assert.deepEqual(list.map((t) => t.task_id), ["task-2", "task-1b"]);
  for (let i = 3; i < 30; i++) addPending(store, ticket(i));
  assert.equal(pendingTickets(store).length, MAX_PENDING);
  removePending(store, ticket(29).request_key);
  assert.equal(pendingTickets(store).length, MAX_PENDING - 1);
  store.setItem(PENDING_KEY, "{not json");
  assert.deepEqual(pendingTickets(store), []);
  store.setItem(PENDING_KEY, JSON.stringify([{ request_key: "x" }, ticket(5)]));
  assert.deepEqual(pendingTickets(store).map((t) => t.task_id), ["task-5"]);
  for (const t of pendingTickets(store)) removePending(store, t.request_key);
  assert.equal(store.getItem(PENDING_KEY), null);
});

test("resume keeps running tickets and drops finished ones", async () => {
  const store = new MemoryStore();
  [1, 2, 3, 4].forEach((n) => addPending(store, ticket(n)));
  let sent = null;
  const statuses = await resumePending(store, async (tickets) => {
    sent = tickets;
    return { tasks: [
      { request_key: ticket(1).request_key, status: "done" },
      { request_key: ticket(2).request_key, status: "running" },
      { request_key: ticket(3).request_key, status: "rejected", reason: "signature" },
      { request_key: ticket(4).request_key, status: "offline" },
    ] };
  });
  assert.equal(sent.length, 4);
  assert.equal(statuses.length, 4);
  assert.deepEqual(pendingTickets(store).map((t) => t.task_id), ["task-2", "task-4"]);
  assert.deepEqual(await resumePending(new MemoryStore(), async () => { throw new Error("not called"); }), []);
});

test("waitForTask polls until the task leaves running", async () => {
  let calls = 0;
  const out = await waitForTask(async () => ({ status: ++calls < 3 ? "running" : "done" }), { sleep: async () => {} });
  assert.equal(out.status, "done");
  assert.equal(calls, 3);
  calls = 0;
  const stuck = await waitForTask(async () => { calls++; return { status: "running" }; }, { tries: 4, sleep: async () => {} });
  assert.equal(stuck.status, "running");
  assert.equal(calls, 4);
});

const prov = (over = {}) => ({ source: "live", provider: "youcam", endpoint: "hair-color", endpoint_version: "v2.0",
  pipeline_version: "2026.10.22-1", units: 1, cache_hit: false, synthetic: false, created: "2026-10-22",
  badge: "Live result", simulation: false, ...over });

test("badge wording for each source", () => {
  const live = badgeModel(prov());
  assert.equal(live.tone, "live");
  assert.equal(live.label, "Live result");
  assert.equal(live.detail, "YouCam Hair Color · 1 unit · 2026-10-22");
  assert.equal(live.simulation, null);
  assert.match(badgeModel(prov({ cache_hit: true, units: 0 })).detail, /repeat, no units used/);
  const rec = badgeModel(prov({ source: "recorded", units: 0, created: null }));
  assert.equal(rec.label, "Recorded API example");
  assert.equal(rec.detail, "YouCam Hair Color · no units used");
  const loc = badgeModel(prov({ source: "local", provider: "local", endpoint: "local-warp", simulation: true, created: null }));
  assert.equal(loc.label, "Local simulation");
  assert.match(loc.detail, /our face shape warp · made by our own code/);
  assert.match(loc.simulation, /^Simulation\./);
  assert.match(loc.aria, /Local simulation\. .*Simulation\./);
  const sample = badgeModel(prov({ source: "recorded", synthetic: true }));
  assert.equal(sample.tone, "sample");
  assert.equal(sample.label, "Sample, not a real result");
});

test("badge helpers", () => {
  assert.equal(units(1), "1 unit");
  assert.equal(units(2), "2 units");
  assert.equal(endpointName("face-reshape+local-warp"), "Recorded face edit, then our face shape warp");
  assert.equal(endpointName("new-thing"), "new-thing");
  assert.equal(endpointName(null), "");
  const legacy = fromLegacyMeta({ source: "demo", units_spent: 0, synthetic: true });
  assert.equal(legacy.synthetic, true);
  assert.equal(legacy.source, "recorded");
  assert.equal(fromLegacyMeta({ source: "cache", units_spent: 0 }).cache_hit, true);
  assert.equal(fromLegacyMeta({ source: "local", units_spent: 0 }).provider, "local");
  const withProv = { source: "live", units_spent: 1, provenance: prov() };
  assert.equal(provenanceOf(withProv), withProv.provenance);
});

test("contrast maths matches known WCAG values", () => {
  assert.deepEqual(hexToRgb("#0055A4"), [0, 85, 164]);
  assert.throws(() => hexToRgb("blue"));
  assert.equal(luminance("#FFFFFF"), 1);
  assert.equal(luminance("#000000"), 0);
  assert.equal(Math.round(contrast("#000000", "#FFFFFF") * 100) / 100, 21);
  assert.equal(Math.round(contrast("#767676", "#FFFFFF") * 100) / 100, 4.54);   // the usual AA grey
  assert.equal(textOn("#002654"), "#FFFFFF");
  assert.equal(textOn("#FAF8F5"), "#000000");
});

test("every text and background pair in theme.css passes WCAG AA", () => {
  const t = readTokens(readFileSync(new URL("../theme.css", import.meta.url), "utf8"));
  for (const name of ["bleu", "bleu-clair", "blanc", "ivoire", "rouge", "gris", "ink", "error", "error-bg", "on-bleu-soft"]) {
    assert.ok(t[name], `missing token --${name}`);
  }
  const pairs = [
    ["ink", "blanc"], ["ink", "ivoire"], ["bleu", "blanc"], ["bleu", "ivoire"], ["bleu-clair", "blanc"],
    ["bleu-clair", "ivoire"], ["gris", "blanc"], ["gris", "ivoire"], ["rouge", "blanc"], ["blanc", "bleu"],
    ["on-bleu-soft", "bleu"], ["error", "error-bg"], ["warn", "warn-bg"], ["blanc", "error"],
  ];
  for (const [fg, bg] of pairs) {
    assert.ok(passesAA(t[fg], t[bg]), `--${fg} on --${bg}: ${contrast(t[fg], t[bg]).toFixed(2)}`);
  }
});
