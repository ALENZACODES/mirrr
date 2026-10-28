// Face-mask cache and thumbnail invalidation for the changing-preview case.
// Drawn sample data only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { masksFor, renderFilterTile, withFilterLevel, settingsFor } from "../dist/js/filters/runtime/layer.js";
import { thumbKey, ThumbCache } from "../dist/js/filters/runtime/cache.js";

function sample() {
  const photo = makeSample("portrait");
  assert.ok(photo.face && photo.face.length >= 468);
  return { ...photo, id: "synthetic-geometry-test", geometryRevision: 1,
    face: photo.face.map(point => [point[0], point[1]]) };
}

test("unchanged geometry reuses the same source mask", () => {
  const source = sample();
  const first = masksFor(source);
  assert.equal(first.source, "landmarks");
  assert.strictEqual(masksFor(source), first);
  assert.strictEqual(masksFor({ ...source, face: source.face.map(point => [...point]) }), first);
});

test("a changed mesh invalidates masks even if photo ID and revision were reused", () => {
  const source = sample();
  const first = masksFor(source);
  source.face[35][0] += 8;
  const second = masksFor(source);
  assert.notStrictEqual(second, first);
  assert.strictEqual(masksFor(source), second);
});

test("geometry revision invalidates previously memoised masks", () => {
  const source = sample();
  const first = masksFor(source);
  source.geometryRevision += 1;
  const second = masksFor(source);
  assert.notStrictEqual(first, second);
  assert.strictEqual(masksFor(source), second);
});

test("a different person outline under the same ID is not reused", () => {
  const photo = makeSample("body-front");
  assert.ok(photo.person);
  const source = { ...photo, id: "synthetic-person-test", geometryRevision: 1 };
  const original = masksFor(source);
  const replaced = { ...source, person: { ...source.person,
    data: Float32Array.from(source.person.data) } };
  const next = masksFor(replaced);
  assert.notStrictEqual(next, original);
  assert.strictEqual(next.person, replaced.person);
});

test("thumbnail keys change with geometry revision and preserve dropSource", () => {
  const fields = { source: "synthetic-thumb", recipe: "C08", strength: 30, side: 128,
    params: { identity_lock: true } };
  const first = thumbKey({ ...fields, revision: 5 });
  const second = thumbKey({ ...fields, revision: 6 });
  assert.notEqual(first, second);
  const cache = new ThumbCache(500);
  const img = { width: 1, height: 1, channels: 3, data: Uint8Array.from([1, 2, 3]) };
  cache.set(first, img);
  cache.set(second, img);
  assert.equal(cache.dropSource("synthetic-thumb"), 2);
});

test("revised geometry re-renders the same selected filter tile", () => {
  const source = sample();
  const option = { recipe: "C08", params: { recipe: "C08", guard: true,
    protect: false, background: false, identity_lock: true }, strength: 30 };
  const cache = new ThumbCache(16 * 1024 * 1024);
  const first = renderFilterTile(source, option, cache);
  assert.strictEqual(renderFilterTile(source, option, cache), first);
  source.geometryRevision += 1;
  const second = renderFilterTile(source, option, cache);
  assert.notStrictEqual(second, first);
});

test("level updates preserve an explicit identity-lock choice", () => {
  const source = { strength: 40, parameters: { recipe: "C03", identity_lock: false } };
  const updated = withFilterLevel(source, 3.8);
  assert.equal(updated.parameters.identity_lock, false);
  assert.equal(settingsFor(updated).identityLock, false);
  assert.equal(updated.strength, 76);
  assert.equal(source.strength, 40);
  const initial = withFilterLevel({ strength: 40, parameters: { recipe: "C03" } }, 2.4);
  assert.equal(initial.parameters.identity_lock, true);
});
