/** Commerce and consent acceptance using the production public workflow modules.
 * All products are repository-declared fictional samples. Remote functions are
 * in-process test doubles and never make an HTTP request or handle real images.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SampleBag, money } from "../../dist/js/commerce/bag.js";
import { expandCatalogue } from "../../dist/js/commerce/catalogue.js";
import { CommerceController, ConsentRequired } from "../../dist/js/commerce/controller.js";
import { LookPlan, LookShelf } from "../../dist/js/commerce/look.js";
import { CommerceNetworkError } from "../../dist/js/commerce/remote.js";

const source = JSON.parse(readFileSync(
  new URL("../../../api/plumb_api/commerce/catalogue.json", import.meta.url), "utf8"));
const catalogue = expandCatalogue(source);
const product = (kind) => catalogue.find((item) => item.vto === kind);
const choice = ["lip", "blush", "foundation"].map((kind) => ({product_id: product(kind).id, strength: 35}));
const profile = Object.freeze({
  depth: 5, undertone: "neutral", confidence: "manual",
  evidence: "Visitor-chosen sample shade",
});
const photoId = "d".repeat(64);
const previewImage = "data:image/png;base64," + "QUJD".repeat(40);

function fixture({providerEnabled = () => false, fail = null, now = () => 2000} = {}) {
  const counts = {upload: 0, remote: 0, local: 0, remove: 0};
  const remote = {
    async upload(blob) {
      counts.upload++;
      assert.equal(blob.type, "image/png");
      return {photo_id: photoId};
    },
    async match(request) {
      counts.remote++;
      assert.equal(request.consent.scope, "skin");
      if (fail !== null) throw new CommerceNetworkError("units_exhausted", fail, "Provider not available");
      throw Error("Unconfigured synthetic match");
    },
    async tryOn() { counts.remote++; throw Error("No live preview expected"); },
    async tryOnLook() { counts.remote++; throw Error("No live composite expected"); },
    async bag() { throw Error("Bag is local"); },
    async add() { throw Error("Bag is local"); },
    async remove() { throw Error("Bag is local"); },
    async wish() { throw Error("Bag is local"); },
    async clear() { throw Error("Bag is local"); },
    async removePhoto(id) {
      assert.equal(id, photoId);
      counts.remove++;
      return {deleted: true, results_removed: 0};
    },
  };
  const media = {
    async upload() {
      counts.upload++;
      return new Blob([Uint8Array.of(3, 1, 4, 1, 5)], {type: "image/png"});
    },
    async localPreview(item) {
      counts.local++;
      return {image: previewImage, source: "local", simulation: true,
        notice: "Local illustration only", product: item, provider_calls: 0, cached: false,
        units_spent: 0, label: "Sample colour illustration"};
    },
    async localCompositePreview(steps) {
      counts.local++;
      return {image: previewImage, source: "local", simulation: true,
        notice: "Local fictional look illustration", product: steps[0].product,
        provider_calls: 0, cached: false, units_spent: 0,
        label: "Sample colour illustration"};
    },
  };
  const controller = new CommerceController(catalogue, remote, media, now, {
    providerEnabled, allowedConcerns: new Set(source.concerns),
  });
  return {controller, counts};
}

test("offline sample discovery with drawn photo never reaches a provider", async () => {
  const {controller, counts} = fixture();
  controller.setPhoto(true);
  assert.equal(controller.state.stage, "consent");
  controller.chooseMode("local");
  const state = await controller.match(profile, "natural");
  assert.equal(state.stage, "results");
  assert.equal(state.mode, "local");
  assert.equal(state.localReason, "local_only");
  assert.equal(state.units, 0);
  assert.ok(state.results.length >= 3);
  assert.ok(state.results.every((item) => item.product.sample));
  assert.ok(state.results.every((item) => /Fictional/i.test(item.label)));
  assert.deepEqual(counts, {upload: 0, remote: 0, local: 0, remove: 0});
});

test("local composite accepts independently selected strength and uses zero units", async () => {
  const {controller, counts} = fixture();
  controller.setPhoto(true);
  const state = await controller.tryOnComposite(choice);
  assert.equal(state.stage, "preview");
  assert.equal(state.preview.source, "local");
  assert.equal(state.preview.simulation, true);
  assert.equal(state.preview.provider_calls, 0);
  assert.equal(state.preview.units_spent, 0);
  assert.equal(state.units, 0);
  assert.deepEqual(counts, {upload: 0, remote: 0, local: 1, remove: 0});
});

test("optional provider cannot upload without explicit adult and skin consent", async () => {
  const {controller, counts} = fixture({providerEnabled: () => true});
  controller.setPhoto(true);
  controller.chooseMode("youcam");
  await assert.rejects(controller.match(profile, "natural"), ConsentRequired);
  assert.equal(counts.upload, 0);
  assert.equal(counts.remote, 0);
  assert.equal(controller.state.stage, "error");
});

test("provider disabled even in selected YouCam mode falls back before any upload", async () => {
  const {controller, counts} = fixture({providerEnabled: () => false});
  controller.setPhoto(true);
  controller.chooseMode("youcam");
  const result = await controller.match(profile, "natural");
  assert.equal(result.localReason, "provider_disabled");
  assert.equal(result.stage, "results");
  assert.equal(result.units, 0);
  assert.equal(counts.upload, 0);
});

for (const status of [0, 429, 502, 503, 504]) {
  test(`recoverable provider ${status}: local alternatives, no automatic retry`, async () => {
    const {controller, counts} = fixture({providerEnabled: () => true, fail: status});
    controller.setPhoto(true);
    controller.chooseMode("youcam");
    controller.grant(true, true, false);
    const result = await controller.match(profile, "natural");
    assert.equal(result.stage, "results");
    assert.equal(result.localReason, "provider_unavailable");
    assert.equal(result.units, 0);
    assert.equal(counts.upload, 2, "one encode and one upload, not retries");
    assert.equal(counts.remote, 1, "ambiguous charge is not retried");
    assert.ok(result.results.length > 0);
    assert.equal(controller.pendingUploadedPhotos(), 1);
    assert.equal(await controller.forgetServerPhoto(), true);
    assert.equal(counts.remove, 1);
    assert.equal(controller.pendingUploadedPhotos(), 0);
  });
}

test("local photo replacement resets consent, preview, analysis and task generation", async () => {
  const {controller, counts} = fixture();
  controller.setPhoto(true);
  await controller.tryOnComposite(choice);
  assert.equal(controller.state.stage, "preview");
  controller.setPhoto(true);
  assert.equal(controller.state.stage, "consent");
  assert.equal(controller.state.preview, null);
  assert.equal(controller.state.photoId, null);
  assert.equal(controller.state.units, 0);
  await controller.match(profile, "satin");
  assert.equal(controller.state.stage, "results");
  controller.setPhoto(false);
  await assert.rejects(controller.match(profile, "natural"), /Choose a photo/);
  assert.equal(controller.state.stage, "photo");
  assert.equal(counts.upload, 0);
  assert.equal(counts.remote, 0);
});

test("fictional bag rejects overspending inputs and never enables a checkout", () => {
  const bag = new SampleBag(catalogue);
  const first = product("lip");
  const second = product("blush");
  assert.equal(bag.snapshot().items, 0);
  assert.equal(bag.add(first.id, 2).items, 2);
  assert.equal(bag.add(second.id).items, 3);
  assert.equal(bag.wish(first.id, true).wishlist.length, 1);
  assert.equal(bag.remove(first.id, 1).items, 2);
  const snapshot = bag.snapshot();
  assert.equal(snapshot.total_cents, first.price_cents + second.price_cents);
  assert.equal(snapshot.checkout_enabled, false);
  assert.equal(snapshot.tax_cents, null);
  assert.equal(snapshot.shipping_cents, null);
  assert.match(snapshot.checkout_message, /no order or payment/i);
  assert.throws(() => bag.add(first.id, -1));
  assert.throws(() => bag.add(first.id, 2.5));
  assert.throws(() => bag.add(first.id, 6));
  assert.throws(() => bag.add("malicious-outside-catalogue"));
  assert.equal(bag.snapshot().items, 2, "failed additions are atomic");
  assert.equal(bag.clear().items, 0);
  assert.equal(money(1234).includes("12.34"), true);
});

test("shareable look is only a list of canonical fictional sample IDs and strengths", () => {
  const shelf = new LookShelf(catalogue);
  for (const row of choice) shelf.add(row.product_id, row.strength);
  const plan = shelf.plan();
  assert.deepEqual(plan.steps.map((step) => step.effect), ["foundation", "blush", "lip"]);
  const json = plan.exportRecipe();
  const raw = JSON.parse(json);
  assert.equal(raw.format, "beljour-sample-look/1");
  assert.deepEqual(Object.keys(raw).sort(), ["format", "steps"]);
  assert.ok(!/photo_id|data:image|bearer|credential|access_token/i.test(json));
  assert.equal(plan.public().photo_included, false);
  assert.equal(plan.public().credentials_included, false);
  assert.equal(plan.public().checkout_enabled, false);
  assert.equal(plan.toRequest(photoId, true).local_only, true);
  assert.equal(LookPlan.importRecipe(catalogue, json).exportRecipe(), json);
});

test("invalid imported sample recipes do not alter the current shelf", () => {
  const shelf = new LookShelf(catalogue);
  shelf.add(product("lip").id, 50);
  const before = shelf.plan().exportRecipe();
  const mutation = [
    "not-json",
    JSON.stringify({format: "old-recipe/1", steps: choice}),
    JSON.stringify({format: "beljour-sample-look/1", steps: [{product_id: "unknown", strength: 50}]}),
    JSON.stringify({format: "beljour-sample-look/1", steps: [{...choice[0], access_token: "synthetic"}]}),
    JSON.stringify({format: "beljour-sample-look/1", steps: [{...choice[0], strength: 103}]}),
  ];
  for (const text of mutation) {
    assert.throws(() => shelf.import(text));
    assert.equal(shelf.plan().exportRecipe(), before);
  }
});
