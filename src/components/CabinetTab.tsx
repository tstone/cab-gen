import { Match, Show, Switch } from 'solid-js';
import BodyTypeField from './BodyTypeField';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import ProfileFields from './ProfileFields';
import type { SideProfile } from '../geometry/sideProfile';
import { overallHeight, params, resetCabinet, setParams } from '../state/params';

interface CabinetTabProps {
  profile: SideProfile;
  monitorWarnings: string[];
}

export default function CabinetTab(props: CabinetTabProps) {
  const overallDepth = () =>
    params.bodyType === 'bartop-base'
      ? Math.max(props.profile.overallDepth, params.base.depth)
      : props.profile.overallDepth;

  return (
    <>
      <section class="params__section">
        <h2>Body Type</h2>
        <BodyTypeField value={params.bodyType} onChange={(v) => setParams('bodyType', v)} />
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

        <Switch>
          <Match when={params.bodyType === 'full'}>
            <LengthField
              label="Height"
              value={params.full.height}
              min={1000}
              max={2500}
              onChange={(v) => setParams('full', 'height', v)}
            />
            <LengthField
              label="Depth at floor"
              value={params.full.depth}
              min={300}
              max={1500}
              onChange={(v) => setParams('full', 'depth', v)}
            />
          </Match>
          <Match when={params.bodyType === 'bartop' || params.bodyType === 'bartop-base'}>
            <LengthField
              label="Bartop height"
              value={params.bartop.height}
              min={300}
              max={1200}
              onChange={(v) => setParams('bartop', 'height', v)}
            />
            <LengthField
              label="Bartop depth"
              value={params.bartop.depth}
              min={300}
              max={1000}
              onChange={(v) => setParams('bartop', 'depth', v)}
            />
          </Match>
        </Switch>

        <Show when={params.bodyType === 'bartop-base'}>
          <LengthField
            label="Base height"
            value={params.base.height}
            min={300}
            max={1500}
            onChange={(v) => setParams('base', 'height', v)}
          />
          <LengthField
            label="Base depth"
            value={params.base.depth}
            min={200}
            max={1500}
            onChange={(v) => setParams('base', 'depth', v)}
          />
        </Show>

        <div class="readout">
          <span>Overall height</span>
          <LengthReadout mm={overallHeight(params)} />
        </div>
        <div class="readout">
          <span>Overall depth</span>
          <LengthReadout mm={overallDepth()} />
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
