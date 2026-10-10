import type { GenericPlayArea, LayoutParams, PlayAreaPreset, PlayAreaSetup } from '../state/params';
import { inches } from '../state/units';

/** A point on the panel's top surface, in a player's frame: u to their right, v away from them (mm). */
interface PlayerPoint {
  u: number;
  v: number;
}

/** Stick and button centers for one play area, with the stick at the origin. */
interface PlayAreaShape {
  stick: PlayerPoint;
  buttons: PlayerPoint[];
}

export const playAreaPresets: Record<
  PlayAreaPreset,
  { label: string; description: string; shape: () => PlayAreaShape }
> = {
  'capcom-sf': {
    label: 'Capcom USA Street Fighter',
    description: 'Two rows of three, straight, with the stick centered between the rows',
    shape: () => {
      // From slagcoin: 95mm from the stick to the first column, columns 1-1/2" apart,
      // rows 1-3/8" apart with the stick halfway between them.
      const buttons: PlayerPoint[] = [];
      for (const v of [inches(11 / 16), -inches(11 / 16)]) {
        for (let col = 0; col < 3; col++) buttons.push({ u: 95 + col * inches(1.5), v });
      }
      return { stick: { u: 0, v: 0 }, buttons };
    },
  },
  japanese: {
    label: 'Standard Japanese Arcade Layout',
    description: 'Two curved rows of four, as on Sega Astro City and Vewlix cabinets',
    shape: () => {
      // From slagcoin. Bottom row: 59mm from the stick to the first column, then
      // 33, 36 and 34mm apart; the second button is level with the stick, the first
      // 14mm lower, the third 6mm lower and the fourth 15mm below the third.
      // The top row is the bottom row raised 38.5mm and shifted right by 7, 7, 6.5
      // and 6.5mm.
      return twoRows([59, 92, 128, 162], [-14, 0, -6, -21], 38.5, [7, 7, 6.5, 6.5]);
    },
  },
  'japanese-straight': {
    label: 'Standard Non-Slanted Japanese Arcade Layout',
    description: 'Two curved rows of four with the top row straight above the bottom',
    shape: () => {
      // From slagcoin. Bottom row: 63mm from the stick to the first column, then
      // 30.5, 36 and 36mm apart; the middle two buttons are level with the stick,
      // the fourth 9mm lower and the first 11mm below that. The top row is the
      // bottom row raised 39mm (19 + 11 + 9), with no sideways shift.
      return twoRows([63, 93.5, 129.5, 165.5], [-20, 0, 0, -9], 39, [0, 0, 0, 0]);
    },
  },
  'moderate-transition': {
    label: 'Moderate Transition',
    description: 'A gentler Japanese-style curve with the stick set out 95mm, as on American layouts',
    shape: () => {
      // From slagcoin. Bottom row: 95mm from the stick to the first column, then
      // 33, 36 and 36mm apart (200mm to the last); the middle two buttons are level
      // with the stick, the first 14mm lower and the fourth 7mm lower. The top row
      // is the bottom row raised 36mm (22 + 14), with no sideways shift.
      return twoRows([95, 128, 164, 200], [-14, 0, 0, -7], 36, [0, 0, 0, 0]);
    },
  },
  'direct-slanted': {
    label: 'Direct Slanted',
    description: 'Rows of four that step down from the second button, with the stick set out 95mm',
    shape: () => {
      // From slagcoin. Bottom row: 95mm from the stick to the first column, then
      // 31.25, 35 and 35mm apart (196.25mm to the last); the second button is level
      // with the stick, the third 9mm lower, and the first and fourth 18mm lower.
      // The top row is the bottom row raised 36mm (18 + 9 + 9), with no sideways shift.
      return twoRows([95, 126.25, 161.25, 196.25], [-18, 0, -9, -18], 36, [0, 0, 0, 0]);
    },
  },
  'shifted-7': {
    label: 'Shifted 7 Button',
    description: 'Four buttons on top and three below, with the top row shifted right',
    shape: () => {
      // From slagcoin. Bottom row: 59mm from the stick to the first column, then
      // 33 and 36mm apart; the second and third buttons are 15mm below the stick
      // and the first 13mm lower still. The top row is shifted 7mm right of the
      // bottom, with columns 33, 36 and 36mm apart (207mm from the reference 36mm
      // left of the stick to the last); the first button is 10mm above the stick
      // and the rest 14mm higher.
      return {
        stick: { u: 0, v: 0 },
        buttons: [
          { u: 66, v: 10 },
          { u: 99, v: 24 },
          { u: 135, v: 24 },
          { u: 171, v: 24 },
          { u: 59, v: -28 },
          { u: 92, v: -15 },
          { u: 128, v: -15 },
        ],
      };
    },
  },
  'shifted-8': {
    label: 'Shifted 8 Button',
    description: 'Two rows of four with the top row shifted right, with the stick set out 95mm',
    shape: () => {
      // From slagcoin. Bottom row: 95mm from the stick to the first column, then
      // 33, 36 and 36mm apart; the last three buttons are level with the stick and
      // the first 14mm lower. The top row is the bottom row raised 38.5mm
      // (14 + 10 + 14.5) and shifted 7mm right (207mm to the last).
      return twoRows([95, 128, 164, 200], [-14, 0, 0, 0], 38.5, [7, 7, 7, 7]);
    },
  },
};

/**
 * Two rows of buttons, top row first, with the stick at the origin. The bottom
 * row is given by its column positions and heights; the top row is the bottom
 * row raised by `rowGap` and shifted right per column by `topShift`.
 */
function twoRows(bottomU: number[], bottomV: number[], rowGap: number, topShift: number[]): PlayAreaShape {
  const top = bottomU.map((u, col) => ({ u: u + topShift[col], v: bottomV[col] + rowGap }));
  const bottom = bottomU.map((u, col) => ({ u, v: bottomV[col] }));
  return { stick: { u: 0, v: 0 }, buttons: [...top, ...bottom] };
}

/** Lays out the generic play area: a single row of buttons to the right of the stick. */
function genericShape(g: GenericPlayArea, warnings: string[]): PlayAreaShape {
  const n = g.buttons;
  const s = g.spacing;
  const buttons: PlayerPoint[] = [];

  if (g.arrangement === 'line') {
    for (let i = 0; i < n; i++) buttons.push({ u: g.stickToButton + i * s, v: 0 });
  } else if (g.arrangement === 'slanted') {
    const t = (g.slant * Math.PI) / 180;
    for (let i = 0; i < n; i++) {
      buttons.push({ u: g.stickToButton + i * s * Math.cos(t), v: i * s * Math.sin(t) });
    }
  } else {
    // Buttons spaced `s` apart along a circle bulging away from the player,
    // symmetric about the middle of the row, with the first button level with the stick.
    let r = g.arcRadius;
    if (r < s / 2) {
      warnings.push('The arc radius is too tight for the button spacing.');
      r = s / 2;
    }
    const step = 2 * Math.asin(s / (2 * r));
    const angle = (i: number) => (i - (n - 1) / 2) * step;
    const center = g.stickToButton - r * Math.sin(angle(0));
    for (let i = 0; i < n; i++) {
      buttons.push({ u: center + r * Math.sin(angle(i)), v: r * (Math.cos(angle(i)) - Math.cos(angle(0))) });
    }
  }

  return { stick: { u: 0, v: 0 }, buttons };
}

function setupShape(setup: PlayAreaSetup, warnings: string[]): PlayAreaShape {
  return setup.mode === 'preset' ? playAreaPresets[setup.preset].shape() : genericShape(setup.generic, warnings);
}

/** A hole through the control panel, in panel coordinates (mm). */
export interface PanelHole {
  /** Along the slope, back from the panel's front edge. */
  along: number;
  /** Across the panel from its center, to the players' right. */
  across: number;
  radius: number;
  kind: 'stick' | 'button' | 'start';
  /** The player the hole belongs to; start buttons go left to right, player 1 first. */
  player: number;
}

export interface PanelHoles {
  /** Holes that fit on the panel; any running off the edge are left out. */
  holes: PanelHole[];
  warnings: string[];
}

/**
 * Places every player's play area on a panel `width` across and `depth` deep.
 * Players get equal slots across the panel; each play area is centered in its
 * slot (shifted by the player's offset), at the player's distance from the front edge.
 * Start buttons, one per player, sit in a row centered across the back of the panel.
 */
export function panelHoles(layout: LayoutParams, width: number, depth: number): PanelHoles {
  const warnings: string[] = [];
  const holes: PanelHole[] = [];
  const stickR = layout.hardware.stickHole / 2;
  const buttonR = layout.hardware.buttonSize / 2;
  const n = layout.playerCount;
  // An empty panel gets no holes at all; the builder cuts their own.
  if (layout.main.mode === 'empty') return { holes, warnings };
  const fits = (hole: PanelHole) =>
    Math.abs(hole.across) + hole.radius <= width / 2 &&
    hole.along - hole.radius >= 0 &&
    hole.along + hole.radius <= depth;

  // Every player uses the player 1 + 2 setup for now.
  const shape = setupShape(layout.main, warnings);
  const circles = [
    { ...shape.stick, r: stickR, kind: 'stick' as const },
    ...shape.buttons.map((b) => ({ ...b, r: buttonR, kind: 'button' as const })),
  ];

  if (overlapping(circles)) warnings.push('Holes in the play area overlap; increase the spacing.');

  // Center the play area on its bounding box.
  const minU = Math.min(...circles.map((c) => c.u - c.r));
  const maxU = Math.max(...circles.map((c) => c.u + c.r));
  const minV = Math.min(...circles.map((c) => c.v - c.r));
  const maxV = Math.max(...circles.map((c) => c.v + c.r));
  const midU = (minU + maxU) / 2;
  const midV = (minV + maxV) / 2;

  const extents: { left: number; right: number }[] = [];
  for (let p = 0; p < n; p++) {
    const pos = layout.positions[p];
    const centerU = -width / 2 + (width * (p + 0.5)) / n + pos.x;
    let offPanel = false;
    for (const c of circles) {
      const hole: PanelHole = {
        across: centerU + c.u - midU,
        along: pos.y + c.v - midV,
        radius: c.r,
        kind: c.kind,
        player: p,
      };
      if (fits(hole)) holes.push(hole);
      else offPanel = true;
    }
    if (offPanel) warnings.push(`Player ${p + 1}'s play area runs off the panel; some holes are left out.`);
    extents.push({ left: centerU + minU - midU, right: centerU + maxU - midU });
  }

  for (let p = 1; p < n; p++) {
    if (extents[p].left < extents[p - 1].right) {
      warnings.push(`Player ${p} and player ${p + 1}'s play areas overlap.`);
    }
  }

  const start = layout.start;
  const startR = start.size / 2;
  if (start.spacing < start.size && n > 1) warnings.push('The start buttons overlap; increase their spacing.');
  let startOffPanel = false;
  let startOverlaps = false;
  for (let p = 0; p < n; p++) {
    const hole: PanelHole = {
      across: (p - (n - 1) / 2) * start.spacing,
      along: depth - start.fromBack,
      radius: startR,
      kind: 'start',
      player: p,
    };
    if (!fits(hole)) {
      startOffPanel = true;
      continue;
    }
    const touches = (h: PanelHole) =>
      Math.hypot(h.across - hole.across, h.along - hole.along) < h.radius + hole.radius;
    if (holes.some((h) => h.kind !== 'start' && touches(h))) startOverlaps = true;
    holes.push(hole);
  }
  if (startOffPanel) warnings.push('Some start buttons run off the panel and are left out.');
  if (startOverlaps) warnings.push('The start buttons overlap a play area.');

  return { holes, warnings };
}

function overlapping(circles: { u: number; v: number; r: number }[]) {
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i];
      const b = circles[j];
      if (Math.hypot(a.u - b.u, a.v - b.v) < a.r + b.r) return true;
    }
  }
  return false;
}
