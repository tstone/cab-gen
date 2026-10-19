import type { CabinetParams } from '../state/params';
import { coinDoorSizes } from '../state/params';
import type { ControlPanelLayout } from './controlPanel';
import type { MonitorPlacement } from './monitor';
import type { BodySections } from './sections';
import type { SideProfile, Vec2 } from './sideProfile';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

type Segment<T> = [T, T];

/** Dashed lines for what's measured, solid for end ticks and angle arcs. */
export interface Strokes<T> {
  dashed: Segment<T>[];
  solid: Segment<T>[];
}

/** Lines showing what a dimension measures on the cabinet. Millimeters, in profile space. */
export interface DimensionGuide {
  /** In the side profile, drawn against whichever side panel faces the camera. */
  side: Strokes<Vec2>;
  /** In profile space with z across the width (0 is the middle), drawn where they are. */
  space: Strokes<Vec3>;
  /** Half the cabinet's width: where the side panels' outer faces are. */
  halfWidth: number;
}

export interface GuideContext {
  params: CabinetParams;
  profile: SideProfile;
  sections: BodySections;
  monitor: MonitorPlacement;
  controlPanel: ControlPanelLayout;
}

const EPSILON = 1e-6;
/** Half-length of the ticks across each end of a measurement. */
const TICK = 10;
/** How far outside the cabinet overall dimensions are drawn. */
const OFFSET = 60;
const ARC_SEGMENTS = 16;

const sub = (a: Vec2, b: Vec2) => ({ x: a.x - b.x, y: a.y - b.y });
const len = (v: Vec2) => Math.hypot(v.x, v.y);
const along = (from: Vec2, dir: Vec2, distance: number) => ({
  x: from.x + dir.x * distance,
  y: from.y + dir.y * distance,
});
const unit = (v: Vec2) => {
  const l = len(v);
  return l < EPSILON ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
};

/** A measurement from `a` to `b`, with ticks across both ends. */
function measure(s: Strokes<Vec2>, a: Vec2, b: Vec2) {
  const d = unit(sub(b, a));
  if (d.x === 0 && d.y === 0) return;
  s.dashed.push([a, b]);
  const n = { x: -d.y, y: d.x };
  for (const p of [a, b]) s.solid.push([along(p, n, -TICK), along(p, n, TICK)]);
}

function extension(s: Strokes<Vec2>, a: Vec2, b: Vec2) {
  if (len(sub(b, a)) > EPSILON) s.dashed.push([a, b]);
}

/** The vertical distance between `a` and `b`, measured along the line at `x`. */
function vertical(s: Strokes<Vec2>, x: number, a: Vec2, b: Vec2) {
  const a2 = { x, y: a.y };
  const b2 = { x, y: b.y };
  extension(s, a, a2);
  extension(s, b, b2);
  measure(s, a2, b2);
}

/** The horizontal distance between `a` and `b`, measured along the line at `y`. */
function horizontal(s: Strokes<Vec2>, y: number, a: Vec2, b: Vec2) {
  const a2 = { x: a.x, y };
  const b2 = { x: b.x, y };
  extension(s, a, a2);
  extension(s, b, b2);
  measure(s, a2, b2);
}

/** The angle at `vertex` from the reference direction `ref` to the edge running to `end`. */
function angle(s: Strokes<Vec2>, vertex: Vec2, ref: Vec2, end: Vec2) {
  const edge = sub(end, vertex);
  const edgeLength = len(edge);
  s.dashed.push([vertex, along(vertex, ref, Math.max(edgeLength, 80))]);
  if (edgeLength < EPSILON) return;
  s.dashed.push([vertex, end]);

  const r = Math.min(Math.max(edgeLength * 0.5, 30), 80);
  const a0 = Math.atan2(ref.y, ref.x);
  let sweep = Math.atan2(edge.y, edge.x) - a0;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;
  const at = (i: number) => {
    const a = a0 + (sweep * i) / ARC_SEGMENTS;
    return { x: vertex.x + r * Math.cos(a), y: vertex.y + r * Math.sin(a) };
  };
  for (let i = 0; i < ARC_SEGMENTS; i++) s.solid.push([at(i), at(i + 1)]);
}

/** The sharp corner at `vertex`, between edges toward `a` and `b`, that a radius rounds off. */
function corner(s: Strokes<Vec2>, vertex: Vec2, a: Vec2, b: Vec2, radius: number) {
  const reach = Math.max(radius * 1.5, 30);
  for (const p of [a, b]) {
    const edge = sub(p, vertex);
    extension(s, vertex, along(vertex, unit(edge), Math.min(reach, len(edge))));
  }
}

/** A measurement in profile space, with ticks along `tick` at both ends. */
function measure3(s: Strokes<Vec3>, a: Vec3, b: Vec3, tick: Vec3) {
  s.dashed.push([a, b]);
  for (const p of [a, b]) {
    s.solid.push([
      { x: p.x - tick.x * TICK, y: p.y - tick.y * TICK, z: p.z - tick.z * TICK },
      { x: p.x + tick.x * TICK, y: p.y + tick.y * TICK, z: p.z + tick.z * TICK },
    ]);
  }
}

const UP = { x: 0, y: 1 };
const FORWARD = { x: 1, y: 0 };
const BACK = { x: -1, y: 0 };

type Builder = (c: GuideContext, side: Strokes<Vec2>, space: Strokes<Vec3>) => void;

const guides = {
  width: ({ params }, _, space) => {
    const x = params.profile.depth;
    measure3(space, { x, y: 0, z: -params.width / 2 }, { x, y: 0, z: params.width / 2 }, { x: 0, y: 1, z: 0 });
  },
  depth: ({ params }, s) => measure(s, { x: 0, y: 0 }, { x: params.profile.depth, y: 0 }),
  overallDepth: ({ profile }, s) => {
    const back = profile.outline.reduce((m, p) => (p.x < m.x ? p : m), { x: 0, y: 0 });
    const front = profile.outline.reduce((m, p) => (p.x > m.x ? p : m));
    horizontal(s, 0, back, front);
  },
  controlPanelHeight: ({ profile }, s) => {
    const { front } = profile.controlPanel;
    vertical(s, front.x, { x: front.x, y: 0 }, front);
  },
  monitorOpening: ({ profile }, s) => {
    const { bottom, top } = profile.screen;
    vertical(s, Math.max(bottom.x, top.x), bottom, top);
  },
  marqueeHeight: ({ profile }, s) => {
    const { bottom, top } = profile.marquee;
    vertical(s, Math.max(bottom.x, top.x) + OFFSET / 2, bottom, top);
  },
  overallHeight: ({ profile, sections }, s) => {
    const x = Math.min(0, ...profile.outline.map((p) => p.x)) - OFFSET;
    const top = profile.outline.reduce((m, p) => (p.y > m.y ? p : m));
    vertical(s, x, { x: 0, y: 0 }, { x: top.x, y: sections.height });
  },
  bartopHeight: ({ profile }, s) => {
    const x = Math.min(0, ...profile.outline.map((p) => p.x)) - OFFSET;
    const top = profile.outline.reduce((m, p) => (p.y > m.y ? p : m));
    vertical(s, x, { x: profile.overallDepth, y: profile.cutHeight }, top);
  },
  baseHeight: ({ profile }, s) => {
    const x = Math.min(0, ...profile.outline.map((p) => p.x)) - OFFSET;
    vertical(s, x, { x: 0, y: 0 }, { x: profile.overallDepth, y: profile.cutHeight });
  },

  cutDepth: ({ profile }, s) => horizontal(s, profile.screen.top.y, profile.screen.top, profile.marquee.bottom),
  cutTopAngle: ({ profile }, s) => angle(s, profile.screen.top, FORWARD, profile.marquee.bottom),
  cutFaceAngle: ({ profile }, s) => angle(s, profile.screen.bottom, UP, profile.screen.top),
  cutBottomAngle: ({ profile }, s) => angle(s, profile.controlPanel.back, BACK, profile.screen.bottom),
  cutTopRadius: ({ profile, params }, s) =>
    corner(s, profile.screen.top, profile.screen.bottom, profile.marquee.bottom, params.profile.monitorCut.topRadius),
  cutBottomRadius: ({ profile, params }, s) =>
    corner(
      s,
      profile.screen.bottom,
      profile.controlPanel.back,
      profile.screen.top,
      params.profile.monitorCut.bottomRadius,
    ),

  monitorOffset: ({ monitor, params }, s) => {
    const recessed = along(monitor.faceCenter, monitor.along, -params.profile.monitor.offset);
    measure(s, recessed, monitor.faceCenter);
  },
  monitorRecess: ({ monitor, params, profile }, s) => {
    const { bottom, top } = profile.screen;
    const mid = { x: (bottom.x + top.x) / 2, y: (bottom.y + top.y) / 2 };
    measure(s, mid, along(monitor.faceCenter, monitor.along, -params.profile.monitor.offset));
  },
  monitorAngle: ({ monitor }, s) => angle(s, monitor.body[0], UP, monitor.body[1]),

  coinDoorBottom: ({ params }, _, space) => {
    if (params.coinDoor.type === 'none') return;
    const x = params.profile.depth;
    const y = params.coinDoor.bottom;
    const half = coinDoorSizes[params.coinDoor.type].width / 2;
    measure3(space, { x, y: 0, z: 0 }, { x, y, z: 0 }, { x: 0, y: 0, z: 1 });
    space.dashed.push([
      { x, y, z: -half },
      { x, y, z: half },
    ]);
  },

  marqueeDepth: ({ profile }, s) =>
    horizontal(s, profile.marquee.top.y + OFFSET / 2, profile.topBack[1], profile.marquee.top),
  marqueeSetback: ({ profile }, s) =>
    horizontal(s, profile.marquee.top.y + OFFSET / 2, profile.lowerFront.top, profile.marquee.top),
  marqueeTopAngle: ({ profile }, s) => angle(s, profile.topBack[1], FORWARD, profile.marquee.top),
  marqueeFaceAngle: ({ profile }, s) => angle(s, profile.marquee.bottom, UP, profile.marquee.top),
  marqueeCornerRadius: ({ profile, params }, s) =>
    corner(s, profile.marquee.top, profile.marquee.bottom, profile.topBack[1], params.profile.marquee.cornerRadius),
  riseHeight: ({ profile }, s) => {
    const [, top, bottom] = profile.topBack;
    vertical(s, top.x, bottom, top);
  },
  riseAngle: ({ profile }, s) => {
    const [, top, bottom] = profile.topBack;
    angle(s, bottom, UP, top);
  },
  backSlope: ({ profile }, s) => {
    const chain = profile.topBack;
    // The chain ends with the slope's high end, the top of the back, then the floor.
    angle(s, chain[chain.length - 2], FORWARD, chain[chain.length - 3]);
  },
  backHeight: ({ profile }, s) => {
    const x = Math.min(0, ...profile.outline.map((p) => p.x)) - OFFSET;
    vertical(s, x, { x: 0, y: 0 }, { x: 0, y: profile.backHeight });
  },

  mountDepth: ({ profile }, s) => {
    const { front, back } = profile.controlPanel;
    horizontal(s, front.y, back, front);
  },
  mountAngle: ({ profile }, s) => angle(s, profile.controlPanel.front, BACK, profile.controlPanel.back),
  mountOverhang: ({ profile }, s) =>
    horizontal(s, profile.controlPanel.front.y, profile.lowerFront.top, profile.controlPanel.front),
  mountFaceHeight: ({ profile }, s) => {
    const { front, underside } = profile.controlPanel;
    if (underside) vertical(s, front.x, underside.front, front);
  },
  mountUndersideAngle: ({ profile }, s) => {
    const { underside } = profile.controlPanel;
    if (underside) angle(s, underside.front, BACK, underside.back);
  },
  panelDepth: ({ controlPanel }, s) =>
    measure(s, controlPanel.front, along(controlPanel.front, controlPanel.dir, controlPanel.depth)),
  panelWidth: ({ controlPanel }, _, space) => {
    const { front, width } = controlPanel;
    measure3(
      space,
      { x: front.x, y: front.y, z: -width / 2 },
      { x: front.x, y: front.y, z: width / 2 },
      { x: 0, y: 1, z: 0 },
    );
  },
} satisfies Record<string, Builder>;

/** A dimension that can be pointed out on the preview. */
export type DimensionKey = keyof typeof guides;

/** Lines showing what the dimension `key` measures on the current cabinet. */
export function dimensionGuide(key: DimensionKey, context: GuideContext): DimensionGuide {
  const side: Strokes<Vec2> = { dashed: [], solid: [] };
  const space: Strokes<Vec3> = { dashed: [], solid: [] };
  (guides[key] as Builder)(context, side, space);
  return { side, space, halfWidth: context.params.width / 2 };
}
