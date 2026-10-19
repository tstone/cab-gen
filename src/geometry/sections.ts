import type { BodyType } from '../state/params';
import type { SideProfile, Vec2 } from './sideProfile';

export interface BodySections {
  /** Side outlines of each separate body section, in the full profile's coordinates. */
  outlines: Vec2[][];
  /** Floor to the top of the highest section. */
  height: number;
  /** Front-to-back extent of all sections together. */
  depth: number;
  /** Height of the bartop and base sections, when split. */
  bartopHeight?: number;
  baseHeight?: number;
}

/**
 * Splits the full-size profile into the sections a body type is built from.
 * A split body is the full profile split in two at `profile.cutHeight`.
 */
export function bodySections(profile: SideProfile, bodyType: BodyType): BodySections {
  const { outline, cutHeight } = profile;
  const top = Math.max(...outline.map((pt) => pt.y));

  const outlines = splitSections(outline, cutHeight, bodyType);

  const xs = outlines.flat().map((pt) => pt.x);
  const result: BodySections = {
    outlines,
    height: top,
    depth: Math.max(...xs) - Math.min(0, ...xs),
  };
  if (bodyType === 'bartop-base') {
    result.bartopHeight = top - cutHeight;
    result.baseHeight = cutHeight;
  }
  return result;
}

/**
 * Splits a side outline (of the body or one of its panels) into the pieces
 * each section gets: whole for a full-size body, else below and above the
 * bartop cut, leaving out a section it doesn't reach.
 */
export function splitSections(outline: Vec2[], cutHeight: number, bodyType: BodyType): Vec2[][] {
  if (bodyType === 'full') return [outline];
  return [clipOutline(outline, cutHeight, 'below'), clipOutline(outline, cutHeight, 'above')].filter(
    (o) => o.length >= 3,
  );
}

/** Keeps the part of the outline above or below a horizontal line (Sutherland–Hodgman). */
function clipOutline(outline: Vec2[], y: number, keep: 'above' | 'below'): Vec2[] {
  const inside = (pt: Vec2) => (keep === 'above' ? pt.y >= y : pt.y <= y);
  const result: Vec2[] = [];
  const push = (pt: Vec2) => {
    const last = result[result.length - 1];
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 1e-6) result.push(pt);
  };

  outline.forEach((a, i) => {
    const b = outline[(i + 1) % outline.length];
    const aIn = inside(a);
    const bIn = inside(b);
    if (aIn !== bIn) {
      const t = (y - a.y) / (b.y - a.y);
      push({ x: a.x + t * (b.x - a.x), y });
    }
    if (bIn) push(b);
  });

  const first = result[0];
  const last = result[result.length - 1];
  if (result.length > 1 && Math.hypot(first.x - last.x, first.y - last.y) < 1e-6) result.pop();
  return result;
}
