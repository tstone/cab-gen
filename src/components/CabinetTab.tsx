import { Show } from 'solid-js';
import ChoiceCards from './ChoiceCards';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import ProfileFields from './ProfileFields';
import type { BodySections } from '../geometry/sections';
import type { SideProfile } from '../geometry/sideProfile';
import { bodyTypes, params, resetCabinet, setParams } from '../state/params';
import { inches } from '../state/units';

interface CabinetTabProps {
  profile: SideProfile;
  sections: BodySections;
  monitorWarnings: string[];
}

export default function CabinetTab(props: CabinetTabProps) {
  return (
    <>
      <section class="params__section">
        <h2>Body Type</h2>
        <ChoiceCards
          options={bodyTypes}
          value={params.bodyType}
          onChange={(v) => setParams('bodyType', v)}
        />
      </section>

      <section class="params__section">
        <h2>Dimensions</h2>
        <LengthField
          label="Width"
          value={params.width}
          min={300}
          max={1500}
          onChange={(v) => setParams('width', v)}
        />
        <LengthField
          label="Depth at floor"
          value={params.profile.depth}
          min={300}
          max={1500}
          onChange={(v) => setParams('profile', 'depth', v)}
        />
        <div class="readout">
          <span>Overall depth</span>
          <LengthReadout mm={props.sections.depth} />
        </div>
      </section>

      <section class="params__section">
        <h2>Heights</h2>
        <LengthField
          label="Control panel from floor"
          value={params.profile.controlPanel.height}
          min={inches(1)}
          max={inches(50)}
          onChange={(v) => setParams('profile', 'controlPanel', 'height', v)}
        />
        <LengthField
          label="Monitor opening"
          value={params.profile.monitorOpening}
          min={inches(2)}
          max={inches(48)}
          onChange={(v) => setParams('profile', 'monitorOpening', v)}
        />
        <LengthField
          label="Marquee"
          value={params.profile.marquee.height}
          min={0}
          max={inches(20)}
          onChange={(v) => setParams('profile', 'marquee', 'height', v)}
        />
        <p class="hint">
          Stacked from the floor up: the control panel's front edge, the vertical height of the
          monitor opening above it, then the marquee face. The overall height follows from these.
        </p>

        <Show when={params.bodyType !== 'full'}>
          <LengthField
            label="Bartop cut below panel"
            value={params.profile.bartopCut}
            min={0}
            max={inches(30)}
            onChange={(v) => setParams('profile', 'bartopCut', v)}
          />
          <div class="readout">
            <span>Bartop height</span>
            <LengthReadout mm={props.sections.bartopHeight ?? 0} />
          </div>
        </Show>
        <Show when={params.bodyType === 'bartop-base'}>
          <div class="readout">
            <span>Base height</span>
            <LengthReadout mm={props.sections.baseHeight ?? 0} />
          </div>
        </Show>

        <div class="readout">
          <span>Overall height</span>
          <LengthReadout mm={props.sections.height} />
        </div>
      </section>

      <ProfileFields profile={props.profile} monitorWarnings={props.monitorWarnings} />

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetCabinet}>
          Reset cabinet
        </button>
      </footer>
    </>
  );
}
