// R23F: real engine public entry, drawn geometry, no real faces and no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { ShadeSession } from "../dist/js/engines/shade/session.js";

const PARITY = JSON.parse(readFileSync(new URL("../../parity/shade-w6.json", import.meta.url), "utf8"));
const reference = PARITY.faces[0];
const image = () => ({ width: reference.width, height: reference.height, channels: 3,
  data: Uint8Array.from(Buffer.from(reference.image, "base64")) });
const points = () => reference.points.map((p) => [...p]);
const background = () => Uint8Array.from(Buffer.from(reference.background, "base64"));

function prepareCrypto() {
  if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

test("one drawn-photo reading is memoized across five guarded levels", async () => {
  prepareCrypto();
  const source = image();
  const original = source.data.slice();
  const session = new ShadeSession();
  const options = { backgroundMask: background() };
  const first = await session.prepare(source, points(), options);
  assert.equal(first.reading.refused, false, first.reading.reason);
  assert.equal(first.audit.usable, true, first.audit.note);
  assert.ok(first.cheekMask.some(Boolean));
  assert.equal(first.landmarks.length, reference.points.length);
  const results = [];
  for (const level of [1, 1.1, 1.2, 3, 5]) {
    const replay = await session.prepare(source, points(), options);
    assert.equal(replay, first);
    results.push(await session.apply(source, first, level, {lockLevel: 1}));
  }
  assert.equal(session.readingComputes, 1);
  assert.equal(session.renderComputes, 5);
  assert.deepEqual(source.data, original);
  assert.ok(results.every((v) => v.simulation && v.providerCalls === 0));
  assert.ok(results.every((v) => v.identityGuard.engine === "pixel_proxy"));
  assert.ok(results.every((v) => v.identityGuard.similarity >= 0.9));
  assert.notDeepEqual(results[0].image, results[4].image);
  assert.equal((await session.apply(source, first, 5)).readingCached, true);
  assert.equal(session.renderComputes, 5);
});

test("the same reading renders a small drag preview and full release", async () => {
  prepareCrypto();
  const wide = image();
  const zoom = 4;
  const data = new Uint8Array(wide.width * zoom * wide.height * zoom * 3);
  for (let y = 0; y < wide.height * zoom; y++) {
    for (let x = 0; x < wide.width * zoom; x++) {
      const a = (y * wide.width * zoom + x) * 3;
      const b = (Math.floor(y / zoom) * wide.width + Math.floor(x / zoom)) * 3;
      data.set(wide.data.subarray(b, b + 3), a);
    }
  }
  const scaled = {width: wide.width * zoom, height: wide.height * zoom, channels: 3, data};
  const scaledPoints = points().map((p) => p.map((v) => v * zoom));
  const scaledMask = new Uint8Array(scaled.width * scaled.height);
  const srcMask = background();
  for (let y = 0; y < scaled.height; y++) {
    for (let x = 0; x < scaled.width; x++) {
      scaledMask[y * scaled.width + x] = srcMask[Math.floor(y / zoom) * wide.width + Math.floor(x / zoom)];
    }
  }
  const session = new ShadeSession();
  const prep = await session.prepare(scaled, scaledPoints, {backgroundMask: scaledMask});
  assert.equal(prep.reading.refused, false, prep.reading.reason);
  const drag = await session.apply(scaled, prep, 3, {phase: "interactive"});
  const release = await session.apply(scaled, prep, 3, {phase: "release"});
  assert.equal(drag.phase, "interactive");
  assert.equal(release.phase, "release");
  assert.ok(Math.max(drag.width, drag.height) <= 384);
  assert.equal(release.width, scaled.width);
  assert.equal(release.height, scaled.height);
  assert.equal(session.readingComputes, 1);
});

test("off-step, stale image and refused readings never render", async () => {
  prepareCrypto();
  const source = image();
  const session = new ShadeSession();
  const prepared = await session.prepare(source, points(), {backgroundMask: background()});
  for (const bad of [0.9, 5.1, 2.25, Infinity, NaN]) {
    await assert.rejects(session.apply(source, prepared, bad), /level|strength|resolution/i);
  }
  const other = image();
  other.data[0] ^= 1;
  await assert.rejects(session.apply(other, prepared, 3), /another image/i);
  const black = image();
  black.data.fill(3);
  const refused = await session.prepare(black, points());
  assert.equal(refused.reading.refused, true);
  await assert.rejects(session.apply(black, refused, 3), /unreliable/i);
});
