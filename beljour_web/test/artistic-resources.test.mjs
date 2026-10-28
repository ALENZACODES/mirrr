// Planner arithmetic is explicit and does not claim measured hardware RAM. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BUDGET, MIB, SCRATCH_BYTES_PER_PIXEL, exportAllocation } from "../dist/js/filters/artistic/resources.js";

for (const effect of Object.keys(SCRATCH_BYTES_PER_PIXEL)) {
  test(`${effect}: 12 MP and 16 MP export allocation remains bounded`, () => {
    for (const [w, h] of [[4000, 3000], [4096, 4096]]) {
      const p = exportAllocation(effect, w, h, 4, 1024, 12);
      assert.ok(p.tile_size >= 32 && p.tile_size <= 1024);
      assert.ok(p.estimated_peak_bytes <= DEFAULT_BUDGET);
      assert.equal(p.frame_bytes, w * h * 8);
      assert.equal(p.estimated_peak_bytes, p.frame_bytes + p.scratch_bytes);
    }
  });
}

test("a smaller allowance selects smaller tiles or refuses before output allocation", () => {
  const generous = exportAllocation("pigment-oil", 500, 600, 4, 512, 1, 256 * MIB);
  const smaller = exportAllocation("pigment-oil", 500, 600, 4, 512, 1, 8 * MIB);
  assert.ok(smaller.tile_size < generous.tile_size);
  assert.ok(smaller.planned_tiles > generous.planned_tiles);
  assert.throws(() => exportAllocation("pigment-oil", 4000, 3000, 4, 512, 1, 8 * MIB), (e) => e.code === "memory_budget");
});

test("invalid allowance and unsupported effect cannot bypass the cap", () => {
  for (const value of [0, -1, true, 8 * MIB - 1, Infinity, "256"]) {
    assert.throws(() => exportAllocation("pigment-oil", 100, 100, 3, 512, 1, value), RangeError);
  }
  assert.throws(() => exportAllocation("rain-expression", 100, 100, 3), (e) => e.code === "not_tileable");
});
