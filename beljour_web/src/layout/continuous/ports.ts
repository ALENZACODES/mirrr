/** Injection-only public boundaries: neither images nor keys travel over a network. */
import type { SubjectDetectionPort, SubjectSnapshot } from "../subjects/contract.js";
import type { TourMockMode, TourMockResult, TourState } from "./contract.js";

export interface TourTryonRequest {
  readonly sourceRevision: number;
  readonly selectedId: string;
  readonly mockConsent: boolean;
  readonly localConsent: boolean;
  readonly identityLock: boolean;
}

export interface TourTryonOutcome {
  readonly result: TourMockResult;
  readonly providerCalls: number;
  readonly unitsSpent: number;
  readonly imageSent: boolean;
  readonly copy: string;
}

export interface TourTryonPort {
  readonly kind: "tour-tryon";
  readonly mode: TourMockMode;
  preview(request: TourTryonRequest): TourTryonOutcome;
}

export function localTourTryon(mode: TourMockMode = "mock"): TourTryonPort {
  return Object.freeze({
    kind: "tour-tryon" as const,
    mode,
    preview(request: TourTryonRequest): TourTryonOutcome {
      if (mode === "off") {
        return {
          result: "provider-disabled", providerCalls: 0, unitsSpent: 0, imageSent: false,
          copy: "The provider branch is off. Local editing stays available.",
        };
      }
      if (!request.localConsent || !request.mockConsent || !request.identityLock || !request.selectedId) {
        return {
          result: "consent-required", providerCalls: 0, unitsSpent: 0, imageSent: false,
          copy: "Separate consent, a selected person and identity lock are required.",
        };
      }
      return {
        result: "mock-applied", providerCalls: 0, unitsSpent: 0, imageSent: false,
        copy: "Local illustration completed. No YouCam request was sent.",
      };
    },
  });
}

export interface TourPublicPorts {
  /** Integration uses only the public owner export, when it is available. */
  readonly subjectDetector?: SubjectDetectionPort | null;
  readonly tryon?: TourTryonPort;
}

export function checkedTourOutcome(outcome: TourTryonOutcome): TourTryonOutcome {
  if (!Number.isInteger(outcome.providerCalls) || outcome.providerCalls !== 0) {
    throw new Error("Live provider calls are not permitted in this tour");
  }
  if (!Number.isInteger(outcome.unitsSpent) || outcome.unitsSpent !== 0 || outcome.imageSent) {
    throw new Error("A mock tour cannot send an image or spend units");
  }
  if (!["mock-applied", "provider-disabled", "consent-required"].includes(outcome.result)) {
    throw new Error("Unsupported try-on status");
  }
  if (typeof outcome.copy !== "string" || outcome.copy.length > 240) {
    throw new Error("Invalid fixed mock status text");
  }
  return outcome;
}

export function canTryon(state: TourState, subjects: SubjectSnapshot): boolean {
  return state.sourceLoaded && subjects.selectedId !== null
    && state.sourceRevision === subjects.revision
    && state.identityLock && state.permissions.local && state.permissions.mock;
}
