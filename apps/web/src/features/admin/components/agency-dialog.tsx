import { type AgencyCreate, agencyCreateSchema } from '@repo/shared';
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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ApiError } from '@/lib/api';

type Errors = Partial<Record<keyof AgencyCreate | 'form', string>>;

const blank: AgencyCreate = { name: '', contactNumber: null, isPublic: false };

/**
 * Adds or edits an agency's name, number and visibility. `onSave` resolves
 * once saved; a 409 shows as a taken name.
 */
export function AgencyDialog({
  open,
  onOpenChange,
  title,
  initial = blank,
  submitLabel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial?: AgencyCreate;
  submitLabel: string;
  onSave: (values: AgencyCreate) => Promise<unknown>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const set = (changes: Partial<AgencyCreate>) => {
    setValues((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = agencyCreateSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        next[(issue.path[0] as keyof AgencyCreate) ?? 'form'] ??= issue.message;
      }
      setErrors(next);
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
              Public agencies' numbers are listed on the hotlines page.
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
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="agency-public">Public</FieldLabel>
                <FieldDescription>
                  List this number on the hotlines page.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="agency-public"
                checked={values.isPublic}
                onCheckedChange={(isPublic) => set({ isPublic })}
              />
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
