import { createMemo } from 'solid-js';
import { Splitter } from '@ark-ui/solid/splitter';
import ParametersPanel from './components/ParametersPanel';
import Viewport from './components/Viewport';
import { controlPanelLayout } from './geometry/controlPanel';
import { dimensionGuide } from './geometry/dimensions';
import { placeMonitor } from './geometry/monitor';
import { panelHoles } from './geometry/playArea';
import { bodySections } from './geometry/sections';
import { sideProfile } from './geometry/sideProfile';
import { speakerPanel } from './geometry/speakers';
import { params } from './state/params';
import { hoveredDimension } from './state/view';

export default function App() {
  // Derived once here so the panel and the preview share them.
  const profile = createMemo(() => sideProfile(params.profile));
  const sections = createMemo(() => bodySections(profile(), params.bodyType));
  const monitor = createMemo(() =>
    placeMonitor(
      profile(),
      params.monitor,
      params.profile.monitor,
      params.width - 2 * params.materialThickness,
    ),
  );
  const monitorWarnings = () => monitor().warnings;
  const controlPanel = createMemo(() =>
    controlPanelLayout(
      profile(),
      params.controlPanel,
      params.width,
      params.materialThickness,
      monitor().body,
      params.panels.frontInset,
    ),
  );
  const speakers = createMemo(() =>
    speakerPanel(
      profile(),
      params.speakers,
      params.panels.topBackInset,
      params.width - 2 * params.materialThickness,
    ),
  );
  const holes = createMemo(() =>
    panelHoles(params.layout, controlPanel().width, controlPanel().depth),
  );
  const guide = createMemo(() => {
    const key = hoveredDimension();
    if (!key) return null;
    return dimensionGuide(key, {
      params,
      profile: profile(),
      sections: sections(),
      monitor: monitor(),
      controlPanel: controlPanel(),
    });
  });

  return (
    <Splitter.Root
      class="app"
      orientation="horizontal"
      defaultSize={[32, 68]}
      panels={[
        { id: 'params', minSize: '240px', maxSize: '50%', resizeBehavior: 'preserve-pixel-size' },
        { id: 'viewport', minSize: '30%' },
      ]}
    >
      <Splitter.Panel id="params" class="panel panel--params">
        <ParametersPanel
          profile={profile()}
          sections={sections()}
          monitorWarnings={monitorWarnings()}
          speakers={speakers()}
          controlPanel={controlPanel()}
          layoutWarnings={holes().warnings}
        />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="params:viewport" class="resize-trigger" aria-label="Resize panels" />
      <Splitter.Panel id="viewport" class="panel panel--viewport">
        <Viewport height={sections().height} monitorWarnings={monitorWarnings()} guide={guide()} />
      </Splitter.Panel>
    </Splitter.Root>
  );
}
