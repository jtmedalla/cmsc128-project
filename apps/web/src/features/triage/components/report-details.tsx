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
import { ResidentLabel } from '@/components/resident-label';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatLocation, formatTime, label } from '@/lib/format';
import { MessageComposer, MessageThread } from '@/features/messaging';
import { reportQueries } from '../queries';
import { ReportNotFound } from './report-not-found';
import { reportTitle } from '../lib/report-title';

/** The quick view's chat and details panes, side by side in the workspace's last two columns. */
function ReportPanes({
  header,
  chat,
  details,
}: {
  header?: React.ReactNode;
  chat: React.ReactNode;
  details: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-col lg:col-span-2">
      {header}
      <div className="grid min-h-0 flex-1 lg:grid-cols-2 lg:divide-x">
        <section aria-label="Chat" className="flex min-h-0 flex-col">
          <h2 className="p-4 text-lg font-semibold">Chat</h2>
          {/* The thread scrolls itself, so it needs a height: fixed when stacked, the pane's rest on large screens. */}
          <div className="flex h-96 min-h-0 flex-col lg:h-auto lg:flex-1">
            {chat}
          </div>
          <div className="border-t p-3">
            <MessageComposer />
          </div>
        </section>
        <section
          aria-label="Details"
          className="flex min-h-0 flex-col gap-4 p-4 lg:overflow-y-auto"
        >
          {details}
        </section>
      </div>
    </div>
  );
}

/** Title, badges and when it arrived, with the link to the full report page. */
function QuickViewHeader({ report }: { report: ReportDetail }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b p-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">
            <IncidentTypeLabel type={report.incidentType}>
              {reportTitle(report)}
            </IncidentTypeLabel>
          </h2>
          {report.severity && <SeverityBadge severity={report.severity} />}
          <StatusBadge status={report.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Received {formatTime(report.createdAt)} via{' '}
          {label(report.sourceChannel)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {report.resident?.contactNumber && (
          <CallButton number={report.resident.contactNumber} />
        )}
        <Button
          variant="ghost"
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
    </div>
  );
}

/** `/dashboard/incidents` with no report chosen yet. */
export function SelectReportPrompt() {
  return (
    <ReportPanes
      chat={<MessageThread messages={[]} />}
      details={
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MousePointerClick />
            </EmptyMedia>
            <EmptyTitle>Select a report to see its details</EmptyTitle>
          </EmptyHeader>
        </Empty>
      }
    />
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
        className="flex flex-col gap-3"
      >
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );
    return <ReportPanes chat={loading} details={loading} />;
  }

  if (isError) {
    return (
      <ReportPanes
        chat={null}
        details={
          <LoadError what="this report" onRetry={() => void refetch()} />
        }
      />
    );
  }

  if (!data) {
    return <ReportPanes chat={null} details={<ReportNotFound />} />;
  }

  return (
    <ReportPanes
      header={<QuickViewHeader report={data} />}
      chat={<MessageThread messages={data.messages} />}
      details={<ReportFields report={data} />}
    />
  );
}

/** "Female · 60+ years old · Asthma", or "No details given". */
function VictimSummary({
  victim,
}: {
  victim: ReportDetail['victims'][number];
}) {
  const parts = [
    victim.sex && <SexLabel sex={victim.sex} />,
    formatAgeRange(victim.ageMin, victim.ageMax),
    victim.medicalCondition,
  ].filter(Boolean);
  if (!parts.length) return 'No details given';
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && ' · '}
      {part}
    </Fragment>
  ));
}

/** The wireframe's details fields, read-only, plus the contact number and victims (#103). */
function ReportFields({ report }: { report: ReportDetail }) {
  const place = formatLocation(report.locationText, report.barangay?.name);
  return (
    <>
      <ReportId id={report.id} className="self-start" />
      <dl className="flex flex-col gap-4">
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
          label="Incident Type"
          value={
            report.incidentType && (
              <IncidentTypeLabel type={report.incidentType} />
            )
          }
        />
        <DetailItem
          label="Reporter"
          value={<ResidentLabel resident={report.resident} />}
        />
        <DetailItem
          label="Location"
          value={place && <LocationLabel text={place} reportId={report.id} />}
        />
      </dl>
      {/* Below the reporter, where the wireframe puts the map. */}
      <ReportMap report={report} />
      {/* Not in the wireframe: #103 requires the contact number; victims kept by decision. */}
      <dl className="flex flex-col gap-4">
        <DetailItem
          label="Contact number"
          value={
            report.resident?.contactNumber && (
              <ContactNumber number={report.resident.contactNumber} />
            )
          }
        />
        <DetailItem
          label={`Victims (${report.victims.length})`}
          value={
            report.victims.length ? (
              <ul>
                {report.victims.map((v) => (
                  <li key={v.id}>
                    <VictimSummary victim={v} />
                  </li>
                ))}
              </ul>
            ) : (
              'None reported'
            )
          }
        />
      </dl>
    </>
  );
}
