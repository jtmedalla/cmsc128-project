import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { COLUMN_LABELS, columns } from './residents-directory-columns';
import { ResidentTable } from './residents-directory-data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { residentsQuery } from '../api';
import { cn } from '@/lib/utils';

export function ResidentsDirectory() {
  const { data, isPending, isError, isFetching, refetch } =
    useQuery(residentsQuery);

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
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn(isFetching && 'animate-spin')} />
        </Button>
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <p className="text-sm text-destructive">Couldn't load residents.</p>
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
