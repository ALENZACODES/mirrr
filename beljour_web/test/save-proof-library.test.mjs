/** Versioned look durability and optimistic conflict acceptance. Synthetic settings only. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { VerifiedLookLibrary, validateVerifiedSave } from "../dist/js/save/proof-library.js";
import { MemoryLookStorage } from "../dist/js/save/storage.js";

function look(count = 1, id = "look-1234abcd") {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id, name: "Local recipe", created,
    versions: Array.from({ length: count }, (_, n) => ({
      version: n + 1, created,
      steps: [{ tool: "enhance", strength: 25 + n, settings: {}, provider: "local" }],
    })),
  };
}

test("verified first save requires observable readback before reporting stored", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  const result = await vault.save(look(), { expectedVersion: 0 });
  assert.equal(result.status, "stored");
  assert.equal(result.persisted, true);
  assert.deepEqual(validateVerifiedSave(result), result);
  assert.deepEqual(await storage.get("look-1234abcd"), look());
  assert.equal(vault.queued(), 0);
});

test("append v2 preserving original v1 succeeds", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  await vault.save(look(1));
  const result = await vault.save(look(2), { expectedVersion: 1 });
  assert.equal(result.status, "stored");
  assert.equal((await storage.get(look().id)).versions.length, 2);
  assert.deepEqual((await storage.get(look().id)).versions[0], look().versions[0]);
});

test("non-append revision cannot alter a frozen earlier look", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  await vault.save(look(1));
  const corrupt = look(2);
  corrupt.versions[0].steps[0].strength = 99;
  const result = await vault.save(corrupt, { expectedVersion: 1 });
  assert.equal(result.status, "conflict");
  assert.equal(result.persisted, false);
  assert.equal((await storage.get(look().id)).versions.length, 1);
});

test("stale expected version refuses a write instead of overwriting newer settings", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  await vault.save(look(2));
  const result = await vault.save(look(3), { expectedVersion: 1 });
  assert.equal(result.status, "conflict");
  assert.equal((await storage.get(look().id)).versions.length, 2);
});

test("already aborted user action never starts a storage write", async () => {
  let writes = 0;
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary({
    ...storage, kind: "memory",
    get: (id) => storage.get(id),
    put: async (recipe) => { writes++; await storage.put(recipe); },
  });
  const controller = new AbortController();
  controller.abort();
  const result = await vault.save(look(), { abort: controller.signal });
  assert.equal(result.status, "aborted");
  assert.equal(result.persisted, false);
  assert.equal(writes, 0);
});

test("write reported successful but no readback remains unverified", async () => {
  const vault = new VerifiedLookLibrary({
    kind: "memory", get: async () => null, put: async () => {}, list: async () => [],
    delete: async () => false, clear: async () => 0,
  });
  const result = await vault.save(look());
  assert.equal(result.status, "changed");
  assert.equal(result.persisted, false);
});

test("read or write denied reports storage unavailable without throwing private errors", async () => {
  for (const mode of ["get", "put"]) {
    const storage = new MemoryLookStorage();
    const vault = new VerifiedLookLibrary({
      kind: "memory",
      get: mode === "get" ? async () => { throw Error("USER_FULLNAME.jpg"); } : (id) => storage.get(id),
      put: mode === "put" ? async () => { throw Error("USER_FULLNAME.jpg"); } : (recipe) => storage.put(recipe),
      list: () => storage.list(), delete: (id) => storage.delete(id), clear: () => storage.clear(),
    });
    const result = await vault.save(look());
    assert.equal(result.status, "denied");
    assert.equal(JSON.stringify(result).includes("USER_FULLNAME.jpg"), false);
  }
});

test("concurrent writes to the same Look are serialized per instance", async () => {
  const storage = new MemoryLookStorage();
  let active = 0;
  let peak = 0;
  const vault = new VerifiedLookLibrary({
    kind: "memory", get: (id) => storage.get(id),
    async put(recipe) {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      await storage.put(recipe);
      active--;
    },
    list: () => storage.list(), delete: (id) => storage.delete(id), clear: () => storage.clear(),
  });
  const first = vault.save(look(1));
  const second = vault.save(look(2), { expectedVersion: 1 });
  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map((row) => row.status), ["stored", "stored"]);
  assert.equal(peak, 1);
  assert.equal(vault.queued(), 0);
});

test("parallel different Look IDs do not require one global lock", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  const results = await Promise.all([vault.save(look(1, "look-aaaaaaaa")), vault.save(look(1, "look-bbbbbbbb"))]);
  assert.deepEqual(results.map((row) => row.status), ["stored", "stored"]);
  assert.equal((await storage.list()).length, 2);
});

test("a digest covers recipe settings but not input pixels", async () => {
  const vault = new VerifiedLookLibrary(new MemoryLookStorage());
  const digest = await vault.digest(look());
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal(digest, await vault.digest(look()));
  assert.notEqual(digest, await vault.digest(look(2)));
});

for (const value of [-1, 65, 1.5, Infinity]) {
  test(`invalid compare-and-swap version ${String(value)} is rejected`, async () => {
    const vault = new VerifiedLookLibrary(new MemoryLookStorage());
    await assert.rejects(vault.save(look(), { expectedVersion: value }), /version/);
  });
}

for (const forgery of [
  { status: "stored", persisted: false }, { status: "denied", reason: "readback_match" },
  { version: 0 }, { recipient: "user.png" }, { status: "unverified" },
]) {
  test("untrusted persisted status is never interpreted as successful readback", () => {
    const raw = { format: "beljour-verified-look-save/1", status: "stored", version: 1,
      persisted: true, reason: "readback_match" };
    assert.throws(() => validateVerifiedSave({ ...raw, ...forgery }), TypeError);
  });
}

test("storage changing the just-written recipe fails readback verification", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary({
    kind: "memory",
    get: (id) => storage.get(id),
    async put(recipe) {
      const changed = structuredClone(recipe);
      changed.name = "Different persisted look";
      await storage.put(changed);
    },
    list: () => storage.list(), delete: (id) => storage.delete(id), clear: () => storage.clear(),
  });
  const result = await vault.save(look());
  assert.equal(result.status, "changed");
  assert.equal(result.persisted, false);
  assert.equal(vault.queued(), 0);
});

test("cancellation while reading the expected version prevents a write", async () => {
  const storage = new MemoryLookStorage();
  const controller = new AbortController();
  let writes = 0;
  const vault = new VerifiedLookLibrary({
    kind: "memory",
    async get(id) { controller.abort(); return storage.get(id); },
    async put(recipe) { writes++; await storage.put(recipe); },
    list: () => storage.list(), delete: (id) => storage.delete(id), clear: () => storage.clear(),
  });
  const result = await vault.save(look(), { abort: controller.signal });
  assert.equal(result.status, "aborted");
  assert.equal(result.persisted, false);
  assert.equal(writes, 0);
});

test("failed storage writes cannot leave a permanently locked recipe queue", async () => {
  const storage = new MemoryLookStorage();
  let denied = true;
  const vault = new VerifiedLookLibrary({
    kind: "memory", get: (id) => storage.get(id),
    async put(recipe) {
      if (denied) throw new Error("quota exceeded");
      await storage.put(recipe);
    },
    list: () => storage.list(), delete: (id) => storage.delete(id), clear: () => storage.clear(),
  });
  assert.equal((await vault.save(look())).status, "denied");
  denied = false;
  assert.equal((await vault.save(look())).status, "stored");
  assert.equal(vault.queued(), 0);
});

test("a forged older version cannot roll back a newer stored recipe", async () => {
  const storage = new MemoryLookStorage();
  const vault = new VerifiedLookLibrary(storage);
  await vault.save(look(3));
  const result = await vault.save(look(1));
  assert.equal(result.status, "conflict");
  assert.equal((await storage.get(look().id)).versions.length, 3);
});
