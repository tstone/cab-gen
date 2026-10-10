import NumberField from './NumberField';

interface AngleFieldProps {
  label: string;
  /** Degrees. */
  value: number;
  onChange: (degrees: number) => void;
  min?: number;
  max?: number;
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
      onChange={props.onChange}
    />
  );
}
