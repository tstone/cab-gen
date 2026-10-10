import { Tabs } from '@ark-ui/solid/tabs';
import CabinetTab from './CabinetTab';
import SettingsTab from './SettingsTab';
import type { SideProfile } from '../geometry/sideProfile';

interface ParametersPanelProps {
  profile: SideProfile;
  monitorWarnings: string[];
}

export default function ParametersPanel(props: ParametersPanelProps) {
  return (
    <div class="params">
      <header class="params__header">
        <h1>Cabinet Designer</h1>
      </header>

      <Tabs.Root class="tabs" defaultValue="cabinet">
        <Tabs.List class="tabs__list">
          <Tabs.Trigger value="settings" class="tabs__trigger">
            Settings
          </Tabs.Trigger>
          <Tabs.Trigger value="cabinet" class="tabs__trigger">
            Cabinet
          </Tabs.Trigger>
          <Tabs.Trigger value="control-panel" class="tabs__trigger">
            Control Panel
          </Tabs.Trigger>
          <Tabs.Indicator class="tabs__indicator" />
        </Tabs.List>

        <Tabs.Content value="settings" class="tabs__content">
          <SettingsTab />
        </Tabs.Content>
        <Tabs.Content value="cabinet" class="tabs__content">
          <CabinetTab profile={props.profile} monitorWarnings={props.monitorWarnings} />
        </Tabs.Content>
        <Tabs.Content value="control-panel" class="tabs__content">
          <p class="tabs__empty">Nothing here yet.</p>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
