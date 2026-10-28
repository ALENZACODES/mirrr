/** The 48-style men's portfolio in the browser: same selection as Python, verified renders.
 * Drawn heads only; tonal simulation, not a haircut prediction. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PORTFOLIO_SIZE, SHORT_SIDES, renderEvidence, selectPortfolio } from "../dist/js/engines/menshair/portfolio.js";
import { validatePresets } from "../dist/js/engines/menshair/render.js";

const SOURCE = JSON.parse(readFileSync(new URL("../../api/plumb_api/engines/menshair/presets.json", import.meta.url), "utf8"));
validatePresets(SOURCE);
const ANCHORS = { left_temple: [0.30, 0.38], right_temple: [0.70, 0.38], crown: [0.50, 0.12],
  left_ear: [0.26, 0.56], right_ear: [0.74, 0.56], nape: [0.50, 0.82] };
const W = 48, H = 56;

/** The light-background, striped case of portfolio_matrix.drawn_case, drawn as RGB bytes. */
function drawnHead() {
  const image = new Uint8Array(W * H * 3), mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const head = ((x - W / 2) / (W * 0.3)) ** 2 + ((y - H * 0.47) / (H * 0.38)) ** 2 <= 1;
    const sides = Math.abs(x - W / 2) > W * 0.2 && y < H * 0.66;
    const hair = head && (y < H * 0.42 || sides);
    const shift = x % 4 < 2 ? 10 : -10;
    image.set(hair ? [62 + shift, 44 + shift, 34 + shift] : head ? [196, 150, 124] : [214, 210, 204], i * 3);
    if (hair) mask[i] = 255;
  }
  return { image, mask };
}

test("48 styles, 33 short-sides across six families, same rule as Python", () => {
  const styles = selectPortfolio(SOURCE);
  assert.equal(styles.length, PORTFOLIO_SIZE);
  const short = styles.filter((s) => SHORT_SIDES.includes(s.family));
  assert.equal(short.length, 33);
  assert.deepEqual(new Set(short.map((s) => s.family)), new Set(SHORT_SIDES));
  assert.equal(styles[0].id, "local-low-fade");
  assert.equal(styles.at(-1).id, "local-skin-mid-fauxhawk");
  assert.equal(new Set(styles.slice(33).map((s) => s.family)).size, 15);
  assert.throws(() => selectPortfolio({ ...SOURCE, styles: SOURCE.styles.slice(0, 20) }), RangeError);
});

test("every portfolio style renders and is verified from its pixels", () => {
  const { image, mask } = drawnHead();
  const before = new Uint8Array(image);
  for (const style of selectPortfolio(SOURCE)) {
    const found = renderEvidence(image, W, H, mask, ANCHORS, style.id, 3, SOURCE);
    assert.ok(found.verified && found.changed_pixels > 0, style.id);
  }
  assert.deepEqual(image, before);
});

test("level one is unchanged, missing mesh refuses, unknown styles throw", () => {
  const { image, mask } = drawnHead();
  assert.equal(renderEvidence(image, W, H, mask, ANCHORS, "local-mid-fade", 1, SOURCE).status, "unchanged");
  const refused = renderEvidence(image, W, H, mask, null, "local-mid-fade", 3, SOURCE);
  assert.deepEqual([refused.status, refused.code, refused.verified], ["refused", "no_mesh", false]);
  assert.throws(() => renderEvidence(image, W, H, mask, ANCHORS, "local-unknown", 3, SOURCE), RangeError);
});

test("the workbench lists the portfolio, not a fixed first eighteen", () => {
  const code = readFileSync(new URL("../src/commerce/hair-workbench.ts", import.meta.url), "utf8");
  assert.match(code, /selectPortfolio\(this\.styles\)/);
  assert.doesNotMatch(code, /slice\(0, 18\)/);
});
