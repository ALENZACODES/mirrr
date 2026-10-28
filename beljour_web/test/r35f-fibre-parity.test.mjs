/** Planned scalp-cover and pigment distances in the browser against parity/fibre-coverage-r35f.json.
 * Production fibre functions on source numbers only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as F from "../dist/js/commerce/fibre-parity.js";
import { cutForLevel } from "../dist/js/engines/local/strands.js";

const P = JSON.parse(readFileSync(new URL("../../parity/fibre-coverage-r35f.json", import.meta.url), "utf8"));

test("the committed contract matches this build", () => {
  assert.deepEqual(F.checkFibreContract(P), []);
  assert.equal(F.coverVectors().length, 164);
  assert.equal(F.pigmentPairs().length, 91);
  assert.deepEqual([F.COVER_LEVELS[0], F.COVER_LEVELS.at(-1), F.COVER_LEVELS.length], [1, 5, 41]);
});

test("a changed stored value is reported", () => {
  const cover = P.cover.map((v, i) => (i === 7 ? { ...v, planned_share: v.planned_share + 0.01 } : v));
  assert.deepEqual(F.checkFibreContract({ ...P, cover }), ["cover:7"]);
  assert.deepEqual(F.checkFibreContract({ ...P, pigments: P.pigments.slice(1) }).slice(0, 2), ["pigment_count", "pigment:0"]);
});

test("vectors use the production cut and never reveal more scalp", () => {
  for (const share of F.START_SHARES) {
    let previous = Infinity;
    for (const lv of F.COVER_LEVELS) {
      const v = F.plannedCover(lv, share);
      assert.equal(v.cut, cutForLevel(lv));
      assert.ok(v.planned_share <= previous);
      previous = v.planned_share;
    }
  }
  for (const [lv, share] of [[0.9, 0.2], [5.1, 0.2], [1.05, 0.2], [2, -0.1], [2, 1.1], [2, Number.NaN]]) {
    assert.throws(() => F.plannedCover(lv, share), RangeError);
  }
});
