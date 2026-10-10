import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { SideProfile } from '../geometry/sideProfile';
import { type ProfileParams, params, profileKey, setParams } from '../state/params';
import { inches } from '../state/units';

interface ProfileFieldsProps {
  /** The computed profile for the current body type, for warnings and readouts. */
  profile: SideProfile;
  /** Problems fitting the monitor from Settings into this profile. */
  monitorWarnings: string[];
}

/** Side-profile parameters for whichever profile the current body type uses. */
export default function ProfileFields(props: ProfileFieldsProps) {
  const p = () => params[profileKey(params.bodyType)];
  const update = (fn: (draft: ProfileParams) => void) =>
    setParams(profileKey(params.bodyType), produce(fn));

  return (
    <>
      <Show when={props.profile.warnings.length + props.monitorWarnings.length > 0}>
        <section class="params__section">
          <Warnings warnings={[...props.profile.warnings, ...props.monitorWarnings]} />
        </section>
      </Show>

      <section class="params__section">
        <h2>Marquee</h2>
        <LengthField
          label="Height"
          value={p().marquee.height}
          min={0}
          max={inches(20)}
          onChange={(v) => update((d) => void (d.marquee.height = v))}
        />
        <LengthField
          label="Depth"
          value={p().marquee.depth}
          min={0}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.marquee.depth = v))}
        />
        <LengthField
          label="Setback from front"
          value={p().marquee.setback}
          min={inches(-12)}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.marquee.setback = v))}
        />
        <AngleField
          label="Top angle"
          value={p().marquee.topAngle}
          min={-45}
          max={45}
          onChange={(v) => update((d) => void (d.marquee.topAngle = v))}
        />
        <AngleField
          label="Face angle"
          value={p().marquee.faceAngle}
          min={-45}
          max={60}
          onChange={(v) => update((d) => void (d.marquee.faceAngle = v))}
        />
        <LengthField
          label="Corner radius"
          value={p().marquee.cornerRadius}
          min={0}
          max={inches(12)}
          onChange={(v) => update((d) => void (d.marquee.cornerRadius = v))}
        />
      </section>

      <section class="params__section">
        <h2>Top</h2>
        <ToggleField
          label="Rise behind marquee"
          checked={p().rise.enabled}
          onChange={(v) => update((d) => void (d.rise.enabled = v))}
        />
        <Show when={p().rise.enabled}>
          <LengthField
            label="Rise height"
            value={p().rise.height}
            min={inches(0.25)}
            max={inches(24)}
            onChange={(v) => update((d) => void (d.rise.height = v))}
          />
          <AngleField
            label="Rise angle"
            value={p().rise.angle}
            min={0}
            max={80}
            onChange={(v) => update((d) => void (d.rise.angle = v))}
          />
        </Show>
        <AngleField
          label="Back slope"
          value={p().backSlope}
          min={-30}
          max={80}
          onChange={(v) => update((d) => void (d.backSlope = v))}
        />
        <div class="readout">
          <span>Back height</span>
          <LengthReadout mm={props.profile.backHeight} />
        </div>
      </section>

      <section class="params__section">
        <h2>Monitor Cut</h2>
        <ToggleField
          label="Monitor cut"
          checked={p().monitorCut.enabled}
          onChange={(v) => update((d) => void (d.monitorCut.enabled = v))}
        />
        <Show when={p().monitorCut.enabled}>
          <LengthField
            label="Depth"
            value={p().monitorCut.depth}
            min={inches(0.5)}
            max={inches(30)}
            onChange={(v) => update((d) => void (d.monitorCut.depth = v))}
          />
          <AngleField
            label="Top line angle"
            value={p().monitorCut.topAngle}
            min={-45}
            max={80}
            onChange={(v) => update((d) => void (d.monitorCut.topAngle = v))}
          />
          <AngleField
            label="Screen angle"
            value={p().monitorCut.faceAngle}
            min={-30}
            max={60}
            onChange={(v) => update((d) => void (d.monitorCut.faceAngle = v))}
          />
          <AngleField
            label="Bottom line angle"
            value={p().monitorCut.bottomAngle}
            min={-45}
            max={80}
            onChange={(v) => update((d) => void (d.monitorCut.bottomAngle = v))}
          />
          <LengthField
            label="Top corner radius"
            value={p().monitorCut.topRadius}
            min={0}
            max={inches(8)}
            onChange={(v) => update((d) => void (d.monitorCut.topRadius = v))}
          />
          <LengthField
            label="Bottom corner radius"
            value={p().monitorCut.bottomRadius}
            min={0}
            max={inches(8)}
            onChange={(v) => update((d) => void (d.monitorCut.bottomRadius = v))}
          />
        </Show>
      </section>

      <section class="params__section">
        <h2>Monitor Placement</h2>
        <LengthField
          label="Vertical offset"
          value={p().monitor.offset}
          min={inches(-20)}
          max={inches(20)}
          onChange={(v) => update((d) => void (d.monitor.offset = v))}
        />
        <LengthField
          label="Recess depth"
          value={p().monitor.recess}
          min={0}
          max={inches(12)}
          fine
          onChange={(v) => update((d) => void (d.monitor.recess = v))}
        />
        <p class="hint">
          Offset slides the monitor along the screen opening from its center. Recess is how far
          behind the opening the monitor face sits.
        </p>
      </section>

      <section class="params__section">
        <h2>Control Panel Mount</h2>
        <LengthField
          label="Height"
          value={p().controlPanel.height}
          min={inches(1)}
          max={inches(50)}
          onChange={(v) => update((d) => void (d.controlPanel.height = v))}
        />
        <LengthField
          label="Depth"
          value={p().controlPanel.depth}
          min={inches(1)}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.controlPanel.depth = v))}
        />
        <AngleField
          label="Angle"
          value={p().controlPanel.angle}
          min={-30}
          max={45}
          onChange={(v) => update((d) => void (d.controlPanel.angle = v))}
        />
        <LengthField
          label="Overhang"
          value={p().controlPanel.overhang}
          min={0}
          max={inches(20)}
          onChange={(v) => update((d) => void (d.controlPanel.overhang = v))}
        />
        <Show when={p().controlPanel.overhang > 0}>
          <LengthField
            label="Front thickness"
            value={p().controlPanel.thickness}
            min={inches(0.5)}
            max={inches(20)}
            onChange={(v) => update((d) => void (d.controlPanel.thickness = v))}
          />
          <AngleField
            label="Underside angle"
            value={p().controlPanel.undersideAngle}
            min={0}
            max={75}
            onChange={(v) => update((d) => void (d.controlPanel.undersideAngle = v))}
          />
        </Show>
      </section>

      <section class="params__section">
        <h2>Bottom</h2>
        <ToggleField
          label="Toe kick"
          checked={p().toeKick.enabled}
          onChange={(v) => update((d) => void (d.toeKick.enabled = v))}
        />
        <Show when={p().toeKick.enabled}>
          <LengthField
            label="Toe kick height"
            value={p().toeKick.height}
            min={inches(0.25)}
            max={inches(24)}
            onChange={(v) => update((d) => void (d.toeKick.height = v))}
          />
          <LengthField
            label="Toe kick depth"
            value={p().toeKick.depth}
            min={inches(0.25)}
            max={inches(12)}
            onChange={(v) => update((d) => void (d.toeKick.depth = v))}
          />
        </Show>
        <ToggleField
          label="Back kick"
          checked={p().backKick.enabled}
          onChange={(v) => update((d) => void (d.backKick.enabled = v))}
        />
        <Show when={p().backKick.enabled}>
          <LengthField
            label="Back kick height"
            value={p().backKick.height}
            min={inches(0.25)}
            max={inches(24)}
            onChange={(v) => update((d) => void (d.backKick.height = v))}
          />
          <LengthField
            label="Back kick depth"
            value={p().backKick.depth}
            min={inches(0.25)}
            max={inches(12)}
            onChange={(v) => update((d) => void (d.backKick.depth = v))}
          />
        </Show>
      </section>
    </>
  );
}
