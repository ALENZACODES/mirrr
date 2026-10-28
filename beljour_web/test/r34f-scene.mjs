/** Drawn skin-lighting cases shared by the r34f browser tests (same integer formula as
 * api/plumb_api/engines/shade/sensitivity_parity.py). No photographs. Author: John Khan.
 */
import { readFileSync } from "node:fs";
import { findFromPixels, whiteFromPixels, ZONES } from "../dist/js/engines/shade/finder.js";
import { SHADE_DATA } from "../dist/js/engines/shade/generated/data.js";
import { DEEP_REFERENCE } from "../dist/js/engines/shade/deep-reference.js";
import { estimateFromWhite, lightingEstimate } from "../dist/js/engines/shade/illumination-sensitivity.js";

export const P = JSON.parse(readFileSync(new URL("../../parity/skin-sensitivity-r34f.json", import.meta.url), "utf8"));
const EXTENDED = [...SHADE_DATA.shades, ...DEEP_REFERENCE];
const cast = (v, m) => Math.min(255, (v * m + 128) >> 8);

export function caseInputs(base, castName) {
  const m = P.casts[castName];
  const zones = {};
  ZONES.forEach((name, z) => {
    zones[name] = Array.from({ length: P.zone_pixels }, (_, k) => [0, 1, 2].map((c) =>
      cast(Math.min(255, Math.max(0, base[c] + ((7 * k + 3 * z + 5 * c) % 9) - 4)), m[c])));
  });
  const patch = (rgb) => Array.from({ length: P.patch_pixels }, () => rgb.map((v, c) => cast(v, m[c])));
  return { zones, card: patch(P.card), wall: patch(P.wall) };
}

/** [W6 result, measured sample, [neutral, grey-world, none] estimates] for one case. */
export function caseReading(base, castName) {
  const { zones, card, wall } = caseInputs(base, castName);
  const neutral = whiteFromPixels(card, "neutral"), grey = whiteFromPixels(wall, "grey_world");
  const result = findFromPixels(zones, neutral, EXTENDED);
  const sample = ZONES.flatMap((name) => zones[name]);
  return [result, sample, [estimateFromWhite(neutral), estimateFromWhite(grey), lightingEstimate("none", [1, 1, 1])]];
}

export const BASES = [...new Map(P.cases.map((c) => [c.reference, c.base])).entries()];
