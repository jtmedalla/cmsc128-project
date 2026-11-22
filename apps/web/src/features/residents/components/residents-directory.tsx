import { useQuery } from '@tanstack/react-query';
import { COLUMN_LABELS, columns } from './residents-directory-columns';
import { ResidentTable } from './residents-directory-data-table';
import { LoadError } from '@/components/load-error';
import { RefreshButton } from '@/components/refresh-button';
import { Skeleton } from '@/components/ui/skeleton';
import { residentQueries } from '../queries';

export function ResidentsDirectory() {
  const { data, isPending, isError, isFetching, refetch } = useQuery(
    residentQueries.list(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Residents Directory</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.length} ${data.length === 1 ? 'resident' : 'residents'} in your community`
              : 'Loading…'}
          </p>
        </div>
        <RefreshButton
          refreshing={isFetching}
          onRefresh={() => void refetch()}
        />
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="residents" onRetry={() => void refetch()} />
      ) : (
        <ResidentTable
          columns={columns}
          data={data}
          columnLabels={COLUMN_LABELS}
        />
      )}
    </div>
  );
}
