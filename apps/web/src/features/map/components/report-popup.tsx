import type { ReportFeedItem } from '@repo/shared';
import { Link } from '@tanstack/react-router';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LocationLabel } from '@/components/location-label';
import { SeverityBadge, StatusBadge } from '@/components/report-badges';
import { Button } from '@/components/ui/button';
import { MarkerPopup } from '@/components/ui/map';
import { formatLocation, formatTimeAgo } from '@/lib/format';

/** A pin's popup: what and where, how long ago, and a link to the report. */
export function ReportPopup({ report }: { report: ReportFeedItem }) {
  const location = formatLocation(report.locationText, report.barangay?.name);
  return (
    <MarkerPopup className="flex w-64 max-w-none flex-col gap-2" closeButton>
      <h3 className="pr-6 font-medium">
        <IncidentTypeLabel type={report.incidentType} />
      </h3>
      <div className="flex flex-wrap gap-1">
        {report.severity && <SeverityBadge severity={report.severity} />}
        <StatusBadge status={report.status} />
      </div>
      {report.firstMessage && (
        <p className="line-clamp-2 text-sm">{report.firstMessage}</p>
      )}
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {location && <LocationLabel text={location} />}
        <span>{formatTimeAgo(report.createdAt)}</span>
      </div>
      <Button
        size="sm"
        nativeButton={false}
        render={
          <Link
            to="/dashboard/incidents/$reportId"
            params={{ reportId: report.id }}
          />
        }
      >
        Open report
      </Button>
    </MarkerPopup>
  );
}
