import { Tabs } from '@ark-ui/solid/tabs';
import ButtonsTab from './ButtonsTab';
import CabinetTab from './CabinetTab';
import ControlPanelTab from './ControlPanelTab';
import MarqueeTab from './MarqueeTab';
import SettingsTab from './SettingsTab';
import SpeakersTab from './SpeakersTab';
import type { ControlPanelLayout } from '../geometry/controlPanel';
import type { BodySections } from '../geometry/sections';
import type { SideProfile } from '../geometry/sideProfile';
import type { SpeakerPanel } from '../geometry/speakers';

interface ParametersPanelProps {
  profile: SideProfile;
  sections: BodySections;
  monitorWarnings: string[];
  speakers: SpeakerPanel | null;
  controlPanel: ControlPanelLayout;
  layoutWarnings: string[];
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
          <Tabs.Trigger value="marquee" class="tabs__trigger">
            Marquee
          </Tabs.Trigger>
          <Tabs.Trigger value="speakers" class="tabs__trigger">
            Speakers
          </Tabs.Trigger>
          <Tabs.Trigger value="control-panel" class="tabs__trigger">
            Control Panel
          </Tabs.Trigger>
          <Tabs.Trigger value="buttons" class="tabs__trigger">
            Buttons
          </Tabs.Trigger>
          <Tabs.Indicator class="tabs__indicator" />
        </Tabs.List>

        <Tabs.Content value="settings" class="tabs__content">
          <SettingsTab />
        </Tabs.Content>
        <Tabs.Content value="cabinet" class="tabs__content">
          <CabinetTab
            profile={props.profile}
            sections={props.sections}
            monitorWarnings={props.monitorWarnings}
          />
        </Tabs.Content>
        <Tabs.Content value="marquee" class="tabs__content">
          <MarqueeTab profile={props.profile} />
        </Tabs.Content>
        <Tabs.Content value="speakers" class="tabs__content">
          <SpeakersTab panel={props.speakers} />
        </Tabs.Content>
        <Tabs.Content value="control-panel" class="tabs__content">
          <ControlPanelTab layout={props.controlPanel} />
        </Tabs.Content>
        <Tabs.Content value="buttons" class="tabs__content">
          <ButtonsTab panel={props.controlPanel} warnings={props.layoutWarnings} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
