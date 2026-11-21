import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { columns } from '@/components/residents-columns';
import { ResidentTable } from '@/components/residents-data-table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { residentsQuery } from '@/lib/residents';
import { cn } from '@/lib/utils';

export function ResidentsPage() {
  const { data, isPending, isError, isFetching, refetch } =
    useQuery(residentsQuery);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Residents Directory</h1>
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
        <ResidentTable columns={columns} data={data} />
      )}
    </div>
  );
}
