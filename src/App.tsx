import { createMemo } from 'solid-js';
import { Splitter } from '@ark-ui/solid/splitter';
import ParametersPanel from './components/ParametersPanel';
import Viewport from './components/Viewport';
import { placeMonitor } from './geometry/monitor';
import { sideProfile } from './geometry/sideProfile';
import { params, profileKey } from './state/params';

export default function App() {
  // Derived once here so the panel and the preview share them.
  const profile = createMemo(() => sideProfile(params[profileKey(params.bodyType)]));
  const monitorWarnings = createMemo(
    () =>
      placeMonitor(
        profile(),
        params.monitor,
        params[profileKey(params.bodyType)].monitor,
        params.width - 2 * params.materialThickness,
      ).warnings,
  );

  return (
    <Splitter.Root
      class="app"
      orientation="horizontal"
      defaultSize={[24, 76]}
      panels={[
        { id: 'params', minSize: '240px', maxSize: '50%', resizeBehavior: 'preserve-pixel-size' },
        { id: 'viewport', minSize: '30%' },
      ]}
    >
      <Splitter.Panel id="params" class="panel panel--params">
        <ParametersPanel profile={profile()} monitorWarnings={monitorWarnings()} />
      </Splitter.Panel>
      <Splitter.ResizeTrigger id="params:viewport" class="resize-trigger" aria-label="Resize panels" />
      <Splitter.Panel id="viewport" class="panel panel--viewport">
        <Viewport monitorWarnings={monitorWarnings()} />
      </Splitter.Panel>
    </Splitter.Root>
  );
}
