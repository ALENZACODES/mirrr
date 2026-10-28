/** Existing My Looks to proof adapter: local and synthetic only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { MemoryLookStorage } from "../dist/js/save/storage.js";
import { LookLibrary } from "../dist/js/save/looks.js";
import { resolveSavedProof } from "../dist/js/save/proof-bridge.js";
import { auditScheduledBatch } from "../dist/js/save/proof-scheduler.js";

function steps() {
  return [{ tool: "enhance", provider: "local", strength: 25, settings: {} }];
}

function frame(seed = 1) {
  const data = new Uint8Array(4 * 4 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index + seed) % 256;
  return { width: 4, height: 4, channels: 4, data };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

async function env() {
  const storage = new MemoryLookStorage();
  const library = new LookLibrary(storage, () => new Date("2026-10-24T00:00:00.000Z"));
  const saved = await library.saveLook("Local test", steps());
  let revision = 1;
  let reads = 0;
  const photo = {
    revision: () => revision,
    read() { reads++; return frame(); },
  };
  return {
    storage, library, saved, photo, engine,
    options: { library: storage, id: () => saved.id, photo, engine },
    bump() { revision++; },
    readCount: () => reads,
  };
}

test("bridge reads validated saved version but not the image until a proof starts", async () => {
  const box = await env();
  const resolved = await resolveSavedProof(box.options);
  assert.equal(resolved.recipe.id, box.saved.id);
  assert.equal(box.readCount(), 0);
  assert.equal(resolved.batch.declared, 1);
  assert.equal(resolved.batch.available, 1);
  assert.deepEqual((await resolved.batch.read(0)).pixels, frame());
  assert.equal(box.readCount(), 1);
});

test("bridge can evaluate the actual saved recipe without ever writing a photograph", async () => {
  const box = await env();
  const resolved = await resolveSavedProof(box.options);
  const proof = await auditScheduledBatch(resolved.recipe, resolved.batch, resolved.engine);
  assert.equal(proof.audit.replay.report.counts.passed, 1);
  assert.equal(proof.audit.status, "UNPROVEN");
  assert.equal((await box.storage.list()).length, 1);
  assert(!JSON.stringify(proof).includes('"data"'));
});

test("missing saved Look returns no reader and no invented check", async () => {
  const box = await env();
  await box.storage.delete(box.saved.id);
  assert.equal(await resolveSavedProof(box.options), null);
  assert.equal(box.readCount(), 0);
});

test("no selected Look does not query private storage or image", async () => {
  const box = await env();
  const output = await resolveSavedProof({ ...box.options, id: () => null });
  assert.equal(output, null);
  assert.equal(box.readCount(), 0);
});

test("a tampered Look identifier fails before storage access", async () => {
  const box = await env();
  await assert.rejects(resolveSavedProof({ ...box.options, id: () => "../../someone/photo.png" }), /reference/);
  assert.equal(box.readCount(), 0);
});

test("modified photo epoch revokes the current read of a saved look", async () => {
  const box = await env();
  const resolved = await resolveSavedProof(box.options);
  box.bump();
  await assert.rejects(resolved.batch.read(0), /photo changed/);
  await assert.rejects(auditScheduledBatch(resolved.recipe, resolved.batch, engine), /photo changed/);
});

test("photo changing while async photo reader runs never becomes accepted evidence", async () => {
  const box = await env();
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  const current = { ...box.options, photo: {
    ...box.photo,
    async read() { await promise; return frame(); },
  } };
  const resolved = await resolveSavedProof(current);
  const pending = resolved.batch.read(0);
  box.bump();
  release();
  await assert.rejects(pending, /photo changed/);
});

test("save list and original look remain unchanged by proof", async () => {
  const box = await env();
  const before = await box.storage.get(box.saved.id);
  const resolved = await resolveSavedProof(box.options);
  await auditScheduledBatch(resolved.recipe, resolved.batch, resolved.engine);
  assert.deepEqual(await box.storage.get(box.saved.id), before);
});

test("reader refuses a missing, zero-sized or oversized photo", async () => {
  const box = await env();
  for (const read of [() => null, () => ({ width: 0, height: 4, channels: 4, data: new Uint8Array(0) }),
    () => ({ width: 99999, height: 99999, channels: 4, data: new Uint8Array(0) })]) {
    const resolved = await resolveSavedProof({ ...box.options, photo: { revision: box.photo.revision, read } });
    await assert.rejects(resolved.batch.read(0), /unavailable photo/);
  }
});

test("outside slot indices are never treated as new faces", async () => {
  const box = await env();
  const resolved = await resolveSavedProof(box.options);
  await assert.rejects(resolved.batch.read(1), /one current photo/);
  await assert.rejects(resolved.batch.read(-1), /one current photo/);
});

test("blocked IndexedDB-style errors do not trigger photo loading", async () => {
  const box = await env();
  const badLibrary = { get: async () => { throw Error("storage denied"); } };
  await assert.rejects(resolveSavedProof({ ...box.options, library: badLibrary }), /storage denied/);
  assert.equal(box.readCount(), 0);
});

for (const bad of [NaN, -1, 1.2, Infinity]) {
  test(`invalid epoch ${String(bad)} is rejected before reading a photo`, async () => {
    const box = await env();
    await assert.rejects(resolveSavedProof({ ...box.options,
      photo: { revision: () => bad, read: box.photo.read } }), /revision/);
    assert.equal(box.readCount(), 0);
  });
}
