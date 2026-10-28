/** Local/private and opt-in/provider commerce journeys with injected fakes only.
 * Tests explicitly assert that no paid provider or photo upload is used when off.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandCatalogue, findProduct, nearbyShades } from "../dist/js/commerce/catalogue.js";
import { rank } from "../dist/js/commerce/ranking.js";
import { CommerceController, ConsentRequired } from "../dist/js/commerce/controller.js";
import { CommerceNetworkError } from "../dist/js/commerce/remote.js";

const source = JSON.parse(readFileSync(new URL("../dist/commerce-catalogue.json", import.meta.url), "utf8"));
const catalogue = expandCatalogue(source);
const validImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pSsAAAAASUVORK5CYII=";
const cool = { depth: 9, undertone: "cool", confidence: "manual", evidence: "Local manual shade selection" };
const warm = { depth: 9, undertone: "warm", confidence: "manual", evidence: "Local manual shade selection" };
const deep = (raw) => structuredClone(raw);
const ids = ["f".repeat(64), "e".repeat(64), "a".repeat(64)];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}
function fixture(options = {}) {
  const calls = [];
  let now = 1_783_226_550_000;
  let uploaded = 0;
  let permitted = options.enabled ?? true;
  const remote = {
    async upload(file) {
      calls.push({ action: "upload", size: file.size });
      if (options.upload) return options.upload();
      const name = ids[uploaded]; uploaded += 1;
      return { photo_id: name };
    },
    async match(request) {
      calls.push({ action: "skin", request });
      if (options.match) return options.match(request);
      const cosmetic_concerns = { redness: 29, moisture: 55 };
      const profile = { ...warm, confidence: "estimate", evidence: "W6 measured estimate" };
      return { photo_id: request.photo_id, source: "youcam", fallback: null,
        units_spent: 9, cached: false, profile, cosmetic_concerns,
        recommendations: deep(rank(catalogue, profile, cosmetic_concerns, request.finish)) };
    },
    async tryOn(request) {
      calls.push({ action: "makeup", request });
      if (options.tryOn) return options.tryOn(request);
      return { image: validImage, source: "youcam", simulation: true,
        product: deep(findProduct(catalogue, request.product_id)), provider_calls: 1,
        cached: false, units_spent: 2, image_type: "image/png" };
    },
    async removePhoto(photo_id) {
      calls.push({ action: "delete", photo_id });
      return { deleted: true, results_removed: 2 };
    },
  };
  const media = {
    async upload() {
      calls.push({ action: "clean-image" });
      if (options.encode) await options.encode();
      return new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" });
    },
    async localPreview(product, strength) {
      calls.push({ action: "local-preview", id: product.id, strength });
      return { image: validImage, source: "local", simulation: true, product,
        notice: "Approximate local simulation", label: "Local simulation",
        cached: false, units_spent: 0, provider_calls: 0 };
    },
  };
  const controller = new CommerceController(catalogue, remote, media, () => now, {
    providerEnabled: () => permitted,
    allowedConcerns: new Set(source.concerns),
  });
  controller.setPhoto(true);
  return {
    controller, calls, remote,
    advance: (ms) => { now += ms; },
    permit: (value) => { permitted = value; },
    providerActions: () => calls.filter((call) => ["upload", "skin", "makeup"].includes(call.action)),
  };
}

test("provider kill switch in selected YouCam mode does not upload or require consent", async () => {
  const { controller, calls, providerActions } = fixture({ enabled: false });
  controller.chooseMode("youcam");
  const result = await controller.match(cool, "natural");
  assert.equal(result.stage, "results");
  assert.equal(result.localReason, "provider_disabled");
  assert.equal(result.analysedBy, "Visitor-selected local sample shade");
  assert.equal(result.units, 0);
  assert.equal(result.results[0].product.undertone, "cool");
  const after = await controller.tryOn(result.results[0].product.id, 45);
  assert.equal(after.stage, "preview");
  assert.equal(after.preview.source, "local");
  assert.equal(after.preview.units_spent, 0);
  assert.equal(after.localReason, "provider_disabled");
  assert.equal(controller.pendingUploadedPhotos(), 0);
  assert.equal(providerActions().length, 0);
  assert.deepEqual(calls.map((item) => item.action), ["local-preview"]);
});

test("manually selected local depth and undertone yield different ranked products", async () => {
  const { controller, providerActions } = fixture();
  const a = await controller.match(cool, "natural");
  const first = a.results[0].product.id;
  const b = await controller.match(warm, "natural");
  assert.notEqual(b.results[0].product.id, first);
  assert.ok(first.endsWith("cool"));
  assert.ok(b.results[0].product.id.endsWith("warm"));
  assert.equal(providerActions().length, 0);
});

test("consented gateway flow produces Skin AI ranking, VTO preview, shade swap and bag", async () => {
  const { controller, calls, providerActions } = fixture();
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  const matched = await controller.match(cool, "natural");
  assert.equal(matched.stage, "results");
  assert.equal(matched.analysedBy, "youcam");
  assert.equal(matched.profile.undertone, "warm");
  assert.equal(matched.units, 9);
  assert.ok(matched.results.length > 1);
  assert.match(matched.results[0].why.join(" "), /W6 local/);
  const original = matched.results[0].product;
  const shades = nearbyShades(catalogue, original.id, 9, "cool");
  assert.ok(shades.length >= 1);
  const swap = shades.find((item) => item.undertone === "cool") ?? shades[0];
  const preview = await controller.tryOn(swap.id, 65);
  assert.equal(preview.stage, "preview");
  assert.equal(preview.preview.product.id, swap.id);
  assert.equal(preview.preview.source, "youcam");
  assert.equal(preview.preview.units_spent, 2);
  assert.equal(preview.units, 11);
  assert.deepEqual(providerActions().map((item) => item.action), ["upload", "skin", "makeup"]);
  const skin = calls.find((item) => item.action === "skin").request;
  const vto = calls.find((item) => item.action === "makeup").request;
  assert.equal(skin.consent.scope, "skin");
  assert.equal(vto.consent.scope, "makeup");
  assert.equal(skin.consent.photo_id, vto.consent.photo_id);
  assert.equal(skin.consent.adult, true);
  assert.equal(skin.consent.version, "beljour-consent/1");
  const price = findProduct(catalogue, swap.id).price_cents;
  assert.equal(controller.add(swap.id).total_cents, price);
  assert.equal(controller.wish(swap.id, true).wishlist.length, 1);
  assert.equal(controller.add(swap.id).total_cents, price * 2);
  assert.equal(controller.remove(swap.id).items, 0);
  assert.equal(controller.state.bag.wishlist[0].id, swap.id);
  assert.equal(controller.clear().total_cents, 0);
  assert.equal(controller.state.bag.checkout_enabled, false);
  assert.equal(controller.state.bag.tax_cents, null);
});

test("consent required independently for skin analysis and makeup try-on", async () => {
  const { controller, providerActions } = fixture();
  controller.chooseMode("youcam");
  await assert.rejects(controller.match(cool, "natural"), ConsentRequired);
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 40), ConsentRequired);
  controller.grant(true, true, false);
  await controller.match(cool, "natural");
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 40), ConsentRequired);
  assert.deepEqual(providerActions().map((x) => x.action), ["upload", "skin"]);
  controller.grant(true, false, true);
  await controller.tryOn("quiet-veil-09-warm", 40);
  assert.deepEqual(providerActions().map((x) => x.action), ["upload", "skin", "makeup"]);
});

test("30-minute consent expiry blocks additional uploads and provider tasks", async () => {
  const { controller, advance, providerActions } = fixture();
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  advance(30 * 60 * 1000 + 1);
  await assert.rejects(controller.match(cool, "natural"), ConsentRequired);
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 40), ConsentRequired);
  assert.equal(providerActions().length, 0);
});

test("consent revocation on mode change blocks any new server request", async () => {
  const { controller, providerActions } = fixture();
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  await controller.match(cool, "natural");
  controller.chooseMode("local");
  await controller.tryOn("quiet-veil-09-warm", 50);
  controller.chooseMode("youcam");
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 50), ConsentRequired);
  assert.deepEqual(providerActions().map((x) => x.action), ["upload", "skin"]);
});

test("mode switch during photo re-encoding results in zero upload calls", async () => {
  const encoder = deferred();
  const started = deferred();
  const { controller, providerActions } = fixture({ encode: async () => {
    started.resolve(); await encoder.promise;
  } });
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  const promise = controller.match(cool, "natural");
  await started.promise;
  controller.chooseMode("local");
  encoder.resolve();
  await promise;
  assert.equal(providerActions().length, 0);
  assert.equal(controller.state.mode, "local");
});

test("late-uploaded photo ID is retained for explicit deletion even after image replacement", async () => {
  const upload = deferred();
  const started = deferred();
  const { controller, calls, providerActions } = fixture({ upload: async () => {
    started.resolve(); return upload.promise;
  } });
  controller.chooseMode("youcam");
  controller.grant(true, true, false);
  const task = controller.match(cool, "natural");
  await started.promise;
  controller.setPhoto(true);
  upload.resolve({ photo_id: ids[0] });
  await task;
  assert.equal(controller.pendingUploadedPhotos(), 1);
  assert.equal(controller.state.photoId, null);
  assert.deepEqual(providerActions().map((item) => item.action), ["upload"]);
  assert.equal(await controller.forgetServerPhoto(), true);
  assert.equal(controller.pendingUploadedPhotos(), 0);
  assert.deepEqual(calls.filter((call) => call.action === "delete").map((call) => call.photo_id), [ids[0]]);
});

test("stale provider response after changing photo is discarded without stale ranking", async () => {
  const pending = deferred();
  const entered = deferred();
  const { controller } = fixture({ match: (request) => {
    entered.resolve(); return pending.promise;
  } });
  controller.chooseMode("youcam");
  controller.grant(true, true, true);
  const task = controller.match(cool, "natural");
  await entered.promise;
  controller.setPhoto(true);
  controller.chooseMode("local");
  const local = await controller.match(cool, "natural");
  pending.resolve({ photo_id: ids[0], recommendations: [], source: "youcam" });
  await task;
  assert.equal(controller.state.mode, "local");
  assert.equal(controller.state.results, local.results);
  assert.equal(controller.state.profile.undertone, "cool");
});

test("gateway unavailable during Skin AI matching fails over with no retry", async () => {
  const { controller, providerActions } = fixture({ match: () => {
    throw new CommerceNetworkError("connection", 0, "mocked server sleep");
  } });
  controller.chooseMode("youcam");
  controller.grant(true, true, false);
  const match = await controller.match(cool, "dewy");
  assert.equal(match.stage, "results");
  assert.equal(match.localReason, "provider_unavailable");
  assert.equal(match.analysedBy, "Visitor-selected local sample shade");
  assert.equal(match.units, 0);
  assert.match(match.message, /no provider retry/);
  assert.deepEqual(providerActions().map((call) => call.action), ["upload", "skin"]);
});

test("gateway unavailable during VTO shows approximate local preview and no retry", async () => {
  const { controller, calls, providerActions } = fixture({ tryOn: () => {
    throw new CommerceNetworkError("unavailable", 503, "mocked provider outage");
  } });
  controller.chooseMode("youcam");
  controller.grant(true, false, true);
  const after = await controller.tryOn("quiet-veil-09-warm", 64);
  assert.equal(after.preview.source, "local");
  assert.equal(after.localReason, "provider_unavailable");
  assert.equal(after.units, 0);
  assert.deepEqual(providerActions().map((call) => call.action), ["upload", "makeup"]);
  assert.equal(calls.filter((item) => item.action === "local-preview").length, 1);
});

test("provider request with invalid result does not silently launder untrusted content", async () => {
  const { controller, providerActions } = fixture({ match: (request) => ({
    photo_id: request.photo_id, source: "youcam", units_spent: 1, cached: false,
    profile: warm, cosmetic_concerns: {}, recommendations: [{ product: { id: "external-brand" } }],
  }) });
  controller.chooseMode("youcam"); controller.grant(true, true, true);
  await assert.rejects(controller.match(cool, "natural"), /invalid/);
  assert.equal(controller.state.stage, "error");
  assert.equal(controller.state.results.length, 0);
  assert.deepEqual(providerActions().map((item) => item.action), ["upload", "skin"]);
});

test("no photo means no product matching or preview, even in local mode", async () => {
  const { controller, providerActions } = fixture({ enabled: false });
  controller.setPhoto(false);
  await assert.rejects(controller.match(cool, "natural"), /Choose a photo/);
  await assert.rejects(controller.tryOn("quiet-veil-09-warm", 30), /Choose a photo/);
  assert.equal(providerActions().length, 0);
});

test("changing manual shade impacts alternatives without introducing unknown product names", () => {
  const base = findProduct(catalogue, "quiet-veil-09-warm");
  const swaps = nearbyShades(catalogue, base.id, 9, "cool");
  assert.ok(swaps.length > 1);
  assert.ok(swaps.every((p) => p.formula_id === base.formula_id));
  assert.ok(swaps.every((p) => catalogue.some((known) => known.id === p.id)));
  assert.ok(swaps.some((p) => p.undertone === "cool"));
  assert.ok(swaps.some((p) => p.depth === 10));
  assert.equal(catalogue.length, 168);
});
