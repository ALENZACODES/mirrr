/** User-initiated measurement-diary import/export only. Author: John Khan. */
import { diaryTrend, validateDiary, type DiaryEntry } from "./progress.js";
export const DIARY_FORMAT = "beljour-brow-lash-diary/1";
export const MAX_DIARY_BYTES = 32768;
export interface DiaryDocument {
  format: typeof DIARY_FORMAT;
  author: "John Khan";
  entries: DiaryEntry[];
  attribution: false;
  contains_photos: false;
}

export function diaryDocument(entries: unknown): DiaryDocument {
  return { format: DIARY_FORMAT, author: "John Khan", entries: validateDiary(entries), attribution: false, contains_photos: false };
}

export function parseDiary(value: unknown): DiaryDocument {
  let data = value;
  if (typeof data === "string") {
    if (new TextEncoder().encode(data).length > MAX_DIARY_BYTES) throw new RangeError("diary exceeds 32 KiB");
    try { data = JSON.parse(data); } catch { throw new RangeError("invalid diary JSON"); }
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).sort().join(",") !== "attribution,author,contains_photos,entries,format") {
    throw new RangeError("unknown diary document fields");
  }
  const object = data as Record<string, unknown>;
  if (object.format !== DIARY_FORMAT || object.author !== "John Khan") throw new RangeError("unsupported diary format or author");
  if (object.attribution !== false || object.contains_photos !== false) throw new RangeError("diary cannot contain photographs or efficacy attribution");
  return diaryDocument(object.entries);
}

export function exportDiary(entries: unknown): string {
  const encoded = JSON.stringify(diaryDocument(entries));
  if (new TextEncoder().encode(encoded).length > MAX_DIARY_BYTES) throw new RangeError("diary exceeds 32 KiB");
  return encoded;
}

export function summarizeDiary(entries: unknown): Record<string, unknown> {
  const validated = validateDiary(entries);
  return { count: validated.length, first_date: validated[0]?.date ?? null,
    last_date: validated.at(-1)?.date ?? null, brows: diaryTrend(validated, "brows"),
    lashes: diaryTrend(validated, "lashes"), attribution: false, photos_stored: false };
}
