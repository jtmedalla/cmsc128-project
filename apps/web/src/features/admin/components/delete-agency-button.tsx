import type { Agency } from '@repo/shared';
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
import { useDeleteAgencyMutation } from '../mutations';

/** Deletes a retired, private, unused agency, such as a test entry. */
export function DeleteAgencyButton({ agency }: { agency: Agency }) {
  const { mutate, isPending } = useDeleteAgencyMutation(agency.id);
  const [open, setOpen] = useState(false);
  const remove = () => {
    setOpen(false);
    mutate(undefined, {
      onSuccess: () => toast.success(`Deleted ${agency.name}.`),
      onError: (error) =>
        toast.error(
          error instanceof ApiError && error.status === 409
            ? `${agency.name} was restored, listed or referred to.`
            : `Couldn't delete ${agency.name}. Try again.`,
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
            aria-label={`Delete ${agency.name}`}
            disabled={isPending}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agency.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It's retired, off hotlines and no referral names it, so nothing is
            lost. This can't be undone.
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
