import { Show } from 'solid-js';
import { produce } from 'solid-js/store';
import AngleField from './AngleField';
import LengthField from './LengthField';
import { Readout } from './LengthReadout';
import ToggleField from './ToggleField';
import Warnings from './Warnings';
import type { SideProfile } from '../geometry/sideProfile';
import { type ProfileParams, params, resetMarquee, setParams } from '../state/params';
import { inches } from '../state/units';

interface MarqueeTabProps {
  /** The computed profile, for warnings and readouts. */
  profile: SideProfile;
}

/** The marquee and the top behind it, in the side profile. Its height is set with the others on the Cabinet tab. */
export default function MarqueeTab(props: MarqueeTabProps) {
  const p = () => params.profile;
  const update = (fn: (draft: ProfileParams) => void) => setParams('profile', produce(fn));

  return (
    <>
      <Show when={props.profile.warnings.length > 0}>
        <section class="params__section">
          <Warnings warnings={props.profile.warnings} />
        </section>
      </Show>

      <section class="params__section">
        <h2>Marquee</h2>
        <LengthField
          label="Depth"
          dimension="marqueeDepth"
          value={p().marquee.depth}
          min={0}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.marquee.depth = v))}
        />
        <LengthField
          label="Setback from front"
          dimension="marqueeSetback"
          value={p().marquee.setback}
          min={inches(-12)}
          max={inches(30)}
          onChange={(v) => update((d) => void (d.marquee.setback = v))}
        />
        <AngleField
          label="Top angle"
          dimension="marqueeTopAngle"
          value={p().marquee.topAngle}
          min={-45}
          max={45}
          onChange={(v) => update((d) => void (d.marquee.topAngle = v))}
        />
        <AngleField
          label="Face angle"
          dimension="marqueeFaceAngle"
          value={p().marquee.faceAngle}
          min={-45}
          max={60}
          onChange={(v) => update((d) => void (d.marquee.faceAngle = v))}
        />
        <LengthField
          label="Corner radius"
          dimension="marqueeCornerRadius"
          value={p().marquee.cornerRadius}
          min={0}
          max={inches(12)}
          onChange={(v) => update((d) => void (d.marquee.cornerRadius = v))}
        />
        <p class="hint">The marquee's height is set with the other heights on the Cabinet tab.</p>
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
            dimension="riseHeight"
            value={p().rise.height}
            min={inches(0.25)}
            max={inches(24)}
            onChange={(v) => update((d) => void (d.rise.height = v))}
          />
          <AngleField
            label="Rise angle"
            dimension="riseAngle"
            value={p().rise.angle}
            min={0}
            max={80}
            onChange={(v) => update((d) => void (d.rise.angle = v))}
          />
        </Show>
        <AngleField
          label="Back slope"
          dimension="backSlope"
          value={p().backSlope}
          min={-30}
          max={80}
          onChange={(v) => update((d) => void (d.backSlope = v))}
        />
        <Readout label="Back height" mm={props.profile.backHeight} dimension="backHeight" />
      </section>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetMarquee}>
          Reset marquee
        </button>
      </footer>
    </>
  );
}
