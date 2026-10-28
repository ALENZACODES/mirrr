/** Local browser capability checks for a rehearsal, not a live API probe. */
export type DemoCheckStatus = "supported" | "unavailable" | "not-tested";
export type DemoCheckName =
  | "canvas-2d"
  | "image-decoding"
  | "download-request"
  | "keyboard"
  | "network"
  | "real-provider"
  | "physical-screen-reader"
  | "device-performance";

export interface DemoCapability {
  readonly name: DemoCheckName;
  readonly title: string;
  readonly status: DemoCheckStatus;
  readonly explanation: string;
}

export interface DemoPreflightReport {
  readonly platform: "browser-local";
  readonly checks: readonly DemoCapability[];
  readonly canRunIllustration: boolean;
  readonly realYouCamVerified: false;
  readonly releasedFaceQualityVerified: false;
}

export interface DemoCapabilityPorts {
  readonly makeCanvas?: () => {
    getContext?(context: "2d"): unknown;
    toBlob?: unknown;
  };
  readonly makeObjectURL?: unknown;
  readonly imageBitmap?: unknown;
  readonly online?: boolean;
  readonly keyboardObserved?: boolean;
}

function availability(
  name: DemoCheckName,
  title: string,
  supported: boolean,
  explanation: string,
): DemoCapability {
  return { name, title, status: supported ? "supported" : "unavailable", explanation };
}

function notTested(name: DemoCheckName, title: string, explanation: string): DemoCapability {
  return { name, title, status: "not-tested", explanation };
}

/** No request, tracking, permission prompt, real photo or provider probe is made. */
export function evaluateDemoCapabilities(ports: DemoCapabilityPorts): DemoPreflightReport {
  let canvas: ReturnType<NonNullable<DemoCapabilityPorts["makeCanvas"]>> | null = null;
  let canvasReady = false;
  try {
    canvas = ports.makeCanvas?.() ?? null;
    canvasReady = Boolean(canvas?.getContext?.("2d"));
  } catch {
    canvasReady = false;
  }
  const downloadReady = Boolean(canvas && typeof canvas.toBlob === "function"
    && typeof ports.makeObjectURL === "function");
  const imageReady = typeof ports.imageBitmap === "function";
  const checks: DemoCapability[] = [
    availability("canvas-2d", "Canvas illustration", canvasReady,
      "Only this browser's ability to create a 2D Canvas is checked."),
    availability("image-decoding", "Image decoder", imageReady,
      "Actual photo decoding and orientation handling are not tested by this check."),
    availability("download-request", "Local file request", downloadReady,
      "The browser API is present; saved-file arrival is not confirmed."),
    ports.keyboardObserved === true
      ? availability("keyboard", "Keyboard observation", true,
        "A keyboard interaction was recorded during this visit, not a full WCAG audit.")
      : notTested("keyboard", "Keyboard observation",
        "Keyboard focus and screen-reader behavior still need an operator pass."),
    typeof ports.online === "boolean"
      ? availability("network", "Connection state", ports.online,
        "Navigator state is advisory and does not establish API availability.")
      : notTested("network", "Connection state",
        "Connection status cannot be determined on this browser."),
    notTested("real-provider", "Live YouCam integration",
      "The mock walkthrough never tests API keys, units, quotes or provider responses."),
    notTested("physical-screen-reader", "Physical screen reader",
      "VoiceOver, TalkBack, NVDA and real keyboard interactions are separate tests."),
    notTested("device-performance", "Device performance",
      "Canvas availability is not a phone, 4G, export-time or memory measurement."),
  ];
  return {
    platform: "browser-local",
    checks,
    canRunIllustration: canvasReady,
    realYouCamVerified: false,
    releasedFaceQualityVerified: false,
  };
}

export function readDemoCapabilities(doc: Document): DemoPreflightReport {
  const browser = doc.defaultView;
  const navigation = browser?.navigator;
  const bitmap = browser && "createImageBitmap" in browser
    ? browser.createImageBitmap : undefined;
  let probe: HTMLCanvasElement | null = null;
  return evaluateDemoCapabilities({
    makeCanvas: () => {
      probe = doc.createElement("canvas");
      probe.width = 1;
      probe.height = 1;
      return probe;
    },
    makeObjectURL: browser?.URL?.createObjectURL,
    imageBitmap: bitmap,
    online: typeof navigation?.onLine === "boolean" ? navigation.onLine : undefined,
  });
}

export function demoCapabilitySummary(report: DemoPreflightReport): string {
  const counts = { supported: 0, unavailable: 0, "not-tested": 0 };
  for (const row of report.checks) counts[row.status] += 1;
  return `${counts.supported} available, ${counts.unavailable} unavailable, `
    + `${counts["not-tested"]} not tested. Provider connectivity is not checked.`;
}
