import { IconText } from '@/components/icon-text';
import { incidentTypeIcon } from '@/lib/incident-types';

/** An incident type's icon and name; a report without one reads "Unclassified incident". */
export function IncidentTypeLabel({
  type,
  className,
  children,
}: {
  type: { code: string; name: string } | null;
  className?: string;
  /** Text in place of the type's name, such as a report title. */
  children?: React.ReactNode;
}) {
  return (
    <IconText icon={incidentTypeIcon(type)} className={className}>
      {children ?? type?.name ?? 'Unclassified incident'}
    </IconText>
  );
}
