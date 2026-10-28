// Paywall and export demo screens (round 2 plan §5-6): demo only, no network, shown only at
// Save, never locking Rescue, sliders, Trust or Delete; export label and file-name preview.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as W from "../dist/js/screens/paywall.js";
import * as E from "../dist/js/screens/export.js";
import { MemoryStore } from "../dist/js/session.js";

test("the plan reads 3-day free trial, then $5.99/month or $49.99/year, and says it is a demo", () => {
  const copy = W.paywallCopy();
  assert.equal(copy.trial, "3-day free trial, then $5.99/month or $49.99/year.");
  assert.match(copy.demo, /^Demo — no billing\./);
  assert.match(copy.demo, /no card/);
  assert.deepEqual(copy.plans.map((p) => p.price), ["$5.99/month", "$49.99/year"]);
  assert.match(copy.plans[1].note, /About \$4\.17 a month, 30% less than monthly/);
  for (const f of ["Bad Day Rescue", "Every slider", "Trust Centre", "Delete my data"]) assert.ok(copy.free.includes(f), f);
  assert.ok(copy.actions.some((a) => a.id === "save-free"), "she can always save without Pro");
});

test("the paywall appears only at Save, never over a preview or a free tool", () => {
  for (const moment of ["preview", "slider", "rescue", "trust", "delete", "open"]) {
    assert.equal(W.paywallDecision({ moment, usesPro: true }).show, false, moment);
  }
  assert.equal(W.paywallDecision({ moment: "save", usesPro: false }).show, false);
  assert.equal(W.paywallDecision({ moment: "save", usesPro: true }).show, true);
  assert.equal(W.paywallDecision({ moment: "save", usesPro: true, trialStarted: true }).show, false);
  for (const f of ["rescue", "sliders", "trust", "delete", "preview"]) assert.equal(W.isAlwaysFree(f), true, f);
  assert.equal(W.isAlwaysFree("pro-preset"), false);
});

test("the demo trial lives in this browser only and counts down 3 days", () => {
  let now = Date.parse("2026-10-23T12:00:00Z");
  const trial = new W.DemoTrial(new MemoryStore(), () => now);
  assert.equal(trial.daysLeft(), null);
  trial.start();
  assert.equal(trial.daysLeft(), 3);
  now += 2.5 * 86_400_000;
  assert.equal(trial.daysLeft(), 1);
  now += 86_400_000;
  assert.equal(trial.active, false);
});

test("paywall and export screen code makes no network call and names no payment provider", () => {
  for (const file of ["src/screens/paywall.ts", "src/screens/export.ts", "src/save/export.ts", "src/save/looks.ts", "src/save/batch.ts"]) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|from "\.\.\/api\.js"/, file);
    assert.doesNotMatch(src, /stripe|paypal|ApplePaySession|PaymentRequest|google ?pay|in-app purchase/i, file);
  }
});

test("export preview: label, file names and plain notes", () => {
  const plan = E.exportPlan({ lookName: "Date Night", count: 6, simulationLabel: true, isSimulation: true });
  assert.equal(plan.label, "Simulation");
  assert.deepEqual(plan.files.slice(0, 2), ["GoodLookin_DateNight_01.jpg", "GoodLookin_DateNight_02.jpg"]);
  assert.match(plan.labelNote, /bottom-left corner/);
  assert.match(plan.metadata, /Location and camera details are removed/);
  assert.match(plan.destination, /Good Lookin'.*6 photos.*originals are not changed/);
  assert.equal(plan.confirm, "Save 6 photos");
  const off = E.exportPlan({ lookName: "x", count: 1, simulationLabel: false, isSimulation: true });
  assert.equal(off.label, null);
  assert.match(off.labelNote, /turned off in your Trust Centre/);
  const fix = E.exportPlan({ lookName: "x", count: 1, simulationLabel: true, isSimulation: false });
  assert.equal(fix.label, null, "photo fixes are never labelled simulations");
  assert.equal(fix.confirm, "Save photo");
  assert.throws(() => E.exportPlan({ lookName: "x", count: 0, simulationLabel: true, isSimulation: true }), /1 to 50/);
});

test("the editor keeps two named saves: Save photo and Save as My Look", () => {
  const html = readFileSync(new URL("../studio.html", import.meta.url), "utf8");
  assert.match(html, /id="shell-download"[^>]*>Save photo/);
  assert.match(html, /id="lg-save-look"[^>]*>Save as My Look/);
});
