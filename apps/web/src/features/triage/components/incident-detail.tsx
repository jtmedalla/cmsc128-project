import { formatAgeRange, type ReportDetail } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { History, Pencil } from 'lucide-react';
import { CallButton, ContactNumber } from '@/components/contact-number';
import { DetailItem } from '@/components/detail-item';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LoadError } from '@/components/load-error';
import { ReportId } from '@/components/report-id';
import { ResidentLabel } from '@/components/resident-label';
import { SexLabel } from '@/components/sex-label';
import { LocationLabel } from '@/components/location-label';
import { SeverityBadge, StatusBadge } from '@/components/report-badges';
import { ReportNotFound } from './report-not-found';
import { ReportMap } from './report-map';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatLocation, formatTime, label } from '@/lib/format';
import { MessageComposer, MessageThread } from '@/features/messaging';
import { reportQueries } from '../queries';
import { reportTitle } from '../lib/report-title';

/** `/dashboard/incidents/:reportId`: one report on its own page, read-only until #39. */
export function IncidentDetail({ reportId }: { reportId: string }) {
  const { data, isPending, isError, refetch } = useQuery(
    reportQueries.detail(reportId),
  );

  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading report"
        className="flex flex-col gap-4"
      >
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return <LoadError what="this report" onRetry={() => void refetch()} />;
  }

  if (!data) {
    return <ReportNotFound />;
  }

  return (
    // On large screens the page fills main and each column scrolls on its own.
    <div className="flex flex-col gap-6 lg:h-full">
      <PageHeader report={data} />
      {/* Wide left column for the report, narrower right column for activity; stacked on narrow screens. */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4 *:shrink-0 lg:min-h-0 lg:overflow-y-auto lg:p-px">
          <DetailsCard report={data} />
          <VictimsCard victims={data.victims} />
          <Card>
            <CardHeader>
              <CardTitle>Referrals</CardTitle>
            </CardHeader>
            {/* TODO(#63): pick a partner agency and log the referral. */}
            <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              No referrals logged
              <Button variant="outline" size="sm" disabled>
                Log referral
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportMap report={data} className="h-80" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4 lg:min-h-0">
          <MessagesCard messages={data.messages} />
        </div>
      </div>
    </div>
  );
}

/** Breadcrumb, the short report ID and the actions. */
function PageHeader({ report }: { report: ReportDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/dashboard/incidents" />}>
              Incidents
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{reportTitle(report)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type, barangay, severity and status already lead the Details card. */}
        <h1 className="sr-only">{reportTitle(report)}</h1>
        <ReportId id={report.id} className="px-2 py-1 text-sm" />
        <div className="flex items-center gap-2">
          <EditHistorySheet />
          {report.resident?.contactNumber && (
            <CallButton
              number={report.resident.contactNumber}
              variant="default"
            />
          )}
          {/* TODO(#39): change the status and record it in ReportEdit. */}
          <Button variant="outline" size="sm" disabled>
            Mark invalid
          </Button>
          <Button size="sm" disabled>
            Mark dispatched
          </Button>
        </div>
      </div>
    </div>
  );
}

/** The report's corrections, opened from the header so they stay out of the way. */
function EditHistorySheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <History data-icon="inline-start" />
        History
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit history</SheetTitle>
          <SheetDescription>
            Every correction made to this report.
          </SheetDescription>
        </SheetHeader>
        {/* TODO(#39): list ReportEdit rows; the detail API doesn't return them yet. */}
        <p className="px-4 text-sm text-muted-foreground">No edits yet</p>
      </SheetContent>
    </Sheet>
  );
}

/** A label column beside the value; minmax(0, 1fr) lets long values wrap instead of overflowing. */
function DetailRow(props: { label: string; value: React.ReactNode }) {
  return (
    <DetailItem
      className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-2"
      {...props}
    />
  );
}

/** The report's fields in two columns: what happened, then where and who reported it. */
function DetailsCard({ report }: { report: ReportDetail }) {
  const place = formatLocation(report.locationText, report.barangay?.name);

  return (
    // A container, so the columns follow the card's width rather than the window's.
    <Card className="@container">
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardAction>
          {/* TODO(#39): edit the parsed fields and record each change. */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit details"
            title="Edit details"
            disabled
          >
            <Pencil />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-3 @lg:grid-cols-2">
        <dl className="flex flex-col gap-3">
          <DetailRow
            label="Incident type"
            value={
              report.incidentType && (
                <IncidentTypeLabel type={report.incidentType} />
              )
            }
          />
          <DetailRow
            label="Severity"
            value={
              report.severity && <SeverityBadge severity={report.severity} />
            }
          />
          <DetailRow
            label="Status"
            value={<StatusBadge status={report.status} />}
          />
          <DetailRow
            label="Incident time"
            value={report.incidentAt && formatTime(report.incidentAt)}
          />
        </dl>
        <dl className="flex flex-col gap-3">
          <DetailRow
            label="Location"
            value={place && <LocationLabel text={place} reportId={report.id} />}
          />
          <DetailRow label="Source" value={label(report.sourceChannel)} />
          <DetailRow
            label="Reporter"
            value={
              <>
                <ResidentLabel resident={report.resident} />
                {report.isProxy && (
                  <span className="text-muted-foreground">
                    {' '}
                    (for someone else)
                  </span>
                )}
              </>
            }
          />
          {/* Responders call back on this number (#103). */}
          <DetailRow
            label="Contact number"
            value={
              report.resident?.contactNumber && (
                <ContactNumber number={report.resident.contactNumber} />
              )
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

/** Victims as a table of sex, age and condition. */
function VictimsCard({ victims }: { victims: ReportDetail['victims'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Victims</CardTitle>
      </CardHeader>
      <CardContent>
        {victims.length ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Sex</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {victims.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      {v.sex ? <SexLabel sex={v.sex} /> : 'Not given'}
                    </TableCell>
                    <TableCell>
                      {formatAgeRange(v.ageMin, v.ageMax) ?? 'Not given'}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {v.medicalCondition || 'None reported'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None reported</p>
        )}
      </CardContent>
    </Card>
  );
}

/** The conversation, scrolling inside the card, with the reply box below. */
function MessagesCard({ messages }: { messages: ReportDetail['messages'] }) {
  return (
    <Card className="lg:min-h-0 lg:flex-1">
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="flex h-[28rem] flex-col border-t px-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <MessageThread messages={messages} />
      </CardContent>
      <CardFooter>
        <MessageComposer placeholder="Reply to resident" />
      </CardFooter>
    </Card>
  );
}
