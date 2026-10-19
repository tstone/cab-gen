import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import ChoiceCards from './ChoiceCards';
import LengthField from './LengthField';
import { Readout } from './LengthReadout';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { ControlPanelLayout } from '../geometry/controlPanel';
import {
  type ProfileParams,
  controlPanelBottoms,
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
            dimension="mountDepth"
            value={mount().depth}
            min={inches(1)}
            max={inches(30)}
            onChange={(v) => updateMount((d) => void (d.depth = v))}
          />
          <AngleField
            label="Angle"
            dimension="mountAngle"
            value={mount().angle}
            min={-30}
            max={45}
            onChange={(v) => updateMount((d) => void (d.angle = v))}
          />
          <LengthField
            label="Overhang"
            dimension="mountOverhang"
            value={mount().overhang}
            min={0}
            max={inches(20)}
            onChange={(v) => updateMount((d) => void (d.overhang = v))}
          />
          <Show when={mount().overhang > 0}>
            <LengthField
              label="Face height"
              dimension="mountFaceHeight"
              value={mount().thickness}
              min={inches(0.5)}
              max={inches(20)}
              onChange={(v) => updateMount((d) => void (d.thickness = v))}
            />
            <AngleField
              label="Underside angle"
              dimension="mountUndersideAngle"
              value={mount().undersideAngle}
              min={0}
              max={75}
              onChange={(v) => updateMount((d) => void (d.undersideAngle = v))}
            />
          </Show>
        </section>

        <Show when={mount().overhang > 0}>
          <section class="params__section">
            <h2>Bottom</h2>
            <ChoiceCards
              options={controlPanelBottoms}
              value={params.controlPanel.bottom}
              onChange={(v) => setParams('controlPanel', 'bottom', v)}
            />
          </section>
        </Show>
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
        <LengthField
          label="Inset"
          value={params.controlPanel.inset}
          min={0}
          max={inches(4)}
          fine
          onChange={(v) => setParams('controlPanel', 'inset', v)}
        />
        <Show when={mount().overhang > 0}>
          <LengthField
            label="Front face setback"
            value={params.controlPanel.faceSetback}
            min={0}
            max={inches(4)}
            fine
            onChange={(v) => setParams('controlPanel', 'faceSetback', v)}
          />
        </Show>
        <p class="hint">
          Inset is how far the top{mount().overhang > 0 ? ' and chin sit' : ' sits'} below the side
          panels' edges.
          {mount().overhang > 0 &&
            ' The front face sits back from the front edge of the top by the setback, so the top overhangs it.'}
        </p>
        <Readout label="Panel depth" mm={props.layout.depth} dimension="panelDepth" />
        <Readout label="Panel width" mm={props.layout.width} dimension="panelWidth" />
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
            The acrylic sits at the top of the panel, with the board just beneath it.
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
