import type { ProfileParams } from '../state/params';

export interface Vec2 {
  x: number;
  y: number;
}

/** What a profile edge represents, so later steps can treat it specially. */
export type EdgeRole = 'panel' | 'marquee' | 'screen' | 'controlPanel';

export interface SideProfile {
  /**
   * Counter-clockwise outline of the side panel in millimeters, x measured
   * forward from the back, y up from the bottom. Rounded corners are already
   * expanded into arc segments. Not closed (last point connects to first).
   */
  outline: Vec2[];
  /** Role of each edge: `roles[i]` is the edge from `outline[i]` to `outline[i + 1]`. */
  roles: EdgeRole[];
  /** Height of the vertical back panel, derived from the back slope. */
  backHeight: number;
  /** Front-to-back extent including anything that overhangs the lower front. */
  overallDepth: number;
  /** Height where a split body is cut in two: where the control panel meets the lower front. */
  cutHeight: number;
  /** Ends of the screen edge before corner rounding: where the monitor opening is. */
  screen: { bottom: Vec2; top: Vec2 };
  /**
   * Ends of the control panel's top edge, front to back: where the control panel
   * is mounted. When it overhangs, `underside` runs from the bottom of its front
   * face back down to the lower front.
   */
  controlPanel: { front: Vec2; back: Vec2; underside: { front: Vec2; back: Vec2 } | null };
  /** The lower front edge, from the floor up to the control panel or its underside. */
  lowerFront: { bottom: Vec2; top: Vec2 };
  /**
   * Corners along the top and back edges: from the front of the marquee top
   * (where any rounding ends), back over the slope, and down the back to the floor.
   */
  topBack: Vec2[];
  /** Ends of the marquee face edge before corner rounding. */
  marquee: { bottom: Vec2; top: Vec2 };
  /**
   * The monitor cut's top line, under the marquee, from where the top corner's
   * rounding ends forward to the marquee bottom; null if the rounding uses it all up.
   */
  screenTop: { back: Vec2; front: Vec2 } | null;
  /** Problems with the current parameters, in plain language. */
  warnings: string[];
}

interface Corner {
  p: Vec2;
  /** Role of the edge leaving this corner. */
  role: EdgeRole;
  radius?: number;
}

const deg = (d: number) => (d * Math.PI) / 180;
const EPSILON = 1e-6;

/**
 * Computes a cabinet side silhouette from its parameters.
 *
 * Going counter-clockwise from the back-bottom corner: bottom, lower
 * front, control panel (underside, front, top), monitor cut (bottom line,
 * screen face, top line), marquee front and top, optional rise, back slope,
 * and back.
 */
export function sideProfile(p: ProfileParams): SideProfile {
  const warnings: string[] = [];
  const D = p.depth;

  // Heights stack up from the floor: control panel, monitor opening, then marquee.
  // Control panel: its top front edge sits at `height`, `overhang` past the lower front.
  const cp = p.controlPanel;
  const overhang = Math.max(0, cp.overhang);
  const cpFront: Vec2 = { x: D + overhang, y: cp.height };
  const cpBack: Vec2 = {
    x: cpFront.x - cp.depth,
    y: cp.height + cp.depth * Math.tan(deg(cp.angle)),
  };

  // The marquee face's horizontal position doesn't depend on any height.
  const m = p.marquee;
  const marqueeBottomX = D - m.setback - m.height * Math.tan(deg(m.faceAngle));

  // Monitor opening: rises from the control panel, and its top sets the marquee bottom.
  const opening = Math.max(EPSILON, p.monitorOpening);
  const cut = monitorCut(p, cpBack, marqueeBottomX, opening, warnings);
  const marqueeBottom: Vec2 = {
    x: marqueeBottomX,
    y: cut.top.y + (marqueeBottomX - cut.top.x) * Math.tan(deg(p.monitorCut.topAngle)),
  };
  if (marqueeBottom.y <= cpBack.y) {
    warnings.push('The marquee bottom is below the control panel.');
  }

  // Marquee: its face rises `height` from the marquee bottom to the top front corner.
  const topRise = m.depth * Math.tan(deg(m.topAngle));
  const topFront: Vec2 = { x: D - m.setback, y: marqueeBottom.y + m.height };
  const topBack: Vec2 = { x: topFront.x - m.depth, y: topFront.y - topRise };

  // Rise: a steep step down and back from the marquee top before the back slope begins.
  const riseBottom: Vec2 = p.rise.enabled
    ? {
        x: topBack.x - p.rise.height * Math.tan(deg(p.rise.angle)),
        y: topBack.y - p.rise.height,
      }
    : topBack;

  let backHeight = riseBottom.y - riseBottom.x * Math.tan(deg(p.backSlope));
  if (riseBottom.x < -EPSILON) {
    warnings.push('The marquee and rise extend past the back of the cabinet.');
  }
  if (backHeight < 0) {
    warnings.push('The back slope is too steep to reach the back; the back panel height is clamped.');
    backHeight = 0;
  }

  // Lowest point of the control panel's front: where the underside meets the lower front, or the top edge if flush.
  let cpLowest = cp.height;
  let underside: SideProfile['controlPanel']['underside'] = null;
  const corners: Corner[] = [];
  corners.push({ p: { x: 0, y: 0 }, role: 'panel' }, { p: { x: D, y: 0 }, role: 'panel' });

  if (overhang > EPSILON) {
    // Box sticking out past the lower front: underside slopes back down to the lower front.
    const underFront: Vec2 = { x: cpFront.x, y: cp.height - cp.thickness };
    const underBack: Vec2 = {
      x: D,
      y: underFront.y - overhang * Math.tan(deg(cp.undersideAngle)),
    };
    if (underBack.y <= 0) {
      warnings.push('The control panel underside reaches the floor.');
    }
    corners.push({ p: underBack, role: 'panel' }, { p: underFront, role: 'panel' });
    cpLowest = underBack.y;
    underside = { front: underFront, back: underBack };
  }
  corners.push({ p: cpFront, role: 'controlPanel' });

  corners.push(
    { p: cpBack, role: 'panel' },
    { p: cut.bottom, role: 'screen', radius: p.monitorCut.bottomRadius },
    { p: cut.top, role: 'panel', radius: p.monitorCut.topRadius },
  );

  corners.push(
    { p: marqueeBottom, role: 'marquee' },
    { p: topFront, role: 'panel', radius: m.cornerRadius },
    { p: topBack, role: 'panel' },
  );
  if (p.rise.enabled) corners.push({ p: riseBottom, role: 'panel' });
  corners.push({ p: { x: 0, y: backHeight }, role: 'panel' });

  const { outline, roles } = expandCorners(corners);
  if (outline.some((pt) => pt.y < -EPSILON) || selfIntersects(outline)) {
    warnings.push('The side profile overlaps itself; the preview may look wrong until this is fixed.');
  }
  const overallDepth = Math.max(...outline.map((pt) => pt.x)) - Math.min(0, ...outline.map((pt) => pt.x));
  const screen = cut;
  const cutHeight = Math.max(0, cpLowest);
  const controlPanel = { front: cpFront, back: cpBack, underside };
  const lowerFront = { bottom: { x: D, y: 0 }, top: underside ? underside.back : { x: D, y: cp.height } };
  // The marquee top starts where its front corner's rounding ends: the outline point before its back.
  const topBackIndex = outline.findIndex((pt) => pt.x === topBack.x && pt.y === topBack.y);
  const topBackChain = [
    outline[topBackIndex - 1] ?? topFront,
    topBack,
    ...(p.rise.enabled ? [riseBottom] : []),
    { x: 0, y: backHeight },
    { x: 0, y: 0 },
  ];
  // The top line ends at the marquee bottom; the outline point before it is where its rounding ends.
  const marqueeBottomIndex = outline.findIndex(
    (pt) => Math.hypot(pt.x - marqueeBottom.x, pt.y - marqueeBottom.y) < EPSILON,
  );
  const screenTop =
    marqueeBottomIndex > 0
      ? { back: outline[marqueeBottomIndex - 1], front: outline[marqueeBottomIndex] }
      : null;
  return {
    outline,
    roles,
    backHeight,
    overallDepth,
    cutHeight,
    screen,
    controlPanel,
    lowerFront,
    topBack: topBackChain,
    marquee: { bottom: marqueeBottom, top: topFront },
    screenTop,
    warnings,
  };
}

/**
 * Finds the two inner corners of the monitor cut, building up from the control
 * panel. The bottom line runs back from the control panel's back edge to the
 * screen face, which is placed so its top is `depth` behind the marquee face;
 * the screen face then rises `opening` vertically.
 */
function monitorCut(
  p: ProfileParams,
  cpBack: Vec2,
  marqueeBottomX: number,
  opening: number,
  warnings: string[],
) {
  const c = p.monitorCut;
  const faceRun = opening * Math.tan(deg(c.faceAngle));
  const topX = marqueeBottomX - c.depth;
  const bottomX = topX + faceRun;

  // Length of the bottom line, from the control panel back to the screen face.
  const t = (cpBack.x - bottomX) / Math.cos(deg(c.bottomAngle));

  let bottom: Vec2;
  let top: Vec2;
  if (t < EPSILON) {
    // The screen face would start in front of the control panel's back edge:
    // run the screen straight up from it, with no bottom line. This is a
    // legitimate style (e.g. Crystal Castles).
    bottom = cpBack;
    top = { x: cpBack.x - faceRun, y: cpBack.y + opening };
  } else {
    bottom = { x: bottomX, y: cpBack.y + t * Math.sin(deg(c.bottomAngle)) };
    top = { x: topX, y: bottom.y + opening };
  }

  if (top.x <= 0 || bottom.x <= 0) {
    warnings.push('The monitor cut extends past the back of the cabinet.');
  }
  return { top, bottom };
}

/** Even-odd test for whether a point is inside a polygon. */
export function insidePolygon(pt: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/** True if any two non-adjacent edges of the closed outline cross. */
function selfIntersects(outline: Vec2[]): boolean {
  const n = outline.length;
  const cross = (o: Vec2, a: Vec2, b: Vec2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  for (let i = 0; i < n; i++) {
    const a1 = outline[i];
    const a2 = outline[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const b1 = outline[j];
      const b2 = outline[(j + 1) % n];
      if (
        cross(a1, a2, b1) * cross(a1, a2, b2) < 0 &&
        cross(b1, b2, a1) * cross(b1, b2, a2) < 0
      ) {
        return true;
      }
    }
  }
  return false;
}

const ARC_SEGMENTS = 10;

/** Replaces rounded corners with arc points, keeping each edge's role. */
function expandCorners(corners: Corner[]) {
  const outline: Vec2[] = [];
  const roles: EdgeRole[] = [];

  const push = (point: Vec2, role: EdgeRole) => {
    const last = outline[outline.length - 1];
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < EPSILON) {
      roles[roles.length - 1] = role;
      return;
    }
    outline.push(point);
    roles.push(role);
  };

  corners.forEach((corner, i) => {
    const prev = corners[(i - 1 + corners.length) % corners.length].p;
    const next = corners[(i + 1) % corners.length].p;
    const arc = corner.radius ? fillet(prev, corner.p, next, corner.radius) : null;
    if (!arc) {
      push(corner.p, corner.role);
      return;
    }
    arc.forEach((point, j) => push(point, j === arc.length - 1 ? corner.role : 'panel'));
  });

  // Drop a closing point that duplicates the first.
  const first = outline[0];
  const last = outline[outline.length - 1];
  if (outline.length > 1 && Math.hypot(first.x - last.x, first.y - last.y) < EPSILON) {
    outline.pop();
    roles.pop();
  }

  return { outline, roles };
}

/**
 * Arc points rounding the corner at `p` between neighbors `a` and `b`. The
 * radius shrinks if needed so the arc never uses more than half of either edge.
 */
function fillet(a: Vec2, p: Vec2, b: Vec2, radius: number): Vec2[] | null {
  const la = Math.hypot(a.x - p.x, a.y - p.y);
  const lb = Math.hypot(b.x - p.x, b.y - p.y);
  if (la < EPSILON || lb < EPSILON) return null;
  const ua = { x: (a.x - p.x) / la, y: (a.y - p.y) / la };
  const ub = { x: (b.x - p.x) / lb, y: (b.y - p.y) / lb };

  const angle = Math.acos(Math.max(-1, Math.min(1, ua.x * ub.x + ua.y * ub.y)));
  if (angle < EPSILON || Math.PI - angle < EPSILON) return null;

  const tangentLength = Math.min(radius / Math.tan(angle / 2), la / 2, lb / 2);
  const r = tangentLength * Math.tan(angle / 2);
  const start = { x: p.x + ua.x * tangentLength, y: p.y + ua.y * tangentLength };
  const end = { x: p.x + ub.x * tangentLength, y: p.y + ub.y * tangentLength };

  const bisector = { x: ua.x + ub.x, y: ua.y + ub.y };
  const bl = Math.hypot(bisector.x, bisector.y);
  const centerDistance = r / Math.sin(angle / 2);
  const center = {
    x: p.x + (bisector.x / bl) * centerDistance,
    y: p.y + (bisector.y / bl) * centerDistance,
  };

  const a0 = Math.atan2(start.y - center.y, start.x - center.x);
  let sweep = Math.atan2(end.y - center.y, end.x - center.x) - a0;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;

  const points: Vec2[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const a = a0 + (sweep * i) / ARC_SEGMENTS;
    points.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
  }
  return points;
}
