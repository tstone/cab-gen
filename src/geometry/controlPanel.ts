import type { ControlPanelParams } from '../state/params';
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
  warnings: string[];
}

const MIN_DEPTH = 10;

/**
 * Lays out an integrated control panel: a board between the side panels whose
 * front edge lines up with the front of the profile's control panel mount and
 * whose back edge is set by `backOffset`. The acrylic, when enabled, sits on
 * top flush with the side panels' edge, so the board drops by its thickness.
 */
export function controlPanelLayout(
  profile: SideProfile,
  cp: ControlPanelParams,
  width: number,
  materialThickness: number,
  /** Side outline of the monitor body, to check the panel clears it. */
  monitorBody: Vec2[],
): ControlPanelLayout {
  const warnings: string[] = [];
  const { front, back } = profile.controlPanel;

  const mountDepth = Math.hypot(back.x - front.x, back.y - front.y);
  // Unit vectors back along the mount edge, and into the cabinet (left of the
  // counter-clockwise outline's direction).
  const dir = { x: (back.x - front.x) / mountDepth, y: (back.y - front.y) / mountDepth };
  const inward = { x: -dir.y, y: dir.x };
  const at = (a: number, i: number): Vec2 => ({
    x: front.x + dir.x * a + inward.x * i,
    y: front.y + dir.y * a + inward.y * i,
  });

  let depth = mountDepth + cp.backOffset;
  if (depth < MIN_DEPTH) {
    warnings.push('The back edge offset leaves no control panel.');
    depth = MIN_DEPTH;
  }

  const acrylicThickness = cp.acrylic.enabled ? Math.max(0, cp.acrylic.thickness) : 0;

  // The whole panel, shrunk slightly so faces resting on the outline still count as inside.
  const totalThickness = acrylicThickness + materialThickness;
  const inset = [at(0.5, 0.5), at(depth - 0.5, 0.5), at(depth - 0.5, totalThickness - 0.5), at(0.5, totalThickness - 0.5)];
  if (inset.some((pt) => !insidePolygon(pt, profile.outline))) {
    warnings.push('The control panel sticks out of the cabinet; try a smaller back edge offset.');
  } else if (profile.outline.some((pt) => insidePolygon(pt, inset))) {
    warnings.push('Part of the cabinet outline cuts into the control panel.');
  }
  if (convexOverlap(inset, monitorBody)) {
    warnings.push('The control panel runs into the monitor.');
  }

  return {
    front,
    dir,
    boardThickness: materialThickness,
    acrylicThickness: cp.acrylic.enabled ? acrylicThickness : null,
    depth,
    width: width - 2 * materialThickness,
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
