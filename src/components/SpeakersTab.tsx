import { Show } from 'solid-js';
import ChoiceCards from './ChoiceCards';
import LengthReadout from './LengthReadout';
import Segmented from './Segmented';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { SpeakerPanel } from '../geometry/speakers';
import {
  params,
  resetSpeakers,
  setParams,
  speakerChannelOptions,
  speakerCuts,
  speakerSizeOptions,
  speakerSizes,
} from '../state/params';

interface SpeakersTabProps {
  /** The laid out speaker panel, or null when the monitor cut's top line is too short for one. */
  panel: SpeakerPanel | null;
}

export default function SpeakersTab(props: SpeakersTabProps) {
  const size = () => speakerSizes[params.speakers.size];

  return (
    <>
      <Show when={!props.panel}>
        <section class="params__section">
          <Warnings
            warnings={[
              'The speaker panel runs along the top of the monitor cut, under the marquee. Deepen the monitor cut or steepen its top line on the Cabinet tab to make room for it.',
            ]}
          />
        </section>
      </Show>
      <Show when={(props.panel?.warnings.length ?? 0) > 0}>
        <section class="params__section">
          <Warnings warnings={props.panel?.warnings ?? []} />
        </section>
      </Show>

      <section class="params__section">
        <h2>Speakers</h2>
        <ChoiceCards
          options={speakerChannelOptions}
          value={params.speakers.channels}
          onChange={(v) => setParams('speakers', 'channels', v)}
        />
        <Segmented
          label="Size"
          options={speakerSizeOptions}
          value={params.speakers.size}
          onChange={(v) => setParams('speakers', 'size', v)}
        />
      </section>

      <section class="params__section">
        <h2>Cut</h2>
        <ChoiceCards
          options={speakerCuts}
          value={params.speakers.cut}
          onChange={(v) => setParams('speakers', 'cut', v)}
        />
        <ToggleField
          label="Mounting holes"
          checked={params.speakers.mountingHoles}
          onChange={(v) => setParams('speakers', 'mountingHoles', v)}
        />
        <div class="readout">
          <span>Cutout diameter</span>
          <LengthReadout mm={size().cutout} />
        </div>
        <Show when={params.speakers.mountingHoles}>
          <div class="readout">
            <span>Mounting hole circle</span>
            <LengthReadout mm={size().boltCircle} />
          </div>
        </Show>
        <p class="hint">
          Typical sizes for this speaker; check them against the speakers you're fitting. Mounting
          holes are four screw holes on the diagonals.
        </p>
      </section>

      <Show when={props.panel}>
        {(panel) => (
          <section class="params__section">
            <h2>Panel</h2>
            <div class="readout">
              <span>Panel length</span>
              <LengthReadout mm={panel().length} />
            </div>
            <p class="hint">
              The board along the top of the monitor cut, from the marquee face back to the
              screen opening. It's set in like the top and back panels.
            </p>
          </section>
        )}
      </Show>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetSpeakers}>
          Reset speakers
        </button>
      </footer>
    </>
  );
}
