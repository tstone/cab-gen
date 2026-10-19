import NumberField from './NumberField';
import type { DimensionKey } from '../geometry/dimensions';
import { fromMm, toMm, unit, units } from '../state/units';

interface LengthFieldProps {
  label: string;
  /** Value, min and max are in millimeters; display follows the current unit. */
  value: number;
  onChange: (mm: number) => void;
  min?: number;
  max?: number;
  /** Smaller step and one extra decimal, for small sizes like material thickness. */
  fine?: boolean;
  /** Dimension to point out on the preview while hovered. */
  dimension?: DimensionKey;
}

export default function LengthField(props: LengthFieldProps) {
  const extra = () => (props.fine ? 1 : 0);
  const info = () => units[unit()];

  return (
    <NumberField
      label={props.label}
      unit={info().label}
      value={fromMm(props.value, unit(), extra())}
      min={props.min === undefined ? undefined : fromMm(props.min, unit(), extra())}
      max={props.max === undefined ? undefined : fromMm(props.max, unit(), extra())}
      step={props.fine ? info().fineStep : info().step}
      decimals={info().decimals + extra()}
      dimension={props.dimension}
      onChange={(v) => props.onChange(toMm(v, unit()))}
    />
  );
}
