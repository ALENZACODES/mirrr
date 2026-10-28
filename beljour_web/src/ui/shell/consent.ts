/** Consent gate (plan N22, round brief item 1): nothing reaches the styling provider without it.
 *
 * Two levels:
 *  1. Visit consent, once per browser tab: the person confirms they are 18 or older and that
 *     they understand how photos are used. Needed before opening a photo from the device.
 *     It is the only consent record kept between pages of the same tab, in sessionStorage,
 *     and it holds no photo, file name, face data or provider identifier: just the version,
 *     the two answers and the time. Storage failures fall back to memory for this page.
 *  2. Photo consent, per uploaded photo and per scope (makeup or hair styling): given by a
 *     deliberate tick next to the action that sends the photo, held in memory only, and
 *     ended by withdrawal, by a new photo, or after 30 minutes.
 * styling-tasks.ts asks this gate before every quote, so a missing consent stops the request
 * before any network call.
 *
 * On-device only (plan N21): one switch that refuses every provider request and every new photo
 * consent until it is turned off. Kept for the tab in sessionStorage as "1", nothing else.
 *
 * Author: John Khan.
 */

export const CONSENT_VERSION = "beljour-consent/1";
export const STORAGE_KEY = "beljour.consent";
export const LOCAL_ONLY_KEY = "beljour.local-only";
export const LOCAL_ONLY_REASON = "On-device only is on, so nothing is sent to YouCam. Turn it off in the studio to use makeup and hair styling.";
export const PHOTO_CONSENT_MS = 30 * 60 * 1000;

export type ProviderScope = "makeup" | "hair";
export const STYLING_ACTIONS = ["makeup", "hair-color", "hair-style", "hair-transfer", "hair-bang", "hair-curl", "hair-extension", "hair-volume"] as const;
export type StylingAction = typeof STYLING_ACTIONS[number];

export interface Statement { id: "adult" | "understood"; text: string }
export const VISIT_STATEMENTS: readonly Statement[] = [
  { id: "adult", text: "I'm 18 or older, and so is everyone in the photos I open." },
  { id: "understood", text: "I understand that local tools run on this device, and that a photo is sent to YouCam only when I tick the box next to a makeup or hair styling action." },
];

export const PROVIDER_FACTS: readonly string[] = [
  "Only the photo you chose is sent, for the one makeup or hair styling action you start.",
  "YouCam processes it and the result comes back here. The provider copy is deleted after the result.",
  "Each action shows its unit price before you start. Cached results cost nothing.",
  "Location data and other file metadata are removed before upload.",
  "You can withdraw at any time. Local tools keep working without consent to send.",
];

export function scopeFor(action: string): ProviderScope {
  if (action === "makeup") return "makeup";
  if ((STYLING_ACTIONS as readonly string[]).includes(action)) return "hair";
  throw new RangeError("Only makeup and hair styling actions can be sent to the provider");
}

export function scopeTitle(scope: ProviderScope): string {
  return scope === "makeup" ? "makeup preview" : "hair styling preview";
}

export interface VisitRecord { version: string; adult: true; understood: true; at: number }
export interface PhotoGrant { photoId: string; scopes: ProviderScope[]; at: number; expires: number; othersConfirmed: boolean }

export type ConsentNeed = "visit" | "photo" | "scope" | "expired" | "local-only";
export type ConsentCheck = { allowed: true; grant: PhotoGrant } | { allowed: false; need: ConsentNeed; reason: string };

/** What the server checks (api/plumb_api/consent.py): sent with each styling request. */
export interface ConsentAttestation { version: string; adult: true; scope: ProviderScope; photo_id: string; given_at: number }

export function attestationFor(grant: Pick<PhotoGrant, "at">, photoId: string, action: string): ConsentAttestation {
  return { version: CONSENT_VERSION, adult: true, scope: scopeFor(action), photo_id: photoId, given_at: grant.at };
}

export class ConsentRequired extends Error {
  constructor(readonly need: ConsentNeed, message: string) { super(message); this.name = "ConsentRequired"; }
}

/** The parts of the Web Storage API the gate uses, so tests can pass a fake or nothing. */
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }

const PHOTO_ID = /^[A-Za-z0-9_-]{4,64}$/;

/** Parse a stored visit record. Anything unexpected is treated as no consent. */
export function readVisit(raw: string | null, now: number): VisitRecord | null {
  if (!raw || raw.length > 400) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const keys = Object.keys(value).sort().join(",");
    if (keys !== "adult,at,understood,version") return null;
    if (value.version !== CONSENT_VERSION || value.adult !== true || value.understood !== true) return null;
    if (typeof value.at !== "number" || !Number.isFinite(value.at) || value.at > now + 60_000) return null;
    return { version: CONSENT_VERSION, adult: true, understood: true, at: value.at };
  } catch { return null; }
}

export interface Receipt { kind: "visit" | "photo" | "withdrawn" | "revoked" | "local-only"; at: number; detail: string }

export class ConsentGate {
  private visitRecord: VisitRecord | null = null;
  private localOnlyFlag = false;
  private readonly grants = new Map<string, PhotoGrant>();
  private readonly log: Receipt[] = [];
  private readonly listeners = new Set<() => void>();
  constructor(private readonly clock: () => number = () => Date.now(), private readonly store: KeyValueStore | null = null,
    private readonly photoMs = PHOTO_CONSENT_MS) {
    if (!(Number.isFinite(photoMs) && photoMs >= 1000 && photoMs <= 24 * 3600 * 1000)) throw new RangeError("Photo consent must last 1 s to 24 h");
    try { this.visitRecord = readVisit(store?.getItem(STORAGE_KEY) ?? null, clock()); } catch { this.visitRecord = null; }
    try { this.localOnlyFlag = store?.getItem(LOCAL_ONLY_KEY) === "1"; } catch { this.localOnlyFlag = false; }
  }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private changed(receipt: Receipt): void {
    this.log.push(receipt);
    if (this.log.length > 50) this.log.shift();
    for (const listener of this.listeners) listener();
  }
  get visit(): VisitRecord | null { return this.visitRecord ? { ...this.visitRecord } : null; }
  get hasVisit(): boolean { return this.visitRecord !== null; }
  get localOnly(): boolean { return this.localOnlyFlag; }
  /** Turn on-device only on or off. Turning it on also ends every photo consent. */
  setLocalOnly(on: boolean): void {
    if (on === this.localOnlyFlag) return;
    this.localOnlyFlag = on;
    if (on) this.grants.clear();
    try { if (on) this.store?.setItem(LOCAL_ONLY_KEY, "1"); else this.store?.removeItem(LOCAL_ONLY_KEY); } catch { /* memory only */ }
    this.changed({ kind: "local-only", at: this.clock(), detail: on ? "On-device only turned on" : "On-device only turned off" });
  }
  /** Record visit consent. Both answers must be an explicit yes. */
  acceptVisit(answers: { adult: boolean; understood: boolean }): VisitRecord {
    if (answers.adult !== true) throw new ConsentRequired("visit", "BELJOUR — FULL BEAUTY STUDIO is for adults. Your best day. Still you. Confirm you're 18 or older to open a photo.");
    if (answers.understood !== true) throw new ConsentRequired("visit", "Please confirm you understand how photos are used.");
    const record: VisitRecord = { version: CONSENT_VERSION, adult: true, understood: true, at: this.clock() };
    this.visitRecord = record;
    try { this.store?.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* memory only on this page */ }
    this.changed({ kind: "visit", at: record.at, detail: "Visit consent given" });
    return { ...record };
  }
  /** Consent to send one uploaded photo for the given scopes. Needs visit consent first. */
  grantPhoto(photoId: string, scopes: readonly ProviderScope[], { othersConfirmed = true }: { othersConfirmed?: boolean } = {}): PhotoGrant {
    if (this.localOnlyFlag) throw new ConsentRequired("local-only", LOCAL_ONLY_REASON);
    if (!this.visitRecord) throw new ConsentRequired("visit", "Confirm the visit consent before sending any photo.");
    if (!PHOTO_ID.test(photoId)) throw new RangeError("Photo consent needs the uploaded photo's ID");
    if (!scopes.length || !scopes.every((s) => s === "makeup" || s === "hair")) throw new RangeError("Choose makeup, hair styling or both");
    if (othersConfirmed !== true) throw new ConsentRequired("photo", "Everyone in the photo must be an adult who agreed to it.");
    const at = this.clock();
    const previous = this.grants.get(photoId);
    const merged = [...new Set([...(previous && previous.expires > at ? previous.scopes : []), ...scopes])].sort() as ProviderScope[];
    const grant: PhotoGrant = { photoId, scopes: merged, at, expires: at + this.photoMs, othersConfirmed: true };
    this.grants.set(photoId, grant);
    this.changed({ kind: "photo", at, detail: `Photo consent for ${merged.map(scopeTitle).join(" and ")}` });
    return { ...grant, scopes: [...grant.scopes] };
  }
  check(photoId: string, action: string): ConsentCheck {
    const scope = scopeFor(action);
    if (this.localOnlyFlag) return { allowed: false, need: "local-only", reason: LOCAL_ONLY_REASON };
    if (!this.visitRecord) return { allowed: false, need: "visit", reason: "Confirm you're 18 or older and how photos are used before anything is sent." };
    const grant = this.grants.get(photoId);
    if (!grant) return { allowed: false, need: "photo", reason: `Tick "Send this photo to YouCam" to start a ${scopeTitle(scope)}.` };
    if (grant.expires <= this.clock()) {
      this.grants.delete(photoId);
      return { allowed: false, need: "expired", reason: "Consent to send this photo has expired. Tick the box again to continue." };
    }
    if (!grant.scopes.includes(scope)) return { allowed: false, need: "scope", reason: `This photo was only cleared for ${grant.scopes.map(scopeTitle).join(" and ")}.` };
    return { allowed: true, grant: { ...grant, scopes: [...grant.scopes] } };
  }
  /** Throw unless the photo may be sent for this action. */
  require(photoId: string, action: string): PhotoGrant {
    const result = this.check(photoId, action);
    if (!result.allowed) throw new ConsentRequired(result.need, result.reason);
    return result.grant;
  }
  allows(photoId: string, action: string): boolean { return this.check(photoId, action).allowed; }
  revokePhoto(photoId: string): boolean {
    const had = this.grants.delete(photoId);
    if (had) this.changed({ kind: "revoked", at: this.clock(), detail: "Photo consent withdrawn" });
    return had;
  }
  /** Withdraw everything: visit consent and every photo consent. */
  withdraw(): void {
    this.visitRecord = null; this.grants.clear();
    try { this.store?.removeItem(STORAGE_KEY); } catch { /* nothing stored */ }
    this.changed({ kind: "withdrawn", at: this.clock(), detail: "All consent withdrawn" });
  }
  /** Photo-free history of consent events, for the privacy panel. */
  receipts(): Receipt[] { return this.log.map((r) => ({ ...r })); }
  activeGrants(): PhotoGrant[] {
    const now = this.clock();
    return [...this.grants.values()].filter((g) => g.expires > now).map((g) => ({ ...g, scopes: [...g.scopes] }));
  }
}

function browserStore(): KeyValueStore | null {
  try {
    const store = (globalThis as { sessionStorage?: KeyValueStore }).sessionStorage;
    return store ?? null;
  } catch { return null; }
}

/** The one gate for this page. Classic screens and the studio share the stored visit record. */
export const appConsent = new ConsentGate(() => Date.now(), browserStore());
