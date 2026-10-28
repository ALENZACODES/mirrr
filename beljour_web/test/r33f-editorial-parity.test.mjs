// R33F Editorial Shade Book: the browser model equals the Python folios, field by field.
// parity/editorial-shade-book-r33f.json is written by api/plumb_api/engines/hair_palette/
// editorial.py and kept in sync by api/tests/test_r33f_editorial_parity.py. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalogue } from "../dist/js/engines/hair_palette/index.js";
import {
  NOTE, PAGE_SIZE, editorialFolios, filterFolios, fixed4, folioByNumber, glint, pageOf, shadow,
} from "../dist/js/commerce/editorial-shade-model.js";

const PARITY = JSON.parse(readFileSync(new URL("../../parity/editorial-shade-book-r33f.json", import.meta.url), "utf8"));

test("all 90 folios equal the Python folios exactly", () => {
  const folios = editorialFolios();
  assert.equal(PARITY.folios.length, 90);
  assert.equal(folios.length, 90);
  for (let i = 0; i < 90; i++) assert.deepEqual({ ...folios[i] }, PARITY.folios[i], `folio ${i + 1}`);
  assert.equal(PARITY.note, NOTE);
  assert.equal(PARITY.page_size, PAGE_SIZE);
});

test("folios follow catalogue order with unique names and exact source labels", () => {
  const folios = editorialFolios();
  assert.deepEqual(folios.map((f) => f.shade_id), catalogue().map((s) => s.id));
  assert.equal(new Set(folios.map((f) => f.name)).size, 90);
  for (const [i, shade] of catalogue().entries()) {
    const parts = folios[i].lab_label.split(" · ").map((p) => Number(p.split(" ").at(-1)));
    parts.forEach((v, c) => assert.ok(Math.abs(v - shade.lab[c]) <= 5e-5, `${shade.id} lab ${c}`));
  }
  assert.equal(fixed4(-0.5062), "-0.5062");
  assert.equal(fixed4(3.076), "3.0760");
});

test("presentation colours use the same integer arithmetic", () => {
  assert.deepEqual(glint([0, 128, 255]), [89, 172, 255]);
  assert.deepEqual(shadow([0, 128, 255]), [0, 79, 158]);
  const first = folioByNumber(1);
  assert.deepEqual([first.rgb, first.glint, first.shadow], ["#130f11", "#666364", "#0c090b"]);
  assert.throws(() => folioByNumber(91), RangeError);
});

test("facets, search and pages agree with Python", () => {
  assert.equal(filterFolios({ family: "fashion" }).length, 15);
  assert.ok(filterFolios({ undertone: "cool" }).every((f) => f.undertone === "cool"));
  assert.deepEqual(filterFolios({ query: "ocean" }).map((f) => f.shade_id), ["fashion-ocean"]);
  const last = pageOf(editorialFolios(), 8);
  assert.deepEqual([last.page, last.pages, last.folios.length], [8, 8, 6]);
  assert.equal(pageOf(editorialFolios(), 99).page, 8);
  assert.throws(() => filterFolios({ family: "neon" }), RangeError);
});
