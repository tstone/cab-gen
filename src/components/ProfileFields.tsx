import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { SideProfile } from '../geometry/sideProfile';
import { type ProfileParams, params, setParams } from '../state/params';
import { inches } from '../state/units';

interface ProfileFieldsProps {
  /** The computed profile for the current body type, for warnings and readouts. */
  profile: SideProfile;
  /** Problems fitting the monitor from Settings into this profile. */
  monitorWarnings: string[];
}

/** Side-profile parameters, shared by every body type. */
export default function ProfileFields(props: ProfileFieldsProps) {
  const p = () => params.profile;
  const update = (fn: (draft: ProfileParams) => void) => setParams('profile', produce(fn));

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
    </>
  );
}
