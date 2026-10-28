/** R23G consent, stale-response and quota-free fallback contracts.
 * All commerce fixtures are fictional; there is no live HTTP transport.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CommerceController, ConsentRequired } from "../../dist/js/commerce/controller.js";
import { expandCatalogue } from "../../dist/js/commerce/catalogue.js";
import { CommerceNetworkError } from "../../dist/js/commerce/remote.js";

const source = JSON.parse(readFileSync(
  new URL("../../../api/plumb_api/commerce/catalogue.json", import.meta.url), "utf8"));
const catalogue = expandCatalogue(source);
const picture = "a".repeat(64);
const cosmetics = catalogue.filter((product) => product.vto);
const lip = cosmetics.find((item) => item.vto === "lip");
const blush = cosmetics.find((item) => item.vto === "blush");
const colour = cosmetics.find((item) => item.vto === "foundation");
const look = [lip, blush, colour].map((item) => ({ product_id: item.id, strength: 25 }));
const profile = Object.freeze({
  depth: 4, undertone: "neutral", confidence: "manual", evidence: "Synthetic visitor selection",
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function preview(item, strength = 20) {
  return {
    image: "data:image/png;base64,QUJD", source: "local", simulation: true,
    notice: `Fictional ${item.id} at ${strength}`, product: item,
    provider_calls: 0, cached: false, units_spent: 0,
    label: "Synthetic colour illustration", fallback: null,
  };
}

function port({ encode, upload, match, tryOn, composite, local } = {}) {
  const calls = { encode: 0, upload: 0, match: 0, tryOn: 0, composite: 0, local: 0, deleted: [] };
  const remote = {
    async upload(data) {
      calls.upload++;
      assert.ok(data instanceof Blob);
      return upload ? upload(data) : { photo_id: picture };
    },
    async match(request) {
      calls.match++;
      assert.equal(request.consent.scope, "skin");
      return match ? match(request) : { malformed: "synthetic no true analysis" };
    },
    async tryOn(request) {
      calls.tryOn++;
      assert.equal(request.consent.scope, "makeup");
      return tryOn ? tryOn(request) : { malformed: true };
    },
    async tryOnLook(request) {
      calls.composite++;
      assert.equal(request.consent.scope, "makeup");
      return composite ? composite(request) : { malformed: true };
    },
    async removePhoto(photoId) {
      calls.deleted.push(photoId);
      return { deleted: true, results_removed: 0 };
    },
  };
  const media = {
    async upload() {
      calls.encode++;
      return encode ? encode() : new Blob([Uint8Array.of(1, 2, 3)], { type: "image/png" });
    },
    async localPreview(item, strength) {
      calls.local++;
      return local ? local(item, strength) : preview(item, strength);
    },
    async localCompositePreview(steps) {
      calls.local++;
      return local ? local(steps[0].product, steps[0].strength) : preview(steps[0].product);
    },
  };
  return { calls, remote, media };
}

function make(options = {}) {
  const ports = port(options);
  let enabled = true;
  let time = 10_000;
  const controller = new CommerceController(catalogue, ports.remote, ports.media,
    () => time, { providerEnabled: () => enabled, allowedConcerns: new Set(source.concerns) });
  const turnOn = () => {
    controller.setPhoto(true);
    controller.chooseMode("youcam");
    controller.grant(true, true, true);
  };
  return { ...ports, controller, turnOn, setEnabled: (value) => { enabled = value; },
    advance: (value) => {
      time += value;
    },
  };
}

async function tick() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

test("photo switch during canvas encoding prevents even the first remote upload", async () => {
  const gate = deferred();
  const { controller, calls, turnOn } = make({ encode: () => gate.promise });
  turnOn();
  const stale = controller.match(profile, "natural");
  await tick();
  assert.equal(calls.encode, 1);
  assert.equal(calls.upload, 0);
  controller.setPhoto(true);
  gate.resolve(new Blob([Uint8Array.of(9)], { type: "image/png" }));
  await stale;
  assert.equal(calls.upload, 0);
  assert.equal(calls.match, 0);
  assert.equal(controller.state.stage, "consent");
  assert.equal(controller.state.photoId, null);
});

test("mode change during encoding invalidates skin consent and never uploads", async () => {
  const gate = deferred();
  const { controller, calls, turnOn } = make({ encode: () => gate.promise });
  turnOn();
  const task = controller.match(profile, "natural");
  await tick();
  controller.chooseMode("local");
  gate.resolve(new Blob([Uint8Array.of(1)], { type: "image/png" }));
  await task;
  assert.equal(controller.state.mode, "local");
  assert.equal(controller.state.stage, "consent");
  assert.equal(calls.upload, 0);
  assert.equal(calls.match, 0);
  assert.equal(calls.local, 0);
});

test("photo switch during remote upload preserves ID for explicit later deletion", async () => {
  const gate = deferred();
  const { controller, calls, turnOn } = make({ upload: () => gate.promise });
  turnOn();
  const task = controller.match(profile, "satin");
  await tick();
  assert.equal(calls.encode, 1);
  assert.equal(calls.upload, 1);
  controller.setPhoto(true);
  gate.resolve({ photo_id: picture });
  await task;
  assert.equal(calls.match, 0);
  assert.equal(controller.state.photoId, null);
  assert.equal(controller.pendingUploadedPhotos(), 1);
  assert.equal(await controller.forgetServerPhoto(), true);
  assert.deepEqual(calls.deleted, [picture]);
  assert.equal(controller.pendingUploadedPhotos(), 0);
});

test("photo switch while provider skin task is pending drops the late response", async () => {
  const gate = deferred();
  const { controller, calls, turnOn } = make({ match: () => gate.promise });
  turnOn();
  const task = controller.match(profile, "dewy");
  await tick();
  assert.equal(calls.match, 1);
  controller.setPhoto(true);
  gate.resolve({ units_spent: 100, results: [{ malicious: true }] });
  await task;
  assert.equal(controller.state.stage, "consent");
  assert.equal(controller.state.units, 0);
  assert.equal(controller.state.profile, null);
  assert.equal(controller.state.results.length, 0);
  assert.equal(controller.pendingUploadedPhotos(), 1);
});

test("cancel while provider skin match is in flight cannot add stale results", async () => {
  const gate = deferred();
  const { controller, calls, turnOn } = make({ match: () => gate.promise });
  turnOn();
  const task = controller.match(profile, "natural");
  await tick();
  assert.equal(calls.match, 1);
  controller.cancel();
  gate.resolve({ units_spent: 100, recommendations: [{ id: "malicious" }] });
  await task;
  assert.equal(controller.state.units, 0);
  assert.equal(controller.state.results.length, 0);
  assert.equal(calls.match, 1);
});

test("disabled provider during queued skin request cannot start remote matching", async () => {
  const gate = deferred();
  const h = make({ upload: () => gate.promise });
  h.turnOn();
  const pending = h.controller.match(profile, "matte");
  await tick();
  h.setEnabled(false);
  gate.resolve({ photo_id: picture });
  await pending;
  assert.equal(h.calls.match, 0);
  assert.equal(h.controller.state.units, 0);
  assert.equal(h.controller.pendingUploadedPhotos(), 1);
});

test("local previews resolving in reverse order never replace the newer selected item", async () => {
  const first = deferred();
  const second = deferred();
  let count = 0;
  const { controller, calls } = make({ local: () => (++count === 1 ? first.promise : second.promise) });
  controller.setPhoto(true);
  const oldTask = controller.tryOn(lip.id, 20);
  const newTask = controller.tryOn(blush.id, 60);
  second.resolve(preview(blush, 60));
  await newTask;
  assert.equal(controller.state.selectedSku, blush.id);
  first.resolve(preview(lip, 20));
  await oldTask;
  assert.equal(controller.state.selectedSku, blush.id);
  assert.equal(controller.state.preview.product.id, blush.id);
  assert.equal(controller.state.units, 0);
  assert.equal(calls.local, 2);
});

test("local preview finishing after removing the photo cannot resurrect it", async () => {
  const gate = deferred();
  const { controller } = make({ local: () => gate.promise });
  controller.setPhoto(true);
  const previewTask = controller.tryOn(lip.id, 45);
  controller.setPhoto(false);
  gate.resolve(preview(lip, 45));
  await previewTask;
  assert.equal(controller.state.stage, "photo");
  assert.equal(controller.state.preview, null);
  assert.equal(controller.state.photoId, null);
});

test("local composite finishing after a mode change cannot restore stale products", async () => {
  const gate = deferred();
  const { controller } = make({ local: () => gate.promise });
  controller.setPhoto(true);
  const pending = controller.tryOnComposite(look);
  controller.chooseMode("local");
  gate.resolve(preview(lip));
  await pending;
  assert.equal(controller.state.stage, "consent");
  assert.equal(controller.state.preview, null);
});

test("expired consent is rejected without opening an upload transport", async () => {
  const h = make();
  h.turnOn();
  h.advance(30 * 60 * 1000 + 1);
  await assert.rejects(h.controller.match(profile, "natural"), ConsentRequired);
  await assert.rejects(h.controller.tryOn(lip.id, 35), ConsentRequired);
  assert.equal(h.calls.encode, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.tryOn, 0);
  assert.equal(h.calls.match, 0);
});

test("skin-only consent cannot open makeup remote preview", async () => {
  const h = make();
  h.controller.setPhoto(true);
  h.controller.chooseMode("youcam");
  h.controller.grant(true, true, false);
  await assert.rejects(h.controller.tryOn(lip.id, 25), ConsentRequired);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.tryOn, 0);
});

test("makeup-only consent cannot open skin match", async () => {
  const h = make();
  h.controller.setPhoto(true);
  h.controller.chooseMode("youcam");
  h.controller.grant(true, false, true);
  await assert.rejects(h.controller.match(profile, "satin"), ConsentRequired);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.match, 0);
});

for (const status of [0, 429, 502, 503, 504]) {
  test(`a ${status} remote failure produces only a local preview, not a provider retry`, async () => {
    const h = make({ tryOn: () => {
      throw new CommerceNetworkError("offline", status, "Synthetic provider unavailable");
    } });
    h.turnOn();
    const result = await h.controller.tryOn(lip.id, 25);
    assert.equal(result.stage, "preview");
    assert.equal(result.localReason, "provider_unavailable");
    assert.equal(result.preview.source, "local");
    assert.equal(result.preview.units_spent, 0);
    assert.equal(h.calls.tryOn, 1);
    assert.equal(h.calls.local, 1);
    assert.equal(h.calls.upload, 1);
  });
}

test("server deletion requires an acknowledgement and keeps outstanding IDs on failure", async () => {
  const h = make({ match: () => {
    throw new CommerceNetworkError("offline", 503, "Synthetic outage");
  } });
  h.turnOn();
  await h.controller.match(profile, "natural");
  assert.equal(h.controller.pendingUploadedPhotos(), 1);
  h.remote.removePhoto = async () => ({ deleted: false, results_removed: 0 });
  await assert.rejects(h.controller.forgetServerPhoto(), /could not confirm/);
  assert.equal(h.controller.pendingUploadedPhotos(), 1);
});

test("a false or throwing provider capability never attempts an upload", async () => {
  const h = make();
  h.turnOn();
  h.setEnabled(false);
  const state = await h.controller.match(profile, "natural");
  assert.equal(state.localReason, "provider_disabled");
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.match, 0);
});
