/** Explicitly consented transport for the existing key-proxy origin; no vendor SDK.
 * Requests are never sent to YouCam from a browser. Upload is opt-in only and metadata
 * is stripped by the caller using the canvas encoder. Author: John Khan.
 */
import { ApiError, commerceTransport, type CommerceEndpoint } from "../api.js";
import type { BagSnapshot, Consent, Finish, SkinMatchResult, TryOnResult } from "./types.js";
import type { LookRequest, LookPreviewReceipt } from "./look.js";

export class CommerceNetworkError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) { super(message); }
}
export interface MatchRequest {
  photo_id: string;
  local_only: boolean;
  consent?: Consent;
  finish: Finish;
  concerns?: string[];
  manual_depth?: number;
  manual_undertone?: string;
}
export interface PreviewRequest {
  photo_id: string;
  product_id: string;
  local_only: boolean;
  strength: number;
  /** Preferred strict 1.0--5.0 field; legacy strength is migration-only. */
  level?: number;
  lock_level?: number;
  consent?: Consent;
}
export interface CommerceRemote {
  upload(blob: Blob): Promise<{ photo_id: string }>;
  match(body: MatchRequest): Promise<SkinMatchResult>;
  tryOn(body: PreviewRequest): Promise<TryOnResult>;
  tryOnLook(body: LookRequest): Promise<LookPreviewReceipt>;
  bag(): Promise<BagSnapshot>;
  add(product_id: string, quantity?: number): Promise<BagSnapshot>;
  remove(product_id: string): Promise<BagSnapshot>;
  wish(product_id: string, selected: boolean): Promise<BagSnapshot>;
  clear(): Promise<BagSnapshot>;
  removePhoto(photo_id: string): Promise<{ deleted: boolean; results_removed: number }>;
}

async function request<T>(path: CommerceEndpoint, data?: Record<string, unknown> | FormData,
  method?: "DELETE"): Promise<T> {
  try {
    return await commerceTransport<T>({endpoint: path, method, payload: data});
  } catch (reason) {
    if (reason instanceof ApiError) {
      throw new CommerceNetworkError(reason.code, reason.status, reason.message);
    }
    throw new CommerceNetworkError("connection", 0,
      "Unable to reach the service. Your photo and recipe remain on this device.");
  }
}

export class KeyProxyCommerceRemote implements CommerceRemote {
  async upload(blob: Blob): Promise<{ photo_id: string }> {
    if (!(blob instanceof Blob) || !["image/jpeg", "image/png", "image/webp"].includes(blob.type) ||
        blob.size > 8_000_000 || blob.size === 0) throw Error("Select a supported photo under 8 MB.");
    const form = new FormData();
    form.append("file", blob, "consented-photo.jpg");
    return request<{ photo_id: string }>("/api/photos", form);
  }
  match(body: MatchRequest): Promise<SkinMatchResult> {
    return request<SkinMatchResult>("/api/commerce/match", { ...body });
  }
  tryOn(body: PreviewRequest): Promise<TryOnResult> {
    return request<TryOnResult>("/api/commerce/try-on", { ...body });
  }
  tryOnLook(body: LookRequest): Promise<LookPreviewReceipt> {
    return request<LookPreviewReceipt>("/api/commerce/look/try-on", { ...body });
  }
  bag(): Promise<BagSnapshot> { return request<BagSnapshot>("/api/commerce/bag"); }
  add(product_id: string, quantity = 1): Promise<BagSnapshot> {
    return request<BagSnapshot>("/api/commerce/bag/add", { product_id, quantity });
  }
  remove(product_id: string): Promise<BagSnapshot> {
    return request<BagSnapshot>("/api/commerce/bag/remove", { product_id });
  }
  wish(product_id: string, selected: boolean): Promise<BagSnapshot> {
    return request<BagSnapshot>("/api/commerce/wishlist", { product_id, selected });
  }
  clear(): Promise<BagSnapshot> { return request<BagSnapshot>("/api/commerce/bag/clear", {}); }
  removePhoto(photo_id: string): Promise<{ deleted: boolean; results_removed: number }> {
    if (!/^[0-9a-f]{64}$/.test(photo_id)) throw Error("Invalid photo reference");
    return request(`/api/photos/${photo_id}`, undefined, "DELETE");
  }
}
