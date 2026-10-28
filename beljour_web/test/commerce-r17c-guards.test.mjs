/** Offline injection and response-integrity tests for commerce. Author: John Khan. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expandCatalogue, findProduct } from "../dist/js/commerce/catalogue.js";
import { rank } from "../dist/js/commerce/ranking.js";
import { cosmeticScores, decodeMatch, decodeTryOn, InvalidCommerceResponse, validateImageDataUrl } from "../dist/js/commerce/guards.js";

const source = JSON.parse(readFileSync(new URL("../dist/commerce-catalogue.json", import.meta.url), "utf8"));
const items = expandCatalogue(source);
const photo = "b".repeat(64);
const profile = { depth: 9, undertone: "cool", confidence: "estimate", evidence: "W6 measured estimate", lightness: 36 };
const allowed = new Set(source.concerns);
const IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pSsAAAAASUVORK5CYII=";
const deep = (value) => structuredClone(value);
function rawMatch() {
  const scores = { redness: 19, moisture: 47 };
  return { photo_id: photo, source: "youcam", units_spent: 9, cached: false,
    fallback: null, profile: deep(profile), cosmetic_concerns: scores, message: "A result was measured",
    recommendations: deep(rank(items, profile, scores, "satin")) };
}
function decoded(value) { return decodeMatch(value, items, photo, "satin", allowed); }
function rawPreview() {
  return { image: IMAGE, image_type: "image/png", source: "youcam", simulation: true,
    product: deep(findProduct(items, "quiet-veil-09-cool")), label: "Provider simulation",
    notice: "Provider response", provider_calls: 1, units_spent: 5, cached: false };
}

test("real synthetic mock match is accepted and product references are canonical", () => {
  const original = rawMatch();
  const result = decoded(original);
  assert.deepEqual(result.recommendations, rank(items, profile, original.cosmetic_concerns, "satin"));
  assert.strictEqual(result.recommendations[0].product, findProduct(items, result.recommendations[0].product.id));
  assert.equal(result.source, "youcam");
  assert.equal(result.units_spent, 9);
  assert.notEqual(result.message, "Provider-sponsored sale");
  assert.equal(result.note.includes("Fictional"), true);
});

test("response rejects injected brands, prices, swatches, duplicate IDs and unseen SKUs", () => {
  for (const [field, change] of [
    ["brand name", (m) => { m.recommendations[0].product.name = "Unapproved Lipstick Ltd"; }],
    ["counterfeit price", (m) => { m.recommendations[0].product.price_cents = 0; }],
    ["swatch swap", (m) => { m.recommendations[0].product.swatch = "#000000"; }],
    ["unseen product", (m) => { m.recommendations[0].product.id = "unlisted-shadow-09-cool"; }],
    ["duplicate", (m) => { m.recommendations[1] = deep(m.recommendations[0]); }],
    ["fake provider label", (m) => { m.recommendations[0].product.sample = false; }],
  ]) {
    const altered = rawMatch(); change(altered);
    assert.throws(() => decoded(altered), InvalidCommerceResponse, field);
  }
});

test("matching response protects photo binding, provider accounting and provenance", () => {
  const modifications = [
    (m) => { m.photo_id = "a".repeat(64); },
    (m) => { m.photo_id = "not a hash"; },
    (m) => { m.units_spent = Number.NaN; },
    (m) => { m.units_spent = -1; },
    (m) => { m.cached = true; },
    (m) => { m.source = "sponsored"; },
    (m) => { m.source = "local"; },
    (m) => { m.profile.depth = 0; },
    (m) => { m.profile.undertone = "exotic"; },
    (m) => { m.profile.lightness = Infinity; },
    (m) => { m.profile.confidence = "claimed-verified"; },
    (m) => { m.profile.evidence = "x".repeat(200); },
    (m) => { m.cosmetic_concerns.redness = 150; },
    (m) => { m.cosmetic_concerns.fake_diagnosis = 100; },
    (m) => { m.cosmetic_concerns.moisture = true; },
    (m) => { m.cosmetic_concerns = [99]; },
  ];
  for (const change of modifications) {
    const item = rawMatch(); change(item);
    assert.throws(() => decoded(item), InvalidCommerceResponse);
  }
});

test("severe or forged provider recommendations are rejected before display", () => {
  const modifications = [
    (m) => { m.recommendations.reverse(); },
    (m) => { m.recommendations.splice(0, 1); },
    (m) => { m.recommendations.push(m.recommendations[0]); },
    (m) => { m.recommendations = "provider products"; },
    (m) => { m.recommendations = []; },
    (m) => { m.recommendations[0] = null; },
    (m) => { m.profile = null; },
    (m) => { m.recommendations = Array.from({ length: 17 }, () => m.recommendations[0]); },
  ];
  for (const change of modifications) {
    const item = rawMatch(); change(item);
    assert.throws(() => decoded(item), InvalidCommerceResponse);
  }
});

test("provider cache and measured branch have different accounting", () => {
  const item = rawMatch();
  item.cached = true;
  item.units_spent = 0;
  assert.equal(decoded(item).cached, true);
  item.source = "local";
  item.cosmetic_concerns = {};
  item.recommendations = rank(items, profile, {}, "satin");
  assert.equal(decoded(item).source, "local");
});

test("cosmetic score map remains a bounded safe immutable contract at the boundary", () => {
  assert.deepEqual({ ...cosmeticScores({ moisture: 35 }, allowed) }, { moisture: 35 });
  for (const score of [NaN, Infinity, -1, 101, true, "0", {}, null]) {
    assert.throws(() => cosmeticScores({ moisture: score }, allowed), InvalidCommerceResponse);
  }
  assert.throws(() => cosmeticScores(Object.fromEntries(Array.from({ length: 33 }, (_, n) => [String(n), 0])), allowed));
});

test("preview result trusts original catalogue product and only safe encoded images", () => {
  const expected = findProduct(items, "quiet-veil-09-cool");
  const parsed = decodeTryOn(rawPreview(), expected);
  assert.strictEqual(parsed.product, expected);
  assert.equal(parsed.image, IMAGE);
  assert.notEqual(parsed.label, "Provider simulation");
  assert.match(parsed.notice, /simulation/i);
});

test("preview response will not display a mismatched SKU, external URL or forged metadata", () => {
  const original = findProduct(items, "quiet-veil-09-cool");
  const cases = [
    (item) => { item.product.name = "Brand endorsement"; },
    (item) => { item.product.id = "quiet-veil-09-warm"; },
    (item) => { item.image = "https://example.com/tracker?face=1"; },
    (item) => { item.image = "data:text/html;base64,PHNjcmlwdD4="; },
    (item) => { item.image = "data:image/png;base64,abc"; },
    (item) => { item.image_type = "image/jpeg"; },
    (item) => { item.simulation = false; },
    (item) => { item.source = "provider-brand"; },
    (item) => { item.units_spent = 999_999; },
    (item) => { item.provider_calls = 4; },
    (item) => { item.cached = true; },
    (item) => { item.fallback = "<script>"; },
  ];
  for (const change of cases) {
    const item = rawPreview(); change(item);
    assert.throws(() => decodeTryOn(item, original), InvalidCommerceResponse);
  }
});

test("local fallback preview costs no units and advertises its real source", () => {
  const item = rawPreview(); item.source = "local"; item.units_spent = 0; item.provider_calls = 0;
  const result = decodeTryOn(item, findProduct(items, item.product.id));
  assert.equal(result.provider_calls, 0);
  assert.match(result.notice, /locally placed/);
  item.units_spent = 5;
  assert.throws(() => decodeTryOn(item, findProduct(items, item.product.id)));
});

test("static data URL validator rejects huge or improperly encoded provider images", () => {
  assert.equal(validateImageDataUrl(IMAGE), IMAGE);
  for (const bad of ["", "data:image/svg+xml;base64,PHN2Zz4=", "data:image/png;base64,Z",
    "data:image/gif;base64,AAAA", "data:image/png;base64,AAAA\\nAAAA", "data:image/png;base64,###",
    "data:image/jpeg;base64," + "A".repeat(18_000_001)]) {
    assert.throws(() => validateImageDataUrl(bad), InvalidCommerceResponse);
  }
});
