/** No-checkout browser bag. Items and prices are resolved only from the validated source.
 * Private to this active page; no cookies, localStorage or payment collection.
 * Author: John Khan.
 */
import { findProduct } from "./catalogue.js";
import type { BagSnapshot, Product } from "./types.js";

export class SampleBag {
  private lines = new Map<string, number>();
  private saved = new Set<string>();
  private version = 0;
  constructor(private readonly catalogue: readonly Product[]) {}
  snapshot(): BagSnapshot {
    const lines = [...this.lines].sort(([a], [b]) => a.localeCompare(b))
      .map(([sku, quantity]) => {
        const product = findProduct(this.catalogue, sku);
        return { product, quantity, total_cents: product.price_cents * quantity };
      });
    const subtotal = lines.reduce((total, row) => total + row.total_cents, 0);
    return { lines, wishlist: [...this.saved].sort().map((sku) => findProduct(this.catalogue, sku)),
      items: lines.reduce((n, row) => n + row.quantity, 0), subtotal_cents: subtotal, currency: "CAD",
      tax_cents: null, shipping_cents: null, total_cents: subtotal,
      total_label: "Sample subtotal only; taxes and delivery are not calculated",
      checkout_enabled: false, checkout_message: "Demo bag only. No order or payment will be taken.",
      revision: this.version };
  }
  add(sku: string, quantity = 1): BagSnapshot {
    findProduct(this.catalogue, sku);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) throw Error("Choose between one and five sample items.");
    const old = this.lines.get(sku) ?? 0;
    if (old + quantity > 5) throw Error("There is a limit of five per sample shade.");
    if (!old && this.lines.size >= 30) throw Error("The sample bag holds up to thirty different items.");
    this.lines.set(sku, old + quantity);
    this.version += 1;
    return this.snapshot();
  }
  remove(sku: string, quantity?: number): BagSnapshot {
    findProduct(this.catalogue, sku);
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 1 || quantity > 5)) throw Error("Invalid removal amount");
    const old = this.lines.get(sku) ?? 0;
    if (!old) return this.snapshot();
    const remaining = old - (quantity ?? old);
    if (remaining > 0) this.lines.set(sku, remaining);
    else this.lines.delete(sku);
    this.version += 1;
    return this.snapshot();
  }
  wish(sku: string, enabled: boolean): BagSnapshot {
    findProduct(this.catalogue, sku);
    if (enabled && !this.saved.has(sku) && this.saved.size >= 50) throw Error("Save up to fifty sample products.");
    const previous = this.saved.has(sku);
    if (enabled) this.saved.add(sku); else this.saved.delete(sku);
    if (previous !== enabled) this.version += 1;
    return this.snapshot();
  }
  clear(): BagSnapshot {
    this.lines.clear(); this.saved.clear(); this.version += 1;
    return this.snapshot();
  }
}
export function money(cents: number, locale = "en-CA"): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw Error("Invalid monetary amount");
  return new Intl.NumberFormat(locale, { style: "currency", currency: "CAD" }).format(cents / 100);
}
