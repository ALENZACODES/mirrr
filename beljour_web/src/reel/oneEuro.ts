/**
 * One Euro filter, written from Casiez, Roussel and Vogel, "1 Euro Filter: A Simple
 * Speed-based Low-pass Filter for Noisy Input in Interactive Systems", CHI 2012.
 * Low cutoff when the signal is slow (removes jitter), higher cutoff when it moves fast
 * (removes lag).
 */
export class OneEuro {
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(public minCutoff = 1.0, public beta = 0.007, public dCutoff = 1.0) {}

  private static alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  /** x is the new sample, t its time in seconds. */
  filter(x: number, t: number): number {
    if (this.xPrev === null || this.tPrev === null || t <= this.tPrev) {
      this.xPrev = x;
      this.tPrev = t;
      return x;
    }
    const dt = t - this.tPrev;
    const dx = (x - this.xPrev) / dt;
    const aD = OneEuro.alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = OneEuro.alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = t;
    return xHat;
  }

  reset(): void {
    this.xPrev = null;
    this.tPrev = null;
    this.dxPrev = 0;
  }
}

/** One filter per coordinate of a landmark set. */
export class LandmarkSmoother {
  private filters: OneEuro[] = [];
  constructor(private minCutoff = 1.5, private beta = 0.02) {}

  smooth(points: { x: number; y: number }[], t: number): { x: number; y: number }[] {
    if (this.filters.length !== points.length * 2) {
      this.filters = Array.from({ length: points.length * 2 }, () => new OneEuro(this.minCutoff, this.beta));
    }
    return points.map((p, i) => ({ x: this.filters[2 * i].filter(p.x, t), y: this.filters[2 * i + 1].filter(p.y, t) }));
  }

  reset(): void {
    this.filters.forEach((f) => f.reset());
  }
}
