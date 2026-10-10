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
  /** Ends of the screen edge before corner rounding: where the monitor opening is. */
  screen: { bottom: Vec2; top: Vec2 };
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
 * Going counter-clockwise from the back-bottom corner: bottom, toe kick, lower
 * front, control panel (underside, front, top), monitor cut (bottom line,
 * screen face, top line), marquee front and top, optional rise, back slope,
 * back, and back kick.
 */
export function sideProfile(p: ProfileParams): SideProfile {
  const warnings: string[] = [];
  const { height: H, depth: D } = p;

  // Marquee: the higher end of its top sits at the overall height.
  const m = p.marquee;
  const topRise = m.depth * Math.tan(deg(m.topAngle));
  const topFrontY = topRise >= 0 ? H : H + topRise;
  const topFront: Vec2 = { x: D - m.setback, y: topFrontY };
  const topBack: Vec2 = { x: topFront.x - m.depth, y: topFrontY - topRise };
  const marqueeBottom: Vec2 = {
    x: topFront.x - m.height * Math.tan(deg(m.faceAngle)),
    y: topFront.y - m.height,
  };

  // Rise: a steep step down and back from the marquee top before the back slope begins.
  const riseBottom: Vec2 = p.rise.enabled
    ? {
        x: topBack.x - p.rise.height * Math.tan(deg(p.rise.angle)),
        y: topBack.y - p.rise.height,
      }
    : topBack;

  const backKick = p.backKick.enabled ? p.backKick : { height: 0, depth: 0 };
  let backHeight = riseBottom.y - riseBottom.x * Math.tan(deg(p.backSlope));
  if (riseBottom.x < -EPSILON) {
    warnings.push('The marquee and rise extend past the back of the cabinet.');
  }
  if (backHeight < backKick.height) {
    warnings.push('The back slope is too steep to reach the back; the back panel height is clamped.');
    backHeight = backKick.height;
  }

  // Control panel: its top front edge sits at `height`, `overhang` past the lower front.
  const cp = p.controlPanel;
  const overhang = Math.max(0, cp.overhang);
  const cpFront: Vec2 = { x: D + overhang, y: cp.height };
  const cpBack: Vec2 = {
    x: cpFront.x - cp.depth,
    y: cp.height + cp.depth * Math.tan(deg(cp.angle)),
  };
  if (marqueeBottom.y <= cpBack.y) {
    warnings.push('The marquee bottom is below the control panel.');
  }

  const corners: Corner[] = [];
  corners.push({ p: { x: backKick.depth, y: 0 }, role: 'panel' });

  if (p.toeKick.enabled) {
    corners.push(
      { p: { x: D - p.toeKick.depth, y: 0 }, role: 'panel' },
      { p: { x: D, y: p.toeKick.height }, role: 'panel' },
    );
  } else {
    corners.push({ p: { x: D, y: 0 }, role: 'panel' });
  }

  if (overhang > EPSILON) {
    // Box sticking out past the lower front: underside slopes back down to the lower front.
    const underFront: Vec2 = { x: cpFront.x, y: cp.height - cp.thickness };
    const underBack: Vec2 = {
      x: D,
      y: underFront.y - overhang * Math.tan(deg(cp.undersideAngle)),
    };
    if (underBack.y <= (p.toeKick.enabled ? p.toeKick.height : 0)) {
      warnings.push('The control panel underside reaches the floor or toe kick.');
    }
    corners.push({ p: underBack, role: 'panel' }, { p: underFront, role: 'panel' });
  }
  corners.push({ p: cpFront, role: 'controlPanel' });

  const cut = p.monitorCut.enabled ? monitorCut(p, marqueeBottom, cpBack, warnings) : null;
  if (cut) {
    corners.push(
      { p: cpBack, role: 'panel' },
      { p: cut.bottom, role: 'screen', radius: p.monitorCut.bottomRadius },
      { p: cut.top, role: 'panel', radius: p.monitorCut.topRadius },
    );
  } else {
    // No cut: the screen runs straight from the control panel to the marquee.
    corners.push({ p: cpBack, role: 'screen' });
  }

  corners.push(
    { p: marqueeBottom, role: 'marquee' },
    { p: topFront, role: 'panel', radius: m.cornerRadius },
    { p: topBack, role: 'panel' },
  );
  if (p.rise.enabled) corners.push({ p: riseBottom, role: 'panel' });
  corners.push({ p: { x: 0, y: backHeight }, role: 'panel' });
  if (p.backKick.enabled) corners.push({ p: { x: 0, y: backKick.height }, role: 'panel' });

  const { outline, roles } = expandCorners(corners);
  if (outline.some((pt) => pt.y < -EPSILON) || selfIntersects(outline)) {
    warnings.push('The side profile overlaps itself; the preview may look wrong until this is fixed.');
  }
  const overallDepth = Math.max(...outline.map((pt) => pt.x)) - Math.min(0, ...outline.map((pt) => pt.x));
  const screen = cut ?? { bottom: cpBack, top: marqueeBottom };
  return { outline, roles, backHeight, overallDepth, screen, warnings };
}

/**
 * Finds the two inner corners of the monitor cut. The top line runs back from
 * the marquee bottom; the screen face runs down from its end; the bottom line
 * runs back from the control panel. Returns null if they can't meet.
 */
function monitorCut(p: ProfileParams, marqueeBottom: Vec2, cpBack: Vec2, warnings: string[]) {
  const c = p.monitorCut;
  const top: Vec2 = {
    x: marqueeBottom.x - c.depth,
    y: marqueeBottom.y - c.depth * Math.tan(deg(c.topAngle)),
  };

  // Intersect the screen line (from `top`, leaning back by faceAngle) with the
  // bottom line (from the control panel back edge, rising toward the back).
  const u = { x: Math.sin(deg(c.faceAngle)), y: -Math.cos(deg(c.faceAngle)) };
  const v = { x: -Math.cos(deg(c.bottomAngle)), y: Math.sin(deg(c.bottomAngle)) };
  const d = { x: cpBack.x - top.x, y: cpBack.y - top.y };
  const det = u.y * v.x - u.x * v.y;
  const s = (d.y * v.x - d.x * v.y) / det;
  const t = (u.x * d.y - u.y * d.x) / det;

  if (top.x <= 0) {
    warnings.push('The monitor cut extends past the back of the cabinet.');
  }
  if (top.y <= cpBack.y) {
    warnings.push('The monitor cut top is below the control panel; showing no cut.');
    return null;
  }

  // The screen reaches the control panel before meeting the bottom line (or
  // never meets it): run the screen straight to the control panel's back edge,
  // with no bottom line. This is a legitimate style (e.g. Crystal Castles).
  if (!Number.isFinite(s) || s <= 0 || t < EPSILON) {
    return { top, bottom: cpBack };
  }

  return { top, bottom: { x: top.x + s * u.x, y: top.y + s * u.y } };
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
