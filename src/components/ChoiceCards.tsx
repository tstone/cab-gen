import { For } from 'solid-js';
import { RadioGroup } from '@ark-ui/solid/radio-group';

export interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
  disabled?: boolean;
}

interface ChoiceCardsProps<T extends string> {
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A radio group shown as stacked cards with a description under each label. */
export default function ChoiceCards<T extends string>(props: ChoiceCardsProps<T>) {
  return (
    <RadioGroup.Root
      class="choice-cards"
      value={props.value}
      onValueChange={(details) => {
        if (details.value) props.onChange(details.value as T);
      }}
    >
      <For each={props.options}>
        {(option) => (
          <RadioGroup.Item value={option.value} disabled={option.disabled} class="choice-cards__item">
            <RadioGroup.ItemControl class="choice-cards__control" />
            <div class="choice-cards__text">
              <RadioGroup.ItemText class="choice-cards__label">{option.label}</RadioGroup.ItemText>
              <span class="choice-cards__description">{option.description}</span>
            </div>
            <RadioGroup.ItemHiddenInput />
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup.Root>
  );
}
