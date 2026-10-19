import { createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Checkbox } from '@ark-ui/solid/checkbox';
import { Dialog } from '@ark-ui/solid/dialog';
import ChoiceCards, { type Choice } from './ChoiceCards';
import { exportStep } from '../export/step';
import { params } from '../state/params';

type ExportFormat = 'step';

interface ExportOptions {
  includeMonitor: boolean;
}

const FORMATS: Choice<ExportFormat>[] = [
  { value: 'step', label: 'STEP', description: 'Solid model for CAD software (.step)' },
];

const download = (format: ExportFormat, options: ExportOptions) => {
  switch (format) {
    case 'step': {
      const blob = new Blob([exportStep(params, options)], { type: 'model/step' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cabinet.step';
      link.click();
      URL.revokeObjectURL(url);
      break;
    }
  }
};

/** Opens a full-screen dialog for choosing an export format and downloading the cabinet. */
export default function ExportButton() {
  const [format, setFormat] = createSignal<ExportFormat>('step');
  const [includeMonitor, setIncludeMonitor] = createSignal(false);

  return (
    <Dialog.Root lazyMount unmountOnExit>
      <Dialog.Trigger class="export-button">Export</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop class="export-dialog__backdrop" />
        <Dialog.Positioner class="export-dialog__positioner">
          <Dialog.Content class="export-dialog">
            <header class="export-dialog__header">
              <Dialog.Title class="export-dialog__title">Export</Dialog.Title>
              <Dialog.CloseTrigger class="export-dialog__close" aria-label="Close">
                ✕
              </Dialog.CloseTrigger>
            </header>

            <section class="export-dialog__section">
              <h3 class="export-dialog__section-title">Format</h3>
              <ChoiceCards options={FORMATS} value={format()} onChange={setFormat} />
            </section>

            <section class="export-dialog__section">
              <h3 class="export-dialog__section-title">Options</h3>
              <Checkbox.Root
                class="checkbox"
                checked={includeMonitor()}
                onCheckedChange={(details) => setIncludeMonitor(details.checked === true)}
              >
                <Checkbox.Control class="checkbox__control">
                  <Checkbox.Indicator class="checkbox__indicator">✓</Checkbox.Indicator>
                </Checkbox.Control>
                <Checkbox.Label class="checkbox__label">Export monitor</Checkbox.Label>
                <Checkbox.HiddenInput />
              </Checkbox.Root>
            </section>

            <footer class="export-dialog__footer">
              <Dialog.CloseTrigger class="export-dialog__cancel">Cancel</Dialog.CloseTrigger>
              <button
                type="button"
                class="export-button"
                onClick={() => download(format(), { includeMonitor: includeMonitor() })}
              >
                Download
              </button>
            </footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
