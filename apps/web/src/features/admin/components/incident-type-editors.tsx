import type { IncidentType } from '@repo/shared';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUpdateIncidentTypeMutation } from '../mutations';
import { IncidentTypeNameDialog } from './incident-type-name-dialog';

/** Retires or restores a type. */
export function ActiveSwitch({ type }: { type: IncidentType }) {
  const { mutate, isPending } = useUpdateIncidentTypeMutation(type.id);
  return (
    <Switch
      aria-label={`${type.name} is active`}
      checked={type.isActive}
      disabled={isPending}
      onCheckedChange={(isActive) =>
        mutate(
          { isActive },
          {
            onError: () =>
              toast.error(
                `Couldn't ${isActive ? 'restore' : 'retire'} ${type.name}. Try again.`,
              ),
          },
        )
      }
    />
  );
}

export function RenameIncidentTypeButton({ type }: { type: IncidentType }) {
  const { mutateAsync } = useUpdateIncidentTypeMutation(type.id);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Rename ${type.name}`}
        onClick={() => setOpen(true)}
      >
        <Pencil />
      </Button>
      <IncidentTypeNameDialog
        open={open}
        onOpenChange={setOpen}
        title={`Rename ${type.name}`}
        description="Reports keep this type; only its name changes."
        initialName={type.name}
        submitLabel="Rename"
        onSave={(name) => mutateAsync({ name })}
      />
    </>
  );
}
