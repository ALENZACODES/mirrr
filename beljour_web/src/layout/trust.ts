/** Trust Centre model (feature 103, women-first rule 10, layout spec §3).
 * One screen she can screenshot. Each line is either wired to a real function in this app or
 * says "Not built" (spec §5.4: never a promise for something that doesn't exist).
 * Deletion is real: it withdraws consent, clears this tab's session and pending tasks, wipes the
 * on-device skin and body history, asks our server to delete any uploaded photo this tab knows
 * about, and returns a receipt listing each step. My Looks hold no face data and are kept
 * unless she ticks "also delete my saved looks".
 * Author: John Khan.
 */
import { fingerprint } from "./my-looks.js";
import type { KeyValueStore } from "../session.js";

export type TrustState = "on" | "off" | "built" | "not built";
/** Uploaded photo ids of this tab, so deletion can ask the server to remove them. */
export const PHOTO_IDS_KEY = "beljour.photo-ids";
const PHOTO_ID = /^[A-Za-z0-9_-]{4,80}$/;

export function knownPhotoIds(store: KeyValueStore | null): string[] {
  try {
    const raw = store?.getItem(PHOTO_IDS_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string" && PHOTO_ID.test(x)) : [];
  } catch { return []; }
}

/** Called after an upload, never for the shared sample. Keeps the last 20 ids, tab only. */
export function rememberPhotoId(store: KeyValueStore | null, id: string): void {
  if (!PHOTO_ID.test(id)) return;
  const ids = [...knownPhotoIds(store).filter((x) => x !== id), id].slice(-20);
  try { store?.setItem(PHOTO_IDS_KEY, JSON.stringify(ids)); } catch { /* deletion then relies on the server's one-hour limit */ }
}

export const SIM_LABEL_KEY = "beljour.sim-label";

/** The export label preference: on unless she turned it off (decisions Q17), tab only. */
export function simulationLabelPref(store: KeyValueStore | null): { get(): boolean; set(on: boolean): void } {
  return {
    get: (): boolean => { try { return store?.getItem(SIM_LABEL_KEY) !== "0"; } catch { return true; } },
    set: (on: boolean): void => {
      try { if (on) store?.removeItem(SIM_LABEL_KEY); else store?.setItem(SIM_LABEL_KEY, "0"); } catch { /* page only */ }
    },
  };
}

export interface TrustItem {
  id: "on-device" | "never-train" | "neutral-defaults" | "simulation-label" | "swap-mark" | "no-sexualised" | "delete";
  title: string;
  detail: string;
  state: TrustState;
  /** A switch she can flip on this screen. */
  toggle: boolean;
}

export interface TrustDeps {
  /** The consent gate (web/src/ui/shell/consent.ts appConsent). */
  consent: { localOnly: boolean; setLocalOnly(on: boolean): void; withdraw(): void; hasVisit: boolean };
  /** Whether exported images carry the Simulation label (on by default, decisions Q17). */
  simulationLabel: { get(): boolean; set(on: boolean): void };
}

export function trustItems(deps: TrustDeps): TrustItem[] {
  return [
    { id: "on-device", title: "On-device mode", toggle: true, state: deps.consent.localOnly ? "on" : "off",
      detail: "When on, nothing is ever sent to YouCam. Local tools keep working; makeup and hair styling pause." },
    { id: "never-train", title: "We never train on your photos", toggle: false, state: "built",
      detail: "This app has no training step. Local edits never leave this device. A styling photo goes to YouCam only after you tick the box, and our server deletes it within an hour." },
    { id: "neutral-defaults", title: "Neutral defaults", toggle: false, state: "built",
      detail: "No default ever lightens skin, slims a face or removes freckles or moles. Reshaping is off until you turn it on. Every default is checked on six skin tones before release." },
    { id: "simulation-label", title: "Simulation label on saved photos", toggle: true, state: deps.simulationLabel.get() ? "on" : "off",
      detail: "Edited photos say they are a simulation. On by default; you can turn it off for a photo." },
    { id: "swap-mark", title: "Visible mark on any swap", toggle: false, state: "not built",
      detail: "Not built: this app has no face swap. If one is ever added, its results carry a visible mark." },
    { id: "no-sexualised", title: "No sexualised styles", toggle: false, state: "not built",
      detail: "Not built: there are no avatar styles yet. When they come, they are tested by women on women before release." },
    { id: "delete", title: "Delete my face data", toggle: false, state: "built",
      detail: "Removes consent, this tab's session, skin and body history on this device, and asks our server to delete your uploaded photo. You get a receipt." },
  ];
}

export function setToggle(deps: TrustDeps, id: TrustItem["id"], on: boolean): void {
  if (id === "on-device") deps.consent.setLocalOnly(on);
  else if (id === "simulation-label") deps.simulationLabel.set(on);
  else throw new RangeError(`${id} has no switch`);
}

export interface DeletionDeps {
  consent: { withdraw(): void; hasVisit: boolean };
  session: KeyValueStore | null;
  sessionKeys: readonly string[];
  clearHistory: () => Promise<void>;
  /** Uploaded photo ids this tab knows about, and the server call that deletes one. */
  photoIds: readonly string[];
  deletePhoto: ((id: string) => Promise<{ deleted: boolean }>) | null;
  looks: { clear(): number } | null;
  /** The versioned Save System is separate from the older My Looks key. */
  versionedLooks?: { clear(): Promise<number> };
  alsoLooks: boolean;
  clock: () => Date;
}

export interface ReceiptLine { what: string; result: "deleted" | "nothing to delete" | "kept" | "failed"; detail: string }
export interface Receipt { id: string; at: string; lines: ReceiptLine[] }

/** Run every deletion step; a failing step is recorded and the others still run. */
export async function deleteFaceData(deps: DeletionDeps): Promise<Receipt> {
  const lines: ReceiptLine[] = [];
  const had = deps.consent.hasVisit;
  deps.consent.withdraw();
  lines.push({ what: "Consent", result: had ? "deleted" : "nothing to delete", detail: "Visit consent and every photo consent withdrawn." });
  let removed = 0;
  for (const key of deps.sessionKeys) {
    try {
      if (deps.session?.getItem(key) !== null && deps.session?.getItem(key) !== undefined) { deps.session.removeItem(key); removed++; }
    } catch { /* storage blocked: nothing kept there */ }
  }
  lines.push({ what: "This tab's session", result: removed ? "deleted" : "nothing to delete",
    detail: `${removed} stored item${removed === 1 ? "" : "s"} removed (session id, pending tasks, consent record).` });
  try {
    await deps.clearHistory();
    lines.push({ what: "Skin and body history on this device", result: "deleted", detail: "Dates and measurements only; no photos were stored." });
  } catch (error) {
    lines.push({ what: "Skin and body history on this device", result: "failed", detail: error instanceof Error ? error.message : "Storage refused" });
  }
  if (!deps.photoIds.length) {
    lines.push({ what: "Uploaded photos on our server", result: "nothing to delete",
      detail: "This tab sent no photo. Any earlier upload is deleted by the server within an hour." });
  } else if (!deps.deletePhoto) {
    lines.push({ what: "Uploaded photos on our server", result: "failed", detail: "No connection; the server still deletes uploads within an hour." });
  } else {
    for (const id of deps.photoIds) {
      try {
        const res = await deps.deletePhoto(id);
        lines.push({ what: "Uploaded photo", result: res.deleted ? "deleted" : "nothing to delete", detail: `Photo ${id.slice(0, 6)}…` });
      } catch {
        lines.push({ what: "Uploaded photo", result: "failed", detail: `Photo ${id.slice(0, 6)}…: the server didn't answer; it deletes uploads within an hour.` });
      }
    }
  }
  if (deps.alsoLooks) {
    if (deps.looks) {
      try {
        const n = deps.looks.clear();
        lines.push({ what: "My Looks", result: n ? "deleted" : "nothing to delete", detail: `${n} saved look${n === 1 ? "" : "s"} (settings only).` });
      } catch { lines.push({ what: "My Looks", result: "failed", detail: "Browser storage refused deletion. Try again in this browser." }); }
    }
    if (deps.versionedLooks) {
      try {
        const n = await deps.versionedLooks.clear();
        lines.push({ what: "Saved look versions", result: n ? "deleted" : "nothing to delete", detail: `${n} versioned recipe${n === 1 ? "" : "s"} removed.` });
      } catch { lines.push({ what: "Saved look versions", result: "failed", detail: "Browser storage refused deletion. Versioned recipes may remain." }); }
    }
  } else {
    lines.push({ what: "My Looks", result: "kept", detail: "Settings only, no face data. Tick the box to delete them too." });
  }
  const at = deps.clock().toISOString();
  return { id: "R-" + fingerprint(at + JSON.stringify(lines)).toUpperCase(), at, lines };
}

export function receiptText(receipt: Receipt): string {
  return [`Deletion receipt ${receipt.id}`, receipt.at, ...receipt.lines.map((l) => `${l.what}: ${l.result}. ${l.detail}`)].join("\n");
}
