import type { Agency, AgencyUpdate } from '@repo/shared';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUpdateAgencyMutation } from '../mutations';
import { AgencyDialog } from './agency-dialog';

/** Saves a change to one agency, sending its other fields unchanged. */
function useUpdateAgency(agency: Agency) {
  const { mutate, mutateAsync, isPending } = useUpdateAgencyMutation(agency.id);
  const { name, contactNumber, isPublic, isActive } = agency;
  const current: AgencyUpdate = { name, contactNumber, isPublic, isActive };
  const save = (changes: Partial<AgencyUpdate>, verb: string) =>
    mutate(
      { ...current, ...changes },
      { onError: () => toast.error(`Couldn't ${verb} ${name}. Try again.`) },
    );
  const saveAsync = (changes: Partial<AgencyUpdate>) =>
    mutateAsync({ ...current, ...changes });
  return { save, saveAsync, pending: isPending };
}

/** Lists the agency on hotlines; asks for a number first if it has none. */
export function PublicSwitch({ agency }: { agency: Agency }) {
  const { save, pending } = useUpdateAgency(agency);
  return (
    <Switch
      aria-label={`${agency.name} is public`}
      checked={agency.isPublic}
      disabled={pending}
      onCheckedChange={(checked) => {
        if (checked && !agency.contactNumber) {
          toast.error(
            `Add a contact number to ${agency.name} before listing it.`,
          );
          return;
        }
        save({ isPublic: checked }, checked ? 'list' : 'unlist');
      }}
    />
  );
}

export function ActiveSwitch({ agency }: { agency: Agency }) {
  const { save, pending } = useUpdateAgency(agency);
  return (
    <Switch
      aria-label={`${agency.name} is active`}
      checked={agency.isActive}
      disabled={pending}
      onCheckedChange={(checked) =>
        save({ isActive: checked }, checked ? 'restore' : 'retire')
      }
    />
  );
}

/** Opens the dialog for the agency's name and number. */
export function EditAgencyButton({ agency }: { agency: Agency }) {
  const { saveAsync } = useUpdateAgency(agency);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${agency.name}`}
        onClick={() => setOpen(true)}
      >
        <Pencil />
      </Button>
      <AgencyDialog
        open={open}
        onOpenChange={setOpen}
        title={`Edit ${agency.name}`}
        initial={{ name: agency.name, contactNumber: agency.contactNumber }}
        isPublic={agency.isPublic}
        submitLabel="Save"
        onSave={saveAsync}
      />
    </>
  );
}
