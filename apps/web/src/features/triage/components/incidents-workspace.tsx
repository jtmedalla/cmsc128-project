import type { ReportFeedItem } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowDownUp, SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LoadError } from '@/components/load-error';
import { ResidentLabel } from '@/components/resident-label';
import { LocationLabel } from '@/components/location-label';
import { SeverityBadge, StatusBadge } from '@/components/report-badges';
import { ReportDetails, SelectReportPrompt } from './report-details';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatLocation, formatTimeAgo, label } from '@/lib/format';
import { reportQueries } from '../queries';

/**
 * `/dashboard/incidents`: the incident feed. The report list stays on the
 * left; the quick view of `selectedId` (from `?report=`) sits beside it.
 */
export function IncidentsWorkspace({ selectedId }: { selectedId?: string }) {
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();
  const list = (
    <section aria-label="Reports" className="h-full overflow-y-auto">
      <ReportList search={search} />
    </section>
  );
  const quickView = selectedId ? (
    <ReportDetails reportId={selectedId} />
  ) : (
    <SelectReportPrompt />
  );

  return (
    // Fills main on wide screens so only the panes scroll, never the page.
    <div className="flex flex-col gap-4 md:h-full">
      <div className="flex flex-wrap items-center gap-2">
        {/* Only the feed exists for now; Table and Board are shown disabled, as agreed. */}
        <Tabs value="feed">
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="table" disabled>
              Table
            </TabsTrigger>
            <TabsTrigger value="board" disabled>
              Board
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <InputGroup className="w-full sm:w-72">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search incidents"
            placeholder="Search incidents"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        {/* TODO(#38): sorting. */}
        <Button variant="outline" disabled>
          <ArrowDownUp /> Sort
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        {isMobile ? (
          <div className="flex flex-col divide-y">
            {list}
            {quickView}
          </div>
        ) : (
          <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize="30" minSize="20">
              {list}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="70" minSize="40">
              {quickView}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

/** True when the report's type, message, place or reporter contains `search`. */
function matches(report: ReportFeedItem, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [
    report.incidentType?.name,
    report.firstMessage,
    report.barangay?.name,
    report.locationText,
    report.resident?.name,
  ].some((field) => field?.toLowerCase().includes(needle));
}

/** The feed; each item opens its report's quick view beside the list. */
function ReportList({ search }: { search: string }) {
  const { data, isPending, isError, refetch } = useQuery(reportQueries.feed());

  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading reports"
        className="flex flex-col gap-3 p-4"
      >
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <LoadError what="reports" onRetry={() => void refetch()} />
      </div>
    );
  }

  const shown = data.filter((report) => matches(report, search));

  if (!shown.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {data.length ? 'No reports match your search' : 'No reports yet'}
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {shown.map((report) => (
        <li key={report.id}>
          <ReportItem report={report} />
        </li>
      ))}
    </ul>
  );
}

/** "No victims reported", "1 victim", "3 victims". */
function victimsText(count: number) {
  if (!count) return 'No victims reported';
  return `${count} ${count === 1 ? 'victim' : 'victims'}`;
}

/** One feed item: type and badges, the first message, then place, reporter and time. */
function ReportItem({ report }: { report: ReportFeedItem }) {
  const location = formatLocation(report.locationText, report.barangay?.name);

  return (
    <Link
      to="/dashboard/incidents"
      search={{ report: report.id }}
      className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/50"
      // Every item shares the path, so only the matching ?report= marks it active.
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
      <p className="line-clamp-2 text-sm">
        {report.firstMessage ?? 'No message'}
      </p>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        {/* Plain, not links: the whole item already is one. */}
        {location && <LocationLabel text={location} />}
        <ResidentLabel resident={report.resident} link={false} />
        <p>
          {label(report.sourceChannel)} · {formatTimeAgo(report.createdAt)} ·{' '}
          {victimsText(report.victimCount)}
          {report.isProxy && ' · for someone else'}
          {report.creator && ` · logged by ${report.creator.name}`}
        </p>
      </div>
    </Link>
  );
}
