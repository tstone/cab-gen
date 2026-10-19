import { type SpeakerParams, speakerSizes } from '../state/params';
import { inches } from '../state/units';
import { intersect, offsetLine } from './lines';
import type { SideProfile, Vec2 } from './sideProfile';

/**
 * The board along the top line of the monitor cut, under the marquee, with the
 * speaker cutouts. Lengths in millimeters.
 */
export interface SpeakerPanel {
  /** Front end of the board's outer (lower) face, in profile coordinates. */
  front: Vec2;
  /** Unit vector back along the board, in the profile. */
  dir: Vec2;
  /** Unit vector from the outer face into the cabinet, in the profile. */
  normal: Vec2;
  /** Along the outer face, from the marquee face back to the board's square back end. */
  length: number;
  /** Across the cabinet, between the side panels. */
  width: number;
  /**
   * Hole outlines on the board's outer face: x back along the board from its
   * front end, y across from its center line.
   */
  holes: Vec2[][];
  warnings: string[];
}

const MIN_LENGTH = 1;
/** Clear board kept around each speaker, along the panel. */
const EDGE_MARGIN = inches(0.25);

const SLOT_WIDTH = inches(0.25);
const SLOT_PITCH = inches(0.5);
const PERFORATION = inches(3 / 16);
const PERFORATION_PITCH = inches(5 / 16);

/**
 * Lays out the speaker panel, with its outer face set in `inset` from the
 * monitor cut's top line and its front end where that face meets the marquee
 * face. Null when the top line is too short to hold a panel.
 */
export function speakerPanel(
  profile: SideProfile,
  speakers: SpeakerParams,
  inset: number,
  width: number,
): SpeakerPanel | null {
  const top = profile.screenTop;
  if (!top || Math.hypot(top.front.x - top.back.x, top.front.y - top.back.y) < MIN_LENGTH) return null;

  // The outline runs back to front along the top line, so its inside is to the left.
  const d = Math.max(0, inset);
  const outer = offsetLine(top.back, top.front, d);
  const { normal } = outer;
  const back = { x: top.back.x + normal.x * d, y: top.back.y + normal.y * d };
  const faceLine = offsetLine(profile.marquee.bottom, profile.marquee.top, 0);
  const front = intersect(outer, faceLine) ?? {
    x: top.front.x + normal.x * d,
    y: top.front.y + normal.y * d,
  };
  const length = Math.hypot(back.x - front.x, back.y - front.y);
  if (length < MIN_LENGTH) return null;
  const dir = { x: (back.x - front.x) / length, y: (back.y - front.y) / length };

  const warnings: string[] = [];
  const size = speakerSizes[speakers.size];
  const radius = speakers.mountingHoles ? (size.boltCircle + size.boltHole) / 2 : size.cutout / 2;
  const centers =
    speakers.channels === 'mono'
      ? [{ x: length / 2, y: 0 }]
      : [-1, 1].map((side) => ({ x: length / 2, y: (side * width) / 4 }));

  let holes: Vec2[][] = [];
  if (2 * (radius + EDGE_MARGIN) > length) {
    warnings.push(
      `The speaker panel is too short for ${speakers.size}" speakers, so they're left out. ` +
        'Deepen the monitor cut or steepen its top line to lengthen it.',
    );
  } else if (centers.some((c) => Math.abs(c.y) + radius + EDGE_MARGIN > width / 2)) {
    warnings.push(`The cabinet is too narrow for these ${speakers.size}" speakers, so they're left out.`);
  } else {
    holes = centers.flatMap((c) => speakerHoles(c, speakers));
  }

  return { front, dir, normal, length, width, holes, warnings };
}

/** Outlines cut for one speaker centered at `center`. */
function speakerHoles(center: Vec2, speakers: SpeakerParams): Vec2[][] {
  const size = speakerSizes[speakers.size];
  const r = size.cutout / 2;
  const holes: Vec2[][] = [];

  if (speakers.cut === 'hole') {
    holes.push(circle(center, r, 48));
  } else if (speakers.cut === 'slots') {
    // Slots run across the cabinet, in rows along the panel, each as long as the cutout allows.
    const rows = Math.floor((r - SLOT_WIDTH / 2) / SLOT_PITCH);
    for (let i = -rows; i <= rows; i++) {
      const along = i * SLOT_PITCH;
      const edge = Math.abs(along) + SLOT_WIDTH / 2;
      const half = Math.sqrt(Math.max(0, r * r - edge * edge)) - SLOT_WIDTH / 2;
      if (half > SLOT_WIDTH / 4) holes.push(slot({ x: center.x + along, y: center.y }, half, SLOT_WIDTH / 2));
    }
  } else {
    // Drilled holes on a hexagonal grid, kept inside the cutout.
    const rowPitch = PERFORATION_PITCH * Math.sin(Math.PI / 3);
    const rows = Math.ceil(r / rowPitch);
    for (let i = -rows; i <= rows; i++) {
      const shift = i % 2 === 0 ? 0 : PERFORATION_PITCH / 2;
      const cols = Math.ceil(r / PERFORATION_PITCH) + 1;
      for (let j = -cols; j <= cols; j++) {
        const offset = { x: i * rowPitch, y: j * PERFORATION_PITCH + shift };
        if (Math.hypot(offset.x, offset.y) + PERFORATION / 2 > r) continue;
        holes.push(circle({ x: center.x + offset.x, y: center.y + offset.y }, PERFORATION / 2, 12));
      }
    }
  }

  if (speakers.mountingHoles) {
    // Four screws on the bolt circle, at the diagonals.
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const at = {
        x: center.x + (Math.cos(a) * size.boltCircle) / 2,
        y: center.y + (Math.sin(a) * size.boltCircle) / 2,
      };
      holes.push(circle(at, size.boltHole / 2, 12));
    }
  }
  return holes;
}

function circle(center: Vec2, r: number, segments: number): Vec2[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
  });
}

/** A slot with rounded ends, running across (y) `half` either side of `center`. */
function slot(center: Vec2, half: number, r: number): Vec2[] {
  const points: Vec2[] = [];
  const steps = 8;
  for (const end of [1, -1]) {
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;
      // Each cap sweeps a half turn around its end of the slot.
      points.push({ x: center.x + end * r * Math.cos(a), y: center.y + end * (half + r * Math.sin(a)) });
    }
  }
  return points;
}
