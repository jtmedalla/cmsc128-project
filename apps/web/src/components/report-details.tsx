import type { ReportDetail } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { reportDetailQuery } from '@/lib/reports';

/** "storm_surge" → "Storm surge" */
function label(value: string) {
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatTime(date: Date) {
  return date.toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function Field({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{name}</dt>
      <dd>{value ?? 'Not given'}</dd>
    </div>
  );
}

const route = getRouteApi('/dashboard/_app/incidents/$reportId');

/** `/dashboard/incidents/:reportId` */
export function IncidentPage() {
  const { reportId } = route.useParams();
  return <ReportDetails reportId={reportId} />;
}

/** Read-only view of one report; editing arrives with #39. */
export function ReportDetails({ reportId }: { reportId: string }) {
  const { data, isPending, isError, refetch } = useQuery(
    reportDetailQuery(reportId),
  );

  if (isPending) return <ReportDetailsSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>Couldn't load this report. Check your connection and try again.</p>
        <Button onClick={() => void refetch()}>Try again</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>This report doesn't exist.</p>
        <Button nativeButton={false} render={<Link to="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  return <ReportView report={data} />;
}

function ReportView({ report }: { report: ReportDetail }) {
  const confidence = Object.entries(report.parseConfidence ?? {});

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {report.incidentType?.name ?? 'Unclassified incident'}
        </h1>
        <p className="text-muted-foreground">
          {label(report.status)}
          {report.severity && ` · ${label(report.severity)} severity`}
          {' · Received '}
          {formatTime(report.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field name="Barangay" value={report.barangay?.name} />
            <Field name="Location" value={report.locationText} />
            <Field
              name="Happened"
              value={report.incidentAt && formatTime(report.incidentAt)}
            />
            <Field name="Channel" value={label(report.sourceChannel)} />
            <Field
              name="Reported for someone else"
              value={report.isProxy ? 'Yes' : 'No'}
            />
            <Field
              name="Parsed"
              value={report.parsedAutomatically ? 'Automatically' : 'By form'}
            />
          </dl>
          {confidence.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Parse confidence:{' '}
              {confidence
                .map(
                  ([field, score]) =>
                    // "incidentType" → "incident type"
                    `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} ${Math.round(score * 100)}%`,
                )
                .join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resident</CardTitle>
        </CardHeader>
        <CardContent>
          {report.resident ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field name="Name" value={report.resident.name} />
              <Field
                name="Contact number"
                value={
                  report.resident.contactNumber && (
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
          ) : (
            <p className="text-muted-foreground">Unknown caller</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Victims ({report.victims.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {report.victims.length ? (
            <ul className="flex flex-col gap-2">
              {report.victims.map((v) => (
                <li key={v.id}>
                  {[
                    v.sex && label(v.sex),
                    v.age !== null && `${v.age} years old`,
                    v.medicalCondition,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'No details given'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">None reported</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {report.messages.length ? (
            <ul className="flex flex-col gap-3">
              {report.messages.map((m) => (
                <li key={m.id}>
                  <p className="text-sm text-muted-foreground">
                    {m.direction === 'inbound' ? 'Resident' : 'MIGO'} ·{' '}
                    {formatTime(m.createdAt)}
                  </p>
                  <p>{m.body ?? '(attachment)'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No messages</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportDetailsSkeleton() {
  return (
    <div
      className="flex max-w-3xl flex-col gap-4"
      aria-busy="true"
      aria-label="Loading report"
    >
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
