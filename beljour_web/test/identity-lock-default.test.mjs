// R23d Lane D: an ON-only client contract, never a fabricated Lane H engine.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { IdentityLockController, mockIdentityLock } from "../dist/js/layout/identity-lock.js";
import { renderIdentityControls } from "../dist/js/ui/shell/identity-controls.js";
import { mountStudioIdentity } from "../dist/js/ui/shell/studio-identity.js";
import { renderJudgeFace, renderJudgeHair, renderJudgeMock } from "../dist/js/ui/shell/judge-edits.js";
import { JudgeSession } from "../dist/js/layout/judge-session.js";
import { judgeDOM, control } from "./judge-fixtures-r22d.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

function judgeState() {
  const session = new JudgeSession();
  session.selectSource("sample");
  session.consent("local", true);
  session.consent("hair", true);
  session.consent("face", true);
  session.consent("mock", true);
  return session;
}

test("identity lock starts on even when its engine is unavailable", () => {
  const lock = new IdentityLockController();
  assert.equal(lock.snapshot.requested, true);
  assert.equal(lock.snapshot.status, "not-connected");
  assert.equal(lock.snapshot.looseness, 1);
  assert.equal(lock.snapshot.safeToClaimProtected, false);
  assert.match(lock.snapshot.label, /pending/);
  assert.equal("disable" in lock, false);
  assert.equal("toggle" in lock, false);
});

test("pose, hair, face and photo requests all retain their identity lock", () => {
  for (const kind of ["pose", "face", "hair", "photo", "mock"]) {
    const lock = mockIdentityLock();
    const result = lock.evaluate(kind, "revision-1", 3.0);
    assert.equal(result.requested, true);
    assert.equal(result.safeToClaimProtected, false, kind);
    assert.match(result.reason, /pending/);
    assert.ok(lock.snapshot.requested);
  }
});

test("fine tuning cannot disable the ON request", () => {
  const lock = new IdentityLockController();
  for (const level of [1.1, 2, 3.4, 4.9, 5]) {
    const changed = lock.tune(level);
    assert.equal(changed.looseness, level);
    assert.equal(changed.requested, true);
    assert.equal(changed.safeToClaimProtected, false);
  }
  assert.throws(() => lock.tune(0), RangeError);
  assert.throws(() => lock.tune(5.5), RangeError);
  assert.throws(() => lock.evaluate("pose", "", 3.0), RangeError);
  assert.throws(() => lock.evaluate("face", "revision", 3.02), RangeError);
  lock.reset();
  assert.equal(lock.snapshot.looseness, 1);
});

test("an explicit future public adapter must certify protection", () => {
  let lastRequest = null;
  const port = {
    kind: "identity-lock",
    evaluate(request) {
      lastRequest = request;
      return { requested: true, status: "enforced", safeToClaimProtected: true, reason: "checked" };
    },
  };
  const lock = new IdentityLockController(port);
  lock.tune(2.1);
  const result = lock.evaluate("pose", "photo-2", 3.0);
  assert.equal(result.safeToClaimProtected, true);
  assert.deepEqual(lastRequest, {
    family: "pose", photoRevision: "photo-2", strength: 3, looseness: 2.1, requested: true,
  });
  const failed = new IdentityLockController({ kind: "identity-lock", evaluate() {
    return { requested: true, status: "not-connected", safeToClaimProtected: false, reason: "unavailable" };
  } });
  assert.equal(failed.evaluate("face", "photo", 1).safeToClaimProtected, false);
});

test("Judge Mode creates an accessible strength and protected ON state", () => {
  const app = judgeDOM();
  try {
    const lock = mockIdentityLock();
    const changes = [];
    const rendered = renderIdentityControls(app.document, {
      family: "hair",
      photoRevision: "sample-1",
      strength: 2.4,
      controller: lock,
      onStrength: (n) => changes.push(n),
    });
    app.host.append(rendered.element);
    assert.match(app.host.textContent, /Identity lock: ON by default/);
    assert.match(app.host.textContent, /not connected/);
    assert.ok(!/Turn identity lock off/.test(app.host.textContent));
    assert.deepEqual([rendered.strength.min, rendered.strength.max, rendered.strength.step], ["1", "5", "0.1"]);
    assert.deepEqual([rendered.looseness.min, rendered.looseness.max, rendered.looseness.step], ["1", "5", "0.1"]);
    assert.equal(rendered.strength.getAttribute("aria-valuetext"), "2.4 of 5.0");
    rendered.strength.value = "3.2";
    rendered.strength.dispatch("input");
    assert.deepEqual(changes, [3.2]);
    rendered.looseness.value = "2.1";
    rendered.looseness.dispatch("input");
    assert.equal(lock.snapshot.looseness, 2.1);
    assert.equal(lock.snapshot.requested, true);
    rendered.destroy();
  } finally { app.close(); }
});

test("each Judge Mode edit screen exposes default-on protection and 1.0–5.0 strength", () => {
  for (const screen of ["hair", "face", "mock"]) {
    const app = judgeDOM();
    try {
      const session = judgeState();
      const image = { hasImage: false, original: app.document.createElement("canvas") };
      const lock = new IdentityLockController();
      const cache = { render: () => false };
      const enhance = {
        revision: 1, lock, cache,
        onStrength: (level) => session.setStrength(level),
        onTune: (level) => lock.tune(level),
      };
      if (screen === "hair") {
        renderJudgeHair(app.document, app.host, session.snapshot, image, () => {}, enhance);
      } else if (screen === "face") {
        renderJudgeFace(app.document, app.host, session.snapshot, image, () => {}, enhance);
      } else {
        renderJudgeMock(app.document, app.host, session.snapshot, image, () => {}, enhance);
      }
      assert.match(app.host.textContent, /Identity lock: ON by default/, screen);
      assert.match(app.host.textContent, /engine is not connected/, screen);
      const slider = control(app.host, "edit-strength");
      assert.ok(slider, `missing strength in ${screen}`);
      assert.deepEqual([slider.min, slider.max, slider.step], ["1", "5", "0.1"]);
      assert.ok(!app.host.textContent.includes("Disable identity lock"));
    } finally { app.close(); }
  }
});

test("Studio displays lock across selected edit families including posture", () => {
  const app = judgeDOM();
  try {
    const panel = app.document.createElement("section");
    app.host.append(panel);
    const ui = mountStudioIdentity(app.document, panel);
    assert.match(app.host.textContent, /Identity lock: ON/);
    assert.match(app.host.getAttribute("aria-label") ?? app.host.textContent, /Identity lock/i);
    assert.ok(ui.controller.snapshot.requested);
    assert.equal(ui.controller.snapshot.safeToClaimProtected, false);
    assert.equal(ui.root.dataset.identityLock, "on");
    const slider = ui.root.querySelector("input");
    assert.equal(slider.step, "0.1");
    ui.dispose();
  } finally { app.close(); }
  assert.match(read("../src/layout/editor-chrome.ts"), /mountStudioIdentity/);
  assert.match(read("../src/ui/shell/studio-identity.ts"), /including posture/);
});
