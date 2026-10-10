import { createEffect, createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import { inches } from './units';

export type BodyType = 'bartop' | 'bartop-base' | 'full';

export const bodyTypes: { value: BodyType; label: string; description: string }[] = [
  { value: 'bartop', label: 'Bartop', description: 'Cut off below the control panel, sits on a table or bar' },
  { value: 'bartop-base', label: 'Bartop + Base', description: 'Full size, split into a bartop and base below the control panel' },
  { value: 'full', label: 'Full Size', description: 'Single full-height cabinet' },
];

export type ControlPanelType = 'integrated' | 'removable';

export const controlPanelTypes: {
  value: ControlPanelType;
  label: string;
  description: string;
  disabled?: boolean;
}[] = [
  { value: 'integrated', label: 'Integrated', description: 'Fits between the side panels, resting on the control panel mount' },
  { value: 'removable', label: 'Removable', description: 'A separate assembly that sits on the cabinet (coming soon)', disabled: true },
];

/** Lengths in millimeters. */
export interface ControlPanelParams {
  type: ControlPanelType;
  /**
   * Moves the back edge along the panel's slope, measured from the back of the
   * control panel mount in the side profile; positive extends further back.
   */
  backOffset: number;
  /** Clear sheet over the panel, between the side panels and flush with their edge. */
  acrylic: { enabled: boolean; thickness: number };
}

export type PlayerCount = 1 | 2 | 3 | 4;

export const playerCounts: PlayerCount[] = [1, 2, 3, 4];

export type ButtonCount = 2 | 3 | 4;

export const buttonCounts: ButtonCount[] = [2, 3, 4];

export type ButtonArrangement = 'line' | 'slanted' | 'arced';

export const buttonArrangements: { value: ButtonArrangement; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'slanted', label: 'Slanted' },
  { value: 'arced', label: 'Arced' },
];

/** Standard arcade button sizes, which are also their mounting hole diameters (mm). */
export type ButtonSize = 24 | 30;

export const buttonSizes: ButtonSize[] = [24, 30];

/** A single row of buttons to the right of the stick. Lengths in millimeters, angles in degrees. */
export interface GenericPlayArea {
  buttons: ButtonCount;
  /** From the stick's center to the first button's center. */
  stickToButton: number;
  /** Center to center between neighboring buttons. */
  spacing: number;
  arrangement: ButtonArrangement;
  /** Rise of a slanted row from horizontal; positive goes away from the player. */
  slant: number;
  /** Radius of the circle an arced row follows. */
  arcRadius: number;
}

export type PlayAreaPreset =
  | 'capcom-sf'
  | 'japanese'
  | 'japanese-straight'
  | 'moderate-transition'
  | 'direct-slanted'
  | 'shifted-7'
  | 'shifted-8';

export type PlayAreaMode = 'generic' | 'preset' | 'empty';

export const playAreaModes: { value: PlayAreaMode; label: string; description: string }[] = [
  { value: 'generic', label: 'Generic', description: 'Choose the button count, spacing and arrangement' },
  { value: 'preset', label: 'Preset', description: 'Dimensions taken from a real arcade machine' },
  { value: 'empty', label: 'Empty', description: 'A blank panel, for cutting your own custom layout' },
];

export interface PlayAreaSetup {
  mode: PlayAreaMode;
  generic: GenericPlayArea;
  preset: PlayAreaPreset;
}

/**
 * Where a player's play area sits on the panel's top surface. Lengths in millimeters.
 * Players get equal slots across the panel and each play area is centered in its slot.
 */
export interface PlayAreaPosition {
  /** Left/right shift from the center of the player's slot; positive moves to the players' right. */
  x: number;
  /** Distance along the panel from its front edge to the play area's center. */
  y: number;
}

/** How the controls are arranged on the control panel. */
export interface LayoutParams {
  playerCount: PlayerCount;
  /** Play area setup shared by players 1 and 2. */
  main: PlayAreaSetup;
  /** One per possible player, used for the first `playerCount`. */
  positions: PlayAreaPosition[];
  hardware: {
    /** Diameter of the hole the joystick shaft passes through. */
    stickHole: number;
    buttonSize: ButtonSize;
  };
  /** One start button per player, in a row centered across the back of the panel. */
  start: {
    size: ButtonSize;
    /** Center to center between neighboring start buttons. */
    spacing: number;
    /** Distance along the panel from its back edge to the row's center line. */
    fromBack: number;
  };
}

export type AspectRatio ='4:3' | '5:4' | '16:10' | '16:9';

export const aspectRatios: AspectRatio[] = ['4:3', '5:4', '16:10', '16:9'];

export type MonitorOrientation = 'horizontal' | 'vertical';

/** The monitor being built around. Lengths in millimeters. */
export interface MonitorSpec {
  aspectRatio: AspectRatio;
  /** Diagonal of the visible picture. */
  diagonal: number;
  orientation: MonitorOrientation;
  /** Frame around the visible picture, on each side. */
  bezel: number;
  /** Front-to-back thickness of the monitor body. */
  depth: number;
}

/**
 * A cabinet side silhouette. Lengths in millimeters, angles in degrees.
 *
 * Heights stack up from the floor: the control panel height, then the monitor
 * opening above the control panel, then the marquee above that. The overall
 * height follows from them.
 */
export interface ProfileParams {
  /** Vertical height of the screen edge (the monitor opening), from its bottom to its top. */
  monitorOpening: number;
  /** Depth of the lower body at the floor, back to lower front face. */
  depth: number;
  marquee: {
    /** Vertical height of the marquee front face. */
    height: number;
    /** Horizontal depth of the marquee top, from its back corner to its front corner. */
    depth: number;
    /** Distance from the lower front face back to the marquee's top front corner. */
    setback: number;
    /** Slope of the marquee top from horizontal; positive rises toward the front. */
    topAngle: number;
    /** Lean of the marquee face from vertical; positive puts the top further forward. */
    faceAngle: number;
    /** Rounding of the top front corner. */
    cornerRadius: number;
  };
  rise: {
    enabled: boolean;
    /** Vertical drop from the marquee top to where the back slope begins. */
    height: number;
    /** Lean from vertical, with the bottom further back. */
    angle: number;
  };
  /** Angle of the top slope from the rise (or marquee) down to the back, from horizontal. */
  backSlope: number;
  monitorCut: {
    enabled: boolean;
    /** How far back the cut goes, measured horizontally from the marquee front face. */
    depth: number;
    /** Top line, from horizontal; positive drops toward the back. */
    topAngle: number;
    /** Screen face lean from vertical; positive tips the top back. */
    faceAngle: number;
    /** Bottom line, from horizontal; positive rises toward the back. */
    bottomAngle: number;
    topRadius: number;
    bottomRadius: number;
  };
  controlPanel: {
    /** Height of the control panel's top front edge from the floor. */
    height: number;
    /** Horizontal depth of the control panel top. */
    depth: number;
    /** Slope of the control panel top from horizontal; positive rises toward the back. */
    angle: number;
    /** How far the control panel front sticks out past the lower front; 0 is flush. */
    overhang: number;
    /** Height of the control panel's front face when it overhangs. */
    thickness: number;
    /** Slope of the underside from horizontal, dropping back toward the lower front. */
    undersideAngle: number;
  };
  /**
   * How far below the lowest front point of the control panel the bartop is cut
   * off. Bartops keep the part above the cut; a bartop + base keeps both parts.
   */
  bartopCut: number;
  /** Where the monitor sits relative to the screen edge of the profile. */
  monitor: {
    /** Slide along the screen edge from the center of the opening; positive moves up. */
    offset: number;
    /** Distance from the screen edge back to the monitor's front face. */
    recess: number;
  };
}

/** All lengths are in millimeters. */
export interface CabinetParams {
  bodyType: BodyType;
  /** Shared by every body type. */
  width: number;
  /** Sheet goods thickness, used for every panel. */
  materialThickness: number;
  monitor: MonitorSpec;
  /** Full-height side profile. Bartops are cut from it just below the control panel. */
  profile: ProfileParams;
  controlPanel: ControlPanelParams;
  layout: LayoutParams;
}

// Defaults use round imperial sizes, since most cabinets are built from US plans and sheet goods.
export const defaultParams: CabinetParams = {
  bodyType: 'bartop',
  width: inches(26),
  // Most "3/4 inch" plywood and MDF sold in stores is actually 23/32".
  materialThickness: inches(23 / 32),
  monitor: {
    aspectRatio: '4:3',
    diagonal: inches(19),
    orientation: 'horizontal',
    bezel: inches(0.75),
    depth: inches(2.5),
  },
  // Roughly a classic Atari upright.
  profile: {
    monitorOpening: inches(19),
    depth: inches(27),
    marquee: {
      height: inches(9),
      depth: inches(8),
      setback: inches(0),
      topAngle: 8,
      faceAngle: 10,
      cornerRadius: 0,
    },
    rise: { enabled: false, height: inches(2.5), angle: 35 },
    backSlope: 30,
    monitorCut: {
      enabled: true,
      depth: inches(9),
      topAngle: 30,
      faceAngle: 18,
      bottomAngle: 25,
      topRadius: inches(0.5),
      bottomRadius: inches(0.5),
    },
    controlPanel: {
      height: inches(37),
      depth: inches(7),
      angle: 8,
      overhang: inches(5),
      thickness: inches(4),
      undersideAngle: 35,
    },
    bartopCut: inches(2),
    monitor: { offset: 0, recess: inches(1) },
  },
  controlPanel: {
    type: 'integrated',
    backOffset: 0,
    acrylic: { enabled: true, thickness: inches(1 / 8) },
  },
  layout: {
    playerCount: 2,
    main: {
      mode: 'preset',
      generic: {
        buttons: 3,
        stickToButton: 95,
        spacing: inches(1.5),
        arrangement: 'line',
        slant: 15,
        arcRadius: inches(6),
      },
      preset: 'capcom-sf',
    },
    positions: Array.from({ length: 4 }, () => ({ x: 0, y: inches(3.5) })),
    // Happ-style 1-1/8" stick hole and Sanwa-style 30mm buttons.
    hardware: { stickHole: inches(1.125), buttonSize: 30 },
    start: { size: 24, spacing: inches(1.5), fromBack: inches(1) },
  },
};

const STORAGE_KEY = 'cab-gen:params';

/**
 * Overlays `stored` onto `defaults`, keeping only values whose type matches the
 * default's, so settings saved by an older version can't break the shape.
 */
function mergeStored<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(stored)) return defaults;
    return defaults.map((d, i) => mergeStored(d, stored[i])) as T;
  }
  if (defaults !== null && typeof defaults === 'object') {
    if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) return defaults;
    const merged = { ...defaults } as Record<string, unknown>;
    for (const key of Object.keys(merged)) {
      merged[key] = mergeStored(merged[key], (stored as Record<string, unknown>)[key]);
    }
    return merged as T;
  }
  if (typeof stored === 'number' && !Number.isFinite(stored)) return defaults;
  return typeof stored === typeof defaults ? (stored as T) : defaults;
}

function loadParams(): CabinetParams {
  const defaults = structuredClone(defaultParams);
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return mergeStored(defaults, JSON.parse(stored));
  } catch {
    // Storage unavailable or unreadable; fall through to the defaults.
  }
  return defaults;
}

const [params, setParams] = createStore<CabinetParams>(loadParams());

// Saves every change. Once the resets bring everything back to the defaults,
// the saved copy is dropped.
createRoot(() => {
  const defaultsJson = JSON.stringify(defaultParams);
  createEffect(() => {
    const json = JSON.stringify(params);
    try {
      if (json === defaultsJson) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, json);
    } catch {
      // Not persisted; the changes still apply for this session.
    }
  });
});

/** Restores the Settings tab values (material and monitor). */
export function resetSettings() {
  setParams({
    materialThickness: defaultParams.materialThickness,
    monitor: structuredClone(defaultParams.monitor),
  });
}

/**
 * Restores the Cabinet tab values (body type, dimensions and profiles). The
 * control panel mount is edited on the Control Panel tab, so it's kept, apart
 * from its height.
 */
export function resetCabinet() {
  const d = structuredClone(defaultParams);
  const controlPanel = { ...params.profile.controlPanel, height: d.profile.controlPanel.height };
  setParams({ bodyType: d.bodyType, width: d.width, profile: { ...d.profile, controlPanel } });
}

/** Restores the Control Panel tab values, including the mount in the side profile (but not its height). */
export function resetControlPanel() {
  const d = structuredClone(defaultParams);
  setParams('controlPanel', d.controlPanel);
  setParams('profile', 'controlPanel', {
    ...d.profile.controlPanel,
    height: params.profile.controlPanel.height,
  });
}

/** Restores the Layout tab values. */
export function resetLayout() {
  setParams('layout', structuredClone(defaultParams.layout));
}

export { params, setParams };
