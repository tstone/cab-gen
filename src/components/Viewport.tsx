import { Show, createEffect, on, onCleanup, onMount } from 'solid-js';
import { createScene } from '../scene/createScene';
import { overallHeight, params } from '../state/params';
import UnitToggle from './UnitToggle';
import Warnings from './Warnings';

interface ViewportProps {
  /** Monitor fit problems, shown over the preview so they're visible from any tab. */
  monitorWarnings: string[];
}

export default function Viewport(props: ViewportProps) {
  let container!: HTMLDivElement;

  onMount(() => {
    const scene = createScene(container);

    // buildCabinet reads the store synchronously, so this effect tracks exactly
    // the fields the current body type uses.
    createEffect(() => scene.setCabinet(params));

    // Reframe only when the body type changes, not on every dimension tweak.
    createEffect(
      on(
        () => params.bodyType,
        () => scene.frameHeight(overallHeight(params) * 0.001),
      ),
    );

    onCleanup(() => scene.dispose());
  });

  return (
    <div class="viewport">
      <div ref={container} class="viewport__canvas" />
      <div class="viewport__overlay viewport__overlay--top-left">
        <UnitToggle />
      </div>
      <Show when={props.monitorWarnings.length > 0}>
        <div class="viewport__overlay viewport__overlay--bottom-center" role="status">
          <Warnings warnings={props.monitorWarnings} />
        </div>
      </Show>
    </div>
  );
}
