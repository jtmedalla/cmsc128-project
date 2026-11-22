import { formatAgeRange, type ReportDetail } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { MousePointerClick } from 'lucide-react';
import { Fragment } from 'react';
import { CallButton, ContactNumber } from '@/components/contact-number';
import { DetailItem } from '@/components/detail-item';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LoadError } from '@/components/load-error';
import { ReportId } from '@/components/report-id';
import { SexLabel } from '@/components/sex-label';
import { LocationLabel } from '@/components/location-label';
import { SeverityBadge, StatusBadge } from '@/components/report-badges';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ReportMap } from './report-map';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatTime, label } from '@/lib/format';
import { MessageComposer, MessageThread } from '@/features/messaging';
import { reportQueries } from '../queries';
import { ReportNotFound } from './report-not-found';
import { reportTitle } from '../lib/report-title';

/**
 * The quick view: a header over the chat and details panes, resizable side by
 * side on wide screens and stacked on narrow ones.
 */
function QuickViewPanel({
  header,
  chat,
  details,
}: {
  header?: React.ReactNode;
  chat: React.ReactNode;
  details: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const chatPane = (
    <section aria-label="Chat" className="flex h-full min-h-0 flex-col">
      {chat}
    </section>
  );
  const detailsPane = (
    <section
      aria-label="Details"
      className="flex h-full min-h-0 flex-col gap-6 overflow-y-auto p-4 *:shrink-0"
    >
      {details}
    </section>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {header}
      {isMobile ? (
        <div className="flex flex-col divide-y">
          {chatPane}
          {detailsPane}
        </div>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel defaultSize="50" minSize="30">
            {chatPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50" minSize="30">
            {detailsPane}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}

/** The report's ID and when it arrived, with the link to the full report page. */
function QuickViewHeader({ report }: { report: ReportDetail }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      {/* Type, barangay, severity and status already lead the details pane. */}
      <h2 className="sr-only">{reportTitle(report)}</h2>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ReportId id={report.id} />
        Received {formatTime(report.createdAt)} via{' '}
        {label(report.sourceChannel)}
      </div>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link
            to="/dashboard/incidents/$reportId"
            params={{ reportId: report.id }}
          />
        }
      >
        Open full report
      </Button>
    </div>
  );
}

/** Who reported it, linked to their profile, with a button to call them back. */
function ReporterBar({ report }: { report: ReportDetail }) {
  const { resident } = report;
  const name = resident
    ? resident.name || 'Unnamed resident'
    : 'Unknown caller';
  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div className="flex min-w-0 flex-col">
        {resident ? (
          <Link
            to="/dashboard/residents/$residentId"
            params={{ residentId: resident.id }}
            className="truncate text-sm font-medium underline-offset-4 hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="truncate text-sm font-medium">{name}</span>
        )}
        <span className="truncate text-xs text-muted-foreground">
          {label(report.sourceChannel)}
          {report.isProxy && ' · for someone else'}
          {report.creator && ` · logged by ${report.creator.name}`}
        </span>
      </div>
      {resident?.contactNumber && (
        <CallButton number={resident.contactNumber} variant="default" />
      )}
    </div>
  );
}

/** The reporter, their conversation and the reply box. */
function ChatPane({
  report,
  messages,
}: {
  report?: ReportDetail;
  messages: ReportDetail['messages'];
}) {
  return (
    <>
      {report && <ReporterBar report={report} />}
      {/* The thread scrolls itself, so it needs a height: fixed when stacked, the pane's rest on large screens. */}
      <div className="flex h-96 min-h-0 flex-col lg:h-auto lg:flex-1">
        <MessageThread messages={messages} />
      </div>
      <div className="border-t p-3">
        <MessageComposer placeholder="Message resident" />
      </div>
    </>
  );
}

/** `/dashboard/incidents` with no report chosen yet. */
export function SelectReportPrompt() {
  return (
    <div className="flex h-full min-h-64 items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MousePointerClick />
          </EmptyMedia>
          <EmptyTitle>Select a report to see its details</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

/** The quick view: read-only panes for one report; editing arrives with #39. */
export function ReportDetails({ reportId }: { reportId: string }) {
  const { data, isPending, isError, refetch } = useQuery(
    reportQueries.detail(reportId),
  );

  if (isPending) {
    const loading = (
      <div
        aria-busy="true"
        aria-label="Loading report"
        className="flex flex-col gap-3 p-4"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
    return <QuickViewPanel chat={loading} details={null} />;
  }

  if (isError) {
    return (
      <QuickViewPanel
        chat={null}
        details={
          <LoadError what="this report" onRetry={() => void refetch()} />
        }
      />
    );
  }

  if (!data) {
    return <QuickViewPanel chat={null} details={<ReportNotFound />} />;
  }

  return (
    <QuickViewPanel
      header={<QuickViewHeader report={data} />}
      chat={<ChatPane report={data} messages={data.messages} />}
      details={<ReportFields report={data} />}
    />
  );
}

/** "Female · 60+ years old", or "No details given". */
function VictimSummary({
  victim,
}: {
  victim: ReportDetail['victims'][number];
}) {
  const parts = [
    victim.sex && <SexLabel sex={victim.sex} />,
    formatAgeRange(victim.ageMin, victim.ageMax),
  ].filter(Boolean);
  if (!parts.length) return 'No details given';
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' · '}
      {part}
    </Fragment>
  ));
}

/** The report's fields in a two-column grid, its map, and its victims. */
function ReportFields({ report }: { report: ReportDetail }) {
  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <DetailItem
          label="Status"
          value={<StatusBadge status={report.status} />}
        />
        <DetailItem
          label="Severity"
          value={
            report.severity && <SeverityBadge severity={report.severity} />
          }
        />
        <DetailItem
          label="Incident type"
          value={
            report.incidentType && (
              <IncidentTypeLabel type={report.incidentType} />
            )
          }
        />
        <DetailItem label="Barangay" value={report.barangay?.name} />
        <DetailItem
          label="Location"
          value={
            report.locationText && (
              <LocationLabel text={report.locationText} reportId={report.id} />
            )
          }
        />
        <DetailItem
          label="Incident time"
          value={report.incidentAt && formatTime(report.incidentAt)}
        />
        {/* Responders call back on this number (#103). */}
        <DetailItem
          className="col-span-2"
          label="Contact number"
          value={
            report.resident?.contactNumber && (
              <ContactNumber number={report.resident.contactNumber} />
            )
          }
        />
      </dl>
      <ReportMap report={report} className="h-44" />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm text-muted-foreground">
          Victims ({report.victims.length})
        </h3>
        {report.victims.length ? (
          <ul className="divide-y rounded-lg border">
            {report.victims.map((v) => (
              <li key={v.id} className="flex flex-col gap-0.5 px-3 py-2">
                <span className="text-sm font-medium">
                  <VictimSummary victim={v} />
                </span>
                <span className="text-xs text-muted-foreground">
                  {v.medicalCondition || 'None reported'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">None reported</p>
        )}
      </div>
    </>
  );
}
