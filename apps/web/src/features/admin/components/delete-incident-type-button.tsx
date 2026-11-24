import type { IncidentType } from '@repo/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useDeleteIncidentTypeMutation } from '../mutations';

/** Deletes a retired, unused type, such as a mistake or a test entry. */
export function DeleteIncidentTypeButton({ type }: { type: IncidentType }) {
  const { mutate, isPending } = useDeleteIncidentTypeMutation(type.id);
  const [open, setOpen] = useState(false);
  const remove = () => {
    setOpen(false);
    mutate(undefined, {
      onSuccess: () => toast.success(`Deleted ${type.name}.`),
      onError: (error) =>
        toast.error(
          error instanceof ApiError && error.status === 409
            ? `${type.name} was restored or a report now uses it.`
            : `Couldn't delete ${type.name}. Try again.`,
        ),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${type.name}`}
            disabled={isPending}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {type.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It's retired and no report uses it, so nothing is lost. This can't
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
