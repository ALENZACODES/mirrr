// Save System (round 2 plan §8): recipe round-trip, identical re-apply, original untouched,
// versions, batch with no-face skip, cancel/resume, review grid, export with no EXIF,
// Good Lookin' names and album, the one-time offer. Synthetic pixels only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "../dist/js/save/looks.js";
import * as B from "../dist/js/save/batch.js";
import * as X from "../dist/js/save/export.js";
import { MemoryLookStorage, IndexedDBLookStorage, browserLookStorage } from "../dist/js/save/storage.js";
import { MemoryStore } from "../dist/js/session.js";
import { jpeg } from "./helpers/images.mjs";

function photo(seed = 1, w = 12, h = 10) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < data.length; i++) data[i] = (i * 13 + seed * 29) % 256;
  return { width: w, height: h, channels: 4, data };
}
/** Deterministic toy engine: each tool shifts one channel by strength x dose. */
const engine = {
  feminine: (p, s, dose) => ({ ...p, data: p.data.map((v, i) => i % 4 === 0 ? Math.min(255, v + Math.round(s.strength * dose / 10)) : v) }),
  nose: (p, s, dose) => ({ ...p, data: p.data.map((v, i) => i % 4 === 1 ? Math.max(0, v - Math.round(s.strength * dose / 10)) : v) }),
  tan: (p, s, dose) => ({ ...p, data: p.data.map((v, i) => i % 4 === 2 ? Math.max(0, v - Math.round(s.strength * dose / 20)) : v) }),
  skin: (p) => ({ ...p, data: Uint8Array.from(p.data) }),
};
const steps = [
  { tool: "feminine", strength: 40, settings: {}, provider: "local" },
  { tool: "nose", strength: 25, settings: { shape: "soft" }, provider: "local" },
  { tool: "tan", strength: 30, settings: {}, provider: "local" },
  { tool: "skin", strength: 20, settings: {}, provider: "local" },
];
const clock = (iso = "2026-10-23T10:00:00Z") => { let t = Date.parse(iso); return () => new Date((t += 1000)); };

test("Save as My Look stores the recipe and reads it back exactly", async () => {
  const storage = new MemoryLookStorage();
  const lib = new L.LookLibrary(storage, clock());
  const look = await lib.saveLook("Date Night", steps);
  assert.match(look.id, /^look-[0-9a-f]{8}$/);
  assert.equal(look.versions.length, 1);
  const again = await lib.get(look.id);
  assert.deepEqual(again, look);
  const auto = await lib.saveLook("", steps);
  assert.equal(auto.name, "Feminine 40 → Nose 25 → Tan 30", "auto-named from the tools");
  await assert.rejects(lib.saveLook("Empty", []), /add an edit first/);
  assert.doesNotMatch(JSON.stringify(look), /data:|landmark|pixels/i, "settings only");
});

test("re-applying a saved look gives identical bytes and never changes the original", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Office", steps);
  const original = photo(3);
  const snapshot = Uint8Array.from(original.data);
  const a = L.applyLook(look, original, engine);
  const b = L.applyLook(await lib.get(look.id), original, engine);
  assert.deepEqual(a.photo.data, b.photo.data);
  assert.deepEqual(a.applied, ["feminine", "nose", "tan", "skin"]);
  assert.deepEqual(original.data, snapshot, "original untouched");
  assert.notDeepEqual(a.photo.data, snapshot, "the look did something");
});

test("versions: v1 stays untouched, the update becomes v2", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const v1 = await lib.saveLook("Wedding trial", steps.slice(0, 2));
  const v2 = await lib.updateLook(v1.id, [...steps.slice(0, 2), { tool: "tan", strength: 10, settings: {}, provider: "local" }]);
  assert.equal(v2.versions.length, 2);
  assert.deepEqual(v2.versions[0], v1.versions[0], "v1 kept byte for byte");
  assert.equal(v2.versions[1].version, 2);
  const p = photo(5);
  assert.notDeepEqual(L.applyLook(v2, p, engine, { version: 1 }).photo.data, L.applyLook(v2, p, engine).photo.data);
  assert.deepEqual(L.applyLook(v2, p, engine, { version: 1 }).photo.data, L.applyLook(v1, p, engine).photo.data);
  assert.throws(() => L.applyLook(v2, p, engine, { version: 3 }), /no version 3/);
  await assert.rejects(lib.updateLook("look-00000000", steps), /not saved/);
});

test("YouCam steps are skipped with a plain note when the adapter is off", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Glam", [...steps.slice(0, 1), { tool: "makeup", strength: 50, settings: { lip: "rose" }, provider: "youcam" }]);
  const off = L.applyLook(look, photo(), engine);
  assert.deepEqual(off.applied, ["feminine"]);
  assert.match(off.skipped[0].reason, /needs YouCam, which is off/);
  const on = L.applyLook(look, photo(), { ...engine, makeup: (p) => p }, { youcamAvailable: true });
  assert.deepEqual(on.applied, ["feminine", "makeup"]);
});

test("batch of 5 with one faceless photo: 4 done, 1 skipped, never fails the batch", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Date Night", steps);
  const photos = [1, 2, 3, 4, 5].map((n) => ({ name: `pic${n}`, photo: photo(n) }));
  const run = new B.BatchRun(look, photos, {
    engine,
    findFaces: (p) => p === photos[2].photo ? [] : [{ id: "f1", box: [0, 0, 5, 5] }],
    doseFor: (p) => p === photos[4].photo ? 0.5 : 1,
  });
  const seen = [];
  const result = await run.run((p) => seen.push(p.done + p.skipped));
  assert.deepEqual([result.done, result.skipped, result.failed, result.total], [4, 1, 0, 5]);
  assert.deepEqual(seen, [1, 2, 3, 4, 5], "progress after each photo");
  const grid = run.grid();
  assert.equal(grid[2].status, "skipped-no-face");
  assert.match(grid[2].note, /No face found/);
  assert.equal(grid[2].after, null);
  assert.deepEqual(grid[0].before.data, photos[0].photo.data, "before kept for the tap-to-compare grid");
  // adaptive dose: photo 5 got half strength, so it differs from a full-dose apply
  assert.notDeepEqual(grid[4].after.data, L.applyLook(look, photos[4].photo, engine).photo.data);
  assert.equal(B.summary(result), "4 of 5 done, 1 skipped (no face).");
  assert.equal(run.finished().length, 4);
});

test("cancel pauses after the current photo; resume finishes without redoing work", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Batch", steps);
  const photos = Array.from({ length: 6 }, (_, i) => ({ name: `p${i}`, photo: photo(i + 1) }));
  let applied = 0;
  const counting = Object.fromEntries(Object.entries(engine).map(([k, fn]) => [k, (p, s, d) => { if (k === "feminine") applied++; return fn(p, s, d); }]));
  const run = new B.BatchRun(look, photos, { engine: counting, findFaces: () => [{ id: "a", box: [0, 0, 1, 1] }] });
  const first = await run.run((p) => { if (p.done === 2) run.cancel(); });
  assert.equal(first.done, 2);
  assert.equal(first.cancelled, true);
  assert.match(B.summary(first), /paused/);
  const second = await run.run();
  assert.equal(second.done, 6);
  assert.equal(second.finished, true);
  assert.equal(applied, 6, "each photo edited exactly once across cancel and resume");
});

test("group photos follow the face-chip rule and one photo can be redone alone", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Group", steps);
  const faces = [{ id: "left", box: [0, 0, 2, 2] }, { id: "right", box: [5, 0, 2, 2] }];
  const run = new B.BatchRun(look, [{ name: "g", photo: photo() }, { name: "h", photo: photo(2) }],
    { engine, findFaces: (p) => p.data[0] === photo().data[0] ? faces : [faces[0]] }, ["right"]);
  await run.run();
  const grid = run.grid();
  assert.deepEqual(grid[0].facesEdited, ["right"]);
  assert.equal(grid[1].status, "skipped-no-face");
  assert.match(grid[1].note, /chosen faces/);
  const redone = await run.redo(0, { doseFor: () => 0 });
  assert.equal(redone.status, "done");
  assert.deepEqual(redone.after.data, photo().data, "dose 0 re-run leaves that photo as it was");
  assert.throws(() => new B.BatchRun(look, [], { engine, findFaces: () => [] }), /1 to 50/);
});

test("a throwing face finder marks that photo failed, not the batch", async () => {
  const lib = new L.LookLibrary(new MemoryLookStorage(), clock());
  const look = await lib.saveLook("Robust", steps);
  const run = new B.BatchRun(look, [{ name: "a", photo: photo(1) }, { name: "b", photo: photo(2) }],
    { engine, findFaces: (p) => { if (p.data[0] === photo(1).data[0]) throw new Error("detector crashed"); return [{ id: "x", box: [0, 0, 1, 1] }]; } });
  const r = await run.run();
  assert.deepEqual([r.done, r.failed], [1, 1]);
  assert.match(B.summary(r), /1 could not be edited/);
});

test("export strips EXIF/GPS and comments, keeps JFIF and the image data", async () => {
  const withExif = jpeg(64, 48, { orientation: 6, comment: true });
  assert.equal(X.hasMetadata(withExif), true);
  const clean = X.stripJpegMetadata(withExif);
  assert.equal(X.hasMetadata(clean), false);
  const markers = X.jpegSegments(clean).map((s) => s.marker);
  assert.ok(markers.includes(0xe0) && markers.includes(0xc0) && markers.includes(0xda));
  assert.ok(!markers.includes(0xe1) && !markers.includes(0xfe));
  assert.deepEqual([...clean.subarray(-2)], [0xff, 0xd9], "image data and end marker intact");
  assert.deepEqual(X.stripJpegMetadata(clean), clean, "idempotent");
  assert.throws(() => X.jpegSegments(Uint8Array.of(1, 2, 3, 4)), /not a JPEG/);
  const encoder = { calls: [], async encode(px, o) { this.calls.push(o); return withExif; } };
  const file = await X.exportPhoto(photo(), encoder, { lookName: "Date Night", index: 1, simulationLabel: true, isSimulation: true });
  assert.equal(file.name, "GoodLookin_DateNight_01.jpg");
  assert.equal(file.label, "Simulation");
  assert.equal(X.hasMetadata(file.bytes), false, "no APP1/EXIF in the exported file");
  assert.equal(encoder.calls[0].label, "Simulation");
  const off = await X.exportPhoto(photo(), encoder, { lookName: "x", index: 2, simulationLabel: false, isSimulation: true });
  assert.equal(off.label, null, "Trust Centre switch respected");
});

test("Good Lookin' names and the album zip", () => {
  assert.equal(X.fileName("Date Night", 3), "GoodLookin_DateNight_03.jpg");
  assert.equal(X.fileName("été / café", 12), "GoodLookin_EteCafe_12.jpg");
  assert.equal(X.fileName("!!!", 1), "GoodLookin_Look_01.jpg");
  assert.throws(() => X.fileName("x", 0), /1 to 999/);
  const files = [1, 2, 3, 4, 5, 6].map((i) => ({ name: X.fileName("Date Night", i), bytes: Uint8Array.of(i, i + 1), label: null }));
  const album = X.album(files);
  assert.equal(album.message, "6 photos saved to Good Lookin'.");
  const z = album.bytes;
  assert.deepEqual([...z.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  const end = z.length - 22;
  assert.deepEqual([...z.subarray(end, end + 4)], [0x50, 0x4b, 0x05, 0x06]);
  assert.equal(new DataView(z.buffer, z.byteOffset).getUint16(end + 10, true), 6);
  assert.match(new TextDecoder().decode(z), /Good Lookin'\/GoodLookin_DateNight_06\.jpg/);
  assert.deepEqual(X.album(files).bytes, z, "deterministic bytes, no hidden timestamps");
  assert.equal(X.crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.throws(() => X.storeZip([{ name: "a.jpg", bytes: new Uint8Array() }, { name: "a.jpg", bytes: new Uint8Array() }]), /repeated/);
  assert.throws(() => X.album([]), /nothing to save/);
});

test("the one-time offer shows once, only after saving a photo with edits and no look", () => {
  const store = new MemoryStore();
  const offer = new L.SaveOffer(store);
  assert.equal(offer.shouldOffer({ savedPhoto: true, hasEdits: false, savedAsLook: false }), false);
  assert.equal(offer.shouldOffer({ savedPhoto: true, hasEdits: true, savedAsLook: true }), false);
  assert.equal(offer.shouldOffer({ savedPhoto: true, hasEdits: true, savedAsLook: false }), true);
  offer.answer("no");
  assert.equal(offer.shouldOffer({ savedPhoto: true, hasEdits: true, savedAsLook: false }), false, "never again");
  assert.equal(L.OFFER_TEXT, "Save this as a Look to reuse it?");
  const broken = new L.SaveOffer({ getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } });
  assert.equal(broken.shouldOffer({ savedPhoto: true, hasEdits: true, savedAsLook: false }), false);
});

test("storage: damaged records are skipped, IndexedDB path works through a fake, memory fallback in node", async () => {
  const mem = new MemoryLookStorage();
  const lib = new L.LookLibrary(mem, clock());
  const look = await lib.saveLook("Keep", steps);
  mem.putRaw("look-deadbeef", "{broken");
  assert.deepEqual((await mem.list()).map((l) => l.id), [look.id]);
  assert.equal(await mem.get("look-deadbeef"), null);
  assert.equal(browserLookStorage().kind, "memory", "no IndexedDB in node");
  // A minimal in-memory IndexedDB double: one store per name, and a transaction that, like a
  // real one, fires oncomplete only after its last request (including requests issued from
  // another request's onsuccess) has finished. Storage resolves multi-store writes on oncomplete.
  const stores = new Map();
  const table = (name) => { if (!stores.has(name)) stores.set(name, new Map()); return stores.get(name); };
  const transaction = () => {
    let pending = 0;
    const tx = { oncomplete: null, onerror: null };
    const req = (fn) => {
      const r = { onsuccess: null, onerror: null, result: undefined };
      pending++;
      queueMicrotask(() => {
        r.result = fn(); r.onsuccess?.();
        if (--pending === 0) queueMicrotask(() => { if (pending === 0) tx.oncomplete?.(); });
      });
      return r;
    };
    tx.objectStore = (name) => {
      const rows = table(name);
      return { get: (k) => req(() => rows.get(k)), put: (v) => req(() => rows.set(v.id, structuredClone(v))),
        delete: (k) => req(() => rows.delete(k)), getAll: () => req(() => [...rows.values()]),
        clear: () => req(() => rows.clear()), count: () => req(() => rows.size) };
    };
    return tx;
  };
  const db = { objectStoreNames: { contains: (n) => stores.has(n) }, createObjectStore: (n) => table(n), transaction };
  const idb = { open: () => { const r = { onupgradeneeded: null, onsuccess: null, onerror: null, result: db }; queueMicrotask(() => { r.onupgradeneeded?.(); r.onsuccess?.(); }); return r; } };
  const disk = new IndexedDBLookStorage(idb);
  const lib2 = new L.LookLibrary(disk, clock());
  const saved = await lib2.saveLook("On disk", steps);
  table("looks").set("look-bad00000", { id: "look-bad00000", format: "nope" });
  assert.deepEqual((await disk.list()).map((l) => l.id), [saved.id]);
  const face = { format: "test-face", points: [[1, 2]] };
  await disk.putFace(saved.id, face);
  assert.deepEqual(await disk.getFace(saved.id), face);
  assert.equal(await disk.delete(saved.id), true);
  assert.equal(await disk.getFace(saved.id), null, "deleting a look deletes its saved face in the same transaction");
  assert.equal(await disk.delete(saved.id), false);
  assert.equal(await disk.clear(), 1);
  assert.equal(table("looks").size, 0);
});
