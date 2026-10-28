// R9 consent gate: visit consent, per-photo provider consent, expiry, withdrawal, storage contents,
// and the end-to-end rule that no styling request (not even the quote) starts without it.
// Offline: the transport is a recording fake and fetch throws. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import * as K from "../dist/js/ui/shell/consent.js";
import { performStyling } from "../dist/js/ui/styling-tasks.js";

function memoryStore() {
  const map = new Map();
  return { map, getItem: (k) => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}
function clock(start = 1_700_000_000_000) { const c = { now: start }; c.fn = () => c.now; return c; }

const quote = { feature: "makeup-vto", units: 1, cached: false, live: true, scope: "youcam",
  data_flow: "sent to YouCam, deleted after the result", visit_units_left: 6, visit_units_used: 0, visit_units_cap: 6,
  visit_units_after: 5, daily_units_left: 80, pricing_verified: true, can_apply: true, unavailable_reason: null, is_estimate: true };
function transport() {
  const calls = [];
  return { calls,
    quote: async (b) => { calls.push(["quote", b]); return quote; },
    startTask: async (b) => { calls.push(["start", b]); return { status: "done", request_key: "k1", ticket: null }; },
    task: async (k) => { calls.push(["poll", k]); return { status: "done", request_key: k, image: "data:image/jpeg;base64,QQ==" }; } };
}

test("visit consent needs both an adult answer and an understood answer", () => {
  const gate = new K.ConsentGate(clock().fn, memoryStore());
  assert.equal(gate.hasVisit, false);
  assert.throws(() => gate.acceptVisit({ adult: false, understood: true }), (e) => e instanceof K.ConsentRequired && /18/.test(e.message));
  assert.throws(() => gate.acceptVisit({ adult: true, understood: false }), /understand/);
  assert.throws(() => gate.acceptVisit({ adult: "yes", understood: true }), /18/);
  const record = gate.acceptVisit({ adult: true, understood: true });
  assert.equal(record.version, K.CONSENT_VERSION);
  assert.equal(gate.hasVisit, true);
});

test("the stored visit record holds four plain fields and no photo, face, file or provider data", () => {
  const store = memoryStore(), c = clock();
  const gate = new K.ConsentGate(c.fn, store);
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["makeup"]);
  assert.deepEqual([...store.map.keys()], [K.STORAGE_KEY], "only one key, and photo grants are never stored");
  const saved = JSON.parse(store.map.get(K.STORAGE_KEY));
  assert.deepEqual(Object.keys(saved).sort(), ["adult", "at", "understood", "version"]);
  const reopened = new K.ConsentGate(c.fn, store);
  assert.equal(reopened.hasVisit, true, "the next page in this tab sees the visit consent");
  assert.equal(reopened.allows("photo0001", "makeup"), false, "photo consent does not survive a page change");
});

test("malformed, foreign or future stored records count as no consent", () => {
  const now = 1_700_000_000_000;
  for (const raw of [null, "", "not json", "{}", JSON.stringify({ version: "other/1", adult: true, understood: true, at: now }),
    JSON.stringify({ version: K.CONSENT_VERSION, adult: true, understood: true, at: now, photo: "x" }),
    JSON.stringify({ version: K.CONSENT_VERSION, adult: false, understood: true, at: now }),
    JSON.stringify({ version: K.CONSENT_VERSION, adult: true, understood: true, at: now + 10 * 60_000 }), "x".repeat(500)]) {
    assert.equal(K.readVisit(raw, now), null, String(raw).slice(0, 40));
  }
  assert.ok(K.readVisit(JSON.stringify({ version: K.CONSENT_VERSION, adult: true, understood: true, at: now - 5 }), now));
});

test("storage that throws falls back to memory for this page", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const gate = new K.ConsentGate(clock().fn, broken);
  assert.equal(gate.hasVisit, false);
  gate.acceptVisit({ adult: true, understood: true });
  assert.equal(gate.hasVisit, true);
  gate.withdraw();
  assert.equal(gate.hasVisit, false);
});

test("photo consent: per photo, per scope, after visit consent, and with every person an adult who agreed", () => {
  const gate = new K.ConsentGate(clock().fn, null);
  assert.throws(() => gate.grantPhoto("photo0001", ["makeup"]), (e) => e.need === "visit");
  gate.acceptVisit({ adult: true, understood: true });
  assert.throws(() => gate.grantPhoto("bad id!", ["makeup"]), /photo's ID/);
  assert.throws(() => gate.grantPhoto("photo0001", []), /makeup, hair/);
  assert.throws(() => gate.grantPhoto("photo0001", ["skin"]), /makeup, hair/);
  assert.throws(() => gate.grantPhoto("photo0001", ["makeup"], { othersConfirmed: false }), /adult/);
  gate.grantPhoto("photo0001", ["makeup"]);
  assert.equal(gate.allows("photo0001", "makeup"), true);
  assert.equal(gate.check("photo0001", "hair-color").need, "scope");
  assert.equal(gate.check("photo0002", "makeup").need, "photo");
  gate.grantPhoto("photo0001", ["hair"]);
  assert.deepEqual(gate.check("photo0001", "hair-style").grant.scopes, ["hair", "makeup"], "scopes add up");
  assert.throws(() => gate.check("photo0001", "skin-analysis"), /Only makeup and hair/);
  assert.equal(K.scopeFor("hair-volume"), "hair");
  assert.equal(K.scopeFor("makeup"), "makeup");
});

test("photo consent expires after 30 minutes and can be withdrawn", () => {
  const c = clock();
  const gate = new K.ConsentGate(c.fn, null);
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["makeup"]);
  c.now += K.PHOTO_CONSENT_MS - 1;
  assert.equal(gate.allows("photo0001", "makeup"), true);
  c.now += 2;
  const expired = gate.check("photo0001", "makeup");
  assert.equal(expired.allowed, false); assert.equal(expired.need, "expired");
  assert.equal(gate.check("photo0001", "makeup").need, "photo", "an expired grant is removed");
  gate.grantPhoto("photo0003", ["makeup"]);
  assert.equal(gate.activeGrants().length, 1);
  assert.equal(gate.revokePhoto("photo0003"), true);
  assert.equal(gate.revokePhoto("photo0003"), false);
  gate.grantPhoto("photo0004", ["hair"]);
  gate.withdraw();
  assert.equal(gate.hasVisit, false);
  assert.equal(gate.check("photo0004", "hair-color").need, "visit");
  const kinds = gate.receipts().map((r) => r.kind);
  assert.deepEqual(kinds, ["visit", "photo", "photo", "revoked", "photo", "withdrawn"]);
  assert.ok(gate.receipts().every((r) => !/photo0/.test(r.detail)), "receipts don't repeat photo IDs");
});

test("on-device only refuses every provider request and new photo consent, and persists for the tab", async () => {
  const store = memoryStore(), c = clock();
  const gate = new K.ConsentGate(c.fn, store);
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["makeup"]);
  gate.setLocalOnly(true);
  assert.equal(gate.localOnly, true);
  assert.equal(store.map.get(K.LOCAL_ONLY_KEY), "1", "only the flag is stored");
  const refused = gate.check("photo0001", "makeup");
  assert.equal(refused.allowed, false); assert.equal(refused.need, "local-only");
  assert.throws(() => gate.grantPhoto("photo0002", ["hair"]), (e) => e.need === "local-only");
  assert.equal(gate.activeGrants().length, 0, "turning it on ends earlier photo consents");
  const t = transport();
  await assert.rejects(performStyling(t, { photo_id: "photo0001", action: "makeup" }, { consent: gate }), (e) => e.need === "local-only");
  assert.equal(t.calls.length, 0);
  const next = new K.ConsentGate(c.fn, store);
  assert.equal(next.localOnly, true, "the next page in this tab keeps it on");
  gate.withdraw();
  assert.equal(gate.localOnly, true, "withdrawing consent doesn't switch it off");
  gate.setLocalOnly(false);
  assert.equal(store.map.has(K.LOCAL_ONLY_KEY), false);
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0002", ["hair"]);
  assert.equal(gate.allows("photo0002", "hair-style"), true);
  assert.deepEqual(gate.receipts().filter((r) => r.kind === "local-only").map((r) => r.detail),
    ["On-device only turned on", "On-device only turned off"]);
});

test("listeners hear every consent change", () => {
  const gate = new K.ConsentGate(clock().fn, null);
  let n = 0; const off = gate.subscribe(() => n++);
  gate.acceptVisit({ adult: true, understood: true });
  gate.grantPhoto("photo0001", ["makeup"]);
  gate.revokePhoto("photo0001");
  off(); gate.withdraw();
  assert.equal(n, 3);
  assert.throws(() => new K.ConsentGate(() => 0, null, 10), /1 s to 24 h/);
});

test("e2e: without consent a styling request stops before the quote; with it the task runs", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("network is not allowed"); };
  try {
    const c = clock();
    const gate = new K.ConsentGate(c.fn, null);
    const body = { photo_id: "photo0001", action: "makeup", lip_id: "L01" };
    const t1 = transport();
    await assert.rejects(performStyling(t1, body, { consent: gate, sleep: async () => {} }), (e) => e.need === "visit");
    assert.equal(t1.calls.length, 0, "no quote, no task without visit consent");
    gate.acceptVisit({ adult: true, understood: true });
    await assert.rejects(performStyling(t1, body, { consent: gate }), (e) => e.need === "photo");
    assert.equal(t1.calls.length, 0, "no quote, no task without photo consent");
    gate.grantPhoto("photo0001", ["hair"]);
    await assert.rejects(performStyling(t1, body, { consent: gate }), (e) => e.need === "scope");
    assert.equal(t1.calls.length, 0);
    gate.grantPhoto("photo0001", ["makeup"]);
    const done = await performStyling(t1, body, { consent: gate, sleep: async () => {} });
    assert.equal(done.status, "done");
    assert.deepEqual(t1.calls.map((x) => x[0]), ["quote", "start", "poll"]);
    assert.equal(t1.calls[0][1].consent, undefined, "the quote carries no consent data");
    assert.deepEqual(t1.calls[1][1].consent, { version: K.CONSENT_VERSION, adult: true, scope: "makeup",
      photo_id: "photo0001", given_at: gate.check("photo0001", "makeup").grant.at }, "the start carries the attestation the server checks");
    c.now += K.PHOTO_CONSENT_MS + 1;
    const t2 = transport();
    await assert.rejects(performStyling(t2, body, { consent: gate }), (e) => e.need === "expired");
    assert.equal(t2.calls.length, 0, "expired consent sends nothing");
    gate.grantPhoto("photo0001", ["makeup"]);
    gate.revokePhoto("photo0001");
    await assert.rejects(performStyling(t2, body, { consent: gate }), (e) => e.need === "photo");
    assert.equal(t2.calls.length, 0, "withdrawn consent sends nothing");
  } finally { globalThis.fetch = originalFetch; }
});

function sources(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path)); else if (name.endsWith(".ts")) out.push(path);
  }
  return out;
}
const SRC = new URL("../src/", import.meta.url).pathname;

test("boundary: only the styling gateway starts provider tasks, and the product path passes the consent gate", () => {
  const starters = sources(SRC).filter((p) => /\.startTask\(/.test(readFileSync(p, "utf8")));
  assert.deepEqual(starters.map((p) => p.slice(SRC.length)), ["ui/styling-tasks.ts"]);
  const gateway = readFileSync(join(SRC, "ui/styling-tasks.ts"), "utf8");
  assert.match(gateway, /const grant = consent\?\.require\(body\.photo_id, body\.action\);\s*onUpdate\("Checking the live styling quote"\)/, "consent is asked before the quote");
  assert.match(gateway, /startTask\(grant \? \{ \.\.\.body, consent: attestationFor\(grant, body\.photo_id, body\.action\) \} : body\)/, "the start carries the attestation");
  assert.match(gateway, /performStyling\(api, body, \{ onUpdate, consent: appConsent/, "the product path always passes the shared gate");
  const callers = sources(SRC).filter((p) => /applyStyling\(/.test(readFileSync(p, "utf8"))).map((p) => p.slice(SRC.length)).sort();
  assert.deepEqual(callers, ["screens/hair.ts", "screens/reel.ts", "screens/tryon.ts", "ui/styling-tasks.ts"]);
  const hair = readFileSync(join(SRC, "screens/hair.ts"), "utf8");
  assert.match(hair, /appConsent\.require\(photo\.photo_id, request\.action\)/, "Hair Studio refuses before upload or quote");
  assert.ok(hair.indexOf("appConsent.require(photo.photo_id") < hair.indexOf("api.uploadPhoto(request.referenceFile)"));
  assert.match(hair, /sendConsentBox\(/, "Hair Studio keeps the existing consent dialogue");
  assert.match(readFileSync(join(SRC, "screens/tryon.ts"), "utf8"), /sendConsentBox\(/);
  const reel = readFileSync(join(SRC, "screens/reel.ts"), "utf8");
  assert.match(reel, /if \(!send\.checked\)/);
  assert.ok(reel.indexOf("appConsent.grantPhoto(photo.photo_id") < reel.indexOf("applyStyling({ photo_id: photo.photo_id"));
  assert.match(reel, /appConsent\.revokePhoto\(photo\.photo_id\)/);
  assert.match(readFileSync(join(SRC, "screens/photo.ts"), "utf8"), /appConsent\.acceptVisit\(/);
});

test("the studio page itself never calls fetch or a provider route", () => {
  const shell = sources(join(SRC, "ui/shell")).concat(sources(join(SRC, "demo")));
  for (const path of shell) {
    const text = readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|\/api\/tasks|localStorage/, path.slice(SRC.length));
  }
});

test("the attestation matches the server's shape and scope rules", () => {
  const a = K.attestationFor({ at: 123 }, "photo0009", "hair-curl");
  assert.deepEqual(a, { version: "beljour-consent/1", adult: true, scope: "hair", photo_id: "photo0009", given_at: 123 });
  const server = readFileSync(new URL("../../api/plumb_api/consent.py", import.meta.url), "utf8");
  assert.ok(server.includes(`CONSENT_VERSION = "${K.CONSENT_VERSION}"`), "browser and server use the same version");
  for (const action of K.STYLING_ACTIONS) assert.ok(server.includes(`"${action}"`), `${action} is a server styling action`);
});

test("consent copy is plain and names what is sent", () => {
  assert.equal(K.VISIT_STATEMENTS.length, 2);
  assert.match(K.VISIT_STATEMENTS[0].text, /18 or older/);
  assert.ok(K.PROVIDER_FACTS.some((f) => /deleted after the result/.test(f)));
  assert.ok(K.PROVIDER_FACTS.some((f) => /unit price/.test(f)));
  for (const text of [...K.VISIT_STATEMENTS.map((s) => s.text), ...K.PROVIDER_FACTS]) {
    assert.doesNotMatch(text, /clinic|surgery|patient|guarantee|perfect/i);
  }
});
