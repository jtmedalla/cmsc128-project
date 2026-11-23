import type { IncidentType } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { IncidentTypeLabel } from '@/components/incident-type-label';
import { LoadError } from '@/components/load-error';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateIncidentTypeMutation,
  useUpdateIncidentTypeMutation,
} from '../mutations';
import { adminQueries } from '../queries';
import { IncidentTypeNameDialog } from './incident-type-name-dialog';

function IncidentTypeRow({ type }: { type: IncidentType }) {
  const { mutate, mutateAsync, isPending } = useUpdateIncidentTypeMutation(
    type.id,
  );
  const [renaming, setRenaming] = useState(false);
  const setActive = (isActive: boolean) =>
    mutate(
      { isActive },
      {
        onError: () =>
          toast.error(
            `Couldn't ${isActive ? 'restore' : 'retire'} ${type.name}. Try again.`,
          ),
      },
    );

  return (
    <TableRow>
      <TableCell className="font-medium">
        <IncidentTypeLabel type={type} />
      </TableCell>
      <TableCell className="font-mono text-muted-foreground">
        {type.code}
      </TableCell>
      <TableCell>
        <Switch
          aria-label={`${type.name} is active`}
          checked={type.isActive}
          disabled={isPending}
          onCheckedChange={setActive}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Rename ${type.name}`}
          onClick={() => setRenaming(true)}
        >
          <Pencil />
        </Button>
        <IncidentTypeNameDialog
          open={renaming}
          onOpenChange={setRenaming}
          title={`Rename ${type.name}`}
          description="Reports keep this type; only its name changes."
          initialName={type.name}
          submitLabel="Rename"
          onSave={(name) => mutateAsync({ name })}
        />
      </TableCell>
    </TableRow>
  );
}

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
            What residents and responders pick from. Retired types stay on past
            reports but aren't offered for new ones.
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
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? (
                data.map((type) => (
                  <IncidentTypeRow key={type.id} type={type} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No incident types yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
