import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import ChoiceCards from './ChoiceCards';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { ControlPanelLayout } from '../geometry/controlPanel';
import {
  type ProfileParams,
  controlPanelTypes,
  params,
  resetControlPanel,
  setParams,
} from '../state/params';
import { inches } from '../state/units';

interface ControlPanelTabProps {
  layout: ControlPanelLayout;
}

export default function ControlPanelTab(props: ControlPanelTabProps) {
  // The mount is part of the side profile, so its values live there.
  const mount = () => params.profile.controlPanel;
  const updateMount = (fn: (draft: ProfileParams['controlPanel']) => void) =>
    setParams('profile', 'controlPanel', produce(fn));

  return (
    <>
      <section class="params__section">
        <h2>Type</h2>
        <ChoiceCards
          options={controlPanelTypes}
          value={params.controlPanel.type}
          onChange={(v) => setParams('controlPanel', 'type', v)}
        />
      </section>

      <Show when={props.layout.warnings.length > 0}>
        <section class="params__section">
          <Warnings warnings={props.layout.warnings} />
        </section>
      </Show>

      <Show when={params.controlPanel.type === 'integrated'}>
        <section class="params__section">
          <h2>Control Panel Mount</h2>
          <LengthField
            label="Depth"
            value={mount().depth}
            min={inches(1)}
            max={inches(30)}
            onChange={(v) => updateMount((d) => void (d.depth = v))}
          />
          <AngleField
            label="Angle"
            value={mount().angle}
            min={-30}
            max={45}
            onChange={(v) => updateMount((d) => void (d.angle = v))}
          />
          <LengthField
            label="Overhang"
            value={mount().overhang}
            min={0}
            max={inches(20)}
            onChange={(v) => updateMount((d) => void (d.overhang = v))}
          />
          <Show when={mount().overhang > 0}>
            <LengthField
              label="Front thickness"
              value={mount().thickness}
              min={inches(0.5)}
              max={inches(20)}
              onChange={(v) => updateMount((d) => void (d.thickness = v))}
            />
            <AngleField
              label="Underside angle"
              value={mount().undersideAngle}
              min={0}
              max={75}
              onChange={(v) => updateMount((d) => void (d.undersideAngle = v))}
            />
          </Show>
        </section>
      </Show>

      <section class="params__section">
        <h2>Panel</h2>
        <LengthField
          label="Back edge offset"
          value={params.controlPanel.backOffset}
          min={inches(-20)}
          max={inches(20)}
          onChange={(v) => setParams('controlPanel', 'backOffset', v)}
        />
        <p class="hint">
          The front edge follows the cabinet. Positive offsets extend the back edge past the
          control panel mount; negative offsets stop it short.
        </p>
        <div class="readout">
          <span>Panel depth</span>
          <LengthReadout mm={props.layout.depth} />
        </div>
        <div class="readout">
          <span>Panel width</span>
          <LengthReadout mm={props.layout.width} />
        </div>
      </section>

      <section class="params__section">
        <h2>Acrylic</h2>
        <ToggleField
          label="Acrylic cover"
          checked={params.controlPanel.acrylic.enabled}
          onChange={(v) => setParams('controlPanel', 'acrylic', 'enabled', v)}
        />
        <Show when={params.controlPanel.acrylic.enabled}>
          <LengthField
            label="Thickness"
            value={params.controlPanel.acrylic.thickness}
            min={1}
            max={12}
            fine
            onChange={(v) => setParams('controlPanel', 'acrylic', 'thickness', v)}
          />
          <p class="hint">
            The acrylic sits flush with the side panels' edge, with the panel just beneath it.
          </p>
        </Show>
      </section>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetControlPanel}>
          Reset control panel
        </button>
      </footer>
    </>
  );
}
