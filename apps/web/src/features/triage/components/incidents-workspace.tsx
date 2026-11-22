import type { ReportFeedItem } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowDownUp } from 'lucide-react';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LoadError } from '@/components/load-error';
import { LocationLabel } from '@/components/location-label';
import { SeverityBadge, StatusBadge } from '@/components/report-badges';
import { ReportDetails, SelectReportPrompt } from './report-details';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatLocation, formatTime } from '@/lib/format';
import { reportQueries } from '../queries';

/**
 * `/dashboard/incidents`: the wireframe's Incident Feed. The report list stays
 * on the left; the quick view of `selectedId` (from `?report=`) sits beside it.
 */
export function IncidentsWorkspace({ selectedId }: { selectedId?: string }) {
  return (
    // Exactly fills the window on large screens so only the panes scroll, never the page:
    // 100svh minus the header (h-14, 3.5rem), main's padding (p-4, 2rem) and the
    // inset panel's margin (m-2 top and bottom, 1rem).
    <div className="flex flex-col overflow-hidden lg:h-[calc(100svh-6.5rem)]">
      {/* Only Reports exists for now; Table and Kanban are shown disabled, as agreed. */}
      <Tabs value="reports">
        <TabsList variant="line" className="w-full border-b">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="table" disabled>
            Table
          </TabsTrigger>
          <TabsTrigger value="kanban" disabled>
            Kanban
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {/* Three panes side by side on large screens, stacked on narrow ones. */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-3 lg:divide-x">
        <section
          aria-label="Reports"
          className="flex min-h-0 flex-col gap-3 p-4 lg:overflow-y-auto"
        >
          {/* TODO(#38): sorting. Shown disabled so the layout matches the wireframe. */}
          <Button variant="ghost" size="sm" className="self-start" disabled>
            <ArrowDownUp /> Sort
          </Button>
          <ReportList />
        </section>
        {selectedId ? (
          <ReportDetails reportId={selectedId} />
        ) : (
          <SelectReportPrompt />
        )}
      </div>
    </div>
  );
}

/** The feed as cards; each opens its report's quick view beside the list. */
function ReportList() {
  const { data, isPending, isError, refetch } = useQuery(reportQueries.feed());

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading reports" className="contents">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (isError) {
    return <LoadError what="reports" onRetry={() => void refetch()} />;
  }

  if (!data.length)
    return <p className="text-muted-foreground">No reports yet</p>;

  return (
    <ul className="flex flex-col gap-3">
      {data.map((report) => (
        <li key={report.id}>
          <ReportCard report={report} />
        </li>
      ))}
    </ul>
  );
}

/** One wireframe card: type, badges, the first message, reporter, time, location. */
function ReportCard({ report }: { report: ReportFeedItem }) {
  const location = formatLocation(report.locationText, report.barangay?.name);

  return (
    <Link
      to="/dashboard/incidents"
      search={{ report: report.id }}
      className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50"
      // Every card shares the path, so only the matching ?report= marks it active.
      activeOptions={{ exact: true, includeSearch: true }}
      activeProps={{ className: 'bg-muted', 'aria-current': 'page' }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">
          <IncidentTypeLabel type={report.incidentType} />
        </h3>
        <div className="flex shrink-0 gap-1">
          {report.severity && <SeverityBadge severity={report.severity} />}
          <StatusBadge status={report.status} />
        </div>
      </div>
      <p>{report.firstMessage ?? 'No message'}</p>
      <div className="text-sm text-muted-foreground">
        <p>Reported by: {report.resident?.name ?? 'Unknown caller'}</p>
        <p>{formatTime(report.createdAt)}</p>
        {/* Plain, not a link: the whole card already is one. */}
        {location && <LocationLabel text={location} />}
      </div>
    </Link>
  );
}
