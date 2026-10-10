import { For, Show } from 'solid-js';
import AngleField from './AngleField';
import ChoiceCards from './ChoiceCards';
import LengthField from './LengthField';
import LengthReadout from './LengthReadout';
import Segmented from './Segmented';
import SelectField from './SelectField';
import Warnings from './Warnings';
import type { ControlPanelLayout } from '../geometry/controlPanel';
import { playAreaPresets } from '../geometry/playArea';
import {
  type ButtonArrangement,
  type ButtonCount,
  type ButtonSize,
  type PlayAreaPreset,
  type PlayerCount,
  buttonArrangements,
  buttonCounts,
  buttonSizes,
  params,
  playAreaModes,
  playerCounts,
  resetLayout,
  setParams,
} from '../state/params';
import { inches } from '../state/units';

const presetOptions = Object.entries(playAreaPresets).map(([value, preset]) => ({
  value: value as PlayAreaPreset,
  label: preset.label,
}));

interface LayoutTabProps {
  panel: ControlPanelLayout;
  warnings: string[];
}

export default function LayoutTab(props: LayoutTabProps) {
  const main = () => params.layout.main;
  const generic = () => main().generic;
  const hasHoles = () => main().mode !== 'empty';

  return (
    <>
      <section class="params__section">
        <h2>Players</h2>
        <Segmented
          label="Player count"
          options={playerCounts.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(params.layout.playerCount)}
          onChange={(v) => setParams('layout', 'playerCount', Number(v) as PlayerCount)}
        />
        <Show when={hasHoles()}>
          <p class="hint">
            Players get equal slots across the panel. Left / right shifts a play area from the center of
            its slot; from front edge is measured along the panel to the play area's center.
          </p>
        </Show>
      </section>

      <section class="params__section">
        <h2>{params.layout.playerCount === 1 ? 'Player 1' : 'Player 1 + 2'}</h2>
        <ChoiceCards
          options={playAreaModes}
          value={main().mode}
          onChange={(v) => setParams('layout', 'main', 'mode', v)}
        />
        <Show when={main().mode === 'preset'}>
          <SelectField
            label="Preset"
            options={presetOptions}
            value={main().preset}
            onChange={(v) => setParams('layout', 'main', 'preset', v)}
          />
          <p class="hint">{playAreaPresets[main().preset].description}</p>
        </Show>
        <Show when={main().mode === 'generic'}>
          <Segmented
            label="Buttons"
            options={buttonCounts.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(generic().buttons)}
            onChange={(v) => setParams('layout', 'main', 'generic', 'buttons', Number(v) as ButtonCount)}
          />
          <Segmented<ButtonArrangement>
            label="Arrangement"
            options={buttonArrangements}
            value={generic().arrangement}
            onChange={(v) => setParams('layout', 'main', 'generic', 'arrangement', v)}
          />
          <LengthField
            label="Stick to first button"
            value={generic().stickToButton}
            min={inches(1)}
            max={inches(8)}
            onChange={(v) => setParams('layout', 'main', 'generic', 'stickToButton', v)}
          />
          <LengthField
            label="Button spacing"
            value={generic().spacing}
            min={inches(0.5)}
            max={inches(4)}
            fine
            onChange={(v) => setParams('layout', 'main', 'generic', 'spacing', v)}
          />
          <Show when={generic().arrangement === 'slanted'}>
            <AngleField
              label="Slant"
              value={generic().slant}
              min={-45}
              max={45}
              onChange={(v) => setParams('layout', 'main', 'generic', 'slant', v)}
            />
          </Show>
          <Show when={generic().arrangement === 'arced'}>
            <LengthField
              label="Arc radius"
              value={generic().arcRadius}
              min={inches(1)}
              max={inches(30)}
              onChange={(v) => setParams('layout', 'main', 'generic', 'arcRadius', v)}
            />
          </Show>
        </Show>
      </section>

      <Show when={!hasHoles()}>
        <section class="params__section">
          <h2>Panel</h2>
          <div class="readout">
            <span>Panel depth</span>
            <LengthReadout mm={props.panel.depth} />
          </div>
          <div class="readout">
            <span>Panel width</span>
            <LengthReadout mm={props.panel.width} />
          </div>
          <p class="hint">No holes are cut. Depth is measured along the panel's slope.</p>
        </section>
      </Show>

      <Show when={hasHoles()}>
        <section class="params__section">
          <h2>Hardware</h2>
          <LengthField
            label="Joystick hole"
            value={params.layout.hardware.stickHole}
            min={10}
            max={inches(2)}
            fine
            onChange={(v) => setParams('layout', 'hardware', 'stickHole', v)}
          />
          <Segmented
            label="Button size"
            options={buttonSizes.map((n) => ({ value: String(n), label: `${n}mm` }))}
            value={String(params.layout.hardware.buttonSize)}
            onChange={(v) => setParams('layout', 'hardware', 'buttonSize', Number(v) as ButtonSize)}
          />
        </section>

        <Show when={props.warnings.length > 0}>
          <section class="params__section">
            <Warnings warnings={props.warnings} />
          </section>
        </Show>

        <For each={params.layout.positions.slice(0, params.layout.playerCount)}>
          {(position, i) => (
            <section class="params__section">
              <h2>Player {i() + 1} Position</h2>
              <LengthField
                label="Left / right"
                value={position.x}
                min={-params.width}
                max={params.width}
                onChange={(v) => setParams('layout', 'positions', i(), 'x', v)}
              />
              <LengthField
                label="From front edge"
                value={position.y}
                min={0}
                max={inches(30)}
                onChange={(v) => setParams('layout', 'positions', i(), 'y', v)}
              />
            </section>
          )}
        </For>
        <section class="params__section">
          <h2>Start Buttons</h2>
          <Segmented
            label="Size"
            options={buttonSizes.map((n) => ({ value: String(n), label: `${n}mm` }))}
            value={String(params.layout.start.size)}
            onChange={(v) => setParams('layout', 'start', 'size', Number(v) as ButtonSize)}
          />
          <Show when={params.layout.playerCount > 1}>
            <LengthField
              label="Spacing"
              value={params.layout.start.spacing}
              min={inches(0.5)}
              max={inches(12)}
              fine
              onChange={(v) => setParams('layout', 'start', 'spacing', v)}
            />
          </Show>
          <LengthField
            label="From back edge"
            value={params.layout.start.fromBack}
            min={0}
            max={inches(12)}
            fine
            onChange={(v) => setParams('layout', 'start', 'fromBack', v)}
          />
          <p class="hint">
            One per player, in a row centered across the panel. From back edge is measured along the
            panel to the buttons' centers.
          </p>
        </section>
      </Show>

      <footer class="params__footer">
        <button type="button" class="button" onClick={resetLayout}>
          Reset layout
        </button>
      </footer>
    </>
  );
}
