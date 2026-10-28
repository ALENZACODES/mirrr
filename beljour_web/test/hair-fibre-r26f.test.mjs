/** Original swatch-block parity: no network or face photographs. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CoverSession, COVER_LABEL, DefaultCoverGuard } from "../dist/js/engines/local/fibre.js";
import { cutForLevel } from "../dist/js/engines/local/strands.js";
import { DEFAULT_ANCHORS } from "../dist/js/engines/menshair/render.js";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const vectors = JSON.parse(readFileSync(resolve(root, "parity/fibre-r26f.json"), "utf8"));
const decode = (value) => new Uint8Array(Buffer.from(value, "base64"));
function scene() {
  const { width, height, channels } = vectors;
  const img = { width, height, channels, data: decode(vectors.image) };
  const region = { width, height, channels: 1, data: decode(vectors.region) };
  const scalp = { width, height, channels: 1, data: decode(vectors.scalp) };
  return { img, region, scalp };
}
function withinOne(a, b, message) {
  assert.equal(a.length, b.length);
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  assert.ok(maximum <= 1, `${message}: maximum=${maximum}`);
}

test("1..5 local hair fibre matches frozen Python vectors without provider calls", () => {
  const { img, region, scalp } = scene(), session = new CoverSession();
  for (const entry of vectors.vectors) {
    const result = session.render(img, region, scalp, {
      photoHash: vectors.sha256, zone: "crown", level: entry.level, landmarks: DEFAULT_ANCHORS,
    });
    assert.equal(result.rendered, true, result.reason);
    assert.equal(result.providerCalls, 0);
    assert.equal(result.label, COVER_LABEL);
    assert.equal(result.image.channels, 4);
    withinOne(result.image.data, decode(entry.after), `level ${entry.level}`);
    assert.ok(Math.abs(result.afterShare - entry.scalp_share_after) < 1e-5);
    for (let i = 0; i < region.data.length; i++) {
      if (!region.data[i]) {
        assert.deepEqual(result.image.data.slice(i * 4, i * 4 + 4), img.data.slice(i * 4, i * 4 + 4));
      }
      assert.equal(result.image.data[i * 4 + 3], img.data[i * 4 + 3]);
    }
  }
  assert.equal(session.zoneGridCalls, 1);
  assert.equal(session.splitCalls, 1);
  assert.equal(session.energyCalls, 1);
});

test("fibre product strength scale rejects off-grid and out-of-range inputs", () => {
  assert.equal(cutForLevel(1), 0);
  assert.equal(cutForLevel(5), .8);
  assert.equal(cutForLevel(3), .4);
  for (const invalid of [.95, 5.1, 2.25, NaN, Infinity, true, "3.0"]) {
    assert.throws(() => cutForLevel(invalid));
  }
});

test("default pixel guard is called and refuses fake geometry", () => {
  const { img, region, scalp } = scene();
  const session = new CoverSession();
  const bad = session.render(img, region, scalp, {
    photoHash: vectors.sha256, zone: "crown", level: 3, landmarks: null,
  });
  assert.equal(bad.code, "no_mesh");
  let calls = 0;
  const spy = { guard(before, after, lock) {
    assert.equal(lock, 5); calls++;
    return new DefaultCoverGuard().guard(before, after, lock);
  } };
  for (const level of [1, 2, 3, 4, 5]) {
    const result = session.render(img, region, scalp, {
      photoHash: vectors.sha256, zone: "crown", level, landmarks: DEFAULT_ANCHORS, guard: spy,
    });
    assert.equal(result.rendered, true);
  }
  assert.equal(calls, 5);
});
