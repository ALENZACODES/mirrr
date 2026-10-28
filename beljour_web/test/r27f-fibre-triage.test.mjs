/** Fibre-cover triage in the browser: coded not_applicable outcomes stay counted.
 * Drawn hair blocks only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { COPY, coverWithTriage, summarizeTriage, triageCover } from "../dist/js/commerce/fibre-evidence.js";
import { CoverSession } from "../dist/js/engines/local/fibre.js";

const HEAD = { left_temple: [.28, .34], right_temple: [.72, .34], crown: [.5, .11],
  left_ear: [.24, .59], right_ear: [.76, .59], nape: [.5, .83] };
const HASH = "a".repeat(64);

/** The tests/r27f_fixtures.hair_block layout, as float masks. */
function block(hair, { detail = 3, scalp = [188, 146, 112] } = {}) {
  const n = 96 * 96, data = new Uint8Array(n * 4), region = new Float64Array(n), show = new Float64Array(n);
  for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
    const i = y * 96 + x, inRegion = y >= 12 && y < 62 && x >= 22 && x < 74, inScalp = y >= 39 && y < 59 && x >= 28 && x < 69;
    let rgb = [205, 177, 145];
    if (inRegion) rgb = [hair[0], Math.min(255, hair[1] + Math.floor(x / 2) % (detail + 1)), hair[2]];
    if (inScalp) rgb = scalp;
    data.set([...rgb, 255], i * 4);
    region[i] = inRegion ? 1 : 0;
    show[i] = inScalp ? 1 : 0;
  }
  const mask = (d) => ({ width: 96, height: 96, channels: 1, data: d });
  return [{ width: 96, height: 96, channels: 4, data }, mask(region), mask(show)];
}

test("eligible hair renders through the guarded renderer; level one is unchanged", () => {
  const [img, region, scalp] = block([64, 41, 39]);
  const found = coverWithTriage(new CoverSession(), img, region, scalp, { photoHash: HASH, zone: "crown", level: 4, landmarks: HEAD });
  assert.equal(found.status, "rendered");
  assert.ok(found.result.changedPixels > 0);
  const still = coverWithTriage(new CoverSession(), img, region, scalp, { photoHash: HASH, zone: "crown", level: 1, landmarks: HEAD });
  assert.equal(still.status, "unchanged");
});

test("unreadable inputs are coded not_applicable with plain guidance", () => {
  const cases = [
    [block([64, 41, 39]), null, "no_mesh"],
    [block([2, 2, 2], { scalp: [3, 2, 2] }), HEAD, "too_dark"],
    [block([64, 41, 39], { detail: 0 }), HEAD, "low_detail"],
  ];
  for (const [[img, region, scalp], head, code] of cases) {
    const found = triageCover(img, region, scalp, head);
    assert.deepEqual([found.status, found.code], ["not_applicable", code]);
    assert.ok(COPY[code].length > 20);
  }
  const [img, region, scalp] = block([64, 41, 39]);
  const small = { ...region, data: region.data.map((_, i) => (Math.floor(i / 96) >= 40 && Math.floor(i / 96) < 50 && i % 96 >= 30 && i % 96 < 40 ? 1 : 0)) };
  assert.equal(triageCover(img, small, scalp, HEAD).code, "insufficient_hair");
});

test("summary keeps every case in the denominator", () => {
  const [img, region, scalp] = block([64, 41, 39]);
  const session = new CoverSession();
  const none = { ...scalp, data: new Float64Array(scalp.data.length) };
  const rows = [coverWithTriage(session, img, region, scalp, { photoHash: HASH, zone: "crown", level: 3, landmarks: HEAD }),
    coverWithTriage(session, img, region, scalp, { photoHash: HASH, zone: "crown", level: 3, landmarks: null }),
    coverWithTriage(session, img, region, none, { photoHash: HASH, zone: "crown", level: 3, landmarks: HEAD })];
  const body = summarizeTriage(rows);
  assert.equal(body.total, 3);
  assert.deepEqual(body.statuses, { not_applicable: 1, rendered: 1, unchanged: 0, refused: 1 });
  assert.deepEqual(body.codes, { no_mesh: 1, no_scalp: 1 });
  assert.throws(() => summarizeTriage([triageCover(img, region, scalp, HEAD)]), RangeError);
});
