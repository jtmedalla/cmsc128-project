import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { LoadError } from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreateIncidentTypeMutation } from '../mutations';
import { adminQueries } from '../queries';
import { IncidentTypeNameDialog } from './incident-type-name-dialog';
import { IncidentTypesTable } from './incident-types-data-table';

export function IncidentTypesPage() {
  const { data, isPending, isError, refetch } = useQuery(
    adminQueries.incidentTypes(),
  );
  const create = useCreateIncidentTypeMutation();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Incident types</h1>
          <p className="text-sm text-muted-foreground">
            Types residents and responders pick from.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" />
          Add type
        </Button>
        <IncidentTypeNameDialog
          open={adding}
          onOpenChange={setAdding}
          title="Add incident type"
          description="It's offered in chat and report forms right away."
          submitLabel="Add"
          onSave={(name) => create.mutateAsync({ name })}
        />
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="incident types" onRetry={() => void refetch()} />
      ) : (
        <IncidentTypesTable data={data} />
      )}
    </div>
  );
}
