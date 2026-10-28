// R33F Editorial Shade Book controls on a test DOM: family, undertone and search facets,
// paging, choosing a folio without applying an edit, carrying it to the workbench
// callback, and a print layout that only the visitor's button starts. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { installDOM } from "./helpers/dom.mjs";
import { EditorialShadeBook } from "../dist/js/commerce/editorial-shade-book.js";
import { EditorialShadeBookModel } from "../dist/js/commerce/editorial-shade-model.js";

function mount(options = {}) {
  const dom = installDOM();
  const host = dom.document.createElement("div");
  const book = new EditorialShadeBook(host, { reducedMotion: true, ...options });
  const button = (name) => book.root.querySelectorAll("button").find((b) => b.textContent === name);
  const cards = () => book.root.querySelectorAll("li");
  return { dom, host, book, button, cards };
}

test("family, undertone and search facets narrow the folios and reset the page", async () => {
  const { dom, book, button, cards } = mount();
  try {
    await button("Next twelve").click();
    const [family, undertone] = book.root.querySelectorAll("select");
    family.value = "fashion";
    await family.dispatch("change");
    assert.equal(cards().length, 12);
    assert.ok(cards().every((c) => c.dataset.shade.startsWith("fashion-")));
    assert.match(book.root.textContent, /Page 1 of 2 · 15 folios/);
    undertone.value = "warm";
    await undertone.dispatch("change");
    assert.ok(cards().length > 0 && cards().length < 15);
    const search = book.root.querySelector("input");
    search.value = "ruby";
    await search.dispatch("input");
    assert.deepEqual(cards().map((c) => c.dataset.shade), ["fashion-ruby"]);
    search.value = "no such folio";
    await search.dispatch("input");
    assert.equal(cards().length, 0);
    assert.match(book.root.textContent, /No folios match/);
  } finally { dom.restore(); }
});

test("choosing a folio marks it and applies nothing; carrying hands it to the workbench", async () => {
  const carried = [];
  const { dom, book, button, cards } = mount({ onCarry: (folio) => carried.push(folio.shade_id) });
  try {
    assert.equal(button("Carry to local workbench").disabled, true);
    await cards()[2].querySelector("button").click();
    assert.equal(book.model.selected.number, 3);
    assert.equal(cards()[2].querySelector("button").getAttribute("aria-pressed"), "true");
    assert.equal(cards()[0].querySelector("button").getAttribute("aria-pressed"), "false");
    assert.match(book.root.textContent, /Nothing is applied until you use the workbench/);
    assert.deepEqual(carried, []);
    await button("Carry to local workbench").click();
    assert.deepEqual(carried, [book.model.selected.shade_id]);
    assert.match(book.root.textContent, /no edit was applied/);
  } finally { dom.restore(); }
});

test("without a workbench callback the carry control stays disabled", async () => {
  const { dom, book, button, cards } = mount();
  try {
    await cards()[0].querySelector("button").click();
    assert.equal(button("Carry to local workbench").disabled, true);
    assert.equal(book.carryChosen(), null);
  } finally { dom.restore(); }
});

test("printing starts only from the visitor's button and lays out every match", async () => {
  let layout = null, shown = 0, calls = 0;
  const holder = {};
  const { dom, book, button, cards } = mount({ print: () => {
    calls++;
    layout = holder.book.root.dataset.layout;
    shown = holder.cards().length;
  } });
  holder.book = book;
  holder.cards = cards;
  try {
    assert.equal(calls, 0);
    await button("Print this book").click();
    assert.deepEqual([calls, layout, shown], [1, "print", 90]);
    assert.equal(book.root.dataset.layout, "screen");
    assert.equal(cards().length, 12);
  } finally { dom.restore(); }
});

test("the pure model clamps pages and refuses unknown facets", () => {
  const model = new EditorialShadeBookModel();
  assert.equal(model.previous().page, 1);
  assert.equal(model.goTo(50).page, 8);
  assert.equal(model.setFilter({ family: "white" }).total, 3);
  assert.equal(model.next().page, 1);
  assert.throws(() => model.setFilter({ undertone: "olive" }), RangeError);
  assert.equal(model.family, "white");
  assert.throws(() => model.select(0), RangeError);
  model.select(90);
  assert.equal(model.selected.number, 90);
  model.clearSelection();
  assert.equal(model.selected, null);
});
