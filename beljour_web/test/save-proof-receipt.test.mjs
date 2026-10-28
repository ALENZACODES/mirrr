/** Portable checksum and replay evidence tests. Pure drawn, in-memory inputs. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { auditSavedBatch } from "../dist/js/save/proof-service.js";
import {
  createPortableProof,
  parsePortableProof,
  receiptDescription,
  summarizePortableProof,
} from "../dist/js/save/proof-receipt.js";

function recipe(strength = 20) {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-1f2f3f4f", name: "Private local look", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", provider: "local", strength, settings: {} }] }],
  };
}

function source(seed = 1) {
  const data = new Uint8Array(8 * 8 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index * 7 + seed) % 256;
  return { pixels: { width: 8, height: 8, channels: 4, data } };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

async function receipt() {
  const raw = await auditSavedBatch(recipe(), [source()], engine, 1);
  const text = await createPortableProof(raw, recipe());
  return { text, audit: raw };
}

test("portable proof contains checked counts and a digest, but no source image or saved name", async () => {
  const { text, audit } = await receipt();
  const parsed = await parsePortableProof(text, recipe());
  assert.deepEqual(parsed.audit, audit);
  assert.equal(parsed.method, "unsigned-local-checksum");
  assert.match(parsed.checksum, /^[0-9a-f]{64}$/);
  for (const forbidden of ["Private local look", '"pixelsRaw"', '"face_id"', '"filename"', '"photo"']) {
    assert(!text.includes(forbidden), `receipt leaked ${forbidden}`);
  }
});

test("identical recipe and counts serialize deterministically", async () => {
  const { text, audit } = await receipt();
  assert.equal(text, await createPortableProof(audit, recipe()));
});

test("different version strength invalidates an earlier saved proof", async () => {
  const { text } = await receipt();
  await assert.rejects(parsePortableProof(text, recipe(21)), /changed/);
});

test("changed count with stale digest fails even if the JSON remains valid", async () => {
  const { text } = await receipt();
  const raw = JSON.parse(text);
  raw.audit.exports.failed = 1;
  await assert.rejects(parsePortableProof(JSON.stringify(raw), recipe()), /accounting mismatch/);
});

test("malicious claim of PASS on incomplete export does not become quality evidence", async () => {
  const { text } = await receipt();
  const raw = JSON.parse(text);
  raw.audit.status = "PASS";
  raw.audit.exports.missing = 0;
  await assert.rejects(parsePortableProof(JSON.stringify(raw), recipe()), /mismatch|unsupported/);
});

test("a replaced checksum is detected, without claiming cryptographic authentication", async () => {
  const { text } = await receipt();
  const raw = JSON.parse(text);
  raw.checksum = "0".repeat(64);
  await assert.rejects(parsePortableProof(JSON.stringify(raw), recipe()), /checksum differs/);
});

test("unknown or sensitive extra fields are refused", async () => {
  const { text } = await receipt();
  const raw = JSON.parse(text);
  raw.picture = new Uint8Array([2, 3]);
  await assert.rejects(parsePortableProof(JSON.stringify(raw), recipe()), /unexpected fields/);
});

test("invalid JSON cannot force a PASS", async () => {
  await assert.rejects(parsePortableProof("{ malformed", recipe()), /not valid JSON/);
});

test("imported count-only proof is limited to 64 KiB", async () => {
  await assert.rejects(parsePortableProof(" ".repeat(65537), recipe()), /size limit/);
});

test("receipt is never a signature or a public release assertion", async () => {
  const { audit } = await receipt();
  const summary = summarizePortableProof(audit);
  assert.equal(summary.assurance, "local-mechanical-only");
  assert.equal(summary.status, "UNPROVEN");
  const text = receiptDescription(summary);
  assert.match(text, /not a real-face, identity, fairness, or appearance-quality result/i);
  assert.match(text, /Export 0\/1 checked/);
  assert.match(text, /1 missing/);
});

test("a complete mechanical pass still explicitly excludes appearance-quality", async () => {
  const { audit } = await receipt();
  const fake = { ...audit, exports: { ...audit.exports, missing: 0, inspected: 1, passed: 1 }, status: "PASS" };
  const summary = summarizePortableProof(fake);
  assert.equal(summary.status, "PASS");
  assert.match(receiptDescription(summary), /not a real-face/i);
});

for (const modification of [
  { declared: -1 }, { complete: 4 }, { replayPassed: 5 }, { exportsMissing: -1 }, { checks: 1 },
  { assurance: "signed-certificate" }, { status: "quality-approved" },
]) {
  test("summary mutations cannot alter the portable outcome", async () => {
    const { audit } = await receipt();
    const summary = summarizePortableProof(audit);
    assert.throws(() => receiptDescription({ ...summary, ...modification }), TypeError);
  });
}
