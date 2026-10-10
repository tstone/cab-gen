import Segmented from './Segmented';
import { type Unit, setUnit, unit, units } from '../state/units';

export default function UnitToggle() {
  return (
    <Segmented
      class="segmented--overlay"
      ariaLabel="Units"
      options={(Object.keys(units) as Unit[]).map((u) => ({ value: u, label: units[u].label }))}
      value={unit()}
      onChange={setUnit}
    />
  );
}
