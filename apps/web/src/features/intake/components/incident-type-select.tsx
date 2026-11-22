import { useQuery } from '@tanstack/react-query';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { intakeQueries } from '../queries';

/** Picks an active incident type, shown with its icon as everywhere else; null is unknown. */
export function IncidentTypeSelect({
  id,
  value,
  onValueChange,
}: {
  id?: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
}) {
  const { data: types = [] } = useQuery(intakeQueries.incidentTypes());
  const selected = types.find((type) => type.id === value) ?? null;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue>
          {selected ? <IncidentTypeLabel type={selected} /> : 'Unknown'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={null}>Unknown</SelectItem>
          {types.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <IncidentTypeLabel type={type} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
