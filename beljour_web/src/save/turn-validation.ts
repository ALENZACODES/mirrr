/** Prevalidate pixel-field weights before any turn render is attempted.
 * Declining an invalid edit is different from certifying a successful edit.
 * Author: John Khan.
 */
export interface TurnRefusal { module: "warp_turn"; refused: true; code: "invalid_weights" | "invalid_geometry"; message: string }
export interface TurnAllowed { module: "warp_turn"; refused: false; weights: Float32Array }
export type CheckedTurnWeights = TurnAllowed | TurnRefusal;

export function checkedTurnWeights(weights: Float32Array, width: number, height: number): CheckedTurnWeights {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 ||
      weights.length !== width * height) {
    return { module: "warp_turn", refused: true, code: "invalid_geometry", message: "weight dimensions are invalid" };
  }
  for (let i = 0; i < weights.length; i++) {
    if (!Number.isFinite(weights[i]) || weights[i] < 0 || weights[i] > 1) {
      return { module: "warp_turn", refused: true, code: "invalid_weights", message: "weights must be finite and in [0, 1]" };
    }
  }
  return { module: "warp_turn", refused: false, weights: new Float32Array(weights) };
}
