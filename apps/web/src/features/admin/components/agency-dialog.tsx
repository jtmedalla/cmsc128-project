import { type AgencyDetails, agencyDetailsSchema } from '@repo/shared';
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';

type Errors = Partial<Record<keyof AgencyDetails | 'form', string>>;

const blank: AgencyDetails = { name: '', contactNumber: null };

/**
 * Adds or edits an agency's name and number; the table sets visibility.
 * `onSave` resolves once saved; a 409 shows as a taken name. `isPublic` keeps
 * a public agency from losing its number.
 */
export function AgencyDialog({
  open,
  onOpenChange,
  title,
  initial = blank,
  isPublic = false,
  submitLabel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: AgencyDetails;
  isPublic?: boolean;
  submitLabel: string;
  onSave: (values: AgencyDetails) => Promise<unknown>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const set = (changes: Partial<AgencyDetails>) => {
    setValues((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = agencyDetailsSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[(issue.path[0] as keyof AgencyDetails) ?? 'form'] ??=
          issue.message;
      }
      setErrors(next);
      return;
    }
    if (isPublic && parsed.data.contactNumber === null) {
      setErrors({
        contactNumber:
          'Unlist this agency from hotlines before removing its number.',
      });
      return;
    }
    setPending(true);
    try {
      await onSave(parsed.data);
      onOpenChange(false);
    } catch (cause) {
      setErrors(
        cause instanceof ApiError && cause.status === 409
          ? { name: 'An agency with this name already exists.' }
          : { form: "Couldn't save. Try again." },
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
          setValues(initial);
          setErrors({});
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Set whether it's listed on the hotlines page from the table.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="agency-name">Name</FieldLabel>
              <Input
                id="agency-name"
                value={values.name}
                aria-invalid={errors.name ? true : undefined}
                onChange={(event) => set({ name: event.target.value })}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>
            <Field data-invalid={errors.contactNumber ? true : undefined}>
              <FieldLabel htmlFor="agency-number">Contact number</FieldLabel>
              <Input
                id="agency-number"
                type="tel"
                placeholder="(033) 315-8000"
                value={values.contactNumber ?? ''}
                aria-invalid={errors.contactNumber ? true : undefined}
                onChange={(event) =>
                  set({ contactNumber: event.target.value || null })
                }
              />
              {errors.contactNumber && (
                <FieldError>{errors.contactNumber}</FieldError>
              )}
            </Field>
          </FieldGroup>
          {errors.form && <FieldError>{errors.form}</FieldError>}
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
