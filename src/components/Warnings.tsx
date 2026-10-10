import { For, Show } from 'solid-js';

export default function Warnings(props: { warnings: string[] }) {
  return (
    <Show when={props.warnings.length > 0}>
      <ul class="warnings">
        <For each={props.warnings}>{(warning) => <li>{warning}</li>}</For>
      </ul>
    </Show>
  );
}
