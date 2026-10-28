/** A separate mock-only port. Real YouCam tasks remain in the one existing adapter. */
export interface JudgeMockIntent {
  readonly localConsent: boolean;
  readonly mockConsent: boolean;
  readonly sourceReady: boolean;
  readonly subjectSelected: boolean;
}

export type JudgeMockStatus = "illustrated" | "missing-consent" | "missing-subject";

export interface JudgeMockResult {
  readonly status: JudgeMockStatus;
  readonly provider: "mock-only";
  readonly providerCalls: 0;
  readonly unitsSpent: 0;
  readonly sendsImage: false;
  readonly description: string;
}

/** No actual provider interface is imported or instantiated in Judge Mode. */
export interface JudgeMockPreviewPort {
  readonly kind: "local-illustration";
  preview(intent: JudgeMockIntent): JudgeMockResult;
}

export function localJudgeMock(): JudgeMockPreviewPort {
  return {
    kind: "local-illustration",
    preview(intent: JudgeMockIntent): JudgeMockResult {
      if (!intent.localConsent || !intent.mockConsent || !intent.sourceReady) {
        return {
          status: "missing-consent",
          provider: "mock-only",
          providerCalls: 0,
          unitsSpent: 0,
          sendsImage: false,
          description: "Opt into the local illustration and mock action first.",
        };
      }
      if (!intent.subjectSelected) {
        return {
          status: "missing-subject",
          provider: "mock-only",
          providerCalls: 0,
          unitsSpent: 0,
          sendsImage: false,
          description: "A checked target is required; bystanders cannot be edited.",
        };
      }
      return {
        status: "illustrated",
        provider: "mock-only",
        providerCalls: 0,
        unitsSpent: 0,
        sendsImage: false,
        description: "A locally drawn accessory appeared. No provider request was made.",
      };
    },
  };
}
