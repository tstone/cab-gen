import { Show } from 'solid-js';
import ChoiceCards from './ChoiceCards';
import LengthField from './LengthField';
import { Readout } from './LengthReadout';
import ProfileFields from './ProfileFields';
import type { BodySections } from '../geometry/sections';
import type { SideProfile } from '../geometry/sideProfile';
import { bodyTypes, coinDoorTypes, params, resetCabinet, setParams } from '../state/params';
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
          dimension="width"
          value={params.width}
          min={300}
          max={1500}
          onChange={(v) => setParams('width', v)}
        />
        <LengthField
          label="Depth at floor"
          dimension="depth"
          value={params.profile.depth}
          min={300}
          max={1500}
          onChange={(v) => setParams('profile', 'depth', v)}
        />
        <Readout label="Overall depth" mm={props.sections.depth} dimension="overallDepth" />
      </section>

      <section class="params__section">
        <h2>Heights</h2>
        <LengthField
          label="Control panel from floor"
          dimension="controlPanelHeight"
          value={params.profile.controlPanel.height}
          min={inches(1)}
          max={inches(50)}
          onChange={(v) => setParams('profile', 'controlPanel', 'height', v)}
        />
        <LengthField
          label="Monitor opening"
          dimension="monitorOpening"
          value={params.profile.monitorOpening}
          min={inches(2)}
          max={inches(48)}
          onChange={(v) => setParams('profile', 'monitorOpening', v)}
        />
        <LengthField
          label="Marquee"
          dimension="marqueeHeight"
          value={params.profile.marquee.height}
          min={0}
          max={inches(20)}
          onChange={(v) => setParams('profile', 'marquee', 'height', v)}
        />
        <p class="hint">
          Stacked from the floor up: the control panel's front edge, the vertical height of the
          monitor opening above it, then the marquee face. The overall height follows from these.
        </p>

        <Show when={params.bodyType === 'bartop-base'}>
          <Readout label="Bartop height" mm={props.sections.bartopHeight ?? 0} dimension="bartopHeight" />
          <Readout label="Base height" mm={props.sections.baseHeight ?? 0} dimension="baseHeight" />
        </Show>

        <Readout label="Overall height" mm={props.sections.height} dimension="overallHeight" />
      </section>

      <ProfileFields profile={props.profile} monitorWarnings={props.monitorWarnings} />

      <section class="params__section">
        <h2>Panels</h2>
        <LengthField
          label="Front inset"
          value={params.panels.frontInset}
          min={0}
          max={inches(4)}
          fine
          onChange={(v) => setParams('panels', 'frontInset', v)}
        />
        <LengthField
          label="Top & back inset"
          value={params.panels.topBackInset}
          min={0}
          max={inches(4)}
          fine
          onChange={(v) => setParams('panels', 'topBackInset', v)}
        />
        <p class="hint">
          How far the front, top and back panels sit in from the side panels' edges. The front
          panel is butt jointed and runs up to the control panel's chin or bottom; the top and back
          panels are mitered where they meet. The speaker panel under the marquee is set in like the
          top and back.
        </p>
      </section>

      <section class="params__section">
        <h2>Coin Door</h2>
        <ChoiceCards
          options={coinDoorTypes}
          value={params.coinDoor.type}
          onChange={(v) => setParams('coinDoor', 'type', v)}
        />
        <Show when={params.coinDoor.type !== 'none'}>
          <LengthField
            label="Bottom from floor"
            dimension="coinDoorBottom"
            value={params.coinDoor.bottom}
            min={0}
            max={inches(40)}
            onChange={(v) => setParams('coinDoor', 'bottom', v)}
          />
          <p class="hint">
            Cut out of the front panel, centered across it. It's left out if it doesn't fit within
            the front panel.
          </p>
        </Show>
      </section>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetCabinet}>
          Reset cabinet
        </button>
      </footer>
    </>
  );
}
