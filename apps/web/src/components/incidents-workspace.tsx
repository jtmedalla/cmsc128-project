import type { ReportFeedItem } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import { ArrowDownUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTime, label } from '@/lib/format';
import { reportFeedQuery } from '@/lib/reports';

/**
 * `/dashboard/incidents`: the wireframe's Incident Feed. The report list stays
 * on the left; the selected report's panes render in the outlet beside it.
 */
export function IncidentsWorkspace() {
  return (
    // Fills the dashboard below its header (h-14) and padding (p-4) on large screens.
    <div className="flex flex-col overflow-hidden rounded-xl border lg:h-[calc(100svh-5.5rem)]">
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
        <Outlet />
      </div>
    </div>
  );
}

/** The feed as cards; each opens its report beside the list. */
function ReportList() {
  const { data, isPending, isError, refetch } = useQuery(reportFeedQuery);

  if (isPending) {
    return (
      <div aria-busy="true" aria-label="Loading reports" className="contents">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Couldn't load reports.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </div>
    );
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
  const location = report.locationText ?? report.barangay?.name;

  return (
    <Link
      to="/dashboard/incidents/$reportId"
      params={{ reportId: report.id }}
      className="flex flex-col gap-2 rounded-xl border p-4 hover:bg-muted/50"
      // The selected card stays highlighted while its report is open.
      activeProps={{ className: 'bg-muted', 'aria-current': 'page' }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">
          {report.incidentType?.name ?? 'Unclassified incident'}
        </h3>
        <div className="flex shrink-0 gap-1">
          {report.severity && (
            <Badge variant="secondary">{label(report.severity)}</Badge>
          )}
          <Badge variant="outline">{label(report.status)}</Badge>
        </div>
      </div>
      <p>{report.firstMessage ?? 'No message'}</p>
      <div className="text-sm text-muted-foreground">
        <p>Reported by: {report.resident?.name ?? 'Unknown caller'}</p>
        <p>{formatTime(report.createdAt)}</p>
        {location && <p className="text-xs">Location: {location}</p>}
      </div>
    </Link>
  );
}
