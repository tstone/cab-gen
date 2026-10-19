import { type Line, intersect, offsetLine } from './lines';
import type { SideProfile, Vec2 } from './sideProfile';

export interface BodyPanels {
  /** Side outline (profile coordinates, mm) of the lower front panel, or null if there's no room for one. */
  front: Vec2[] | null;
  /** Side outlines of the top and back panels, front to back, mitered where they meet. */
  topBack: Vec2[][];
}

const MIN_LENGTH = 1;
const EPSILON = 1e-6;

/**
 * Lays out the boards between the side panels that close in the body, each
 * `thickness` thick with its outer face set in from the profile edge it covers.
 *
 * The lower front panel is butt jointed: square ends, running from the floor
 * up to `frontTop` (by default where the lower front meets the control panel
 * or its underside).
 *
 * The top and back panels follow the outline from the marquee top back over
 * the slope and down the back, each pair meeting in a miter. The marquee top's
 * front end is cut along the marquee face, or square where that corner is
 * rounded, and the back's bottom end is square to the floor.
 */
export function bodyPanels(
  profile: SideProfile,
  thickness: number,
  inset: { front: number; topBack: number },
  frontTop?: number,
): BodyPanels {
  const t = thickness;

  const { bottom, top: lowerTop } = profile.lowerFront;
  const top = frontTop ?? lowerTop.y;
  const outerX = bottom.x - Math.max(0, inset.front);
  const front =
    top - bottom.y < MIN_LENGTH
      ? null
      : [
          { x: outerX, y: bottom.y },
          { x: outerX, y: top },
          { x: outerX - t, y: top },
          { x: outerX - t, y: bottom.y },
        ];

  // Drop repeated corners, e.g. a back slope that reaches the floor.
  const chain = profile.topBack.filter(
    (pt, i, all) => i === 0 || Math.hypot(pt.x - all[i - 1].x, pt.y - all[i - 1].y) > EPSILON,
  );
  const edges = chain.slice(1).map((b, i) => ({ a: chain[i], b }));
  const backInset = Math.max(0, inset.topBack);
  // Each panel's outer and inner faces.
  const faces = edges.map(({ a, b }) => [offsetLine(a, b, backInset), offsetLine(a, b, backInset + t)]);

  // A square end: straight in from the profile corner `pt`, square to the edge.
  const squareEnd = (pt: Vec2, line: Line, distance: number) => ({
    x: pt.x + line.normal.x * distance,
    y: pt.y + line.normal.y * distance,
  });
  const ends = (pt: Vec2, i: number) => [
    squareEnd(pt, faces[i][0], backInset),
    squareEnd(pt, faces[i][0], backInset + t),
  ];
  // Where panels i - 1 and i meet: the outer and inner faces' crossings.
  const miter = (i: number) =>
    [0, 1].map((f) => intersect(faces[i - 1][f], faces[i][f]) ?? ends(chain[i], i)[f]);

  // The marquee top's front end is cut along the marquee face, unless that corner is rounded.
  const { marquee } = profile;
  const unrounded = chain[0].x === marquee.top.x && chain[0].y === marquee.top.y;
  const faceLine = offsetLine(marquee.bottom, marquee.top, 0);
  const first = unrounded
    ? [0, 1].map((f) => intersect(faces[0][f], faceLine) ?? ends(chain[0], 0)[f])
    : ends(chain[0], 0);

  const topBack = edges.map((_, i) => {
    const [startOuter, startInner] = i === 0 ? first : miter(i);
    const [endOuter, endInner] = i === edges.length - 1 ? ends(chain[i + 1], i) : miter(i + 1);
    return [startOuter, endOuter, endInner, startInner];
  });

  return { front, topBack };
}
