/** Revision-bound browser evidence ledger, never a release-certificate store.
 * Image bytes and private hashes are excluded from public state and receipts.
 * Author: John Khan.
 */
import { evaluateCommandLocks, LockMatrixReport, LockObservation } from './lock-matrix.js';
import { collectObservedLock, ObservedLockOptions } from './observed-lock.js';
import { ProPlan } from './plan.js';
import { checkedFrame, PixelFrame, ProRenderError, RunSummary } from './runtime.js';

export interface ObservationTicket {
  readonly revision: number;
}

export interface BrowserLedgerState {
  readonly open: boolean;
  readonly revision: number;
  readonly observed: number;
  readonly commandsObserved: number;
  readonly levelsMissing: number;
  readonly releaseQualified: false;
}

async function privatePhotoDigest(source: PixelFrame): Promise<string> {
  checkedFrame(source);
  if (typeof crypto === 'undefined' || crypto.subtle === undefined) {
    throw new ProRenderError('hash_unavailable', 'A secure local hash is required to bind evidence.');
  }
  const bytes = new Uint8Array(source.pixels.byteLength + 9);
  const header = new DataView(bytes.buffer);
  header.setUint32(0, source.width, false);
  header.setUint32(4, source.height, false);
  bytes[8] = source.channels;
  bytes.set(source.pixels, 9);
  const hashed = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashed), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class BrowserObservedLockLedger {
  private revision = 0;
  private photoDigest: string | null = null;
  private readonly rows = new Map<string, LockObservation>();

  async openPhoto(source: PixelFrame): Promise<ObservationTicket> {
    this.closePhoto();
    const revision = this.revision;
    const digest = await privatePhotoDigest(source);
    if (revision !== this.revision) {
      throw new ProRenderError('stale_preview', 'Photo changed while opening evidence.');
    }
    this.photoDigest = digest;
    return Object.freeze({ revision });
  }

  closePhoto(): void {
    this.revision++;
    this.photoDigest = null;
    this.rows.clear();
  }

  ticket(): ObservationTicket {
    if (this.photoDigest === null) {
      throw new ProRenderError('photo_missing', 'A photo must be opened before lock evidence.');
    }
    return Object.freeze({ revision: this.revision });
  }

  private async checkTicket(ticket: ObservationTicket, source: PixelFrame): Promise<void> {
    if (typeof ticket !== 'object' || ticket === null ||
        !Number.isInteger(ticket.revision) || ticket.revision < 1) {
      throw new ProRenderError('invalid_ticket', 'A valid observation ticket is required.');
    }
    if (this.photoDigest === null || ticket.revision !== this.revision) {
      throw new ProRenderError('stale_preview', 'A newer photo invalidated the lock observation.');
    }
    const digest = await privatePhotoDigest(source);
    if (this.photoDigest === null || ticket.revision !== this.revision) {
      throw new ProRenderError('stale_preview', 'Photo changed during evidence capture.');
    }
    if (digest !== this.photoDigest) {
      throw new ProRenderError('photo_mismatch', 'Lock evidence belongs to a different photo.');
    }
  }

  async observe(
    ticket: ObservationTicket,
    source: PixelFrame,
    plan: ProPlan,
    preview: RunSummary,
    exported: RunSummary,
    options: ObservedLockOptions = {},
  ): Promise<LockObservation> {
    await this.checkTicket(ticket, source);
    const observed = collectObservedLock(plan, source, preview, exported, options);
    const key = `${observed.command}:${observed.levelTenths}`;
    if (this.rows.has(key)) {
      throw new ProRenderError('duplicate_lock_evidence', 'An observed decimal level cannot be overwritten.');
    }
    if (this.rows.size >= 205) {
      throw new ProRenderError('invalid_lock_matrix', 'The five-command observation limit was reached.');
    }
    await this.checkTicket(ticket, source);
    this.rows.set(key, observed);
    return observed;
  }

  get state(): BrowserLedgerState {
    const commands = new Set([...this.rows.values()].map((row) => row.command));
    return Object.freeze({ open: this.photoDigest !== null, revision: this.revision,
      observed: this.rows.size, commandsObserved: commands.size,
      levelsMissing: 205 - this.rows.size, releaseQualified: false });
  }

  snapshot(): readonly LockObservation[] {
    if (this.photoDigest === null) {
      throw new ProRenderError('photo_missing', 'Observation session is closed.');
    }
    const order = ['identitylock', 'cleanup', 'upscale', 'studioquality', 'poseonly'];
    return Object.freeze([...this.rows.values()].sort((left, right) => {
      const c = order.indexOf(left.command) - order.indexOf(right.command);
      return c || left.levelTenths - right.levelTenths;
    }));
  }

  report(): LockMatrixReport {
    return evaluateCommandLocks(this.snapshot());
  }
}
