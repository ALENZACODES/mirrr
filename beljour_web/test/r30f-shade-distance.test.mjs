/** Checked CIEDE2000 and never-lighter ranking in the browser.
 * Sharma, Wu and Dalal (2005) published pairs and synthetic Lab readings only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as D from "../dist/js/engines/shade/distance.js";
import { matchShades } from "../dist/js/engines/shade/finder.js";
import { suggest } from "../dist/js/engines/hair_palette/palette.js";
import { loadHairShades, loadReferenceShades, shadeById } from "../dist/js/engines/shade/loaders.js";

const csv = readFileSync(new URL("../../lab/bqa_shade/data/sharma2005_pairs.csv", import.meta.url), "utf8")
  .trim().split("\n").slice(1).map((line) => line.split(",").map(Number));

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

test("all 34 published Sharma pairs", () => {
  assert.equal(csv.length, 34);
  const got = D.deltaEPairs(csv.map((r) => [r.slice(1, 4), r.slice(4, 7)]));
  got.forEach((value, i) => assert.ok(Math.abs(value - csv[i][7]) < 1e-4, `pair ${csv[i][0]}`));
  assert.equal(D.deltaE, D.delta_e);
  assert.equal(D.delta_e([55, 12.5, 18.25], new Float64Array([55, 12.5, 18.25])), 0);
});

test("bad Lab is refused, never clipped", () => {
  for (const bad of [[1, 2], [1, 2, 3, 4], [Infinity, 0, 0], [-1, 0, 0], [50, 0, -130], [false, 0, 0], ["50", 0, 0], null]) {
    assert.throws(() => D.delta_e(bad, [50, 0, 0]), RangeError);
  }
  assert.throws(() => D.deltaEPairs([[[50, 0, 0], [60, 0, 0]], [[50, 0, 0]]]), RangeError);
  assert.deepEqual(D.deltaEPairs([]), []);
});

test("skin ranking matches the W6 matcher on the 96 references", () => {
  const rand = seeded(30);
  const table = loadReferenceShades().map((r) => ({ id: r.id, name: r.name, lab: r.lab }));
  for (let i = 0; i < 60; i++) {
    const lab = [18 + 66 * rand(), 22 * rand(), 2 + 28 * rand()];
    const expected = matchShades(lab, table);
    const got = D.rankShades(lab, "reference");
    assert.deepEqual(got.map((m) => m.record.id), expected.map((m) => m.id));
    got.forEach((m, k) => assert.ok(Math.abs(m.delta_e - expected[k].delta_e) < 1e-12));
    assert.ok(got.every((m) => m.lighter_by <= 1 && m.measured_level === null));
  }
});

test("hair ranking matches the palette suggestion", () => {
  const rand = seeded(31);
  for (let i = 0; i < 40; i++) {
    const lab = [5 + 75 * rand(), -3 + 28 * rand(), -8 + 43 * rand()];
    const got = D.rankShades(lab, "hair", { limit: 5 });
    assert.deepEqual(got.map((m) => m.record.id), suggest(lab, { count: 5 }).map((s) => s.shade.id));
    assert.ok(got.every((m) => m.record.level <= m.measured_level));
  }
});

test("lighter swatches need an explicit choice; too-deep readings get none", () => {
  const lab = [25.4, 7.23, 3.96];
  const held = D.nearestShade(lab, "hair");
  const lifted = D.nearestShade(lab, "hair", { allowLighter: true });
  assert.ok(held.record.level <= held.measured_level && lifted.record.level > lifted.measured_level);
  assert.ok(lifted.delta_e < held.delta_e);
  assert.throws(() => D.rankShades(lab, "hair", { allowLighter: 1 }), RangeError);
  assert.equal(D.nearestShade([10, 5, 5]), null);
  assert.deepEqual(D.rankShades([10, 5, 5], "base"), []);
  assert.equal(D.nearestShade([21, 5, 5]).record.id, "LG-24N");
});

test("limits, custom tables and distanceToShade", () => {
  const lab = [60, 12, 18];
  const ranked = D.rankShades(lab, "base", { limit: 2 });
  assert.deepEqual(ranked.map((m) => m.record.id), ["LG-08N", "LG-09N"]);
  const mixed = [shadeById("LG-08N"), ...loadHairShades().slice(0, 3)];
  assert.deepEqual(new Set(D.rankShades(lab, mixed, { allowLighter: true }).map((m) => m.record.surface)),
    new Set(["skin", "hair"]));
  assert.equal(D.distanceToShade(lab, ranked[0].record), ranked[0].delta_e);
  for (const limit of [0, -1, 1.5]) assert.throws(() => D.rankShades(lab, "base", { limit }), RangeError);
  const first = loadReferenceShades()[0];
  for (const table of [[], [first, first]]) assert.throws(() => D.rankShades(lab, table), RangeError);
});
