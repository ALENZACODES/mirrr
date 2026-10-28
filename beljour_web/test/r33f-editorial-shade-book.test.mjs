// R33F Editorial Shade Book rendering on a test DOM: twelve folios at a time, each with
// its number, name, exact Lab/LCh labels, notes and an original illustration; reduced
// motion removes animation; no network, price or brand text. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { installDOM } from "./helpers/dom.mjs";
import { EditorialShadeBook, folioIllustration, strandPath } from "../dist/js/commerce/editorial-shade-book.js";
import { editorialFolios, folioByNumber } from "../dist/js/commerce/editorial-shade-model.js";

function mount(options = {}) {
  const dom = installDOM();
  const host = dom.document.createElement("div");
  const book = new EditorialShadeBook(host, { reducedMotion: false, ...options });
  return { dom, host, book, cards: () => book.root.querySelectorAll("li") };
}

test("the first page shows twelve complete folios", () => {
  const { dom, book, cards } = mount();
  try {
    assert.equal(cards().length, 12);
    const first = cards()[0];
    const folio = folioByNumber(1);
    assert.equal(first.dataset.folio, "1");
    assert.equal(first.dataset.shade, folio.shade_id);
    const text = first.textContent;
    for (const value of [folio.code, folio.name, folio.lab_label, folio.lch_label, folio.undertone_note,
      folio.movement_note]) assert.ok(text.includes(value), value);
    assert.equal(first.querySelectorAll("svg").length, 1);
    assert.match(book.root.textContent, /Page 1 of 8 · 90 folios/);
    assert.match(book.root.textContent, /not physical dye products/);
  } finally { dom.restore(); }
});

test("illustrations use only the folio presentation colours", () => {
  const dom = installDOM();
  const folio = folioByNumber(76);
  const art = folioIllustration(folio, false);
  dom.restore();
  const colours = new Set(art.querySelectorAll("path").map((p) => p.getAttribute("stroke")));
  for (const colour of colours) assert.ok([folio.rgb, folio.shadow].includes(colour));
  const band = art.querySelectorAll("rect").find((r) => r.getAttribute("data-shine") !== null);
  assert.equal(band.getAttribute("fill"), folio.glint);
  assert.equal(band.querySelectorAll("animate").length, 1);
  assert.match(art.getAttribute("aria-label"), /ribboned curl/);
  assert.equal(strandPath(0, 8), strandPath(0, 8));
  assert.notEqual(strandPath(0, 8), strandPath(0, 2));
});

test("reduced motion removes every animation", () => {
  const { dom, book } = mount({ reducedMotion: true });
  try {
    assert.equal(book.root.dataset.motion, "still");
    assert.equal(book.root.querySelectorAll("animate").length, 0);
  } finally { dom.restore(); }
  const moving = mount();
  try {
    assert.equal(moving.book.root.dataset.motion, "drift");
    assert.equal(moving.book.root.querySelectorAll("animate").length, 12);
  } finally { moving.dom.restore(); }
});

test("every folio appears exactly once across the eight pages", async () => {
  const { dom, book, cards } = mount();
  try {
    const seen = [];
    const next = book.root.querySelectorAll("button").find((b) => b.textContent === "Next twelve");
    for (let page = 1; page <= 8; page++) {
      seen.push(...cards().map((c) => Number(c.dataset.folio)));
      await next.click();
    }
    assert.deepEqual(seen, editorialFolios().map((f) => f.number));
    assert.equal(next.disabled, true);
  } finally { dom.restore(); }
});

test("the book source has no network, storage, markup injection or prices", () => {
  for (const file of ["editorial-shade-book.ts", "editorial-shade-model.ts"]) {
    const code = readFileSync(new URL(`../src/commerce/${file}`, import.meta.url), "utf8")
      .replace(/\/\*\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(code, /fetch\(|XMLHttpRequest|localStorage|indexedDB|innerHTML|\$\d|price/i);
  }
});
