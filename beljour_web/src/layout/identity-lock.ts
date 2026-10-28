/** R23d requested identity protection. The Lane H engine is not yet integrated.
 * This typed client boundary must not be mistaken for an identity-quality gate.
 */
import { parseVisibleStrength } from "./strength-scale.js";

export type LockStatus = "not-connected" | "enforced";
export type EditFamily = "face" | "hair" | "pose" | "photo" | "mock";

export interface IdentityLockRequest {
  readonly family: EditFamily;
  readonly photoRevision: string;
  readonly strength: number;
  readonly looseness: number;
  readonly requested: true;
}

export interface IdentityLockDecision {
  readonly requested: true;
  readonly status: LockStatus;
  readonly safeToClaimProtected: boolean;
  readonly reason: string;
}

/** Lane H may expose this public interface later; no private imports or heuristics. */
export interface IdentityLockAdapter {
  readonly kind: "identity-lock";
  evaluate(request: IdentityLockRequest): IdentityLockDecision;
}

export interface LockView {
  readonly requested: true;
  readonly status: LockStatus;
  readonly looseness: number;
  readonly label: string;
  readonly safeToClaimProtected: boolean;
}

/** No code here turns off identity lock or guesses identity from image pixels. */
export class IdentityLockController {
  private looseness = 1.0;
  private adapter: IdentityLockAdapter | null;

  constructor(adapter: IdentityLockAdapter | null = null) {
    this.adapter = adapter;
  }

  get snapshot(): LockView {
    return {
      requested: true,
      status: this.adapter ? "enforced" : "not-connected",
      looseness: this.looseness,
      label: this.adapter ? "Identity lock on" : "Identity lock requested; engine pending",
      safeToClaimProtected: this.adapter !== null,
    };
  }

  /** Fine adjustment is intentionally not a boolean ON/OFF switch. */
  tune(value: number): LockView {
    this.looseness = parseVisibleStrength(value);
    return this.snapshot;
  }

  evaluate(family: EditFamily, photoRevision: string, strength: number): IdentityLockDecision {
    if (!family || !photoRevision) throw new RangeError("Edit and photo revision required");
    const request: IdentityLockRequest = {
      family,
      photoRevision,
      strength: parseVisibleStrength(strength),
      looseness: this.looseness,
      requested: true,
    };
    if (!this.adapter) return {
      requested: true,
      status: "not-connected",
      safeToClaimProtected: false,
      reason: "Identity engine pending. This view cannot verify identity preservation.",
    };
    const answer = this.adapter.evaluate(request);
    if (!answer.requested || answer.status !== "enforced" || !answer.safeToClaimProtected) {
      return {
        requested: true,
        status: "not-connected",
        safeToClaimProtected: false,
        reason: "Identity engine did not certify the request.",
      };
    }
    return answer;
  }

  reset(): void {
    this.looseness = 1.0;
  }
}

/** For synthetic Judge Mode tests only. Never reports that protection was enforced. */
export function mockIdentityLock(): IdentityLockController {
  return new IdentityLockController(null);
}
