/** Controlled, user-initiated local download for count-only Save proofs.
 *
 * The browser allocates a temporary JSON Blob and revokes its URL in a
 * finally block. No fetch, cloud endpoint, photo export or automatic download.
 * A caller must already have a recipe-bound portable receipt, not arbitrary
 * HTML, names or image bytes. Author: John Khan.
 */

import { parsePortableProof } from "./proof-receipt.js";
import { type LookRecipe } from "./recipe.js";

export const LOCAL_RECEIPT_NAME = "LookProof-counts.json";
const MAX_RECEIPT_BYTES = 65536;

type DownloadElement = HTMLAnchorElement;

interface DownloadDocument {
  createElement(tag: "a"): DownloadElement;
  body: { appendChild(anchor: HTMLAnchorElement): unknown } | null;
}

interface DownloadURLs {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

/** Injection makes lifecycle and user-action requirements testable without a DOM. */
export interface LocalReceiptEnvironment {
  readonly doc: DownloadDocument;
  readonly urls: DownloadURLs;
}

export type LocalReceiptResult = "downloaded" | "unavailable";

function environment(): LocalReceiptEnvironment | null {
  if (typeof document === "undefined" || typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function" || typeof URL.revokeObjectURL !== "function") {
    return null;
  }
  return { doc: document, urls: URL };
}

function checkReceiptName(name: string): void {
  if (name !== LOCAL_RECEIPT_NAME) throw new TypeError("unknown local receipt filename");
}

/** Validate current settings before using any browser resource. */
export async function downloadLocalReceipt(
  name: string,
  text: string,
  recipe: LookRecipe,
  source: LocalReceiptEnvironment | null = environment(),
): Promise<LocalReceiptResult> {
  checkReceiptName(name);
  if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > MAX_RECEIPT_BYTES) {
    throw new RangeError("local proof receipt is too large");
  }
  await parsePortableProof(text, recipe);
  if (!source || !source.doc.body) return "unavailable";
  let url: string | null = null;
  let anchor: DownloadElement | null = null;
  try {
    const blob = new Blob([text], { type: "application/json" });
    url = source.urls.createObjectURL(blob);
    if (!url || typeof url !== "string" || !url.startsWith("blob:")) {
      throw new Error("temporary browser download URL unavailable");
    }
    anchor = source.doc.createElement("a");
    anchor.href = url;
    anchor.download = LOCAL_RECEIPT_NAME;
    anchor.rel = "noopener noreferrer";
    source.doc.body.appendChild(anchor);
    anchor.click();
    return "downloaded";
  } catch {
    return "unavailable";
  } finally {
    try { anchor?.remove(); } catch { /* cleanup can continue */ }
    if (url !== null) {
      try { source.urls.revokeObjectURL(url); } catch { /* unavailable cleanup is not success */ }
    }
  }
}

/** A real-browser receipt target for mountProofWidget's optional delivery. */
export function browserReceiptDelivery(recipe: LookRecipe): (name: string, text: string) => Promise<void> {
  return async (name: string, text: string): Promise<void> => {
    if (await downloadLocalReceipt(name, text, recipe) !== "downloaded") {
      throw new Error("local browser receipt download unavailable");
    }
  };
}
