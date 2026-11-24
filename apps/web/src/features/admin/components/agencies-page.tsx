import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LoadError } from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateAgencyMutation } from '../mutations';
import { adminQueries } from '../queries';
import { AgenciesTable } from './agencies-data-table';
import { AgencyDialog } from './agency-dialog';

export function AgenciesPage() {
  const { data, isPending, isError, refetch } = useQuery(
    adminQueries.agencies(),
  );
  const create = useCreateAgencyMutation();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Agencies</h1>
          <p className="text-sm text-muted-foreground">
            Partner agencies for referrals and hotlines.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" />
          Add agency
        </Button>
        <AgencyDialog
          open={adding}
          onOpenChange={setAdding}
          title="Add agency"
          submitLabel="Add"
          onSave={(values) => create.mutateAsync(values)}
        />
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="agencies" onRetry={() => void refetch()} />
      ) : (
        <AgenciesTable data={data} />
      )}
    </div>
  );
}
