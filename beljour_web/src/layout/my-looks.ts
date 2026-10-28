/** My Look presets (feature 92, women-first rule 14): save the current stack of edits as a named
 * look, apply it in one tap, share it as a small file, and import one back.
 * A look holds settings only (tool, mode, strength): never a photo, face points or anything
 * measured from a face, so it is safe to keep in this browser's storage. Storage can fail
 * (private windows, blocked storage); every access is guarded and the page works without it.
 * Author: John Khan.
 */
import { clampStrength } from "./effects.js";
import type { KeyValueStore } from "../session.js";

export const LOOKS_KEY = "beljour.my-looks";
export const LOOK_FORMAT = "beljour-my-look/1";
export const MAX_LOOKS = 24;
export const MAX_STEPS = 12;
const KINDS = ["enhance", "hair-fibre", "beard", "posture", "filters", "portrait", "lighting", "recolour", "balayage", "older", "younger", "gender", "skin", "under-eye", "teeth", "shave", "grey", "studio", "illustration"] as const;
export type LookKind = typeof KINDS[number];
const NAME = /^[\p{L}\p{N} .,'&()+-]{1,40}$/u;
const PARAM_KEY = /^[a-z][a-z0-9_-]{0,40}$/;

export interface LookStep {
  kind: LookKind;
  strength: number;
  params: Record<string, string | number | boolean>;
}
export interface MyLook {
  format: typeof LOOK_FORMAT;
  id: string;
  name: string;
  created: string;
  steps: LookStep[];
}

export class LookError extends Error {}

function cleanParams(raw: unknown): Record<string, string | number | boolean> {
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new LookError("Step settings must be a list of names and values");
  const out: Record<string, string | number | boolean> = {};
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > 20) throw new LookError("Too many settings in one step");
  for (const [key, value] of entries) {
    if (!PARAM_KEY.test(key)) throw new LookError(`Setting name ${key} isn't allowed`);
    if (typeof value === "string" && value.length <= 60) out[key] = value;
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean") out[key] = value;
    else throw new LookError(`Setting ${key} has a value this app can't use`);
  }
  return out;
}

export function validateLook(raw: unknown): MyLook {
  if (typeof raw !== "object" || raw === null) throw new LookError("That file isn't a saved look");
  const look = raw as Record<string, unknown>;
  if (look.format !== LOOK_FORMAT) throw new LookError("That file isn't a BELJOUR — FULL BEAUTY STUDIO look");
  if (typeof look.name !== "string" || !NAME.test(look.name.trim())) throw new LookError("A look needs a short name (letters, numbers, spaces)");
  if (typeof look.id !== "string" || !/^[a-z0-9-]{4,40}$/.test(look.id)) throw new LookError("The look's id is damaged");
  if (!Array.isArray(look.steps) || look.steps.length === 0 || look.steps.length > MAX_STEPS) {
    throw new LookError(`A look holds 1 to ${MAX_STEPS} edits`);
  }
  const steps = look.steps.map((s: unknown) => {
    const step = s as Record<string, unknown>;
    if (!KINDS.includes(step?.kind as LookKind)) throw new LookError("A step uses a tool this app doesn't have");
    if (typeof step.strength !== "number") throw new LookError("Each step needs a strength from 0 to 100");
    return { kind: step.kind as LookKind, strength: clampStrength(step.strength), params: cleanParams(step.params) };
  });
  const created = typeof look.created === "string" && !Number.isNaN(Date.parse(look.created)) ? look.created : new Date(0).toISOString();
  return { format: LOOK_FORMAT, id: look.id, name: look.name.trim(), created, steps };
}

/** A face-free fingerprint of any value, used for look ids and receipts (FNV-1a, 32 bit). */
export function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

export class LookStore {
  private memory: MyLook[] = [];
  constructor(private readonly store: KeyValueStore | null, private readonly clock: () => Date = () => new Date()) {
    this.memory = this.read();
  }
  private read(): MyLook[] {
    try {
      const raw = this.store?.getItem(LOOKS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown[];
      return Array.isArray(parsed) ? parsed.flatMap((x) => { try { return [validateLook(x)]; } catch { return []; } }) : [];
    } catch { return []; }
  }
  private write(): void {
    try { this.store?.setItem(LOOKS_KEY, JSON.stringify(this.memory)); } catch { /* kept for this page only */ }
  }
  list(): MyLook[] { return this.memory.map((l) => ({ ...l, steps: l.steps.map((s) => ({ ...s, params: { ...s.params } })) })); }
  get(id: string): MyLook | null { return this.list().find((l) => l.id === id) ?? null; }
  save(name: string, steps: readonly LookStep[]): MyLook {
    if (this.memory.length >= MAX_LOOKS) throw new LookError(`You can keep ${MAX_LOOKS} looks; remove one first`);
    const created = this.clock().toISOString();
    const id = "look-" + fingerprint(name + created + JSON.stringify(steps));
    const look = validateLook({ format: LOOK_FORMAT, id, name, created, steps });
    this.memory = [...this.memory.filter((l) => l.id !== look.id), look];
    this.write();
    return look;
  }
  remove(id: string): boolean {
    const before = this.memory.length;
    this.memory = this.memory.filter((l) => l.id !== id);
    this.write();
    return this.memory.length < before;
  }
  clear(): number {
    const n = this.memory.length;
    this.memory = [];
    try { this.store?.removeItem(LOOKS_KEY); } catch { /* nothing stored */ }
    return n;
  }
  /** Read a shared look file; a clash of ids keeps the existing look and gives the import a new id. */
  importText(text: string): MyLook {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { throw new LookError("That file isn't a saved look"); }
    const look = validateLook(parsed);
    return this.save(look.name, look.steps);
  }
}

export function exportText(look: MyLook): string {
  return JSON.stringify(validateLook(look), null, 1) + "\n";
}

/** The steps of the layers she has on now, ready to save as a look. Hidden layers are left out. */
export function stepsFromLayers(layers: readonly { kind: string; strength: number; enabled: boolean; parameters: Readonly<Record<string, string | number | boolean>> }[]): LookStep[] {
  return layers.filter((l) => l.enabled && KINDS.includes(l.kind as LookKind))
    .map((l) => ({ kind: l.kind as LookKind, strength: clampStrength(l.strength), params: { ...l.parameters } }));
}

export function browserLooks(): KeyValueStore | null {
  try { return (globalThis as { localStorage?: KeyValueStore }).localStorage ?? null; } catch { return null; }
}

/** One plain line describing a look's main settings, for its card. */
export function describe(look: MyLook): string {
  const names: Record<LookKind, string> = { older: "Older", younger: "Younger", gender: "Gender appearance", enhance: "Enhance", "hair-fibre": "Hair fibres", beard: "Beard", posture: "Posture", filters: "Filter look", portrait: "Portrait look", lighting: "Lighting", recolour: "Hair recolour", balayage: "Balayage", skin: "Skin", "under-eye": "Under-eye", "teeth": "Teeth whitening", "shave": "Beard removal", "grey": "Grey Transition", studio: "Photo studio", illustration: "Illustration" };
  return look.steps.map((s) => `${names[s.kind]} ${s.strength}`).join(" · ");
}
