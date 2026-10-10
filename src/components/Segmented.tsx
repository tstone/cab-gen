import { For, Show } from 'solid-js';
import { SegmentGroup } from '@ark-ui/solid/segment-group';

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Visible label above the control; omit and pass `ariaLabel` for unlabeled use. */
  label?: string;
  ariaLabel?: string;
  class?: string;
}

export default function Segmented<T extends string>(props: SegmentedProps<T>) {
  return (
    <SegmentGroup.Root
      class={`segmented ${props.class ?? ''}`}
      aria-label={props.label ? undefined : props.ariaLabel}
      orientation="horizontal"
      value={props.value}
      onValueChange={(details) => {
        if (details.value) props.onChange(details.value as T);
      }}
    >
      <Show when={props.label}>
        <SegmentGroup.Label class="segmented__label">{props.label}</SegmentGroup.Label>
      </Show>
      <div class="segmented__track">
        <SegmentGroup.Indicator class="segmented__indicator" />
        <For each={props.options}>
          {(option) => (
            <SegmentGroup.Item value={option.value} class="segmented__item">
              <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
              <SegmentGroup.ItemControl />
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          )}
        </For>
      </div>
    </SegmentGroup.Root>
  );
}
