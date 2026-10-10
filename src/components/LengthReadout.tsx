import { fromMm, unit, units } from '../state/units';

/** A millimeter value shown in the current display unit. */
export default function LengthReadout(props: { mm: number }) {
  return (
    <span>
      {fromMm(props.mm, unit())} {units[unit()].label}
    </span>
  );
}
