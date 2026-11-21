import { formatAgeRange, type ReportDetail } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { SeverityBadge, StatusBadge } from './report-badges';
import { ChatMessages, PaneMessage } from './report-details';
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
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTime, label } from '@/lib/format';
import { reportDetailQuery } from '../api';
import { reportTitle } from '../lib/report-title';

/** `/dashboard/incidents/:reportId`: one report on its own page, read-only until #39. */
export function IncidentDetail({ reportId }: { reportId: string }) {
  const { data, isPending, isError, refetch } = useQuery(
    reportDetailQuery(reportId),
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
    return (
      <PaneMessage>
        <p>Couldn't load this report. Check your connection and try again.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </PaneMessage>
    );
  }

  if (!data) {
    return (
      <PaneMessage>
        <p>This report doesn't exist.</p>
        <Button
          nativeButton={false}
          render={<Link to="/dashboard/incidents" />}
        >
          Back to incidents
        </Button>
      </PaneMessage>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader report={data} />
      {/* Wide left column for the report, narrower right column for activity; stacked on narrow screens. */}
      <div className="grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-4">
          <DetailsCard report={data} />
          <VictimsCard victims={data.victims} />
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportMap />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <MessagesCard messages={data.messages} />
          <Card>
            <CardHeader>
              <CardTitle>Edit history</CardTitle>
            </CardHeader>
            {/* TODO(#39): list ReportEdit rows; the detail API doesn't return them yet. */}
            <CardContent className="text-muted-foreground">
              No edits yet
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Referrals</CardTitle>
            </CardHeader>
            {/* TODO(#63): pick a partner agency and log the referral. */}
            <CardContent className="flex items-center justify-between gap-2 text-muted-foreground">
              No referrals logged
              <Button variant="outline" size="sm" disabled>
                Log referral
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Breadcrumb, title with badges, the short report ID and the status actions. */
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{reportTitle(report)}</h1>
          {report.severity && <SeverityBadge severity={report.severity} />}
          <StatusBadge status={report.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Report {report.id.slice(0, 8)}
          </span>
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

/** One label and value; empty values read "Not given". */
function DetailRow({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    // minmax(0, 1fr) lets the value column shrink, so long values wrap instead of overflowing.
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="wrap-break-word">
        {value === null || value === undefined || value === ''
          ? 'Not given'
          : value}
      </dd>
    </div>
  );
}

/** The report's fields in two columns: what happened, then where and who reported it. */
function DetailsCard({ report }: { report: ReportDetail }) {
  const reporter = report.resident?.name ?? 'Unknown caller';

  return (
    // A container, so the columns follow the card's width rather than the window's.
    <Card className="@container">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-3 @lg:grid-cols-2">
        <dl className="flex flex-col gap-3">
          <DetailRow name="Incident type" value={report.incidentType?.name} />
          <DetailRow
            name="Severity"
            value={report.severity && label(report.severity)}
          />
          <DetailRow name="Status" value={label(report.status)} />
          <DetailRow
            name="Incident time"
            value={report.incidentAt && formatTime(report.incidentAt)}
          />
        </dl>
        <dl className="flex flex-col gap-3">
          <DetailRow name="Barangay" value={report.barangay?.name} />
          <DetailRow name="Location" value={report.locationText} />
          <DetailRow name="Source" value={label(report.sourceChannel)} />
          <DetailRow
            name="Reporter"
            value={report.isProxy ? `${reporter} (for someone else)` : reporter}
          />
          {/* Responders call back on this number (#103). */}
          <DetailRow
            name="Contact number"
            value={
              report.resident?.contactNumber && (
                <a
                  className="underline"
                  href={`tel:${report.resident.contactNumber}`}
                >
                  {report.resident.contactNumber}
                </a>
              )
            }
          />
        </dl>
      </CardContent>
      <CardFooter>
        {/* TODO(#39): edit the parsed fields and record each change. */}
        <Button variant="outline" size="sm" disabled>
          Edit details
        </Button>
      </CardFooter>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sex</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {victims.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.sex ? label(v.sex) : 'Not given'}</TableCell>
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
        ) : (
          <p className="text-muted-foreground">None reported</p>
        )}
      </CardContent>
    </Card>
  );
}

/** The conversation, scrolling inside the card, with the reply box below. */
function MessagesCard({ messages }: { messages: ReportDetail['messages'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        <ChatMessages messages={messages} />
      </CardContent>
      {/* TODO(#12): send replies to the resident. */}
      <CardFooter className="gap-2">
        <Input placeholder="Reply to resident" aria-label="Reply" disabled />
        <Button size="sm" disabled>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}
