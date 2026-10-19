import type { DimensionKey } from '../geometry/dimensions';
import { fromMm, unit, units } from '../state/units';
import { hoverDimension } from '../state/view';

/** A millimeter value shown in the current display unit. */
export default function LengthReadout(props: { mm: number }) {
  return (
    <span>
      {fromMm(props.mm, unit())} {units[unit()].label}
    </span>
  );
}

/** A labeled length readout row, pointing out `dimension` on the preview while hovered. */
export function Readout(props: { label: string; mm: number; dimension?: DimensionKey }) {
  const hover = hoverDimension(() => props.dimension);
  return (
    <div class="readout" {...hover}>
      <span>{props.label}</span>
      <LengthReadout mm={props.mm} />
    </div>
  );
}
