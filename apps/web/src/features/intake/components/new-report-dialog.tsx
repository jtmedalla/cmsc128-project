import {
  ANYONE_HURT_LABELS,
  anyoneHurtSchema,
  createdReportSchema,
  type DashboardReportInput,
  type SeverityLevel,
} from '@repo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { TimePicker } from '@/components/reui/time-picker';
import { SeveritySlider } from '@/components/severity-slider';
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
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { emptyLocation, LocationPicker } from '@/features/geo';
import { reportQueries } from '@/features/triage';
import { api } from '@/lib/api';
import { IncidentTypeSelect } from './incident-type-select';

const empty = {
  incidentTypeId: null as string | null,
  severity: null as SeverityLevel | null,
  location: emptyLocation,
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
    incidentTypeId: values.incidentTypeId,
    severity: values.severity,
    barangayId: values.location.barangayId,
    locationText: values.location.text.trim() || null,
    location: values.location.point,
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
  id: Exclude<keyof Values, 'location' | 'incidentTypeId' | 'severity'>;
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
          hourCycle={12}
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
  const set =
    (
      field: Exclude<keyof Values, 'location' | 'incidentTypeId' | 'severity'>,
    ) =>
    (value: string) =>
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
      <DialogContent className="max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New report</DialogTitle>
          <DialogDescription>
            Log an incident received by phone or radio. Leave unknown details
            blank.
          </DialogDescription>
        </DialogHeader>
        {/* Only the fields scroll, so the header and actions stay in view on short screens. */}
        <form
          className="-mx-4 overflow-y-auto px-4"
          id="new-report"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(toInput(values));
          }}
        >
          {/* Two columns once the dialog is wide: the incident on the left, where and who on the right. */}
          <div className="grid gap-7 lg:grid-cols-2">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="incidentTypeId">Incident type</FieldLabel>
                <IncidentTypeSelect
                  id="incidentTypeId"
                  value={values.incidentTypeId}
                  onValueChange={(incidentTypeId) =>
                    setValues((prev) => ({ ...prev, incidentTypeId }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel id="severity-label">Severity</FieldLabel>
                <SeveritySlider
                  labelId="severity-label"
                  value={values.severity}
                  onValueChange={(severity) =>
                    setValues((prev) => ({ ...prev, severity }))
                  }
                />
              </Field>
              <DateTimeField
                date={values.incidentDate}
                time={values.incidentTime}
                onDateChange={set('incidentDate')}
                onTimeChange={set('incidentTime')}
              />
            </FieldGroup>
            <FieldGroup>
              <LocationPicker
                withBarangay
                value={values.location}
                onChange={(location) =>
                  setValues((prev) => ({ ...prev, location }))
                }
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
          </div>
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
