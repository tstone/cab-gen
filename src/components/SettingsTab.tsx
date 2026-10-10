import LengthField from './LengthField';
import Segmented from './Segmented';
import {
  type AspectRatio,
  type MonitorOrientation,
  aspectRatios,
  params,
  resetSettings,
  setParams,
} from '../state/params';
import { inches } from '../state/units';

export default function SettingsTab() {
  return (
    <>
      <section class="params__section">
        <h2>Material</h2>
        <LengthField
          label="Thickness"
          value={params.materialThickness}
          min={3}
          max={40}
          fine
          onChange={(v) => setParams('materialThickness', v)}
        />
      </section>

      <section class="params__section">
        <h2>Monitor</h2>
        <Segmented<AspectRatio>
          label="Aspect ratio"
          options={aspectRatios.map((r) => ({ value: r, label: r }))}
          value={params.monitor.aspectRatio}
          onChange={(v) => setParams('monitor', 'aspectRatio', v)}
        />
        <LengthField
          label="Diagonal size"
          value={params.monitor.diagonal}
          min={inches(5)}
          max={inches(55)}
          onChange={(v) => setParams('monitor', 'diagonal', v)}
        />
        <Segmented<MonitorOrientation>
          label="Orientation"
          options={[
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
          ]}
          value={params.monitor.orientation}
          onChange={(v) => setParams('monitor', 'orientation', v)}
        />
        <LengthField
          label="Bezel width"
          value={params.monitor.bezel}
          min={0}
          max={inches(4)}
          fine
          onChange={(v) => setParams('monitor', 'bezel', v)}
        />
        <LengthField
          label="Body depth"
          value={params.monitor.depth}
          min={inches(0.25)}
          max={inches(24)}
          onChange={(v) => setParams('monitor', 'depth', v)}
        />
      </section>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetSettings}>
          Reset settings
        </button>
      </footer>
    </>
  );
}
