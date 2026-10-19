import { For } from 'solid-js';
import ToggleField from './ToggleField';
import { setVisibility, viewParts, visibility } from '../state/view';

/** Show/hide switches for the parts of the preview. */
export default function VisibilityToggles() {
  return (
    <div class="visibility-toggles" role="group" aria-label="Show in preview">
      <For each={viewParts}>
        {(part) => (
          <ToggleField
            label={part.label}
            checked={visibility[part.value]}
            onChange={(v) => setVisibility(part.value, v)}
          />
        )}
      </For>
    </div>
  );
}
