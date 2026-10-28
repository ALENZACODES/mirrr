/** Editorial Shade Book audit in the browser: the same measured values as Python.
 * Authored catalogue values only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { auditBook, folioNumbers } from "../dist/js/engines/hair_palette/book-audit.js";
import { catalogue } from "../dist/js/engines/hair_palette/palette.js";

test("the catalogue passes with the measured values", () => {
  const audit = auditBook();
  assert.equal(audit.ok, true);
  assert.equal(audit.count, 90);
  assert.ok(audit.max_lab_error > 0 && audit.max_lab_error <= 0.0001 && audit.max_lch_error <= 0.0001);
  assert.equal(audit.min_separation, 1.7262);
  assert.deepEqual(audit.closest_pair, ["golden-08-c", "golden-08-n"]);
  assert.deepEqual(folioNumbers()[0], [1, catalogue()[0].id]);
});

test("duplicates, bad folios, drift and colour clashes fail", () => {
  const rows = [...catalogue()];
  const dup = auditBook([rows[0], { ...rows[1], id: rows[0].id, name: rows[0].name }, ...rows.slice(2)]);
  assert.deepEqual([dup.ok, dup.duplicate_ids, dup.duplicate_names], [false, [rows[0].id], [rows[0].name]]);
  assert.equal(auditBook(rows, folioNumbers().map(([n, id]) => [n + (n > 10 ? 1 : 0), id])).folios_contiguous, false);
  const drift = auditBook([{ ...rows[0], lab: [rows[0].lab[0] + 0.01, rows[0].lab[1], rows[0].lab[2]] }, ...rows.slice(1)]);
  assert.ok(!drift.ok && drift.max_lab_error >= 0.0099);
  const clash = auditBook([rows[0], { ...rows[1], lab: rows[0].lab, lch: rows[0].lch, rgb: rows[0].rgb }, ...rows.slice(2)]);
  assert.deepEqual([clash.ok, clash.min_separation], [false, 0]);
  assert.throws(() => auditBook(rows.slice(0, 1)), RangeError);
});
