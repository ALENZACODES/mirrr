// R19 C full user-facing look plan and network boundary, all locally mocked.
// Every product is fictional; image strings are inert synthetic bytes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandCatalogue } from "../dist/js/commerce/catalogue.js";
import { LookPlan, LookShelf } from "../dist/js/commerce/look.js";
import { decodeLookTryOn, InvalidCommerceResponse } from "../dist/js/commerce/guards.js";
import { CommerceController, ConsentRequired } from "../dist/js/commerce/controller.js";

const source = JSON.parse(readFileSync("../api/plumb_api/commerce/catalogue.json", "utf8"));
const catalogue = expandCatalogue(source);
const sample = (effect) => catalogue.find((p) => p.vto === effect);
const standard = [
  {product_id: sample("lip").id, strength: 35},
  {product_id: sample("foundation").id, strength: 60},
  {product_id: sample("blush").id, strength: 50},
];
const syntheticData = "data:image/jpeg;base64," + "QUJD".repeat(80);
const photoId = "b".repeat(64);

function serverLook(plan, {source = "youcam", units = 1, cached = false} = {}) {
  return {
    photo_id: photoId,
    image: syntheticData,
    image_type: "image/jpeg",
    source,
    simulation: true,
    notice: "This is an unverified sample try-on simulation.",
    label: "Sample makeup VTO simulation",
    product: plan.steps[0].product,
    products: plan.steps.map((s) => s.product),
    steps: plan.steps.map((s) => ({product_id: s.product.id, effect: s.effect,
      swatch: s.product.swatch, strength: s.strength})),
    sample_subtotal_cents: plan.subtotalCents,
    checkout_enabled: false,
    provider_calls: cached ? 0 : 1,
    units_spent: units,
    cached,
  };
}
function makeRemote(overrides = {}) {
  const calls = {upload: 0, look: 0};
  const remote = {
    async upload() { calls.upload++; return {photo_id: photoId}; },
    async tryOnLook(request) {
      calls.look++;
      assert.equal(request.photo_id, photoId);
      assert.equal(request.consent.scope, "makeup");
      const plan = LookPlan.make(catalogue, request.steps);
      return serverLook(plan);
    },
    async match() { throw Error("Unexpected skin request"); },
    async tryOn() { throw Error("Unexpected single-product request"); },
    async bag() { throw Error("Unexpected bag request"); },
    async add() { throw Error("Unexpected bag request"); },
    async remove() { throw Error("Unexpected bag request"); },
    async wish() { throw Error("Unexpected bag request"); },
    async clear() { throw Error("Unexpected bag request"); },
    async removePhoto() { throw Error("Unexpected delete"); },
    ...overrides,
  };
  return {remote, calls};
}
function makeMedia() {
  const stats = {cleaned: 0, local: 0};
  return {stats, media: {
    async upload() { stats.cleaned++; return new Blob(["synthetic"], {type: "image/jpeg"}); },
    async localPreview(product) { return {image: syntheticData, product, source: "local",
      simulation: true, notice: "Approximate local simulation", label: "Local sample",
      provider_calls: 0, units_spent: 0, cached: false}; },
    async localCompositePreview(steps) { stats.local++; return {image: syntheticData,
      product: steps[0].product, source: "local", simulation: true,
      notice: "Approximate composite sample", label: "Local sample",
      provider_calls: 0, units_spent: 0, cached: false}; },
  }};
}

function consentedController(now = () => 1000, providerEnabled = () => true, remoteOver = {}) {
  const {remote, calls} = makeRemote(remoteOver);
  const {media, stats} = makeMedia();
  const controller = new CommerceController(catalogue, remote, media, now, {
    providerEnabled, allowedConcerns: new Set(source.concerns),
  });
  controller.setPhoto(true);
  controller.chooseMode("youcam");
  return {controller, calls, stats};
}

test("look recipes sort into foundation, blush and lips with real integer sample cents", () => {
  const plan = LookPlan.make(catalogue, standard);
  assert.deepEqual(plan.steps.map((s) => s.effect), ["foundation", "blush", "lip"]);
  assert.equal(plan.subtotalCents, plan.steps.reduce((sum, s) => sum + s.product.price_cents, 0));
  assert.equal(plan.public().checkout_enabled, false);
  assert.equal(plan.public().photo_included, false);
  assert.equal(plan.public().credentials_included, false);
  assert.deepEqual(LookPlan.importRecipe(catalogue, plan.exportRecipe()).steps, plan.steps);
  assert.ok(!/photo|session|credential|base64/i.test(plan.exportRecipe()));
});

test("no more than one product per effect, no purchases, no arbitrary product IDs", () => {
  assert.throws(() => LookPlan.make(catalogue, []));
  assert.throws(() => LookPlan.make(catalogue, [...standard, standard[0]]));
  assert.throws(() => LookPlan.make(catalogue, [standard[0], standard[0]]));
  assert.throws(() => LookPlan.make(catalogue, [{product_id: "unsupported-sku", strength: 50}]));
  assert.throws(() => LookPlan.make(catalogue, [{product_id: catalogue.find((p) => p.vto === null).id,
    strength: 50}]));
});

test("effect strength is strict: no coercion of NaN, booleans or fractions", () => {
  for (const strength of [-1, 101, NaN, Infinity, -Infinity, 1.5, null, true, "50"]) {
    assert.throws(() => LookPlan.make(catalogue, [{product_id: sample("lip").id, strength}]));
  }
  for (const strength of [0, 1, 50, 99, 100]) {
    assert.equal(LookPlan.make(catalogue, [{product_id: sample("lip").id, strength}]).steps[0].strength, strength);
  }
});

test("look import rejects extra fields, unknown catalogue IDs, photo injection and huge input", () => {
  const original = LookPlan.make(catalogue, standard).exportRecipe();
  for (const invalid of ["", "not JSON", original.replace("beljour-sample-look/1", "beljour-sample-look/0"),
    JSON.stringify({format: "beljour-sample-look/1", steps: [], photo: syntheticData}),
    JSON.stringify({format: "beljour-sample-look/1", steps: [{product_id: sample("lip").id, strength: 10, secret: "bad"}]}),
    "0".repeat(2049)]) {
    assert.throws(() => LookPlan.importRecipe(catalogue, invalid));
  }
});

test("look shelf edits atomically, can remove a slot, and retains the latest selection", () => {
  const shelf = new LookShelf(catalogue);
  assert.equal(shelf.empty, true);
  shelf.add(sample("lip").id, 15);
  shelf.add(sample("lip").id, 15);
  assert.equal(shelf.version, 1);
  shelf.add(sample("lip").id, 35);
  assert.equal(shelf.version, 2);
  assert.equal(shelf.list()[0].strength, 35);
  shelf.add(sample("blush").id, 42);
  assert.deepEqual(shelf.list().map((s) => s.effect), ["blush", "lip"]);
  const snapshot = shelf.plan().exportRecipe();
  assert.throws(() => shelf.import('{"foo":123}'));
  assert.equal(shelf.plan().exportRecipe(), snapshot, "malformed import must not wipe active recipe");
  shelf.remove("lip");
  assert.equal(shelf.list().length, 1);
  shelf.clear();
  assert.equal(shelf.empty, true);
});

test("look request cannot contain non-session private photo identifiers", () => {
  const plan = LookPlan.make(catalogue, standard);
  assert.throws(() => plan.toRequest("x", true));
  const encoded = plan.toRequest(photoId, false, {version: "beljour-consent/1",
    adult: true, scope: "makeup", photo_id: photoId, given_at: 1000});
  assert.deepEqual(encoded.steps, plan.steps.map((s) => ({product_id: s.product.id, strength: s.strength})));
  assert.equal(encoded.photo_id, photoId);
  assert.equal(encoded.consent.scope, "makeup");
});

test("server cannot forge a product, price, swatch, effect, total or checkout", () => {
  const plan = LookPlan.make(catalogue, standard);
  const legitimate = serverLook(plan);
  const decoded = decodeLookTryOn(legitimate, plan);
  assert.equal(decoded.sample_subtotal_cents, plan.subtotalCents);
  assert.deepEqual(decoded.products.map((p) => p.id), plan.steps.map((s) => s.product.id));
  for (const mutation of [
    {products: legitimate.products.map((p, i) => i ? p : {...p, price_cents: 999999})},
    {products: [...legitimate.products, legitimate.products[0]]},
    {steps: legitimate.steps.map((s, i) => i ? s : {...s, swatch: "#ffffff"})},
    {steps: legitimate.steps.map((s, i) => i ? s : {...s, strength: 100})},
    {sample_subtotal_cents: 10},
    {checkout_enabled: true},
    {source: "acme"},
    {simulation: false},
    {image: "https://malicious.example/photo.jpg"},
  ]) {
    assert.throws(() => decodeLookTryOn({...legitimate, ...mutation}, plan), InvalidCommerceResponse);
  }
});

test("provider mode fails closed before upload without fresh scoped consent", async () => {
  const {controller, calls, stats} = consentedController();
  await assert.rejects(controller.tryOnComposite(standard), ConsentRequired);
  assert.equal(calls.upload, 0);
  assert.equal(calls.look, 0);
  assert.equal(stats.cleaned, 0);
  controller.grant(true, true, false); // Skin opt-in does not grant makeup rights.
  await assert.rejects(controller.tryOnComposite(standard), ConsentRequired);
  assert.equal(calls.upload, 0);
});

test("provider mode with makeup consent uploads once then runs one combined task", async () => {
  const {controller, calls, stats} = consentedController();
  controller.grant(true, false, true);
  const a = await controller.tryOnComposite(standard);
  assert.equal(a.stage, "preview");
  assert.equal(a.preview.source, "youcam");
  assert.equal(a.preview.units_spent, 1);
  assert.equal(calls.upload, 1);
  assert.equal(calls.look, 1);
  assert.equal(stats.cleaned, 1);
  assert.equal(stats.local, 0);
  const b = await controller.tryOnComposite(standard);
  assert.equal(b.stage, "preview");
  assert.equal(calls.upload, 1, "same photo must reuse the transient server id");
  assert.equal(calls.look, 2);
});

test("consent expires after 30 minutes; replacing photo revokes it synchronously", async () => {
  let clock = 1000;
  const {controller, calls} = consentedController(() => clock);
  controller.grant(true, true, true);
  clock += 30 * 60 * 1000 + 1;
  await assert.rejects(controller.tryOnComposite(standard), ConsentRequired);
  controller.grant(true, true, true);
  controller.setPhoto(false);
  controller.setPhoto(true);
  await assert.rejects(controller.tryOnComposite(standard), ConsentRequired);
  assert.equal(calls.upload, 0);
});

test("provider-disabled mode and offline local mode make exactly zero remote requests", async () => {
  const {controller, calls, stats} = consentedController(() => 1000, () => false);
  const result = await controller.tryOnComposite(standard);
  assert.equal(result.preview.source, "local");
  assert.equal(result.preview.units_spent, 0);
  assert.equal(stats.local, 1);
  assert.equal(calls.upload, 0);
  assert.equal(calls.look, 0);
  controller.chooseMode("local");
  const second = await controller.tryOnComposite(standard);
  assert.equal(second.preview.source, "local");
  assert.equal(calls.upload, 0);
});

test("stale provider response cannot overwrite a new photo after the person switches images", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const {controller, calls} = consentedController(() => 1000, () => true, {
    async tryOnLook(body) { calls.look++; return gate.then(() => serverLook(LookPlan.make(catalogue, body.steps))); },
  });
  controller.grant(true, true, true);
  const pending = controller.tryOnComposite(standard);
  await new Promise((resolve) => setImmediate(resolve));
  controller.setPhoto(false);
  release();
  const current = await pending;
  assert.equal(current.stage, "photo");
  assert.equal(current.preview, null);
  assert.equal(calls.look, 1);
});

test("provider connection failures fail to labelled local simulation without retrying upload", async () => {
  // Simulate an ApiError mapped into CommerceNetworkError by remote.ts.
  const {CommerceNetworkError} = await import("../dist/js/commerce/remote.js");
  const {controller, calls, stats} = consentedController(() => 1000, () => true, {
    async tryOnLook() { calls.look++; throw new CommerceNetworkError("offline", 0, "Offline"); },
  });
  controller.grant(true, true, true);
  const result = await controller.tryOnComposite(standard);
  assert.equal(result.preview.source, "local");
  assert.equal(result.localReason, "provider_unavailable");
  assert.equal(calls.look, 1);
  assert.equal(stats.local, 1);
});

test("HTML exposes simulation, before/after, local mode and recipe actions", () => {
  const html = readFileSync("commerce.html", "utf8");
  for (const id of ["look-composer", "look-title", "look-steps", "look-subtotal",
    "preview-look", "clear-look", "export-look", "look-recipe", "import-look",
    "before-image", "after-image", "mode-local", "mode-youcam"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /Simulation only/);
  assert.match(html, /fictional cosmetic effects/);
  const remoteSource = readFileSync("src/commerce/remote.ts", "utf8");
  const apiSource = readFileSync("src/api.ts", "utf8");
  assert.doesNotMatch(remoteSource, /\bfetch\(/);
  assert.match(apiSource, /export async function commerceTransport/);
  assert.match(apiSource, /"\/api\/commerce\/look\/try-on"/);
});


test("simulation disclosure uses blue, keeping red for actual warnings and deletion", () => {
  const css = readFileSync(new URL("../commerce.css", import.meta.url), "utf8");
  const rule = css.match(/\.look-composer \.simulation-disclosure\s*\{([^}]*)\}/);
  assert.ok(rule, "the disclosure must have an explicit visible style");
  assert.match(rule[1], /var\(--lg-blue\)/);
  assert.doesNotMatch(rule[1], /#e1000f|var\(--lg-red\)/i);
});
