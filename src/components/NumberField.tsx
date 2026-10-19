import { NumberInput } from '@ark-ui/solid/number-input';
import type { DimensionKey } from '../geometry/dimensions';
import { hoverDimension } from '../state/view';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Maximum decimal places shown. */
  decimals?: number;
  unit?: string;
  /** Dimension to point out on the preview while hovered. */
  dimension?: DimensionKey;
}

export default function NumberField(props: NumberFieldProps) {
  const hover = hoverDimension(() => props.dimension);

  return (
    <NumberInput.Root
      {...hover}
      class="number-field"
      value={String(props.value)}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      formatOptions={{ maximumFractionDigits: props.decimals ?? 0, useGrouping: false }}
      onValueChange={(details) => {
        if (!Number.isNaN(details.valueAsNumber)) props.onChange(details.valueAsNumber);
      }}
    >
      <NumberInput.Label class="number-field__label">
        {props.label}
        {props.unit && <span class="number-field__unit">{props.unit}</span>}
      </NumberInput.Label>
      <NumberInput.Control class="number-field__control">
        <NumberInput.DecrementTrigger class="number-field__trigger">−</NumberInput.DecrementTrigger>
        <NumberInput.Input class="number-field__input" />
        <NumberInput.IncrementTrigger class="number-field__trigger">+</NumberInput.IncrementTrigger>
      </NumberInput.Control>
    </NumberInput.Root>
  );
}
