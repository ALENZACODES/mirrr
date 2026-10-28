/**
 * A binary min-heap of (key, index) pairs ordered by key, then index: the same total order
 * as Python's heapq on (key, index) tuples, so the fast marching fill visits pixels in the
 * same order in both languages. Author: John Khan.
 */
export class MinHeap {
  private keys: number[] = [];
  private ids: number[] = [];

  get size(): number { return this.keys.length; }

  private less(a: number, b: number): boolean {
    return this.keys[a] < this.keys[b] || (this.keys[a] === this.keys[b] && this.ids[a] < this.ids[b]);
  }

  private swap(a: number, b: number): void {
    [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
    [this.ids[a], this.ids[b]] = [this.ids[b], this.ids[a]];
  }

  push(key: number, id: number): void {
    this.keys.push(key); this.ids.push(id);
    let i = this.keys.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      this.swap(i, parent); i = parent;
    }
  }

  /** Smallest pair, or null when empty. */
  pop(): [number, number] | null {
    const n = this.keys.length;
    if (!n) return null;
    const top: [number, number] = [this.keys[0], this.ids[0]];
    const lastKey = this.keys.pop() as number, lastId = this.ids.pop() as number;
    if (n > 1) {
      this.keys[0] = lastKey; this.ids[0] = lastId;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < n - 1 && this.less(l, m)) m = l;
        if (r < n - 1 && this.less(r, m)) m = r;
        if (m === i) break;
        this.swap(i, m); i = m;
      }
    }
    return top;
  }
}
