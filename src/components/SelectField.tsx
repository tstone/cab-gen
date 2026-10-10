import { For, createMemo } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Select, createListCollection } from '@ark-ui/solid/select';

interface SelectFieldProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A dropdown for picking one of a longer list of options. */
export default function SelectField<T extends string>(props: SelectFieldProps<T>) {
  const collection = createMemo(() => createListCollection({ items: props.options }));

  return (
    <Select.Root
      class="select-field"
      collection={collection()}
      value={[props.value]}
      positioning={{ sameWidth: true }}
      onValueChange={(details) => {
        if (details.value[0]) props.onChange(details.value[0] as T);
      }}
    >
      <Select.Label class="select-field__label">{props.label}</Select.Label>
      <Select.Control>
        <Select.Trigger class="select-field__trigger">
          <Select.ValueText />
          <Select.Indicator class="select-field__indicator">▾</Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content class="select-field__content">
            <For each={collection().items}>
              {(item) => (
                <Select.Item item={item} class="select-field__item">
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              )}
            </For>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect />
    </Select.Root>
  );
}
