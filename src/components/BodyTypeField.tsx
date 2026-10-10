import { For } from 'solid-js';
import { RadioGroup } from '@ark-ui/solid/radio-group';
import { type BodyType, bodyTypes } from '../state/params';

interface BodyTypeFieldProps {
  value: BodyType;
  onChange: (value: BodyType) => void;
}

export default function BodyTypeField(props: BodyTypeFieldProps) {
  return (
    <RadioGroup.Root
      class="body-type"
      value={props.value}
      onValueChange={(details) => {
        if (details.value) props.onChange(details.value as BodyType);
      }}
    >
      <For each={bodyTypes}>
        {(type) => (
          <RadioGroup.Item value={type.value} class="body-type__item">
            <RadioGroup.ItemControl class="body-type__control" />
            <div class="body-type__text">
              <RadioGroup.ItemText class="body-type__label">{type.label}</RadioGroup.ItemText>
              <span class="body-type__description">{type.description}</span>
            </div>
            <RadioGroup.ItemHiddenInput />
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup.Root>
  );
}
