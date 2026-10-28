/** Local-only R17B studio provenance contracts. Author: John Khan. */
import { sha256, sha256Bytes } from '../../engines/workflow_w/passport.js';

export type R17Family = 'hair_women' | 'makeup_w' | 'workflow_w' | 'upscale' | 'gender_look' | 'shave';
export type RenderState = 'pending' | 'completed' | 'cancelled' | 'stale' | 'failed';
export type Scalar = string | number | boolean | null;

export interface RecipeSnapshot {
  feature: string;
  family: R17Family;
  style: string;
  amount: number;
  humidity?: number;
  direction?: 'neutral' | 'feminine' | 'masculine';
  level?: 'normal' | 'extra' | 'hyper';
  metadata?: Record<string, Scalar>;
}

export interface Observation {
  sequence: number;
  key: string;
  value: Scalar;
  source: 'user' | 'checked' | 'engine';
  assumed: boolean;
}

export interface RenderTicket {
  id: number;
  revision: number;
  feature: string;
  photo_sha256: string;
  recipe_sha256: string;
  definitions_sha256: string;
}

export interface RenderReceipt {
  ticket: RenderTicket;
  state: RenderState;
  output_sha256: string | null;
  elapsed_ms: number | null;
  reason: string;
}

const MAX_TEXT = 240;
const MAX_METADATA = 24;
const MAX_OBSERVATIONS = 256;

function safeText(value: unknown, name: string, allowEmpty = false): string {
  if (typeof value !== 'string') throw new Error(`${name} must be text`);
  const text = value.trim();
  if (!allowEmpty && !text) throw new Error(`${name} cannot be empty`);
  if (text.length > MAX_TEXT) throw new Error(`${name} is too long`);
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 && char !== '\t' && char !== '\n') throw new Error(`${name} contains control characters`);
  }
  return text;
}

function finite(value: unknown, name: string, low: number, high: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) {
    throw new Error(`${name} must be in ${low}..${high}`);
  }
  return value;
}

function safeScalar(value: unknown, name: string): Scalar {
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return safeText(value, name, true);
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000) throw new Error(`${name} outside safe range`);
    return value;
  }
  throw new Error(`${name} must be a scalar`);
}

function metadata(value: Record<string, Scalar> | undefined): Record<string, Scalar> {
  if (!value) return {};
  const keys = Object.keys(value);
  if (keys.length > MAX_METADATA) throw new Error('metadata has too many keys');
  const out: Record<string, Scalar> = {};
  for (const key of keys.sort()) {
    const clean = safeText(key, 'metadata key');
    if (clean.startsWith('_')) throw new Error('private metadata keys are reserved');
    out[clean] = safeScalar(value[key], `metadata.${clean}`);
  }
  return out;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(',')}}`;
}

export function validateRecipe(recipe: RecipeSnapshot, featureGroups: Readonly<Record<string, R17Family>>): RecipeSnapshot {
  if (!(recipe.feature in featureGroups)) throw new Error('feature has no R17B pass definition');
  if (featureGroups[recipe.feature] !== recipe.family) throw new Error('feature/family mismatch');
  const style = safeText(recipe.style, 'style', true);
  const amount = finite(recipe.amount, 'amount', 0, 1);
  const humidity = finite(recipe.humidity ?? 55, 'humidity', 0, 100);
  const direction = recipe.direction ?? 'neutral';
  if (!['neutral', 'feminine', 'masculine'].includes(direction)) throw new Error('invalid direction');
  const level = recipe.level ?? 'normal';
  if (!['normal', 'extra', 'hyper'].includes(level)) throw new Error('invalid level');
  return { feature: recipe.feature, family: recipe.family, style, amount, humidity, direction, level, metadata: metadata(recipe.metadata) };
}

export function canonicalRecipe(recipe: RecipeSnapshot, featureGroups: Readonly<Record<string, R17Family>>): string {
  return stableStringify(validateRecipe(recipe, featureGroups));
}

export function recipeFingerprint(recipe: RecipeSnapshot, featureGroups: Readonly<Record<string, R17Family>>): string {
  return sha256(canonicalRecipe(recipe, featureGroups));
}

export function photoFingerprint(data: Uint8Array, width: number, height: number, channels: 3 | 4): string {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 12_000_000) {
    throw new Error('photo dimensions outside supported range');
  }
  if (data.length !== width * height * channels) throw new Error('photo byte length does not match dimensions');
  const prefix = new TextEncoder().encode('beljour.r17b.photo.v1\0');
  const header = new Uint8Array(9);
  const view = new DataView(header.buffer);
  view.setUint32(0, width, false);
  view.setUint32(4, height, false);
  view.setUint8(8, channels);
  const all = new Uint8Array(prefix.length + header.length + data.length);
  all.set(prefix, 0);
  all.set(header, prefix.length);
  all.set(data, prefix.length + header.length);
  return sha256Bytes(all);
}

function validHash(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}

export class LocalSession {
  readonly sessionId: string;
  private photoSha: string | null = null;
  private currentRecipe: RecipeSnapshot | null = null;
  private rev = 0;
  private nextTicket = 1;
  private observations_: Observation[] = [];
  private receipts_: RenderReceipt[] = [];

  constructor(
    sessionId: string,
    private readonly featureGroups: Readonly<Record<string, R17Family>>,
    private readonly definitionsSha256: string,
  ) {
    this.sessionId = safeText(sessionId, 'session_id');
    if (!validHash(definitionsSha256)) throw new Error('definitions hash must be sha256');
  }

  get revision(): number { return this.rev; }
  get photoSha256(): string | null { return this.photoSha; }
  get recipe(): RecipeSnapshot | null { return this.currentRecipe ? structuredClone(this.currentRecipe) : null; }
  get observations(): readonly Observation[] { return this.observations_.map((item) => ({ ...item })); }
  get receipts(): readonly RenderReceipt[] { return this.receipts_.map((item) => ({ ...item, ticket: { ...item.ticket } })); }

  bindPhoto(digest: string): void {
    if (!validHash(digest)) throw new Error('photo digest must be lowercase sha256');
    if (digest !== this.photoSha) {
      this.photoSha = digest;
      this.currentRecipe = null;
      this.rev += 1;
    }
  }

  setRecipe(recipe: RecipeSnapshot): void {
    const clean = validateRecipe(recipe, this.featureGroups);
    if (!this.photoSha && clean.family !== 'workflow_w') throw new Error('photo-backed feature requires a bound photo');
    if (!this.currentRecipe || recipeFingerprint(this.currentRecipe, this.featureGroups) !== recipeFingerprint(clean, this.featureGroups)) {
      this.currentRecipe = clean;
      this.rev += 1;
    }
  }

  observe(key: string, value: Scalar, source: Observation['source'] = 'user', assumed = false): Observation {
    if (this.observations_.length >= MAX_OBSERVATIONS) throw new Error('observation limit reached');
    const cleanKey = safeText(key, 'observation key');
    if (!['user', 'checked', 'engine'].includes(source)) throw new Error('invalid observation source');
    if (source === 'checked' && assumed) throw new Error('checked observation cannot be marked assumed');
    const observation = { sequence: this.observations_.length + 1, key: cleanKey, value: safeScalar(value, `observation.${cleanKey}`), source, assumed };
    this.observations_.push(observation);
    this.rev += 1;
    return { ...observation };
  }

  ticket(): RenderTicket {
    if (!this.currentRecipe) throw new Error('recipe must be selected before rendering');
    const photo = this.photoSha ?? (this.currentRecipe.family === 'workflow_w' ? '0'.repeat(64) : '');
    if (!photo) throw new Error('photo-backed render requires a photo');
    const ticket: RenderTicket = {
      id: this.nextTicket++, revision: this.rev, feature: this.currentRecipe.feature, photo_sha256: photo,
      recipe_sha256: recipeFingerprint(this.currentRecipe, this.featureGroups), definitions_sha256: this.definitionsSha256,
    };
    return ticket;
  }

  private isCurrent(ticket: RenderTicket): boolean {
    if (!this.currentRecipe) return false;
    return ticket.revision === this.rev && ticket.feature === this.currentRecipe.feature
      && ticket.photo_sha256 === (this.photoSha ?? '0'.repeat(64))
      && ticket.recipe_sha256 === recipeFingerprint(this.currentRecipe, this.featureGroups)
      && ticket.definitions_sha256 === this.definitionsSha256;
  }

  complete(ticket: RenderTicket, output: Uint8Array, elapsedMs: number): RenderReceipt {
    let receipt: RenderReceipt;
    if (!this.isCurrent(ticket)) receipt = { ticket: { ...ticket }, state: 'stale', output_sha256: null, elapsed_ms: null, reason: 'session changed before result arrived' };
    else receipt = { ticket: { ...ticket }, state: 'completed', output_sha256: sha256Bytes(output), elapsed_ms: finite(elapsedMs, 'elapsed_ms', 0, 3_600_000), reason: '' };
    this.receipts_.push(receipt);
    return structuredClone(receipt);
  }

  cancel(ticket: RenderTicket, reason = 'user cancelled'): RenderReceipt {
    const receipt: RenderReceipt = { ticket: { ...ticket }, state: 'cancelled', output_sha256: null, elapsed_ms: null, reason: safeText(reason, 'reason') };
    this.receipts_.push(receipt);
    return structuredClone(receipt);
  }

  fail(ticket: RenderTicket, reason: string): RenderReceipt {
    const receipt: RenderReceipt = { ticket: { ...ticket }, state: 'failed', output_sha256: null, elapsed_ms: null, reason: safeText(reason, 'reason') };
    this.receipts_.push(receipt);
    return structuredClone(receipt);
  }

  safeExport(): Record<string, unknown> {
    return {
      schema: 'beljour.r17b.session.v1', author: 'John Khan', session_id: this.sessionId, revision: this.rev,
      photo_sha256: this.photoSha, recipe: this.currentRecipe ? validateRecipe(this.currentRecipe, this.featureGroups) : null,
      observations: this.observations_.map((item) => ({ ...item })), receipts: this.receipts_.map((item) => structuredClone(item)),
      privacy: 'metadata and hashes only; photo pixels, masks and landmarks excluded', definitions_sha256: this.definitionsSha256,
    };
  }

  safeExportText(): string { return stableStringify(this.safeExport()); }
  auditSha256(): string { return sha256(this.safeExportText()); }
}
