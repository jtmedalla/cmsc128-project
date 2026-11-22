import type { HealthStatus } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { RefreshButton } from '@/components/refresh-button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { healthQueries } from '../queries';
import { cn } from '@/lib/utils';

const statusLabel: Record<HealthStatus, string> = {
  ok: 'Operational',
  error: 'Down',
};

function ServiceStatus({ status }: { status: HealthStatus | 'unreachable' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          status === 'ok' ? 'bg-success' : 'bg-destructive',
        )}
      />
      {status === 'unreachable' ? 'Unreachable' : statusLabel[status]}
    </span>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

export function HealthStatusCard() {
  const { data, isPending, isError, isFetching, refetch } = useQuery(
    healthQueries.status(),
  );

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          {data
            ? `Checked ${new Date(data.checkedAt).toLocaleTimeString()}`
            : 'Checking…'}
        </CardDescription>
        <CardAction>
          <RefreshButton
            refreshing={isFetching}
            onRefresh={() => void refetch()}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-16" />
        ) : isError ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">API</dt>
            <dd>
              <ServiceStatus status="unreachable" />
            </dd>
          </dl>
        ) : (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">API</dt>
            <dd>
              <ServiceStatus status="ok" />
            </dd>
            <dt className="text-muted-foreground">Database</dt>
            <dd>
              <ServiceStatus status={data.checks.database} />
            </dd>
            <dt className="text-muted-foreground">Uptime</dt>
            <dd>{formatUptime(data.uptime)}</dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

export function HealthPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">System status</h1>
      <HealthStatusCard />
    </div>
  );
}
