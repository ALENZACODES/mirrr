/** Shared read-only shade catalogues in the browser: counts, order, immutability, lookups.
 * In-house estimates only; no product, photo or person data. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as L from "../dist/js/engines/shade/loaders.js";
import { SHADE_DATA } from "../dist/js/engines/shade/generated/data.js";
import { DEEP_REFERENCE } from "../dist/js/engines/shade/deep-reference.js";
import { catalogue as hairCatalogue } from "../dist/js/engines/hair_palette/palette.js";

test("catalogue counts match the r30f contract", () => {
  assert.equal(L.loadReferenceShades().length, 96);
  assert.equal(L.loadBaseShades().length, 80);
  assert.equal(L.loadHairShades().length, 90);
  assert.deepEqual(L.KINDS.map((k) => L.loadShadeCatalogue(k).count), [96, 80, 90]);
});

test("skin records follow the generated table then the deep anchors", () => {
  const rows = [...SHADE_DATA.shades, ...DEEP_REFERENCE];
  L.loadReferenceShades().forEach((record, i) => {
    assert.equal(record.id, rows[i].id);
    assert.deepEqual([...record.lab], [...rows[i].lab]);
    assert.equal(record.level, rows[i].depth);
    assert.equal(record.step, rows[i].step);
    assert.equal(record.surface, "skin");
    assert.equal(record.family, null);
  });
  assert.deepEqual(L.loadBaseShades(), L.loadReferenceShades().slice(0, 80));
});

test("hair records mirror the hair palette", () => {
  L.loadHairShades().forEach((record, i) => {
    const source = hairCatalogue()[i];
    assert.deepEqual([record.id, record.level, record.family, record.step], [source.id, source.level, source.family, null]);
    assert.deepEqual([...record.lab], [...source.lab]);
    assert.equal(record.assumed, true);
  });
});

test("records and catalogues are frozen and built once", () => {
  const catalogue = L.loadShadeCatalogue("reference");
  assert.equal(catalogue, L.loadShadeCatalogue("reference"));
  assert.ok(Object.isFrozen(catalogue) && Object.isFrozen(catalogue.records));
  const record = catalogue.records[0];
  assert.ok(Object.isFrozen(record) && Object.isFrozen(record.lab));
  assert.throws(() => { "use strict"; record.lab[0] = 1; }, TypeError);
  assert.equal(catalogue.note, L.NOTE);
  assert.equal(L.loadShadeCatalogue("hair").source, "engines/hair_palette/catalogue.json");
});

test("lookup by id", () => {
  assert.deepEqual([...L.shadeById("LG-22O").lab], [20, 2.27, 10.7]);
  assert.equal(L.shadeById("natural-01-n").surface, "hair");
  assert.equal(L.shadeById("LG-01C", "base"), L.loadBaseShades()[0]);
  for (const [id, kind] of [["LG-99X", undefined], ["natural-01-n", "reference"], ["LG-21C", "base"], ["", undefined]]) {
    assert.throws(() => L.shadeById(id, kind), RangeError);
  }
});

test("unknown kinds and bad Lab values are refused", () => {
  for (const kind of ["skin", "", "REFERENCE", null]) assert.throws(() => L.loadShadeCatalogue(kind), RangeError);
  for (const lab of [[1, 2], [Number.NaN, 0, 0], [101, 0, 0], [50, 129, 0], [true, 0, 0], "abc", null, 5]) {
    assert.throws(() => L.checkedLab(lab), RangeError);
  }
  assert.deepEqual([...L.checkedLab(new Float64Array([50, 1, 2]))], [50, 1, 2]);
});
