import type { ControlPanelParams } from '../state/params';
import { type Line, offsetLine } from './lines';
import { type SideProfile, type Vec2, insidePolygon } from './sideProfile';

export interface ControlPanelLayout {
  /** Top front edge of the panel (the acrylic if enabled, else the board), in profile coordinates (mm). */
  front: Vec2;
  /** Unit vector back along the panel's slope. */
  dir: Vec2;
  boardThickness: number;
  /** Thickness of the acrylic sheet over the board, or null without one. */
  acrylicThickness: number | null;
  /** Length of the board along its slope, front edge to back edge. */
  depth: number;
  /** Across the cabinet, between the side panels. */
  width: number;
  /**
   * Side outlines (profile coordinates, mm) of the boards closing in an
   * overhanging panel: the front face under the top, then the chin or square
   * bottom behind it. Each spans the same width as the top. Null when flush.
   * The bottom's first and last points are the bottom and top of its back end.
   */
  frontFace: Vec2[] | null;
  bottom: Vec2[] | null;
  warnings: string[];
}

const MIN_DEPTH = 10;
const MIN_LENGTH = 1;

/** Where a line crosses the vertical at `x`; the line must not be vertical. */
function yAt(line: Line, x: number): number {
  return (line.offset - line.normal.x * x) / line.normal.y;
}

/**
 * Lays out an integrated control panel: a board between the side panels whose
 * back edge is set by `backOffset`, with the acrylic, when enabled, on top. The
 * top surface sits `inset` below the profile's control panel mount.
 *
 * When the profile's control panel overhangs, a front face board closes in the
 * front `faceSetback` behind the top's front edge, running from under the top board
 * down to either a chin (parallel to the profile underside, also inset) or a
 * square bottom running straight back. Both run back to the cabinet's front
 * panel, `frontInset` behind the lower front, and butt against it.
 */
export function controlPanelLayout(
  profile: SideProfile,
  cp: ControlPanelParams,
  width: number,
  materialThickness: number,
  /** Side outline of the monitor body, to check the panel clears it. */
  monitorBody: Vec2[],
  /** How far the cabinet's front panel sits behind the lower front. */
  frontInset: number,
): ControlPanelLayout {
  const warnings: string[] = [];
  const { front: mountFront, back: mountBack, underside } = profile.controlPanel;
  const t = materialThickness;
  const inset = Math.max(0, cp.inset);

  const mountDepth = Math.hypot(mountBack.x - mountFront.x, mountBack.y - mountFront.y);
  // Unit vectors back along the mount edge, and into the cabinet (left of the
  // counter-clockwise outline's direction).
  const dir = {
    x: (mountBack.x - mountFront.x) / mountDepth,
    y: (mountBack.y - mountFront.y) / mountDepth,
  };
  const inward = { x: -dir.y, y: dir.x };
  const at = (a: number, i: number): Vec2 => ({
    x: mountFront.x + dir.x * a + inward.x * i,
    y: mountFront.y + dir.y * a + inward.y * i,
  });

  const acrylicThickness = cp.acrylic.enabled ? Math.max(0, cp.acrylic.thickness) : 0;
  const totalThickness = acrylicThickness + t;

  // The front of the top is `inset` behind the profile's front. Start the top
  // far enough back that neither of its front corners passes that line (the
  // board's front edge is square to its slope).
  const frontX = mountFront.x - inset;
  const startFor = (i: number) => (mountFront.x + inward.x * i - frontX) / -dir.x;
  const start = Math.max(0, startFor(inset), startFor(inset + totalThickness));

  let depth = mountDepth + cp.backOffset - start;
  if (depth < MIN_DEPTH) {
    warnings.push('The back edge offset leaves no control panel.');
    depth = MIN_DEPTH;
  }

  // The whole top, shrunk slightly so faces resting on the outline still count as inside.
  const bounds = [
    at(start + 0.5, inset + 0.5),
    at(start + depth - 0.5, inset + 0.5),
    at(start + depth - 0.5, inset + totalThickness - 0.5),
    at(start + 0.5, inset + totalThickness - 0.5),
  ];
  if (bounds.some((pt) => !insidePolygon(pt, profile.outline))) {
    warnings.push('The control panel sticks out of the cabinet; try a smaller back edge offset.');
  } else if (profile.outline.some((pt) => insidePolygon(pt, bounds))) {
    warnings.push('Part of the cabinet outline cuts into the control panel.');
  }
  if (convexOverlap(bounds, monitorBody)) {
    warnings.push('The control panel runs into the monitor.');
  }

  let frontFace: Vec2[] | null = null;
  let bottom: Vec2[] | null = null;
  if (underside) {
    // The front face sits back from the top's front edge, so the top overhangs it.
    const faceX = frontX - Math.max(0, cp.faceSetback);
    const innerX = faceX - t;
    // The bottom boards run back to the front panel's outer face.
    const backX = underside.back.x - Math.max(0, frontInset);
    // The front face rises to the top board's underside.
    const topUnder = offsetLine(mountFront, mountBack, inset + totalThickness);

    // The bottom board's outer (lower) and inner surfaces, and where the front face stops.
    let outer: Line;
    let inner: Line;
    if (cp.bottom === 'chin') {
      outer = offsetLine(underside.back, underside.front, inset);
      inner = offsetLine(underside.back, underside.front, inset + t);
    } else {
      const y = underside.front.y + inset;
      outer = { normal: { x: 0, y: 1 }, offset: y };
      inner = { normal: { x: 0, y: 1 }, offset: y + t };
    }

    // A chin meets the front face in a miter, from the outer corner to the inner
    // one. A square bottom butts against the face's back, the face running down
    // past it to cover its end.
    const miter = cp.bottom === 'chin';
    const outerCorner = { x: faceX, y: yAt(outer, faceX) };
    const innerCorner = { x: innerX, y: yAt(miter ? inner : outer, innerX) };

    frontFace = [
      innerCorner,
      outerCorner,
      { x: faceX, y: yAt(topUnder, faceX) },
      { x: innerX, y: yAt(topUnder, innerX) },
    ];
    if (Math.min(frontFace[2].y - frontFace[1].y, frontFace[3].y - frontFace[0].y) < MIN_LENGTH) {
      warnings.push('The control panel front is too short to fit a front face; try a smaller inset.');
      frontFace = null;
    }

    if (innerX - backX < MIN_LENGTH) {
      warnings.push(
        `The overhang is too small to fit a ${cp.bottom === 'chin' ? 'chin' : 'bottom'} behind the front face.`,
      );
    } else {
      bottom = [
        { x: backX, y: yAt(outer, backX) },
        miter ? outerCorner : innerCorner,
        { x: innerX, y: yAt(inner, innerX) },
        { x: backX, y: yAt(inner, backX) },
      ];
      if (cp.bottom === 'square' && yAt(inner, innerX) > yAt(topUnder, innerX)) {
        warnings.push('The square bottom runs into the control panel top; try a thicker front.');
      }
    }
  }

  return {
    front: at(start, inset),
    dir,
    boardThickness: t,
    acrylicThickness: cp.acrylic.enabled ? acrylicThickness : null,
    depth,
    width: width - 2 * t,
    frontFace,
    bottom,
    warnings,
  };
}

/** Separating-axis test for two convex polygons. */
function convexOverlap(a: Vec2[], b: Vec2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const axis = { x: q.y - p.y, y: p.x - q.x };
      const project = (pts: Vec2[]) => pts.map((pt) => pt.x * axis.x + pt.y * axis.y);
      const pa = project(a);
      const pb = project(b);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}
