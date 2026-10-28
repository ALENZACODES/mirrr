/** Read-only BELJOUR shade-check panel: strict receipt checks and one deliberate expand control.
 * Built on the shared test DOM; synthetic receipts only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkShadeSafety, renderSkinSensitivityPanel } from "../dist/js/commerce/skin-sensitivity-panel.js";
import { auditIlluminationSensitivity } from "../dist/js/engines/shade/illumination-sensitivity.js";
import { inspectReferenceAmbiguity } from "../dist/js/engines/shade/reference-ambiguity.js";
import { assessShadeSafety, publicShadeSafety } from "../dist/js/engines/shade/shade-safety.js";
import { buttonNamed, installDOM } from "./helpers/dom.mjs";
import { BASES, caseReading } from "./r34f-scene.mjs";

function receipt(index = 8, cast = "warm") {
  const [result, sample, estimates] = caseReading(BASES[index][1], cast);
  return publicShadeSafety(assessShadeSafety(result, auditIlluminationSensitivity(result, sample, estimates),
    inspectReferenceAmbiguity(result)));
}
function ambiguous() {
  for (let i = 0; i < BASES.length; i++) {
    const body = receipt(i, "daylight");
    if (body.ambiguity.alternatives.length > 0) return body;
  }
  throw new Error("no ambiguous fixture");
}

test("a checked receipt renders read-only, with details behind one button", async () => {
  const dom = installDOM();
  try {
    const toggles = [];
    const panel = renderSkinSensitivityPanel(dom.document, receipt(), { onToggle: (open) => toggles.push(open) });
    dom.root.append(panel);
    assert.equal(panel.getAttribute("aria-label"), "BELJOUR shade check");
    assert.match(panel.textContent, /not tested against real products/);
    const button = buttonNamed(dom.root, "Show lighting details");
    assert.equal(button.type, "button");
    assert.equal(button.getAttribute("aria-expanded"), "false");
    const details = panel.children.at(-1);
    assert.equal(details.hidden, true);
    await button.click();
    assert.deepEqual([details.hidden, button.getAttribute("aria-expanded"), toggles], [false, "true", [true]]);
    assert.match(details.textContent, /Provider calls: 0/);
    assert.equal(dom.root.querySelectorAll("button").length, 1);
    assert.equal(dom.root.querySelectorAll("a").length + dom.root.querySelectorAll("form").length, 0);
  } finally { dom.restore(); }
});

test("forged claims, unknown labels, duplicates and lighter references are refused", () => {
  const good = ambiguous();
  assert.equal(checkShadeSafety(good).alternatives.length, good.ambiguity.alternatives.length);
  const forged = [
    { ...good, real_product_match: true }, { ...good, real_face_gate: "PASS" }, { ...good, provider_calls: 1 },
    { ...good, release_pass: true }, { ...good, verified: true }, { ...good, selected: "S05" },
    { ...good, ambiguity: { ...good.ambiguity, alternatives: [...good.ambiguity.alternatives, good.ambiguity.alternatives[0]] } },
    { ...good, ambiguity: { ...good.ambiguity, alternatives: [{ ...good.ambiguity.alternatives[0], lighter_by: 1.5 }] } },
    { ...good, ambiguity: { ...good.ambiguity, alternatives: [{ ...good.ambiguity.alternatives[0], id: "brand-01" }] } },
    { ...good, ambiguity: { ...good.ambiguity, alternatives: [{ ...good.ambiguity.alternatives[0], id: good.selected }] } },
    { ...good, sensitivity: { ...good.sensitivity, selected: good.selected === "LG-01C" ? "LG-02C" : "LG-01C" } },
    { ...good, status: "refused" },
  ];
  for (const bad of forged) assert.throws(() => checkShadeSafety(bad), RangeError);
});

test("the panel source makes no network or purchase calls", () => {
  const code = readFileSync(new URL("../src/commerce/skin-sensitivity-panel.ts", import.meta.url), "utf8");
  assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|checkout|addToBag/);
});
