/** Optional fast-check properties for compiled editor math and pixel preservation.
 * A missing local fast-check package produces a named skip, not a pass.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { fromRGBA, toRGBA } from "../../dist/js/engines/core/buffer.js";
import { scaleFraction } from "../../dist/js/filters/colour/ops.js";

let fastCheck = null;
try {
  fastCheck = await import("fast-check");
} catch (error) {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
}

test("fast-check: every decimal strength preserves a neutral photo and alpha", {
  skip: fastCheck === null,
}, () => {
  const fc = fastCheck.default ?? fastCheck;
  fc.assert(fc.property(
    fc.integer({ min: 10, max: 50 }),
    fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 4, maxLength: 4 }),
    (tenth, bytes) => {
      const portion = (tenth - 10) / 40;
      assert.ok(portion >= 0 && portion <= 1);
      assert.equal(scaleFraction("linear", portion), portion);
      const input = new Uint8ClampedArray(bytes);
      const before = Array.from(input);
      const image = fromRGBA({ width: 1, height: 1, data: input });
      assert.deepEqual(Array.from(toRGBA(image)), before);
      assert.deepEqual(Array.from(input), before);
    },
  ), { seed: 251025, numRuns: 300 });
});
