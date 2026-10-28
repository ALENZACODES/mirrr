/** End-to-end controller-to-catalogue offline commerce assertions.
 * Mocked calls in every network branch; no real faces or provider charges.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as C from "../dist/js/commerce/catalogue.js";
import * as R from "../dist/js/commerce/ranking.js";
import * as B from "../dist/js/commerce/bag.js";
import { CommerceController, ConsentRequired } from "../dist/js/commerce/controller.js";

const SOURCE = JSON.parse(readFileSync(new URL("../dist/commerce-catalogue.json", import.meta.url), "utf8"));
const GOLD = JSON.parse(readFileSync(new URL("../../parity/commerce-r16c.json", import.meta.url), "utf8"));
const ITEMS = C.expandCatalogue(SOURCE);
const SAMPLE_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pSsAAAAASUVORK5CYII=";
const profile = (depth, undertone) => ({ depth, undertone, confidence: "manual", evidence: "Manually selected fictional colour" });

function mocked() {
  const calls = [];
  const photoId = "a".repeat(64);
  const remote = {
    async upload(blob) {
      calls.push(["upload", blob.type]);
      return { photo_id: photoId };
    },
    async match(req) {
      calls.push(["skin-match", req]);
      return { photo_id: req.photo_id, source: "youcam", fallback: null, units_spent: 1,
        cached: false, profile: profile(9, "warm"), cosmetic_concerns: {},
        recommendations: R.rank(ITEMS, profile(9, "warm"), {}, req.finish), note: "mocked skin result", message: "Mocked match" };
    },
    async removePhoto(photo_id) {
      calls.push(["delete-photo", photo_id]);
      return { deleted: true, results_removed: 0 };
    },
    async tryOn(req) {
      calls.push(["makeup-vto", req]);
      return { image: SAMPLE_DATA_URI, source: "youcam", simulation: true,
        product: C.findProduct(ITEMS, req.product_id), notice: "Provider test double",
        label: "Mocked provider sample", provider_calls: 1, cached: false, units_spent: 1 };
    },
  };
  const media = {
    async upload() { calls.push(["reencode", "jpeg"]); return new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" }); },
    async localPreview(product) {
      calls.push(["localPreview", product.id]);
      return { image: SAMPLE_DATA_URI, source: "local", simulation: true,
        product, notice: "Approximate local simulation", label: "Local simulation",
        provider_calls: 0, cached: false, units_spent: 0 };
    },
  };
  const controller = new CommerceController(ITEMS, remote, media, () => 1782265500000);
  controller.setPhoto(true);
  return { calls, controller, photoId };
}

test("168 original fictional SKUs exactly match Python fields, prices, swatches and names", () => {
  assert.equal(GOLD.format, "beljour-commerce-parity/1");
  assert.equal(SOURCE.author, "John Khan");
  assert.equal(ITEMS.length, 168);
  assert.deepEqual(ITEMS, GOLD.products);
  assert.ok(ITEMS.every((item) => item.sample && item.currency === "CAD" && item.label.startsWith("Fictional")));
  const duplicate = structuredClone(SOURCE);
  duplicate.formulas.push(duplicate.formulas[0]);
  assert.throws(() => C.expandCatalogue(duplicate), /Duplicated|validation/);
  assert.throws(() => C.findProduct(ITEMS, "external-brand"), /not in our fictional/);
});

test("Five distinct Python rankings and explanations agree with the browser exact order", () => {
  for (const scenario of GOLD.scenarios) {
    const actual = R.rank(ITEMS, scenario.profile, scenario.concerns, scenario.finish)
      .map((row) => ({ sku: row.product.id, score: row.score, why: row.why }));
    assert.deepEqual(actual, scenario.recommendations, `${scenario.profile.depth}:${scenario.profile.undertone}`);
  }
  const cool = R.rank(ITEMS, profile(9, "cool"));
  const warm = R.rank(ITEMS, profile(9, "warm"));
  assert.notEqual(cool[0].product.id, warm[0].product.id);
  assert.ok(cool[0].product.id.endsWith("cool") && warm[0].product.id.endsWith("warm"));
  for (const row of [...cool, ...warm]) {
    assert.ok(row.why.length > 0);
    assert.ok(ITEMS.some((p) => p.id === row.product.id));
  }
});

test("private bag totals and wishlist use integer cents, never a checkout or an order", () => {
  const bag = new B.SampleBag(ITEMS);
  const sku = "quiet-veil-09-warm";
  const price = C.findProduct(ITEMS, sku).price_cents;
  const after = bag.add(sku, 2);
  assert.equal(after.total_cents, price * 2);
  assert.equal(after.items, 2);
  assert.equal(after.checkout_enabled, false);
  assert.equal(after.tax_cents, null);
  assert.equal(after.shipping_cents, null);
  assert.equal(bag.wish(sku, true).wishlist[0].id, sku);
  assert.equal(bag.remove(sku).items, 0);
  assert.equal(bag.snapshot().wishlist.length, 1);
  assert.equal(bag.clear().wishlist.length, 0);
  assert.throws(() => bag.add("external-product"));
  assert.throws(() => bag.add(sku, 10));
  assert.match(B.money(price), /^\$/);
});

test("browser local-mode journey produces ranked samples, try-on, wishlist and bag with zero network calls", async () => {
  const { controller, calls } = mocked();
  const matched = await controller.match(profile(9, "cool"), "natural");
  assert.equal(matched.stage, "results");
  assert.equal(matched.analysedBy, "Visitor-selected local sample shade");
  assert.equal(matched.units, 0);
  const sku = matched.results[0].product.id;
  assert.equal(matched.results[0].product.undertone, "cool");
  const preview = await controller.tryOn(sku, 60);
  assert.equal(preview.stage, "preview");
  assert.equal(preview.preview.source, "local");
  assert.equal(preview.preview.provider_calls, 0);
  assert.equal(controller.wish(sku, true).wishlist.length, 1);
  assert.equal(controller.add(sku).items, 1);
  assert.equal(controller.remove(sku).items, 0);
  assert.ok(calls.some(([channel]) => channel === "localPreview"));
  assert.equal(calls.some(([channel]) => ["upload", "skin-match", "makeup-vto", "reencode"].includes(channel)), false);
});

test("consent gate blocks upload or Skin AI and makeup independently before network activity", async () => {
  const { controller, calls } = mocked();
  controller.chooseMode("youcam");
  await assert.rejects(controller.match(profile(9, "warm"), "dewy"), ConsentRequired);
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 70), ConsentRequired);
  assert.equal(calls.length, 0);
  controller.grant(true, false, true);
  await assert.rejects(controller.match(profile(9, "warm"), "dewy"), ConsentRequired);
  assert.equal(calls.length, 0);
  controller.grant(true, true, false);
  await controller.match(profile(9, "warm"), "dewy");
  assert.deepEqual(calls.map(([name]) => name), ["reencode", "upload", "skin-match"]);
  assert.equal(calls[2][1].consent.scope, "skin");
  assert.equal(calls[2][1].consent.photo_id, "a".repeat(64));
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 70), ConsentRequired);
  assert.equal(calls.length, 3);
  controller.grant(true, true, true);
  await controller.tryOn("quiet-veil-09-warm", 70);
  assert.equal(calls[3][0], "makeup-vto");
  assert.equal(calls[3][1].consent.scope, "makeup");
  assert.equal(controller.state.units, 2);
});

test("switching to provider-off local mode drops provider traffic and previous results", async () => {
  const { controller, calls } = mocked();
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  const first = await controller.match(profile(9, "warm"), "natural");
  assert.equal(first.stage, "results");
  assert.equal(calls.filter(([name]) => name === "skin-match").length, 1);
  controller.chooseMode("local");
  const local = await controller.match(profile(10, "olive"), "matte");
  assert.equal(local.stage, "results");
  assert.equal(local.units, 0);
  assert.equal(local.results[0].product.undertone, "olive");
  await controller.tryOn(local.results[0].product.id, 35);
  assert.equal(calls.filter(([name]) => ["upload", "skin-match", "makeup-vto"].includes(name)).length, 2);
});

test("late Skin AI results cannot overwrite a later photo or local-mode selection", async () => {
  const { controller, calls } = mocked();
  let conclude;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  controller.chooseMode("youcam");
  controller.grant(true, true, false);
  const originalRemote = controller.remote;
  controller.remote = { ...originalRemote, async match(req) {
    entered();
    return new Promise((resolve) => { conclude = () => resolve({
      photo_id: req.photo_id, source: "youcam", units_spent: 1, recommendations: [],
      profile: profile(9, "warm"), cosmetic_concerns: {}, cached: false,
    }); });
  } };
  const stale = controller.match(profile(9, "warm"), "matte");
  await started;
  controller.chooseMode("local");
  controller.setPhoto(true);
  const local = await controller.match(profile(9, "cool"), "dewy");
  conclude();
  await stale;
  assert.equal(controller.state.mode, "local");
  assert.equal(controller.state.profile.undertone, "cool");
  assert.equal(controller.state.stage, "results");
  assert.ok(calls.some(([event]) => event === "upload"));
});

test("static commerce page and copy are present with accessible consent, comparison, and no payment button", () => {
  const html = readFileSync(new URL("../dist/commerce.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../dist/commerce.css", import.meta.url), "utf8");
  for (const id of ["photo-file", "synthetic-button", "mode-local", "mode-youcam", "confirm-adult",
    "confirm-skin", "confirm-makeup", "find-matches", "match-results", "compare-slider",
    "before-image", "after-image", "update-preview", "save-preview", "clear-bag", "bag-lines", "wish-items"]) {
    assert.ok(html.includes(`id="${id}"`), `Missing interactive control: ${id}`);
  }
  assert.match(html, /js\/commerce\/page\.js/);
  assert.match(html, /No purchases can be made/);
  assert.match(html, /Everything|Every product, swatch and price here is fictional/);
  assert.match(css, /#000091|#e1000f/i);
  assert.doesNotMatch(html, /id="checkout"|href="https:\/\/.*checkout/);
});


test("changing mode requires fresh consent and explicit delete clears proxy photo without clearing local image", async () => {
  const { controller, calls, photoId } = mocked();
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  await controller.match(profile(9, "warm"), "natural");
  assert.equal(controller.state.photoId, photoId);
  controller.chooseMode("local");
  controller.chooseMode("youcam");
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 45), ConsentRequired);
  assert.equal(calls.filter(([event]) => event === "makeup-vto").length, 0);
  assert.equal(await controller.forgetServerPhoto(), true);
  assert.equal(controller.state.photoId, null);
  assert.equal(calls.at(-1)[0], "delete-photo");
  assert.equal(calls.at(-1)[1], photoId);
  assert.equal(controller.state.stage, "consent");
  assert.equal(await controller.forgetServerPhoto(), false);
  controller.chooseMode("local");
  const matched = await controller.match(profile(9, "cool"), "dewy");
  assert.equal(matched.stage, "results");
});
