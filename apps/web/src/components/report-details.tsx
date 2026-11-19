import type { ReportDetail } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { ReportMap } from '@/components/report-map';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTime, label } from '@/lib/format';
import { reportDetailQuery } from '@/lib/reports';

function Field({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm font-medium">{name}</dt>
      {/* An empty string counts as missing too, not only null/undefined. */}
      <dd className="text-muted-foreground">
        {value === null || value === undefined || value === ''
          ? 'Not given'
          : value}
      </dd>
    </div>
  );
}

type Message = ReportDetail['messages'][number];

/** Outbound with a sender_id is a responder; without one, the bot (docs/database.md). */
function senderOf(m: Message) {
  if (m.direction === 'inbound') return 'Resident';
  return m.senderId ? 'Responder' : 'MIGO';
}

/** The text, or what an attachment-only message holds. */
function contentOf(m: Message) {
  if (m.body !== null) return m.body;
  return m.attachments?.some((a) => a.type === 'location')
    ? 'Shared a location'
    : '(attachment)';
}

/** The chat and details panes, side by side in the outlet's two columns. */
function ReportPanes({
  chat,
  details,
}: {
  chat: React.ReactNode;
  details: React.ReactNode;
}) {
  return (
    <div className="grid min-h-0 lg:col-span-2 lg:grid-cols-2 lg:divide-x">
      <section aria-label="Chat" className="flex min-h-0 flex-col">
        <h2 className="p-4 text-lg font-semibold">Chat</h2>
        <div className="min-h-48 flex-1 px-4 lg:overflow-y-auto">{chat}</div>
        {/* TODO(responder messaging, issue not confirmed): enable replies.
            Disabled for now so the layout matches the wireframe. */}
        <div className="border-t p-3">
          <Input
            placeholder="Type your message"
            aria-label="Message"
            disabled
          />
        </div>
      </section>
      <section
        aria-label="Details"
        className="flex min-h-0 flex-col gap-4 p-4 lg:overflow-y-auto"
      >
        {details}
      </section>
    </div>
  );
}

/** Centered helper text inside a pane. */
function PaneMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
      {children}
    </div>
  );
}

/** `/dashboard/incidents` with no report chosen yet. */
export function SelectReportPrompt() {
  return (
    <ReportPanes
      // The wireframe's empty chat state (Figma "chat-body").
      chat={
        <PaneMessage>
          <p className="text-lg text-foreground/70">No messages yet</p>
          <p className="text-sm">Start a conversation by typing below</p>
        </PaneMessage>
      }
      details={<PaneMessage>Select a report to see its details</PaneMessage>}
    />
  );
}

/** Read-only panes for one report; editing arrives with #39. */
export function ReportDetails({ reportId }: { reportId: string }) {
  const { data, isPending, isError, refetch } = useQuery(
    reportDetailQuery(reportId),
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
          <PaneMessage>
            <p>
              Couldn't load this report. Check your connection and try again.
            </p>
            <Button onClick={() => void refetch()}>Try again</Button>
          </PaneMessage>
        }
      />
    );
  }

  if (!data) {
    return (
      <ReportPanes
        chat={null}
        details={
          <PaneMessage>
            <p>This report doesn't exist.</p>
            <Button
              nativeButton={false}
              render={<Link to="/dashboard/incidents" />}
            >
              Back to incidents
            </Button>
          </PaneMessage>
        }
      />
    );
  }

  return (
    <ReportPanes
      chat={<ChatMessages messages={data.messages} />}
      details={<ReportFields report={data} />}
    />
  );
}

/** The report's conversation as wireframe bubbles: resident left, MIGO and responders right. */
function ChatMessages({ messages }: { messages: Message[] }) {
  if (!messages.length) return <PaneMessage>No messages yet</PaneMessage>;

  return (
    <ul className="flex flex-col gap-4 pb-4">
      {messages.map((m) => {
        const inbound = m.direction === 'inbound';
        return (
          <li
            key={m.id}
            className={cn(
              'flex flex-col gap-1',
              inbound ? 'items-start' : 'items-end',
            )}
          >
            <p className="text-xs text-muted-foreground">
              {senderOf(m)} · {formatTime(m.createdAt)}
            </p>
            <p
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 whitespace-pre-wrap',
                inbound ? 'bg-muted' : 'bg-primary text-primary-foreground',
              )}
            >
              {contentOf(m)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** The wireframe's details fields, read-only, plus the contact number and victims (#103). */
function ReportFields({ report }: { report: ReportDetail }) {
  return (
    <>
      {/* Short ID like the wireframe's "#a1b2c3". */}
      <p className="text-sm text-muted-foreground">
        Report ID: #{report.id.slice(0, 8)}
      </p>
      <dl className="flex flex-col gap-4">
        <Field name="Status" value={label(report.status)} />
        <Field
          name="Severity"
          value={report.severity && label(report.severity)}
        />
        <Field name="Incident Type" value={report.incidentType?.name} />
        <Field
          name="Reported By"
          value={report.resident?.name ?? 'Unknown caller'}
        />
      </dl>
      {/* Below Reported By, where the wireframe puts the map. */}
      <ReportMap />
      {/* Not in the wireframe: #103 requires the contact number; victims kept by decision. */}
      <dl className="flex flex-col gap-4">
        <Field
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
        <Field
          name={`Victims (${report.victims.length})`}
          value={
            report.victims.length ? (
              <ul>
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
              'None reported'
            )
          }
        />
      </dl>
    </>
  );
}
