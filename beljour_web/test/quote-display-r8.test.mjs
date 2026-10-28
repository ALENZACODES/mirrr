// R8 quote wording stays truthful on both compatibility and new styling screens.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteDisplay } from "../dist/js/ui/quote-display.js";
const sample = (changes = {}) => ({ feature: "hair-style", cached: false, live: true, units: 2,
  scope: "youcam", data_flow: "sent to YouCam, deleted after the result", visit_units_left: 6,
  visit_units_used: 0, visit_units_cap: 6, visit_units_after: 4, daily_units_left: 150,
  pricing_verified: false, can_apply: true, unavailable_reason: null, is_estimate: true,
  ...changes });

test("live provider quote shows units and remaining per-visit budget", () => {
  const shown = quoteDisplay(sample());
  assert.equal(shown.text, "2 units · 6 left this visit");
  assert.match(shown.detail, /sent to YouCam/);
  assert.match(shown.detail, /estimate, not reserved/);
  assert.equal(shown.scope, "youcam");
  assert.equal(shown.available, true);
});

test("one unit has singular grammar and a depleted allowance is explicit", () => {
  assert.equal(quoteDisplay(sample({ units: 1 })).text, "1 unit · 6 left this visit");
  const depleted = quoteDisplay(sample({ visit_units_left: 0, can_apply: false, unavailable_reason: "No units left" }));
  assert.equal(depleted.text, "2 units · 0 left this visit");
  assert.equal(depleted.available, false);
  assert.match(depleted.detail, /No units left/);
});

test("unlimited allowance doesn't invent a number of available units", () => {
  const shown = quoteDisplay(sample({ visit_units_left: null, visit_units_cap: null, visit_units_after: null }));
  assert.match(shown.text, /no per-visit limit/);
  assert.doesNotMatch(shown.text, /null|Infinity/);
});

test("local action does not promise third-party processing or charge", () => {
  const shown = quoteDisplay(sample({ feature: "enhance", units: 0, scope: "local", live: false,
    data_flow: "stays on this device" }));
  assert.equal(shown.text, "on device · free");
  assert.equal(shown.detail, "stays on this device");
});

test("saved provider results are free even after the visit allowance is used up", () => {
  const shown = quoteDisplay(sample({ cached: true, units: 0, visit_units_left: 0 }));
  assert.equal(shown.text, "saved result · free");
  assert.equal(shown.available, true);
});

test("older recorded examples keep their own origin, never masquerade as a live task", () => {
  const shown = quoteDisplay(sample({ feature: "skin-analysis", units: 0, cached: true,
    scope: "recorded_only", data_flow: "saved example; no new request is sent" }));
  assert.equal(shown.text, "saved result · free");
  assert.match(shown.detail, /no new request/);
  const blocked = quoteDisplay(sample({ cached: false, scope: "recorded_only", can_apply: false,
    unavailable_reason: "This saved example is unavailable" }));
  assert.equal(blocked.text, "unavailable");
  assert.match(blocked.detail, /unavailable/);
  assert.equal(blocked.available, false);
});

test("offline demo status is not described as live availability", () => {
  const shown = quoteDisplay(sample({ live: false, can_apply: false, unavailable_reason: "Live styling is off" }));
  assert.equal(shown.text, "demo only");
  assert.match(shown.detail, /off/);
  assert.equal(shown.available, false);
});

test("quote rejects broken pricing instead of silently showing it", () => {
  for (const units of [-1, NaN, 1.25, Infinity, 10001]) assert.throws(() => quoteDisplay(sample({ units })), /units/);
});

// Server-side compatibility engines must not claim that uploads stayed on device.
test("a local server quote names its actual processing boundary", () => {
  const shown = quoteDisplay(sample({ feature: "skin", units: 0, scope: "local", live: false,
    data_flow: "processed locally on this server; no YouCam call" }));
  assert.equal(shown.text, "local server · free");
  assert.match(shown.detail, /this server/);
});
