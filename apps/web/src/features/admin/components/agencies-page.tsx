import type { Agency, AgencyUpdate } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { useCreateAgencyMutation, useUpdateAgencyMutation } from '../mutations';
import { adminQueries } from '../queries';
import { AgencyDialog } from './agency-dialog';

function AgencyRow({ agency }: { agency: Agency }) {
  const { mutate, mutateAsync, isPending } = useUpdateAgencyMutation(agency.id);
  const [editing, setEditing] = useState(false);
  const { name, contactNumber, isPublic, isActive } = agency;
  const current: AgencyUpdate = { name, contactNumber, isPublic, isActive };
  const toggle = (changes: Partial<AgencyUpdate>, verb: string) =>
    mutate(
      { ...current, ...changes },
      { onError: () => toast.error(`Couldn't ${verb} ${name}. Try again.`) },
    );
  const setPublic = (checked: boolean) => {
    if (checked && !contactNumber) {
      toast.error(`Add a contact number to ${name} before listing it.`);
      return;
    }
    toggle({ isPublic: checked }, checked ? 'list' : 'unlist');
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell className="text-muted-foreground">
        {contactNumber ?? 'None'}
      </TableCell>
      <TableCell>
        <Switch
          aria-label={`${name} is public`}
          checked={isPublic}
          disabled={isPending}
          onCheckedChange={setPublic}
        />
      </TableCell>
      <TableCell>
        <Switch
          aria-label={`${name} is active`}
          checked={isActive}
          disabled={isPending}
          onCheckedChange={(checked) =>
            toggle({ isActive: checked }, checked ? 'restore' : 'retire')
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${name}`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <AgencyDialog
          open={editing}
          onOpenChange={setEditing}
          title={`Edit ${name}`}
          initial={{ name, contactNumber }}
          isPublic={isPublic}
          submitLabel="Save"
          onSave={(values) => mutateAsync({ ...current, ...values })}
        />
      </TableCell>
    </TableRow>
  );
}

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
            Partner agencies for referrals. Public ones are listed on the
            hotlines page while active; retired ones stay on past referrals.
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
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact number</TableHead>
                <TableHead>Public</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? (
                data.map((agency) => (
                  <AgencyRow key={agency.id} agency={agency} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No agencies yet.
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
