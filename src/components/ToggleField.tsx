import { Switch } from '@ark-ui/solid/switch';

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function ToggleField(props: ToggleFieldProps) {
  return (
    <Switch.Root
      class="toggle-field"
      checked={props.checked}
      onCheckedChange={(details) => props.onChange(details.checked)}
    >
      <Switch.Label class="toggle-field__label">{props.label}</Switch.Label>
      <Switch.Control class="toggle-field__control">
        <Switch.Thumb class="toggle-field__thumb" />
      </Switch.Control>
      <Switch.HiddenInput />
    </Switch.Root>
  );
}
