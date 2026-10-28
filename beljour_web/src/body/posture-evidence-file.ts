/** Local JSON import for body evidence and coverage files, never uploaded.
 * Reads one user-chosen file: JSON media type (or none), at most 512 KiB, strict UTF-8,
 * one JSON value. A newer read, `cancel()` or `dispose()` makes an older read stale, so a
 * slow file can never overwrite a newer choice. Parsing is separate from validation; the
 * caller validates with the strict evidence or coverage reader. The file name is never read.
 * Author: John Khan.
 */

/** ASSUMED: a 308-row counts-only report is about 60 KiB; 512 KiB leaves room, not abuse. */
export const MAX_EVIDENCE_FILE_BYTES = 512 * 1024;
export const EVIDENCE_FILE_TYPES = ["application/json", "text/json", ""] as const;

export type EvidenceFileRefusal = "unsupported_evidence_file" | "evidence_file_too_large" | "empty_evidence_file"
  | "invalid_utf8" | "invalid_json";

export class EvidenceFileRefused extends RangeError {
  constructor(readonly code: EvidenceFileRefusal) {
    super(code);
    this.name = "EvidenceFileRefused";
  }
}

export type EvidenceRead = { status: "done"; value: unknown } | { status: "stale" };

/** Read and parse one file; throws EvidenceFileRefused for anything but bounded UTF-8 JSON. */
export async function parseEvidenceFile(file: Blob): Promise<unknown> {
  if (!(EVIDENCE_FILE_TYPES as readonly string[]).includes(file.type)) throw new EvidenceFileRefused("unsupported_evidence_file");
  if (file.size > MAX_EVIDENCE_FILE_BYTES) throw new EvidenceFileRefused("evidence_file_too_large");
  if (file.size === 0) throw new EvidenceFileRefused("empty_evidence_file");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength !== file.size || bytes.byteLength > MAX_EVIDENCE_FILE_BYTES) {
    throw new EvidenceFileRefused("evidence_file_too_large");
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    throw new EvidenceFileRefused("invalid_utf8");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new EvidenceFileRefused("invalid_json");
  }
}

/** Latest-wins reader: only the newest outstanding read can complete as "done". */
export class EvidenceFileReader {
  private ticket = 0;
  private disposed = false;

  async read(file: Blob): Promise<EvidenceRead> {
    if (this.disposed) throw new RangeError("evidence reader has been disposed");
    const mine = ++this.ticket;
    let value: unknown;
    try {
      value = await parseEvidenceFile(file);
    } catch (error) {
      if (mine !== this.ticket || this.disposed) return { status: "stale" };
      throw error;
    }
    return mine === this.ticket && !this.disposed ? { status: "done", value } : { status: "stale" };
  }

  cancel(): void {
    this.ticket++;
  }

  dispose(): void {
    this.cancel();
    this.disposed = true;
  }
}
