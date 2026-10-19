import type { Vec2 } from './sideProfile';

/** A line in the side profile: the points p with `normal · p = offset`. */
export interface Line {
  normal: Vec2;
  offset: number;
}

/** Line through `a` and `b`, moved `distance` toward the left of a → b (into a counter-clockwise outline). */
export function offsetLine(a: Vec2, b: Vec2, distance: number): Line {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const normal = { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
  return { normal, offset: normal.x * a.x + normal.y * a.y + distance };
}

/** Where two lines cross, or null if they're parallel. */
export function intersect(a: Line, b: Line): Vec2 | null {
  const det = a.normal.x * b.normal.y - a.normal.y * b.normal.x;
  if (Math.abs(det) < 1e-9) return null;
  return {
    x: (a.offset * b.normal.y - b.offset * a.normal.y) / det,
    y: (a.normal.x * b.offset - b.normal.x * a.offset) / det,
  };
}
