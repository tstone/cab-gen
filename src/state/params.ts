import { createStore } from 'solid-js/store';
import { inches } from './units';

export type BodyType = 'bartop' | 'bartop-base' | 'full';

export const bodyTypes: { value: BodyType; label: string; description: string }[] = [
  { value: 'bartop', label: 'Bartop', description: 'Top half only, sits on a table or bar' },
  { value: 'bartop-base', label: 'Bartop + Base', description: 'Bartop on a matching base, full height' },
  { value: 'full', label: 'Full Size', description: 'Single full-height cabinet' },
];

export type AspectRatio = '4:3' | '5:4' | '16:10' | '16:9';

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

interface BoxDimensions {
  height: number;
  depth: number;
}

/** A cabinet side silhouette. Lengths in millimeters, angles in degrees. */
export interface ProfileParams {
  /** Overall height, to the highest point of the marquee top. */
  height: number;
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
  /** Angled cut at the bottom front corner. */
  toeKick: { enabled: boolean; height: number; depth: number };
  /** Angled cut at the bottom back corner. */
  backKick: { enabled: boolean; height: number; depth: number };
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
  /** Each body section keeps its own dimensions so switching types doesn't lose edits. */
  full: ProfileParams;
  bartop: ProfileParams;
  base: BoxDimensions;
}

/** The profile section shown and edited for a body type. */
export function profileKey(bodyType: BodyType): 'full' | 'bartop' {
  return bodyType === 'full' ? 'full' : 'bartop';
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
  full: {
    height: inches(72),
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
    toeKick: { enabled: false, height: inches(4), depth: inches(3) },
    backKick: { enabled: false, height: inches(4), depth: inches(3) },
    monitor: { offset: 0, recess: inches(1) },
  },
  bartop: {
    height: inches(28),
    depth: inches(22),
    marquee: {
      height: inches(6),
      depth: inches(6.5),
      setback: inches(5),
      topAngle: -10,
      faceAngle: 10,
      cornerRadius: 0,
    },
    rise: { enabled: true, height: inches(2.5), angle: 35 },
    backSlope: 24,
    monitorCut: {
      enabled: true,
      depth: inches(5),
      topAngle: 30,
      faceAngle: 15,
      bottomAngle: 20,
      topRadius: inches(0.75),
      bottomRadius: inches(0.75),
    },
    controlPanel: {
      height: inches(5.5),
      depth: inches(5),
      angle: 0,
      overhang: 0,
      thickness: inches(2),
      undersideAngle: 30,
    },
    toeKick: { enabled: false, height: inches(2), depth: inches(2) },
    backKick: { enabled: false, height: inches(2), depth: inches(2) },
    monitor: { offset: 0, recess: inches(1) },
  },
  base: { height: inches(42), depth: inches(18) },
};

/** Total height of the cabinet as currently configured. */
export function overallHeight(p: CabinetParams): number {
  switch (p.bodyType) {
    case 'bartop':
      return p.bartop.height;
    case 'bartop-base':
      return p.bartop.height + p.base.height;
    case 'full':
      return p.full.height;
  }
}

const [params, setParams] = createStore<CabinetParams>(structuredClone(defaultParams));

/** Restores the Settings tab values (material and monitor). */
export function resetSettings() {
  setParams({
    materialThickness: defaultParams.materialThickness,
    monitor: structuredClone(defaultParams.monitor),
  });
}

/** Restores the Cabinet tab values (body type, dimensions and profiles). */
export function resetCabinet() {
  const d = structuredClone(defaultParams);
  setParams({ bodyType: d.bodyType, width: d.width, full: d.full, bartop: d.bartop, base: d.base });
}

export { params, setParams };
