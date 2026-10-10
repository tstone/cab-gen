import { createSignal } from 'solid-js';

export type Unit = 'in' | 'cm' | 'mm';

interface UnitInfo {
  label: string;
  /** Millimeters per one of this unit. */
  mm: number;
  /** Increment used by the +/- buttons and arrow keys. */
  step: number;
  /** Decimal places shown in fields and readouts. */
  decimals: number;
  /** Step for fine fields (e.g. material thickness), which also show one extra decimal. */
  fineStep: number;
}

export const units: Record<Unit, UnitInfo> = {
  in: { label: 'in', mm: 25.4, step: 0.25, decimals: 2, fineStep: 1 / 32 },
  cm: { label: 'cm', mm: 10, step: 0.5, decimals: 1, fineStep: 0.1 },
  mm: { label: 'mm', mm: 1, step: 1, decimals: 0, fineStep: 0.5 },
};

const STORAGE_KEY = 'cab-gen:unit';

function loadUnit(): Unit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in units) return stored as Unit;
  } catch {
    // Storage unavailable; fall through to the default.
  }
  return 'in';
}

const [unit, setUnitSignal] = createSignal<Unit>(loadUnit());

export function setUnit(next: Unit) {
  setUnitSignal(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not persisted; the choice still applies for this session.
  }
}

export { unit };

/** Converts millimeters to `u`, rounded to the precision that unit displays (plus `extraDecimals`). */
export function fromMm(mm: number, u: Unit, extraDecimals = 0): number {
  const factor = 10 ** (units[u].decimals + extraDecimals);
  return Math.round((mm / units[u].mm) * factor) / factor;
}

export function toMm(value: number, u: Unit): number {
  return value * units[u].mm;
}

/** Inches to millimeters, for writing defaults in the units cabinets are usually designed in. */
export const inches = (value: number) => value * 25.4;
