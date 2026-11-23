import { incidentTypeCreateSchema } from '@repo/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';

/**
 * Asks for an incident type's name, to add or rename one. `onSave` resolves
 * once saved; a 409 shows as a taken name and other failures as a retry.
 */
export function IncidentTypeNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = '',
  submitLabel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialName?: string;
  submitLabel: string;
  onSave: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = incidentTypeCreateSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setPending(true);
    try {
      await onSave(parsed.data.name);
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 409
          ? 'An incident type with this name already exists.'
          : "Couldn't save. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setName(initialName);
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="incident-type-name">Name</FieldLabel>
            <Input
              id="incident-type-name"
              value={name}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />
            {error && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
