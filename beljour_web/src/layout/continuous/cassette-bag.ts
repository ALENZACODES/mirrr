/** No-charge, metadata-only sample bag. No checkout or inventory. Author: John Khan. */
import { cassetteById, type CassetteId, type CassetteResult } from "./cassette-contract.js";

export interface DemoBagItem {
  readonly id: CassetteId;
  readonly category: string;
  readonly title: string;
  readonly demonstrationOnly: true;
  readonly priceKnown: false;
  readonly purchaseAvailable: false;
}

export interface DemoBagSnapshot {
  readonly format: "beljour-sample-bag/1";
  readonly items: readonly DemoBagItem[];
  readonly totalPrice: null;
  readonly hasCheckout: false;
  readonly hasPayment: false;
  readonly keepsPhotos: false;
}

export class OfflineSampleBag {
  private readonly ids = new Set<CassetteId>();
  private closed = false;

  get snapshot(): DemoBagSnapshot {
    const items: DemoBagItem[] = [];
    for (const id of this.ids) {
      const card = cassetteById(id);
      if (!card) continue;
      items.push(Object.freeze({
        id: card.id,
        category: card.productType,
        title: card.title,
        demonstrationOnly: true as const,
        priceKnown: false as const,
        purchaseAvailable: false as const,
      }));
    }
    return Object.freeze({
      format: "beljour-sample-bag/1" as const,
      items: Object.freeze(items),
      totalPrice: null,
      hasCheckout: false as const,
      hasPayment: false as const,
      keepsPhotos: false as const,
    });
  }

  add(outcome: CassetteResult | null): boolean {
    if (this.closed || !outcome || outcome.status !== "ready" || !outcome.isCached) return false;
    if (outcome.providerCalls !== 0 || outcome.unitsSpent !== 0 || outcome.imageSent) return false;
    const card = cassetteById(outcome.card.id);
    if (!card || card !== outcome.card) return false;
    if (this.ids.size >= 3 && !this.ids.has(card.id)) return false;
    this.ids.add(card.id);
    return true;
  }

  remove(id: CassetteId): void {
    if (this.closed) return;
    this.ids.delete(id);
  }

  clear(): void {
    this.ids.clear();
  }

  dispose(): void {
    if (this.closed) return;
    this.clear();
    this.closed = true;
  }
}

/** Refuse a forged demonstration bag that implies payments or product equivalence. */
export function checkedBagSnapshot(value: DemoBagSnapshot): DemoBagSnapshot {
  if (value.format !== "beljour-sample-bag/1" || value.totalPrice !== null
    || value.hasCheckout !== false || value.hasPayment !== false
    || value.keepsPhotos !== false || value.items.length > 3) {
    throw new Error("Unknown or unsafe sample bag");
  }
  const used = new Set<CassetteId>();
  for (const item of value.items) {
    const card = cassetteById(item.id);
    if (!card || used.has(item.id) || item.category !== card.productType
      || item.title !== card.title || item.demonstrationOnly !== true
      || item.priceKnown !== false || item.purchaseAvailable !== false) {
      throw new Error("Invalid sample bag item");
    }
    used.add(item.id);
  }
  return value;
}
