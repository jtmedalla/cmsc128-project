import { useQuery } from '@tanstack/react-query';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { adminQueries } from '../queries';
import { BarangaysTable } from './barangays-data-table';

export function BarangaysPage() {
  const { data, isPending, isError, refetch } = useQuery(
    adminQueries.barangays(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Barangays</h1>
        <p className="text-sm text-muted-foreground">
          Flags and hazards decide which barangays an advisory reaches.
        </p>
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="barangays" onRetry={() => void refetch()} />
      ) : (
        <BarangaysTable data={data} />
      )}
    </div>
  );
}
