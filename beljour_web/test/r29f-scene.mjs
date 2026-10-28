/** Drawn scene shared by the r29f five-strength browser tests: invented blocks, no photographs.
 * The same rectangle layout as api/tests/test_r29f_hair_comparison.py scene().
 * Author: John Khan.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_ANCHORS } from "../dist/js/engines/menshair/render.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const STYLES = JSON.parse(readFileSync(resolve(root, "api/plumb_api/engines/menshair/presets.json"), "utf8"));
export const HEAD = DEFAULT_ANCHORS;
export const PHOTO_HASH = "ab".repeat(32);

/** RGBA block: background, a striped hair rectangle and a visible-scalp patch. */
export function scene({ hair = [29, 22, 20], scalp = [188, 146, 112], size = 96, channels = 4 } = {}) {
  const pixels = new Uint8Array(size * size * channels);
  const hairMask = new Uint8Array(size * size), scalpMask = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    let rgb = [205, 177, 145];
    if (y >= 12 && y < 62 && x >= 22 && x < 74) {
      hairMask[i] = 255;
      rgb = [hair[0], hair[1] + ((x >> 1) % 4), hair[2]];
    }
    if (y >= 39 && y < 59 && x >= 28 && x < 69) {
      scalpMask[i] = 255;
      rgb = scalp;
    }
    pixels.set(channels === 4 ? [...rgb, 211] : rgb, i * channels);
  }
  return { pixels, width: size, height: size, hair: hairMask, scalp: scalpMask, landmarks: HEAD };
}

export const CHOICES = {
  fibre: { kind: "fibre", zone: "crown", shadeId: null, photoHash: PHOTO_HASH },
  palette: { kind: "palette", shadeId: "natural-03-n", allowLightening: true },
  "short-sides": { kind: "short-sides", styleId: "local-low-fade", source: STYLES },
};

/** Issued by api/plumb_api/commerce/board_receipt.py for scene() with the palette choice.
 * test_r29f_board_receipt.py re-issues it in Python and requires these exact bytes. */
export const PYTHON_RECEIPT = [
  String.raw`{"choice":{"allow_lightening":true,"shade_id":"natural-03-n"},"height":96,"kind":"palette","leve`,
  String.raw`ls":[{"changed_pixels":0,"changed_share":0.0,"guard_applied":true,"identity_blended":false,"iden`,
  String.raw`tity_similarity":1.0,"level":1.0,"max_delta":0,"mean_delta":0.0,"refusal_code":null,"region_pixe`,
  String.raw`ls":2600,"status":"unchanged"},{"changed_pixels":2600,"changed_share":1.0,"guard_applied":true,"`,
  String.raw`identity_blended":false,"identity_similarity":0.9929,"level":2.0,"max_delta":28,"mean_delta":0.0`,
  String.raw`336,"refusal_code":null,"region_pixels":2600,"status":"rendered"},{"changed_pixels":2600,"change`,
  String.raw`d_share":1.0,"guard_applied":true,"identity_blended":false,"identity_similarity":0.9855,"level":`,
  String.raw`3.0,"max_delta":57,"mean_delta":0.0686,"refusal_code":null,"region_pixels":2600,"status":"render`,
  String.raw`ed"},{"changed_pixels":2600,"changed_share":1.0,"guard_applied":true,"identity_blended":true,"id`,
  String.raw`entity_similarity":0.9849,"level":4.0,"max_delta":59,"mean_delta":0.0714,"refusal_code":null,"re`,
  String.raw`gion_pixels":2600,"status":"rendered"},{"changed_pixels":2600,"changed_share":1.0,"guard_applied`,
  String.raw`":true,"identity_blended":true,"identity_similarity":0.9849,"level":5.0,"max_delta":59,"mean_del`,
  String.raw`ta":0.0712,"refusal_code":null,"region_pixels":2600,"status":"rendered"}],"provider_calls":0,"re`,
  String.raw`al_face_status":"not_tested","simulated":true,"totals":{"cases":5,"refused":0,"rendered":4,"unch`,
  String.raw`anged":1},"verification":"unverified","version":"beljour-r29f-board-receipt/1","width":96}`,
].join("");

export const noPause = async () => {};
