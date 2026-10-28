/** W1 preference storage. Palettes contain names, roles and six-digit colour
 * codes only. Never images, face measurements, filenames or URLs. Explicit saves
 * survive unavailable storage in memory with a visible outcome. Author: John Khan.
 */
import { fingerprint } from "../layout/my-looks.js";
import { hexToRgb, rgbToHex } from "../engines/core/colour.js";

export const PALETTE_FORMAT = "beljour-palette/1", PALETTE_KEY = "beljour.palettes.v1";
export const PALETTE_ROLES = ["eyes", "blush", "lips"] as const;
export type PaletteRole = typeof PALETTE_ROLES[number];
export interface PaletteSwatch { id: string; name: string; hex: string; role: PaletteRole }
export interface PersonalPalette { format: typeof PALETTE_FORMAT; id: string; name: string; created: string; swatches: PaletteSwatch[] }
export interface PaletteStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface PaletteSave { palette: PersonalPalette; stored: boolean; note: string }
export const MAX_PALETTES = 24, MAX_SWATCHES = 18, MAX_PALETTE_FILE = 64 * 1024;
function object(raw: unknown, allowed: readonly string[], label: string): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${label} must be an object.`);
  const out = raw as Record<string, unknown>;
  if (Object.keys(out).some(key => !allowed.includes(key))) throw new Error(`${label} contains unexpected fields.`);
  return out;
}
function name(raw: unknown, label: string): string {
  if (typeof raw !== "string" || raw.trim().length < 1 || raw.length > 40 || /[\u0000-\u001f\u007f]/.test(raw) || /^(?:data:|blob:|https?:)/i.test(raw)) {
    throw new Error(`${label} needs 1 to 40 plain text characters.`);
  }
  return raw.trim();
}
export function validateSwatch(raw: unknown): PaletteSwatch {
  const value = object(raw, ["id", "name", "hex", "role"], "Swatch");
  if (typeof value.id !== "string" || !/^[a-z0-9-]{1,40}$/.test(value.id)) throw new Error("Swatch ID is invalid.");
  if (typeof value.hex !== "string" || !/^#[0-9a-f]{6}$/i.test(value.hex)) throw new Error("Choose a six-digit colour code.");
  if (!(PALETTE_ROLES as readonly unknown[]).includes(value.role)) throw new Error("Choose Eyes, Blush or Lips for every swatch.");
  return { id: value.id, name: name(value.name, "Swatch name"), hex: rgbToHex(hexToRgb(value.hex)), role: value.role as PaletteRole };
}
export function validatePalette(raw: unknown): PersonalPalette {
  const value = object(raw, ["format", "id", "name", "created", "swatches"], "Palette");
  if (value.format !== PALETTE_FORMAT || typeof value.id !== "string" || !/^palette-[a-f0-9]{8}$/.test(value.id)) throw new Error("Unsupported palette file.");
  if (typeof value.created !== "string" || !Number.isFinite(Date.parse(value.created))) throw new Error("Palette date is invalid.");
  if (!Array.isArray(value.swatches) || value.swatches.length < 1 || value.swatches.length > MAX_SWATCHES) throw new Error(`A palette holds 1 to ${MAX_SWATCHES} swatches.`);
  const swatches = value.swatches.map(validateSwatch);
  if (new Set(swatches.map(swatch => swatch.id)).size !== swatches.length) throw new Error("Swatch IDs must be unique.");
  return { format: PALETTE_FORMAT, id: value.id, name: name(value.name, "Palette name"),
    created: new Date(value.created).toISOString(), swatches };
}
export function paletteText(palette: PersonalPalette): string { return JSON.stringify(validatePalette(palette), null, 2) + "\n"; }
export function parsePalette(text: string): PersonalPalette {
  if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_PALETTE_FILE) throw new Error("Palette file is too large.");
  let value: unknown; try { value = JSON.parse(text); } catch { throw new Error("This is not a palette JSON file."); }
  return validatePalette(value);
}
const copy = (palette: PersonalPalette): PersonalPalette => ({ ...palette, swatches: palette.swatches.map(swatch => ({ ...swatch })) });

export class PaletteLibrary {
  private items: PersonalPalette[] = [];
  private counter = 0;
  private storageNote = "";
  constructor(private readonly storage: PaletteStorage | null, private readonly clock: () => Date = () => new Date()) {
    try {
      const stored = storage?.getItem(PALETTE_KEY);
      if (stored) {
        if (new TextEncoder().encode(stored).length > MAX_PALETTES * MAX_PALETTE_FILE) throw new Error("Palette storage too large");
        const value: unknown = JSON.parse(stored);
        if (!Array.isArray(value) || value.length > MAX_PALETTES) throw new Error("Invalid palette store");
        for (const row of value) { try { this.items.push(validatePalette(row)); } catch { this.storageNote = "An invalid saved palette was ignored."; } }
        if (new Set(this.items.map(palette => palette.id)).size !== this.items.length) throw new Error("Repeated palette IDs");
      }
    } catch { this.items = []; this.storageNote = "Saved palettes could not be read. New colours can still be kept in this page."; }
  }
  get note(): string { return this.storageNote; }
  list(): PersonalPalette[] { return this.items.map(copy); }
  get(id: string): PersonalPalette | null { const item = this.items.find(palette => palette.id === id); return item ? copy(item) : null; }
  private persist(removal = false): boolean {
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      if (this.items.length) this.storage.setItem(PALETTE_KEY, JSON.stringify(this.items)); else this.storage.removeItem(PALETTE_KEY);
      this.storageNote = removal ? "Removed from this device's palette storage." : "Saved colour settings only. No photo or skin measurement was stored."; return true;
    } catch {
      this.storageNote = removal
        ? "Removed from this page. Device storage could not be updated; the old saved palette may reappear after reload."
        : "Storage is unavailable. This palette is kept only in this page; export its colour file before leaving.";
      return false;
    }
  }
  save(title: string, swatches: readonly PaletteSwatch[], existingId?: string): PaletteSave {
    const prior = existingId ? this.items.find(palette => palette.id === existingId) : undefined;
    if (existingId && !prior) throw new Error("This saved palette is no longer available.");
    if (!prior && this.items.length >= MAX_PALETTES) throw new Error(`Keep at most ${MAX_PALETTES} palettes. Remove one before adding another.`);
    const created = prior?.created ?? this.clock().toISOString();
    let id = prior?.id ?? "palette-" + fingerprint(title + created + JSON.stringify(swatches) + ++this.counter);
    while (!prior && this.items.some(item => item.id === id)) id = "palette-" + fingerprint(id + ++this.counter);
    const palette = validatePalette({ format: PALETTE_FORMAT, id, name: title, created, swatches });
    this.items = prior ? this.items.map(item => item.id === prior.id ? palette : item) : [...this.items, palette];
    const stored = this.persist(); return { palette: copy(palette), stored, note: this.storageNote };
  }
  import(text: string): PaletteSave {
    const parsed = parsePalette(text);
    // Import as a new local copy. A file cannot silently replace an existing palette.
    return this.save(parsed.name, parsed.swatches);
  }
  remove(id: string): { removed: boolean; stored: boolean } {
    const before = this.items.length; this.items = this.items.filter(item => item.id !== id);
    return { removed: this.items.length !== before, stored: this.persist(true) };
  }
  clear(): { removed: number; stored: boolean } {
    const removed = this.items.length; this.items = []; return { removed, stored: this.persist(true) };
  }
}
export function browserPalettes(): PaletteLibrary {
  let storage: PaletteStorage | null = null;
  try { storage = globalThis.localStorage ?? null; } catch { /* denied getter: memory-only editor */ }
  return new PaletteLibrary(storage);
}
