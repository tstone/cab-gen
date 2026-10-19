import { createEffect, createRoot } from 'solid-js';
import { createStore } from 'solid-js/store';
import { inches } from './units';

export type BodyType = 'bartop-base' | 'full';

export const bodyTypes: { value: BodyType; label: string; description: string }[] = [
  { value: 'bartop-base', label: 'Split', description: 'Full size, split into a bartop and base where the control panel meets the front' },
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

/** How the bottom of an overhanging control panel is closed in, behind its front face. */
export type ControlPanelBottom = 'chin' | 'square';

export const controlPanelBottoms: { value: ControlPanelBottom; label: string; description: string }[] = [
  { value: 'chin', label: 'Chin', description: "Slopes back to the lower front at the cabinet's underside angle" },
  { value: 'square', label: 'Square', description: 'No chin; a bottom panel runs straight back from the front face' },
];

/** Lengths in millimeters. */
export interface ControlPanelParams {
  type: ControlPanelType;
  /**
   * Moves the back edge along the panel's slope, measured from the back of the
   * control panel mount in the side profile; positive extends further back.
   */
  backOffset: number;
  /**
   * How far the top, front face and chin sit in from the side panels' edges.
   * 0 is flush.
   */
  inset: number;
  /** How much farther back than the top's front edge the front face sits, so the top overhangs it. */
  faceSetback: number;
  bottom: ControlPanelBottom;
  /** Clear sheet over the panel, between the side panels and on top of the board. */
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
  /** Where the monitor sits relative to the screen edge of the profile. */
  monitor: {
    /** Slide along the screen edge from the center of the opening; positive moves up. */
    offset: number;
    /** Distance from the screen edge back to the monitor's front face. */
    recess: number;
    /** Tilt the monitor at its own angle instead of matching the screen face. */
    separateAngle: boolean;
    /** Monitor lean from vertical when `separateAngle` is on; positive tips the top back. */
    angle: number;
  };
}

export type CoinDoorType = 'none' | 'standard' | 'pinball';

/** Cutout size (mm) for each coin door. */
export const coinDoorSizes: Record<Exclude<CoinDoorType, 'none'>, { width: number; height: number }> = {
  standard: { width: 185, height: 252 },
  pinball: { width: inches(12.15), height: inches(10.41) },
};

export const coinDoorTypes: { value: CoinDoorType; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'No coin door' },
  { value: 'standard', label: 'Standard', description: 'Upright arcade door, cut out 185mm wide by 252mm tall' },
  { value: 'pinball', label: 'Pinball', description: 'Pinball style door, cut out 12.15" wide by 10.41" tall' },
];

export type SpeakerChannels = 'mono' | 'stereo';

export const speakerChannelOptions: { value: SpeakerChannels; label: string; description: string }[] = [
  { value: 'mono', label: 'Mono', description: 'One speaker, centered on the panel' },
  { value: 'stereo', label: 'Stereo', description: 'Two speakers, centered in each half of the panel' },
];

export type SpeakerSize = '4' | '5.25';

export const speakerSizeOptions: { value: SpeakerSize; label: string }[] = [
  { value: '4', label: '4"' },
  { value: '5.25', label: '5.25"' },
];

/**
 * Typical cutout and mounting dimensions (mm) for each speaker size. Speakers
 * vary, so check these against the ones being fitted.
 */
export const speakerSizes: Record<SpeakerSize, { cutout: number; boltCircle: number; boltHole: number }> = {
  '4': { cutout: inches(3.75), boltCircle: inches(4.25), boltHole: inches(5 / 32) },
  '5.25': { cutout: inches(4.5), boltCircle: inches(5.25), boltHole: inches(5 / 32) },
};

export type SpeakerCut = 'hole' | 'slots' | 'perforated';

export const speakerCuts: { value: SpeakerCut; label: string; description: string }[] = [
  { value: 'hole', label: 'Hole', description: 'One round cutout the size of the speaker cone' },
  { value: 'slots', label: 'Slots', description: 'Rows of slots across the cabinet, filling the cutout' },
  { value: 'perforated', label: 'Perforated', description: 'A grid of drilled holes filling the cutout' },
];

/** The speaker panel: the board along the top line of the monitor cut, under the marquee. */
export interface SpeakerParams {
  channels: SpeakerChannels;
  size: SpeakerSize;
  cut: SpeakerCut;
  /** Drill the holes for the screws that hold each speaker. */
  mountingHoles: boolean;
}

/** All lengths are in millimeters. */
export interface CabinetParams {
  bodyType: BodyType;
  /** Shared by every body type. */
  width: number;
  /** Sheet goods thickness, used for every panel. */
  materialThickness: number;
  monitor: MonitorSpec;
  /** Full-height side profile. A split body is cut in two where the control panel meets the lower front. */
  profile: ProfileParams;
  controlPanel: ControlPanelParams;
  /** How far the boards between the side panels sit in from the sides' edges. 0 is flush. */
  panels: { frontInset: number; topBackInset: number };
  /** Cut out of the lower front panel, centered across it. */
  coinDoor: {
    type: CoinDoorType;
    /** Height of the cutout's bottom edge from the floor. */
    bottom: number;
  };
  layout: LayoutParams;
  speakers: SpeakerParams;
}

// Defaults use round imperial sizes, since most cabinets are built from US plans and sheet goods.
export const defaultParams: CabinetParams = {
  bodyType: 'bartop-base',
  width: inches(26),
  // Most "3/4 inch" plywood and MDF sold in stores is actually 23/32".
  materialThickness: inches(23 / 32),
  monitor: {
    aspectRatio: '16:9',
    diagonal: inches(23.75),
    orientation: 'horizontal',
    bezel: inches(0.75),
    depth: inches(2.5),
  },
  // Roughly a classic Atari upright.
  profile: {
    monitorOpening: inches(19),
    depth: inches(24),
    marquee: {
      height: inches(8),
      depth: inches(8),
      setback: inches(0),
      topAngle: 8,
      faceAngle: 10,
      cornerRadius: 0,
    },
    rise: { enabled: false, height: inches(2.5), angle: 35 },
    backSlope: 30,
    monitorCut: {
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
      thickness: inches(5.25),
      undersideAngle: 35,
    },
    monitor: { offset: 0, recess: inches(1), separateAngle: false, angle: 18 },
  },
  controlPanel: {
    type: 'integrated',
    backOffset: 0,
    inset: inches(0.25),
    faceSetback: inches(0.5),
    bottom: 'chin',
    acrylic: { enabled: true, thickness: inches(1 / 8) },
  },
  panels: { frontInset: inches(0.25), topBackInset: inches(0.25) },
  coinDoor: { type: 'standard', bottom: inches(12) },
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
  speakers: { channels: 'stereo', size: '4', cut: 'slots', mountingHoles: true },
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
    if (stored) {
      const merged = mergeStored(defaults, JSON.parse(stored));
      // Older versions also offered a lone bartop.
      if (!bodyTypes.some((t) => t.value === merged.bodyType)) merged.bodyType = defaults.bodyType;
      if (!controlPanelBottoms.some((b) => b.value === merged.controlPanel.bottom)) {
        merged.controlPanel.bottom = defaults.controlPanel.bottom;
      }
      if (!coinDoorTypes.some((c) => c.value === merged.coinDoor.type)) {
        merged.coinDoor.type = defaults.coinDoor.type;
      }
      const { speakers } = merged;
      if (!speakerChannelOptions.some((c) => c.value === speakers.channels)) {
        speakers.channels = defaults.speakers.channels;
      }
      if (!speakerSizeOptions.some((s) => s.value === speakers.size)) speakers.size = defaults.speakers.size;
      if (!speakerCuts.some((c) => c.value === speakers.cut)) speakers.cut = defaults.speakers.cut;
      return merged;
    }
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
 * Restores the Cabinet tab values (body type, dimensions, profiles, panels and
 * coin door). The control panel mount and the marquee are edited on their own
 * tabs, so they're kept, apart from their heights.
 */
export function resetCabinet() {
  const d = structuredClone(defaultParams);
  const controlPanel = { ...params.profile.controlPanel, height: d.profile.controlPanel.height };
  const marquee = { ...params.profile.marquee, height: d.profile.marquee.height };
  setParams({
    bodyType: d.bodyType,
    width: d.width,
    profile: {
      ...d.profile,
      controlPanel,
      marquee,
      rise: { ...params.profile.rise },
      backSlope: params.profile.backSlope,
    },
    panels: d.panels,
    coinDoor: d.coinDoor,
  });
}

/** Restores the Marquee tab values: the marquee (but not its height), rise and back slope. */
export function resetMarquee() {
  const d = structuredClone(defaultParams);
  setParams('profile', 'marquee', { ...d.profile.marquee, height: params.profile.marquee.height });
  setParams('profile', 'rise', d.profile.rise);
  setParams('profile', 'backSlope', d.profile.backSlope);
}

/** Restores the Speakers tab values. */
export function resetSpeakers() {
  setParams('speakers', structuredClone(defaultParams.speakers));
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

/** Restores the Buttons tab values. */
export function resetLayout() {
  setParams('layout', structuredClone(defaultParams.layout));
}

export { params, setParams };
