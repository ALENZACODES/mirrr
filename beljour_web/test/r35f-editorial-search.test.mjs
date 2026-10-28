/** Editorial Shade Book search: multi-term text, independent facets, stable pages, Lab search.
 * In-house hair swatches only; no photograph is indexed. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as E from "../dist/js/commerce/editorial-shade-search.js";
import { catalogue } from "../dist/js/engines/hair_palette/palette.js";
import { ciede2000 } from "../dist/js/engines/core/colour.js";

const index = E.buildShadeIndex();

test("folios follow source order and every swatch is indexed", () => {
  assert.equal(index.entries.length, 90);
  assert.deepEqual(index.entries.map((e) => e.id), catalogue().map((s) => s.id));
  assert.deepEqual(index.entries.map((e) => e.folio), Array.from({ length: 90 }, (_, i) => i + 1));
  assert.ok(index.families.includes("natural") && index.undertones.includes("cool"));
});

test("multi-term text search needs every term and keeps folio order across pages", () => {
  const all = E.searchShades(index, { text: "natural" });
  const pages = Array.from({ length: all.pages }, (_, i) => E.searchShades(index, { text: "natural", page: i + 1 }).hits);
  const folios = pages.flat().map((h) => h.folio);
  assert.equal(folios.length, all.total);
  assert.deepEqual(folios, [...folios].sort((a, b) => a - b));
  assert.ok(pages.every((p, i) => p.length === (i < pages.length - 1 ? E.PAGE_SIZE : all.total - E.PAGE_SIZE * i)));
  const both = E.searchShades(index, { text: "NATURAL  dep warm" });
  assert.ok(both.total > 0 && both.total < all.total);
  assert.ok(both.hits.every((h) => h.family === "natural" && h.undertone === "warm"));
  assert.equal(E.searchShades(index, { text: "natural zzz" }).total, 0);
});

test("facets are independent of their own filter", () => {
  const free = E.searchShades(index, {});
  const ash = E.searchShades(index, { family: "ash" });
  assert.deepEqual(ash.facets.family, free.facets.family);
  assert.equal(ash.total, free.facets.family.ash);
  const ashCool = E.searchShades(index, { family: "ash", undertone: "cool" });
  assert.deepEqual(ashCool.facets.undertone, ash.facets.undertone);
  assert.equal(ashCool.total, ash.facets.undertone.cool);
  assert.equal(Object.values(free.facets.undertone).reduce((a, b) => a + b, 0), 90);
});

test("numeric Lab search orders by CIEDE2000 inside the limit", () => {
  const found = E.searchShades(index, { lab: [30, 8, 12], maxDeltaE: 4 });
  const expected = catalogue().filter((s) => ciede2000([30, 8, 12], s.lab) <= 4).length;
  assert.equal(found.total, expected);
  const d = found.hits.map((h) => h.delta_e);
  assert.deepEqual(d, [...d].sort((a, b) => a - b));
  assert.ok(d.every((v) => v <= 4));
  assert.ok(E.searchShades(index, { lab: [30, 8, 12] }).total >= found.total);
});

test("bad queries and duplicate books are refused", () => {
  for (const q of [{ family: "neon" }, { undertone: "olive" }, { page: 0 }, { page: 1.5 }, { page: 99 },
    { text: "x".repeat(101) }, { lab: [30, 8] }, { lab: [30, 8, 12], maxDeltaE: 0 }]) {
    assert.throws(() => E.searchShades(index, q), RangeError, JSON.stringify(q));
  }
  const rows = [...catalogue()];
  assert.throws(() => E.buildShadeIndex([rows[0], { ...rows[1], id: rows[0].id }]), RangeError);
  assert.throws(() => E.buildShadeIndex([rows[0], { ...rows[1], name: rows[0].name.toUpperCase() }]), RangeError);
  assert.throws(() => E.buildShadeIndex(rows.slice(0, 2), [1, 1]), RangeError);
  assert.equal(E.searchShades(index, { text: "zzz", page: 1 }).pages, 0);
});
