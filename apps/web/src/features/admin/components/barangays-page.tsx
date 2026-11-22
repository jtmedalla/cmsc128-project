import type { Barangay } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { BarangayMap, geoQueries } from '@/features/geo';
import { BarangaysTable } from './barangays-data-table';

const TERRAIN = {
  coastal: { label: 'Coastal', color: '#3b82f6' },
  upland: { label: 'Upland', color: '#16a34a' },
  both: { label: 'Both', color: '#9333ea' },
  neither: { label: 'Neither', color: '#a3a3a3' },
};

function terrainColor({ isCoastal, isUpland }: Barangay) {
  if (isCoastal && isUpland) return TERRAIN.both.color;
  if (isCoastal) return TERRAIN.coastal.color;
  if (isUpland) return TERRAIN.upland.color;
  return TERRAIN.neither.color;
}

/** `barangay` is the name search, kept in the URL by the route. */
export function BarangaysPage({
  barangay = '',
  onBarangayChange,
}: {
  barangay?: string;
  onBarangayChange: (name: string) => void;
}) {
  const { data, isPending, isError, refetch } = useQuery(
    geoQueries.barangays(),
  );
  // Outline what the table's name filter matches.
  const matchedIds = useMemo(() => {
    const query = barangay.trim().toLowerCase();
    if (!query || !data) return [];
    return data
      .filter((row) => row.name.toLowerCase().includes(query))
      .map((row) => row.id);
  }, [data, barangay]);

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
        <>
          <BarangayMap
            className="h-80"
            barangays={data}
            color={terrainColor}
            outlinedIds={matchedIds}
            onBarangayClick={(row) => onBarangayChange(row.name)}
            legend={Object.values(TERRAIN)}
          />
          <BarangaysTable
            data={data}
            nameFilter={barangay}
            onNameFilterChange={onBarangayChange}
          />
        </>
      )}
    </div>
  );
}
