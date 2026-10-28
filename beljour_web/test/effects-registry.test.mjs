// The effects the editor lists agree with the feature registry: an effect is "built" exactly when
// its feature row is Built, and a built effect's note never says it isn't built or names a
// future plan round. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EFFECTS } from "../dist/js/layout/effects.js";
import { rescueLine, RESCUE_NOT_BUILT } from "../dist/js/layout/rescue.js";

const rows = new Map(JSON.parse(readFileSync(new URL("../../api/plumb_api/arena/features.json", import.meta.url), "utf8"))
  .features.map((f) => [f.id, f]));

test("built matches the registry, and a built effect's note promises nothing for later", () => {
  for (const e of EFFECTS) {
    if (e.feature === null) continue;
    const row = rows.get(e.feature);
    assert.ok(row, `${e.id}: feature ${e.feature} exists`);
    assert.equal(e.built, row.status === "Built", `${e.id} (#${e.feature} ${row.name}) is ${row.status}`);
    if (e.built) assert.doesNotMatch(e.note, /not built|plan R\d+|joins the studio|coming soon/i, e.id);
  }
});

test("posture is a supporting tool, not feature 11 (muscle, blocked)", () => {
  assert.equal(EFFECTS.find((e) => e.id === "posture").feature, null);
  assert.equal(rows.get(11).status, "Blocked");
});

test("Rescue names what it leaves out without calling built tools unbuilt", () => {
  assert.equal(rows.get(106).status, "Built");
  assert.match(rescueLine(), /Not in Rescue yet: .*\(Glow is in the Skin tools\)/);
  assert.doesNotMatch(rescueLine(), /Not built yet/);
  assert.deepEqual([...RESCUE_NOT_BUILT], ["dull skin glow", "flyaway hair"]);
});
