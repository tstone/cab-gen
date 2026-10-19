import type { MonitorSpec, ProfileParams } from '../state/params';
import { type SideProfile, type Vec2, insidePolygon } from './sideProfile';

/**
 * Monitor dimensions relative to how it's mounted: "along" runs up the screen
 * edge of the side profile, "across" runs side to side. Millimeters.
 */
export interface MonitorSize {
  viewAlong: number;
  viewAcross: number;
  outerAlong: number;
  outerAcross: number;
  depth: number;
}

export function monitorSize(spec: MonitorSpec): MonitorSize {
  const [a, b] = spec.aspectRatio.split(':').map(Number);
  const diag = Math.hypot(a, b);
  const long = (spec.diagonal * a) / diag;
  const short = (spec.diagonal * b) / diag;
  // Horizontal: the long side runs across the cabinet. Vertical: it runs up the screen edge.
  const [viewAcross, viewAlong] = spec.orientation === 'horizontal' ? [long, short] : [short, long];
  return {
    viewAlong,
    viewAcross,
    outerAlong: viewAlong + 2 * spec.bezel,
    outerAcross: viewAcross + 2 * spec.bezel,
    depth: spec.depth,
  };
}

export interface MonitorPlacement {
  size: MonitorSize;
  /** Center of the monitor's front face, in profile coordinates (mm). */
  faceCenter: Vec2;
  /** Unit vector up along the screen edge. */
  along: Vec2;
  /** Unit vector into the cabinet, perpendicular to the screen edge. */
  inward: Vec2;
  /** Side outline of the monitor body, in profile coordinates. */
  body: Vec2[];
  warnings: string[];
}

/**
 * Places the monitor behind the screen edge of a side profile and checks that
 * it fits: inside the profile, between the side panels, and lined up with the
 * screen opening.
 */
export function placeMonitor(
  profile: SideProfile,
  spec: MonitorSpec,
  placement: ProfileParams['monitor'],
  innerWidth: number,
): MonitorPlacement {
  const warnings: string[] = [];
  const size = monitorSize(spec);
  const { bottom, top } = profile.screen;

  const opening = Math.hypot(top.x - bottom.x, top.y - bottom.y);
  const screenAlong = { x: (top.x - bottom.x) / opening, y: (top.y - bottom.y) / opening };
  // The outline is counter-clockwise, so the inside is to the left of the edge direction.
  const screenInward = { x: -screenAlong.y, y: screenAlong.x };

  // By default the monitor lies flat against the screen face; otherwise it leans at its own angle.
  const lean = (placement.angle * Math.PI) / 180;
  const along = placement.separateAngle ? { x: -Math.sin(lean), y: Math.cos(lean) } : screenAlong;
  const inward = { x: -along.y, y: along.x };
  const at = (base: Vec2, a: number, i: number) => ({
    x: base.x + along.x * a + inward.x * i,
    y: base.y + along.y * a + inward.y * i,
  });

  // Recess is measured straight back from the middle of the opening.
  const mid = { x: (bottom.x + top.x) / 2, y: (bottom.y + top.y) / 2 };
  const recessed = {
    x: mid.x + screenInward.x * placement.recess,
    y: mid.y + screenInward.y * placement.recess,
  };
  const faceCenter = at(recessed, placement.offset, 0);

  if (size.outerAcross > innerWidth) {
    warnings.push('The monitor is wider than the inside of the cabinet.');
  }

  // The visible picture, projected onto the screen edge, should sit within the opening.
  const alongScreen = (a: number) => {
    const pt = at(faceCenter, a, 0);
    return (pt.x - mid.x) * screenAlong.x + (pt.y - mid.y) * screenAlong.y;
  };
  const pictureTop = alongScreen(size.viewAlong / 2);
  const pictureBottom = alongScreen(-size.viewAlong / 2);
  if (pictureTop > opening / 2 + 0.5) {
    warnings.push('The top of the picture is hidden above the screen opening.');
  }
  if (pictureBottom < -opening / 2 - 0.5) {
    warnings.push('The bottom of the picture is hidden below the screen opening.');
  }

  // The monitor body must sit inside the side profile. Test points pulled in
  // slightly so a monitor resting exactly on an edge still counts as inside.
  const h = size.outerAlong / 2 - 0.5;
  const d = Math.max(size.depth - 0.5, 0.5);
  const corners = {
    top: [at(faceCenter, h, 0.5), at(faceCenter, h, d)],
    bottom: [at(faceCenter, -h, 0.5), at(faceCenter, -h, d)],
  };
  const topOut = corners.top.some((pt) => !insidePolygon(pt, profile.outline));
  const bottomOut = corners.bottom.some((pt) => !insidePolygon(pt, profile.outline));
  if (topOut) warnings.push('The top of the monitor sticks out of the cabinet.');
  if (bottomOut) warnings.push('The bottom of the monitor sticks out of the cabinet.');

  if (!topOut && !bottomOut) {
    // Corners inside, but a concave part of the outline could still cut through the body.
    const rect = [corners.bottom[0], corners.top[0], corners.top[1], corners.bottom[1]];
    if (profile.outline.some((pt) => insidePolygon(pt, rect))) {
      warnings.push('Part of the cabinet outline cuts into the monitor.');
    }
  }

  const half = size.outerAlong / 2;
  const body = [
    at(faceCenter, -half, 0),
    at(faceCenter, half, 0),
    at(faceCenter, half, size.depth),
    at(faceCenter, -half, size.depth),
  ];

  return { size, faceCenter, along, inward, body, warnings };
}
