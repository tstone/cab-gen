import NumberField from './NumberField';
import type { DimensionKey } from '../geometry/dimensions';

interface AngleFieldProps {
  label: string;
  /** Degrees. */
  value: number;
  onChange: (degrees: number) => void;
  min?: number;
  max?: number;
  /** Dimension to point out on the preview while hovered. */
  dimension?: DimensionKey;
}

export default function AngleField(props: AngleFieldProps) {
  return (
    <NumberField
      label={props.label}
      unit="°"
      value={props.value}
      min={props.min}
      max={props.max}
      step={1}
      decimals={1}
      dimension={props.dimension}
      onChange={props.onChange}
    />
  );
}
