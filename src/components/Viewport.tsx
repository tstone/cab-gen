import { Show, createEffect, on, onCleanup, onMount } from 'solid-js';
import type { DimensionGuide } from '../geometry/dimensions';
import { createScene } from '../scene/createScene';
import { params } from '../state/params';
import { visibility } from '../state/view';
import ExportButton from './ExportButton';
import UnitToggle from './UnitToggle';
import VisibilityToggles from './VisibilityToggles';
import Warnings from './Warnings';

interface ViewportProps {
  /** Overall cabinet height in millimeters, for framing the camera. */
  height: number;
  /** Monitor fit problems, shown over the preview so they're visible from any tab. */
  monitorWarnings: string[];
  /** The dimension to point out, while its field is hovered. */
  guide: DimensionGuide | null;
}

export default function Viewport(props: ViewportProps) {
  let container!: HTMLDivElement;

  onMount(() => {
    const scene = createScene(container);

    // buildCabinet reads the store synchronously, so this effect tracks exactly
    // the fields the current body type uses.
    createEffect(() => scene.setCabinet(params));
    createEffect(() => scene.setVisibility({ ...visibility }));
    createEffect(() => scene.setGuide(props.guide));

    // Reframe only when the body type changes, not on every dimension tweak.
    createEffect(
      on(
        () => params.bodyType,
        () => scene.frameHeight(props.height * 0.001),
      ),
    );

    onCleanup(() => scene.dispose());
  });

  return (
    <div class="viewport">
      <div ref={container} class="viewport__canvas" />
      <div class="viewport__overlay viewport__overlay--top-center" role="note">
        <div class="wip-banner">
          <strong>Warning:</strong> Untested. Work in progress
        </div>
      </div>
      <div class="viewport__overlay viewport__overlay--top-left">
        <UnitToggle />
      </div>
      <div class="viewport__overlay viewport__overlay--top-right">
        <ExportButton />
        <VisibilityToggles />
      </div>
      <Show when={props.monitorWarnings.length > 0}>
        <div class="viewport__overlay viewport__overlay--bottom-center" role="status">
          <Warnings warnings={props.monitorWarnings} />
        </div>
      </Show>
    </div>
  );
}
