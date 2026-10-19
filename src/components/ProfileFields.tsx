import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import LengthField from './LengthField';
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
  // With no bottom line, the screen face rises straight from the control panel's back edge.
  const hasBottomLine = () => {
    const { screen, controlPanel } = props.profile;
    return Math.hypot(screen.bottom.x - controlPanel.back.x, screen.bottom.y - controlPanel.back.y) > 1e-6;
  };

  return (
    <>
      <Show when={props.profile.warnings.length + props.monitorWarnings.length > 0}>
        <section class="params__section">
          <Warnings warnings={[...props.profile.warnings, ...props.monitorWarnings]} />
        </section>
      </Show>

      <section class="params__section">
        <h2>Monitor Cut</h2>
        <LengthField
          label="Depth"
          dimension="cutDepth"
          value={p().monitorCut.depth}
          min={inches(0.5)}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.monitorCut.depth = v))}
        />
        <AngleField
          label="Top line angle"
          dimension="cutTopAngle"
          value={p().monitorCut.topAngle}
          min={-45}
          max={80}
          onChange={(v) => update((d) => void (d.monitorCut.topAngle = v))}
        />
        <AngleField
          label="Screen angle"
          dimension="cutFaceAngle"
          value={p().monitorCut.faceAngle}
          min={-30}
          max={60}
          onChange={(v) => update((d) => void (d.monitorCut.faceAngle = v))}
        />
        <AngleField
          label="Bottom line angle"
          dimension="cutBottomAngle"
          value={p().monitorCut.bottomAngle}
          min={-45}
          max={80}
          onChange={(v) => update((d) => void (d.monitorCut.bottomAngle = v))}
        />
        <LengthField
          label="Top corner radius"
          dimension="cutTopRadius"
          value={p().monitorCut.topRadius}
          min={0}
          max={inches(8)}
          onChange={(v) => update((d) => void (d.monitorCut.topRadius = v))}
        />
        <LengthField
          label="Bottom corner radius"
          dimension="cutBottomRadius"
          value={p().monitorCut.bottomRadius}
          min={0}
          max={inches(8)}
          onChange={(v) => update((d) => void (d.monitorCut.bottomRadius = v))}
        />
        <Show when={!hasBottomLine()}>
          <p class="hint">
            The screen starts right at the back of the control panel, so there's no bottom line and
            its angle and corner radius have no effect. Increase the cut depth or shorten the control
            panel to bring it back.
          </p>
        </Show>
      </section>

      <section class="params__section">
        <h2>Monitor Placement</h2>
        <LengthField
          label="Vertical offset"
          dimension="monitorOffset"
          value={p().monitor.offset}
          min={inches(-20)}
          max={inches(20)}
          onChange={(v) => update((d) => void (d.monitor.offset = v))}
        />
        <LengthField
          label="Recess depth"
          dimension="monitorRecess"
          value={p().monitor.recess}
          min={0}
          max={inches(12)}
          fine
          onChange={(v) => update((d) => void (d.monitor.recess = v))}
        />
        <ToggleField
          label="Separate monitor mount angle"
          checked={p().monitor.separateAngle}
          onChange={(v) =>
            update((d) => {
              // Start from the screen angle so turning this on doesn't move the monitor.
              if (v) d.monitor.angle = d.monitorCut.faceAngle;
              d.monitor.separateAngle = v;
            })
          }
        />
        <Show when={p().monitor.separateAngle}>
          <AngleField
            label="Monitor angle"
            dimension="monitorAngle"
            value={p().monitor.angle}
            min={-30}
            max={60}
            onChange={(v) => update((d) => void (d.monitor.angle = v))}
          />
        </Show>
        <p class="hint">
          Offset slides the monitor along the screen opening from its center. Recess is how far
          behind the opening the monitor face sits. The monitor matches the screen angle unless it
          has its own mount angle.
        </p>
      </section>
    </>
  );
}
