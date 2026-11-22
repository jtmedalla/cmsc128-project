import {
  ANYONE_HURT_LABELS,
  anyoneHurtSchema,
  createdReportSchema,
  type DashboardReportInput,
  SEVERITY_LABELS,
  severityLevelSchema,
} from '@repo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { TimePicker } from '@/components/reui/time-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { reportQueries } from '@/features/triage';
import { api } from '@/lib/api';
import { intakeQueries } from '../queries';

const empty = {
  incidentTypeId: '',
  severity: '',
  barangayId: '',
  locationText: '',
  /** `yyyy-MM-dd` from the calendar. */
  incidentDate: '',
  /** `HH:mm`; midnight when only the date is known. */
  incidentTime: '',
  anyoneHurt: '',
};
type Values = typeof empty;

/** Blank fields stay unknown; triage fills them in later. */
function toInput(values: Values): DashboardReportInput {
  return {
    incidentTypeId: values.incidentTypeId || null,
    severity: severityLevelSchema.safeParse(values.severity).data ?? null,
    barangayId: values.barangayId || null,
    locationText: values.locationText.trim() || null,
    incidentAt: values.incidentDate
      ? new Date(
          `${values.incidentDate}T${values.incidentTime || '00:00'}`,
        ).toISOString()
      : null,
    anyoneHurt: anyoneHurtSchema.safeParse(values.anyoneHurt).data ?? null,
  };
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: keyof Values;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        id={id}
        className="w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <NativeSelectOption value="">Unknown</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

/** A calendar date picker beside reui's time picker. */
function DateTimeField({
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = date ? parseISO(date) : undefined;
  return (
    <div className="flex gap-3">
      <Field className="flex-1">
        <FieldLabel htmlFor="incidentDate">Incident date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id="incidentDate"
                variant="outline"
                className="justify-between font-normal"
              />
            }
          >
            {selected ? format(selected, 'PPP') : 'Unknown'}
            <ChevronDown data-icon="inline-end" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              disabled={{ after: new Date() }}
              onSelect={(day) => {
                onDateChange(day ? format(day, 'yyyy-MM-dd') : '');
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-36">
        <FieldLabel id="incidentTime-label" htmlFor="incidentTime">
          Time
        </FieldLabel>
        <TimePicker
          id="incidentTime"
          aria-labelledby="incidentTime-label"
          placeholder="Unknown"
          disabled={!date}
          value={time || null}
          onValueChange={(value) => onTimeChange(value ?? '')}
        />
      </Field>
    </div>
  );
}

/**
 * The header's New report button: logs a phone or radio report with the
 * signed-in responder as its creator (FR38), then opens it in the feed.
 */
export function NewReportDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(empty);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const incidentTypes = useQuery({
    ...intakeQueries.incidentTypes(),
    enabled: open,
  });
  const barangays = useQuery({ ...intakeQueries.barangays(), enabled: open });

  const set = (field: keyof Values) => (value: string) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const create = useMutation({
    mutationFn: (input: DashboardReportInput) =>
      api.post('/intake/reports', input, createdReportSchema),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: reportQueries.all() });
      setOpen(false);
      setValues(empty);
      toast.success('Report created');
      await navigate({ to: '/dashboard/incidents', search: { report: id } });
    },
    onError: () => toast.error("Couldn't create the report. Try again."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        New report
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New report</DialogTitle>
          <DialogDescription>
            Log an incident received by phone or radio. Leave unknown details
            blank.
          </DialogDescription>
        </DialogHeader>
        <form
          id="new-report"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(toInput(values));
          }}
        >
          <FieldGroup>
            <SelectField
              id="incidentTypeId"
              label="Incident type"
              value={values.incidentTypeId}
              onChange={set('incidentTypeId')}
              options={(incidentTypes.data ?? []).map((t) => ({
                value: t.id,
                label: t.name,
              }))}
            />
            <SelectField
              id="severity"
              label="Severity"
              value={values.severity}
              onChange={set('severity')}
              options={severityLevelSchema.options.map((level) => ({
                value: level,
                label: SEVERITY_LABELS[level],
              }))}
            />
            <SelectField
              id="barangayId"
              label="Barangay"
              value={values.barangayId}
              onChange={set('barangayId')}
              options={(barangays.data ?? []).map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />
            <Field>
              <FieldLabel htmlFor="locationText">Location</FieldLabel>
              <Input
                id="locationText"
                placeholder="Street, landmark or sitio"
                value={values.locationText}
                onChange={(event) => set('locationText')(event.target.value)}
              />
            </Field>
            <DateTimeField
              date={values.incidentDate}
              time={values.incidentTime}
              onDateChange={set('incidentDate')}
              onTimeChange={set('incidentTime')}
            />
            <SelectField
              id="anyoneHurt"
              label="Anyone hurt?"
              value={values.anyoneHurt}
              onChange={set('anyoneHurt')}
              options={(['yes', 'no'] as const).map((answer) => ({
                value: answer,
                label: ANYONE_HURT_LABELS[answer],
              }))}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="new-report" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
