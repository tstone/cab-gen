import { createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { DimensionKey } from '../geometry/dimensions';

/** Parts of the preview that can be shown or hidden. */
export type ViewPart = 'sides' | 'front' | 'topBack' | 'speakers' | 'controlPanel' | 'monitor';

export const viewParts: { value: ViewPart; label: string }[] = [
  { value: 'sides', label: 'Sides' },
  { value: 'front', label: 'Front' },
  { value: 'topBack', label: 'Top & back' },
  { value: 'speakers', label: 'Speaker panel' },
  { value: 'controlPanel', label: 'Control panel' },
  { value: 'monitor', label: 'Monitor' },
];

/** Preview-only visibility; not part of the cabinet, so not saved with it. */
const [visibility, setVisibility] = createStore<Record<ViewPart, boolean>>({
  sides: true,
  front: true,
  topBack: true,
  speakers: true,
  controlPanel: true,
  monitor: true,
});

/** The dimension whose field the pointer is over, pointed out on the preview. */
const [hoveredDimension, setHoveredDimension] = createSignal<DimensionKey | null>(null);

/**
 * Pointer handlers that point out `key` on the preview while the pointer is
 * over an element. Call from a component, so the guide clears if it unmounts.
 */
export function hoverDimension(key: () => DimensionKey | undefined) {
  const leave = () => {
    if (hoveredDimension() === key()) setHoveredDimension(null);
  };
  onCleanup(leave);
  return {
    onPointerEnter: () => {
      const k = key();
      if (k) setHoveredDimension(k);
    },
    onPointerLeave: leave,
  };
}

export { visibility, setVisibility, hoveredDimension };
