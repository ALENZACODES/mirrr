/**
 * Progress history kept on this device only (IndexedDB). No photos are stored, just
 * dates and scores. People can export it as a file or wipe it.
 */
import type { SkinResult } from "./types.js";

export interface SkinEntry {
  at: string;          // ISO date
  overall: number | null;
  scores: Record<string, number>;   // concern -> measured score
  sample: boolean;
}

const DB = "plumb";
const STORE = "skin";
const BODY = "body";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      for (const name of [STORE, BODY]) {
        if (!req.result.objectStoreNames.contains(name)) req.result.createObjectStore(name, { autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function toEntry(result: SkinResult, sample: boolean, at = new Date()): SkinEntry {
  const scores: Record<string, number> = {};
  for (const s of result.scores) scores[s.concern] = s.raw_score;
  return { at: at.toISOString(), overall: result.overall, scores, sample };
}

export async function addSkin(entry: SkinEntry): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listSkin(): Promise<SkinEntry[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as SkinEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAll(): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve) => {
    const tx = db.transaction([STORE, BODY], "readwrite");
    tx.objectStore(STORE).clear();
    tx.objectStore(BODY).clear();
    tx.oncomplete = () => resolve();
  });
}

export interface BodyEntry {
  at: string;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  bmi?: number;
  whtr?: number;
}

export async function addBody(entry: BodyEntry): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(BODY, "readwrite");
    tx.objectStore(BODY).add(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listBody(): Promise<BodyEntry[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(BODY).objectStore(BODY).getAll();
    req.onsuccess = () => resolve(req.result as BodyEntry[]);
    req.onerror = () => reject(req.error);
  });
}

/** Change in a concern's measured score between the first and last real (non sample) entries. */
export function trend(entries: SkinEntry[], concern: string): { first: number; last: number; change: number } | null {
  const real = entries.filter((e) => !e.sample && concern in e.scores);
  if (real.length < 2) return null;
  const first = real[0].scores[concern], last = real[real.length - 1].scores[concern];
  return { first, last, change: Math.round((last - first) * 10) / 10 };
}
