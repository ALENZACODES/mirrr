/** R18 Lane C consent-first skin/product contracts and short-sides source wiring.
 * All provider callbacks are injected fakes. No test fetches, uploads or real faces.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expandCatalogue, findProduct, nearbyShades } from "../dist/js/commerce/catalogue.js";
import { rank } from "../dist/js/commerce/ranking.js";
import { CommerceController, ConsentRequired } from "../dist/js/commerce/controller.js";
import { decodeMatch, InvalidCommerceResponse } from "../dist/js/commerce/guards.js";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const source = JSON.parse(readFileSync(resolve(root, "api/plumb_api/commerce/catalogue.json")));
const products = expandCatalogue(source);
const hair = JSON.parse(readFileSync(resolve(root, "api/plumb_api/engines/menshair/presets.json")));
const cutBook = JSON.parse(readFileSync(resolve(root, "api/plumb_api/styling/catalogue.json")));
const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pSsAAAAASUVORK5CYII=";
const sample = { depth: 9, undertone: "warm", confidence: "manual", evidence: "User-selected fictional depth" };
const photoId = "c".repeat(64);
function fixture(enabled = false) {
  let sends = 0, renders = 0, uploads = 0, time = 1_780_000_000_000;
  const remote = {
    async upload() { uploads += 1; return { photo_id: photoId }; },
    async match(request) {
      sends += 1;
      return { photo_id: request.photo_id, source: "youcam", units_spent: 0,
        cached: true, profile: sample, cosmetic_concerns: {},
        recommendations: rank(products, sample, {}, request.finish), fallback: null };
    },
    async tryOn(request) {
      sends += 1;
      return { image, source: "youcam", simulation: true, product: findProduct(products, request.product_id),
        provider_calls: 0, cached: true, units_spent: 0, image_type: "image/png" };
    },
    async removePhoto() { return { deleted: true, results_removed: 0 }; },
  };
  const media = {
    async upload() { return new Blob([Uint8Array.from([0xff, 0xd8, 0xff])], { type: "image/jpeg" }); },
    async localPreview(product, strength) {
      renders += 1;
      return { image, source: "local", simulation: true, product,
        label: "Local simulation", notice: `Strength ${strength} (approximate).`,
        provider_calls: 0, units_spent: 0, cached: false };
    },
  };
  let state = enabled;
  const controller = new CommerceController(products, remote, media, () => time, {
    providerEnabled: () => state, allowedConcerns: new Set(source.concerns),
  });
  controller.setPhoto(true);
  return { controller, counts: () => ({ sends, uploads, renders }), permit: (value) => { state = value; },
    advance: (amount) => { time += amount; } };
}

test("all sample shade rank orders are deterministic, fictional and bounded", () => {
  assert.equal(products.length, 168);
  const seen = new Set(products.map((row) => row.id));
  assert.equal(seen.size, 168);
  for (let depth = 1; depth <= 10; depth += 1) {
    for (const undertone of ["cool", "neutral", "warm", "olive"]) {
      const user = { ...sample, depth, undertone };
      const a = rank(products, user, { moisture: 20, oiliness: 95 }, "natural");
      const b = rank(products, user, { moisture: 20, oiliness: 95 }, "natural");
      assert.deepEqual(a, b);
      assert.ok(a.length > 0 && a.length <= 16);
      assert.equal(new Set(a.map((row) => row.product.id)).size, a.length);
      assert.ok(a.every((item) => seen.has(item.product.id) && item.product.sample === true));
      assert.ok(a.filter((item) => item.product.category === "complexion")
        .every((item) => item.product.depth === depth && item.product.undertone === undertone));
    }
  }
});

test("adapter disabled despite YouCam mode: only private local behaviour runs", async () => {
  const f = fixture(false);
  f.controller.chooseMode("youcam");
  const matched = await f.controller.match(sample, "natural");
  assert.equal(matched.stage, "results");
  assert.equal(matched.localReason, "provider_disabled");
  assert.equal(matched.units, 0);
  const sku = matched.results.find((row) => row.product.vto)?.product.id;
  assert.ok(sku);
  const rendered = await f.controller.tryOn(sku, 42);
  assert.equal(rendered.preview.source, "local");
  assert.equal(rendered.preview.provider_calls, 0);
  assert.deepEqual(f.counts(), { sends: 0, uploads: 0, renders: 1 });
  assert.equal(f.controller.pendingUploadedPhotos(), 0);
});

test("skin and makeup each require scoped consent before the mocked provider path", async () => {
  const f = fixture(true);
  f.controller.chooseMode("youcam");
  await assert.rejects(f.controller.match(sample, "natural"), ConsentRequired);
  await assert.rejects(f.controller.tryOn("quiet-veil-09-warm", 65), ConsentRequired);
  assert.deepEqual(f.counts(), { sends: 0, uploads: 0, renders: 0 });
  f.controller.grant(true, true, false);
  const matched = await f.controller.match(sample, "natural");
  assert.equal(matched.analysedBy, "youcam");
  await assert.rejects(f.controller.tryOn("quiet-veil-09-warm", 65), ConsentRequired);
  f.controller.grant(true, false, true);
  const after = await f.controller.tryOn("quiet-veil-09-warm", 65);
  assert.equal(after.preview.source, "youcam");
  assert.deepEqual(f.counts(), { sends: 2, uploads: 1, renders: 0 });
  const swap = nearbyShades(products, "quiet-veil-09-warm", 9, "neutral");
  assert.ok(swap.length >= 1 && swap.every((row) => row.sample));
});

test("untrusted provider cannot inject paid brands or external products into matching", () => {
  const result = { photo_id: photoId, source: "youcam", units_spent: 0, cached: true,
    profile: sample, cosmetic_concerns: {}, fallback: null,
    recommendations: structuredClone(rank(products, sample, {}, "natural")) };
  const allowed = new Set(source.concerns);
  const decoded = decodeMatch(result, products, photoId, "natural", allowed);
  assert.equal(decoded.recommendations.length, result.recommendations.length);
  const injected = structuredClone(result);
  injected.recommendations[0].product.name = "External paid endorsement";
  assert.throws(() => decodeMatch(injected, products, photoId, "natural", allowed), InvalidCommerceResponse);
  injected.recommendations[0].product.name = result.recommendations[0].product.name;
  injected.recommendations[0].product.id = "some-brand";
  assert.throws(() => decodeMatch(injected, products, photoId, "natural", allowed), InvalidCommerceResponse);
});

test("all local hairstyle presets map to explicit unverified concepts only", () => {
  const ids = new Set(hair.styles.map((row) => row.id));
  assert.equal(ids.size, hair.styles.length);
  const concepts = cutBook.styles || cutBook.entries || cutBook.concepts || cutBook.items;
  assert.ok(Array.isArray(concepts));
  const linked = concepts.filter((item) => item.tags?.includes("r18c"));
  assert.equal(new Set(linked.map((item) => item.id)).size, linked.length);
  assert.equal(linked.length, 220);
  assert.ok(linked.every((item) => item.template_id == null && item.source !== "youcam" &&
    item.source === "inspiration" && item.id.startsWith("idea-local-") &&
    ids.has("local-" + item.id.slice("idea-local-".length))));
  const page = readFileSync(resolve(root, "web/commerce.html"), "utf8");
  const catalogueScript = page.match(/<script id="commerce-catalogue-data" type="application\/json">([^<]+)<\/script>/);
  const hairScript = page.match(/<script id="menshair-presets-data" type="application\/json">([^<]+)<\/script>/);
  assert.ok(catalogueScript && hairScript, "offline source data must be embedded");
  assert.deepEqual(JSON.parse(catalogueScript[1]), source);
  assert.deepEqual(JSON.parse(hairScript[1]), hair);
});
