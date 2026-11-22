import type { ReportFeedItem } from '@repo/shared';
import { cn } from 'cn';
import { createElement } from 'react';
import { label } from '@/lib/format';
import { incidentTypeIcon } from '@/lib/incident-types';
import { severityStyles } from '@/lib/report-states';

/** A report as a map pin: its type's icon on its severity's color; grey until classified. */
export function ReportPin({
  report,
  focused = false,
}: {
  report: Pick<ReportFeedItem, 'incidentType' | 'severity'>;
  /** The report the map was opened on, drawn larger. */
  focused?: boolean;
}) {
  const name = report.incidentType?.name ?? 'Unclassified incident';
  return (
    <div
      role="img"
      aria-label={report.severity ? `${name}, ${label(report.severity)}` : name}
      className={cn(
        'flex items-center justify-center rounded-full border-2 border-background shadow-md',
        report.severity
          ? severityStyles[report.severity].solid
          : 'bg-muted-foreground text-background',
        focused ? 'size-9 ring-4 ring-ring/50' : 'size-7',
      )}
    >
      {createElement(incidentTypeIcon(report.incidentType), {
        'aria-hidden': true,
        className: focused ? 'size-5' : 'size-4',
      })}
    </div>
  );
}
