/** Only our named public-shell cache may be listed or deleted. No photo storage access. */
const SHELL_PREFIX = "beljour-public-shell-";

export interface PublicShellStorage {
  readonly cacheVersions: number;
  readonly siteUsageBytes: number | null;
  readonly siteQuotaBytes: number | null;
  readonly pageIsOffline: boolean | null;
  readonly message: string;
}

export interface CacheStoreLike {
  keys(): Promise<readonly string[]>;
  delete(name: string): Promise<boolean>;
}

export interface StorageEstimate {
  readonly usage?: number;
  readonly quota?: number;
}

export interface SiteStorageLike {
  estimate(): Promise<StorageEstimate>;
}

export function isPublicShellCache(name: unknown): name is string {
  return typeof name === "string" && name.startsWith(SHELL_PREFIX)
    && /^[0-9a-f]{24}$/.test(name.slice(SHELL_PREFIX.length));
}

function amount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value : null;
}

export async function inspectPublicShellStorage(
  caches: CacheStoreLike | null,
  storage: SiteStorageLike | null,
  online: boolean | null,
): Promise<PublicShellStorage> {
  let versions = 0;
  if (caches) {
    try {
      const found = await caches.keys();
      versions = found.filter(isPublicShellCache).length;
    } catch {
      // Storage permission failures must not stop local editing.
    }
  }
  let usage: number | null = null;
  let quota: number | null = null;
  if (storage) {
    try {
      const estimate = await storage.estimate();
      usage = amount(estimate.usage);
      quota = amount(estimate.quota);
    } catch {
      // Browser may deny storage estimates in private mode.
    }
  }
  return {
    cacheVersions: versions,
    siteUsageBytes: usage,
    siteQuotaBytes: quota,
    pageIsOffline: online === null ? null : !online,
    message: "Site storage estimates include other browser data; not a measure of photo usage or offline readiness.",
  };
}

/** Explicit user-requested cleanup. Never delete a different cache namespace. */
export async function clearPublicShellStorage(caches: CacheStoreLike): Promise<number> {
  const keys = await caches.keys();
  let removed = 0;
  for (const name of keys) {
    if (isPublicShellCache(name) && await caches.delete(name)) removed += 1;
  }
  return removed;
}
