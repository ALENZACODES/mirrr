/** r35f browser pieces together: C18, calibration, SKN-03 binding, fibre contract and book.
 * Synthetic and in-house data only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkC18Shades, loadC18Shades } from "../dist/js/engines/shade/c18.js";
import { assessCalibrationGap, probeReference } from "../dist/js/engines/shade/calibration.js";
import { nearestShade } from "../dist/js/engines/shade/distance.js";
import { loadSKN03C18Binding } from "../dist/js/engines/shade/skn03-checkpoint.js";
import { checkFibreContract } from "../dist/js/commerce/fibre-parity.js";
import { auditBook } from "../dist/js/engines/hair_palette/book-audit.js";
import { buildShadeIndex, searchShades } from "../dist/js/commerce/editorial-shade-search.js";

const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));

test("C18 skin binds the SKN-03 checkpoint with the Python digest", async () => {
  const skin = await loadC18Shades("skin");
  const binding = await loadSKN03C18Binding();
  assert.equal(binding.digest, skin.digest);
  assert.equal(binding.digest, read("parity/skn03-calibration-r35f.json").c18.skin);
  assert.equal((await checkC18Shades(skin)).ok, true);
});

test("calibration probes agree with nearest-shade ranking on the C18 records", async () => {
  const skin = await loadC18Shades("skin");
  for (const record of skin.shades.slice(0, 24)) {
    const lab = [record.lab[0] - 0.3, record.lab[1] + 0.2, record.lab[2]];
    assert.equal(probeReference(lab).best_id, nearestShade(lab, skin.shades).record.id);
  }
  assert.equal(assessCalibrationGap().status, "UNPROVEN");
});

test("fibre contract, book audit and search cover the same sources", async () => {
  assert.deepEqual(checkFibreContract(read("parity/fibre-coverage-r35f.json")), []);
  const hair = await loadC18Shades("hair");
  assert.equal(auditBook().count, hair.count);
  assert.equal(searchShades(buildShadeIndex()).total, hair.count);
});
