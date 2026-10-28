// R8 provenance is derived from actual layers and fixture scope, not guessed from price.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { documentEvidence, evidenceForLayer } from "../dist/js/ui/shell/evidence.js";
import { layer } from "../dist/js/ui/shell/layers.js";
import { makeSample, uploadedSource } from "../dist/js/ui/shell/demo.js";
import { AnnotationDraft } from "../dist/js/ui/shell/annotations.js";
import { Editor } from "../dist/js/ui/shell/controller.js";

test("empty sample is local, truthful and has no imaginary provider", () => {
  const info = documentEvidence(makeSample("low-light"), []);
  assert.equal(info.source, "drawn sample");
  assert.equal(info.localCount, 0);
  assert.equal(info.providerCount, 0);
  assert.equal(info.activeCount, 0);
  assert.equal(info.flow, "stays on this device");
  assert.equal(info.warnings.length, 0);
  assert.ok(info.badges.includes("Drawn example"));
});

test("local enhancement and simulations have distinct user-facing provenance", () => {
  const a = layer("e", "enhance", "Enhance");
  const b = layer("b", "beard", "Beard");
  const evidence = documentEvidence(makeSample("portrait"), [a, b]);
  assert.equal(evidence.localCount, 2);
  assert.equal(evidence.activeCount, 2);
  assert.equal(evidence.simulationCount, 1);
  assert.equal(evidence.layers[0].display, "Local correction");
  assert.equal(evidence.layers[1].display, "Local simulation");
  assert.match(evidence.warnings.join(" "), /simulations/);
  assert.deepEqual(evidence.layers.map((r) => r.position), [1, 2]);
});

test("a disabled, zero-strength and transparent layer is reported hidden", () => {
  const a = { ...layer("e", "enhance", "Enhance"), enabled: false };
  const b = { ...layer("b", "beard", "Beard"), opacity: 0 };
  const c = { ...layer("c", "hair-fibre", "Fibres"), strength: 0 };
  const info = documentEvidence(makeSample("crown"), [a, b, c]);
  assert.equal(info.activeCount, 0);
  assert.equal(info.hiddenCount, 3);
  assert.equal(info.simulationCount, 0);
  assert.equal(info.layers.every((i) => !i.running && i.display === "Hidden"), true);
  assert.ok(info.badges.includes("3 hidden"));
});

test("provider layers are never counted as on-device; R11 filter looks are on-device and not simulations", () => {
  const a = layer("provider", "styling", "Makeup");
  const b = layer("look", "filters", "Filters", "sample", { recipe: "C08" });
  const info = documentEvidence(makeSample("portrait"), [a, b]);
  assert.equal(info.localCount, 1);
  assert.equal(info.providerCount, 1);
  assert.equal(info.layers[0].scope, "provider");
  assert.equal(info.layers[1].scope, "on-device");
  assert.equal(info.layers[1].display, "Local look");
  assert.equal(info.layers[1].simulation, false);
  assert.equal(info.flow, "provider work requires a separate consented task");
  assert.match(info.warnings.join(" "), /separate consented/);
  assert.doesNotMatch(info.warnings.join(" "), /future feature/);
});

test("manually placed crown on personal image is described as an estimate", () => {
  const crown = makeSample("crown");
  const editor = new Editor();
  editor.load(uploadedSource(crown.image, "upload:manual-crown"));
  const draft = new AnnotationDraft("crown", crown.image.width, crown.image.height);
  draft.add([30, 30]); draft.add([170, 190]);
  editor.mark(draft.seal());
  editor.add();
  const info = documentEvidence(editor.source, editor.document.layers);
  assert.equal(info.source, "user photo");
  assert.match(info.warnings.join(" "), /manually/);
  assert.equal(info.providerCount, 0);
  assert.equal(info.simulationCount, 1);
});

test("manually placed body control points are never described as a clinical assessment", () => {
  const figure = makeSample("body-front");
  const source = uploadedSource(figure.image, "upload:manual-body");
  const info = documentEvidence({ ...source, body: figure.body, person: figure.person }, []);
  assert.match(info.warnings.join(" "), /not medical advice/);
  assert.equal(info.flow, "stays on this device");
});

test("evidence records contain no photo bytes, masks, biometrics or task credentials", () => {
  const source = makeSample("portrait");
  const record = evidenceForLayer(layer("l", "beard", "Beard"), 0);
  assert.deepEqual(Object.keys(record).sort(), ["display", "id", "name", "opacity", "position", "running", "scope", "simulation", "strength"].sort());
  const combined = documentEvidence(source, [layer("l", "beard", "Beard")]);
  const json = JSON.stringify(combined);
  for (const secret of ["image", "data", "face", "landmarks", "request_key", "ticket", "photo_id", "api_key"]) {
    assert.equal(json.includes(`"${secret}"`), false);
  }
  assert.ok(json.length < 2500);
});
