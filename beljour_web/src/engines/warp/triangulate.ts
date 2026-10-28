/**
 * E06 Delaunay triangulation (Bowyer-Watson) and triangle helpers.
 *
 * Same steps and the same floating point operations as
 * api/plumb_api/engines/warp/triangulate.py, so both return the identical sorted list of
 * index triples with positive signed area. Concept: Bowyer (1981) and Watson (1981),
 * "Computing the n-dimensional Delaunay tessellation"; our own code.
 *
 * Author: John Khan.
 */
import type { Point2 } from "./field.js";

export type Triangle = readonly [number, number, number];
export const MAX_POINTS = 4096;
export const INSIDE_MARGIN = 1e-12;

export function signedArea(a: Point2, b: Point2, c: Point2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

/** [cx, cy, r^2]; infinite radius for a degenerate triangle. */
export function circumcircle(a: Point2, b: Point2, c: Point2): [number, number, number] {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (d === 0) return [0, 0, Infinity];
  const a2 = a[0] * a[0] + a[1] * a[1], b2 = b[0] * b[0] + b[1] * b[1], c2 = c[0] * c[0] + c[1] * c[1];
  const cx = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const cy = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  const dx = a[0] - cx, dy = a[1] - cy;
  return [cx, cy, dx * dx + dy * dy];
}

function canonical([a, b, c]: Triangle): Triangle {
  if (b < a && b < c) return [b, c, a];
  if (c < a && c < b) return [c, a, b];
  return [a, b, c];
}

export function compareTriangles(x: Triangle, y: Triangle): number {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

export function delaunay(points: readonly Point2[]): Triangle[] {
  if (!Array.isArray(points) || points.length < 3) throw new RangeError("a triangulation needs at least three points");
  if (points.length > MAX_POINTS) throw new RangeError(`at most ${MAX_POINTS} points`);
  for (const p of points) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) throw new RangeError("points must be finite");
  }
  const n = points.length;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of points) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
  const work: Point2[] = [...points.map((p) => [p[0], p[1]] as const),
    [midX - 20 * span, midY - span], [midX + 20 * span, midY - span], [midX, midY + 20 * span]];
  let first: Triangle = [n, n + 1, n + 2];
  if (signedArea(work[n], work[n + 1], work[n + 2]) < 0) first = [n, n + 2, n + 1];
  let tris: { t: Triangle; c: [number, number, number] }[] = [{ t: first, c: circumcircle(work[first[0]], work[first[1]], work[first[2]]) }];
  for (let i = 0; i < n; i++) {
    const [px, py] = work[i];
    const keep: typeof tris = [], bad: Triangle[] = [];
    for (const entry of tris) {
      const [cx, cy, r2] = entry.c;
      const dx = px - cx, dy = py - cy;
      if (dx * dx + dy * dy < r2 * (1 - INSIDE_MARGIN)) bad.push(entry.t); else keep.push(entry);
    }
    if (!bad.length) throw new RangeError("points must be distinct");
    const count = new Map<string, number>(), edges: [number, number][] = [];
    for (const [a, b, c] of bad) {
      for (const e of [[a, b], [b, c], [c, a]] as [number, number][]) {
        const key = `${Math.min(e[0], e[1])},${Math.max(e[0], e[1])}`;
        count.set(key, (count.get(key) ?? 0) + 1);
        edges.push(e);
      }
    }
    for (const [e0, e1] of edges) {
      if (count.get(`${Math.min(e0, e1)},${Math.max(e0, e1)}`) !== 1) continue;
      if (signedArea(work[e0], work[e1], work[i]) <= 0) throw new RangeError("points must be distinct");
      keep.push({ t: [e0, e1, i], c: circumcircle(work[e0], work[e1], work[i]) });
    }
    tris = keep;
  }
  const out = tris.filter(({ t }) => t[0] < n && t[1] < n && t[2] < n).map(({ t }) => canonical(t)).sort(compareTriangles);
  if (!out.length) throw new RangeError("points are all on one line");
  return out;
}

export function barycentric(x: number, y: number, a: Point2, b: Point2, c: Point2): [number, number, number] | null {
  const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (det === 0) return null;
  const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
  const l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
  return [l1, l2, 1 - l1 - l2];
}

/** Unique undirected edges, sorted. */
export function edges(triangles: readonly Triangle[]): [number, number][] {
  const seen = new Map<string, [number, number]>();
  for (const [a, b, c] of triangles) {
    for (const [p, q] of [[a, b], [b, c], [c, a]]) {
      const e: [number, number] = [Math.min(p, q), Math.max(p, q)];
      seen.set(`${e[0]},${e[1]}`, e);
    }
  }
  return [...seen.values()].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}

/** Directed boundary edges (used by one triangle only), in triangle order. */
export function hullEdges(triangles: readonly Triangle[]): [number, number][] {
  const count = new Map<string, number>();
  const key = (p: number, q: number) => `${Math.min(p, q)},${Math.max(p, q)}`;
  for (const [a, b, c] of triangles) for (const [p, q] of [[a, b], [b, c], [c, a]]) count.set(key(p, q), (count.get(key(p, q)) ?? 0) + 1);
  const out: [number, number][] = [];
  for (const [a, b, c] of triangles) for (const [p, q] of [[a, b], [b, c], [c, a]]) if (count.get(key(p, q)) === 1) out.push([p, q]);
  return out;
}

/** `count` anchor points on an ellipse. */
export function ring(cx: number, cy: number, rx: number, ry: number, count: number): Point2[] {
  if (!(Number.isInteger(count) && count >= 3)) throw new RangeError("an anchor ring needs at least three points");
  const out: Point2[] = [];
  for (let k = 0; k < count; k++) out.push([cx + rx * Math.cos((2 * Math.PI * k) / count), cy + ry * Math.sin((2 * Math.PI * k) / count)]);
  return out;
}
