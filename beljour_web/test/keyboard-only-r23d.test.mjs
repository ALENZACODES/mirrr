// Keyboard-only DOM expectations; physical screen-reader certification remains pending.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { mountJudgeMode } from "../dist/js/layout/judge-mode.js";
import { reportPage } from "./judge-fixtures-cp3-r22d.mjs";
import { control } from "./judge-fixtures-r22d.mjs";

const read = (name) => readFileSync(new URL(name, import.meta.url), "utf8");

async function press(host, action) {
  const button = control(host, action);
  assert.ok(button, `${action} must be keyboard accessible`);
  await button.click();
}

test("Home, Studio, Trust and classic page include an accessible skip target", () => {
  for (const page of ["home.html", "studio.html", "trust.html", "index.html"]) {
    const html = read(`../${page}`);
    assert.match(html, /href="#(?:lg-main|main|shell-editor|content)"|href="#shell-main"/i, page);
    assert.match(html, /<main\b/i, page);
  }
});

test("Judge Mode remains operable through button and native input events", async () => {
  const app = reportPage();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, "sample");
    await press(app.host, "next");
    for (const name of ["local", "hair", "face", "mock"]) {
      const checkbox = control(app.host, `consent-${name}`);
      assert.ok(checkbox);
      checkbox.checked = true;
      await checkbox.dispatch("change");
    }
    await press(app.host, "next");
    const strength = control(app.host, "edit-strength");
    assert.ok(strength);
    assert.equal(strength.type, "range");
    assert.equal(strength.getAttribute("aria-valuetext"), "5.0 of 5.0");
    strength.value = "3.4";
    await strength.dispatch("input");
    assert.equal(mode.session.snapshot.strength, 3.4);
    await press(app.host, "hair-chestnut");
    await press(app.host, "next");
    assert.equal(mode.session.snapshot.step, "face");
    assert.equal(control(app.host, "edit-strength").value, "3.4");
    mode.dispose();
  } finally { app.teardown(); }
});

test("guide shortcut does not steal arrow keys from the strength input", async () => {
  const app = reportPage();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, "sample");
    await press(app.host, "next");
    await press(app.host, "skip");
    assert.equal(mode.session.snapshot.step, "hair");
    await app.host.dispatch("keydown", { key: "ArrowRight", target: { tagName: "INPUT" } });
    assert.equal(mode.session.snapshot.step, "hair");
    await app.host.dispatch("keydown", { key: "?" });
    assert.match(app.host.textContent, /What to show:/);
    mode.dispose();
  } finally { app.teardown(); }
});

test("all sensitive actions provide an explicit keyboard focus target", () => {
  const judge = read("../src/layout/judge-mode.ts");
  const lock = read("../src/ui/shell/identity-controls.ts");
  const timing = read("../src/diagnostics/timing-page.ts");
  assert.match(judge, /heading\.focus\(/);
  assert.match(judge, /querySelectorAll<HTMLElement>\("button"\)/);
  assert.match(lock, /input\.addEventListener|range\.addEventListener/);
  assert.match(timing, /\.type = "button"/);
  assert.match(timing, /aria-live/);
});
