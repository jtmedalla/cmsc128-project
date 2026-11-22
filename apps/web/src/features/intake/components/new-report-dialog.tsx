import {
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { emptyLocation, LocationPicker } from '@/features/geo';
import { reportQueries } from '@/features/triage';
import { api } from '@/lib/api';
import { toVictimInputs, type VictimsValue, victimsValid } from '../victims';
import { IncidentTypeSelect } from './incident-type-select';
import { VictimsField } from './victims-field';

const empty = {
  incidentTypeId: null as string | null,
  severity: null as SeverityLevel | null,
  location: emptyLocation,
  /** `yyyy-MM-dd` from the calendar. */
  incidentDate: '',
  /** `HH:mm`; midnight when only the date is known. */
  incidentTime: '',
  victims: { anyoneHurt: null, victims: [] } as VictimsValue,
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
    anyoneHurt: values.victims.anyoneHurt,
    victims: toVictimInputs(values.victims),
  };
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
      field: Exclude<
        keyof Values,
        'location' | 'incidentTypeId' | 'severity' | 'victims'
      >,
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
        {/* Only the fields scroll, so the header and actions stay in view: the whole form when stacked, each column on its own side by side. */}
        <form
          className="-mx-4 flex min-h-0 flex-col gap-7 overflow-y-auto px-4 lg:grid lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-0 lg:overflow-hidden lg:px-0"
          id="new-report"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(toInput(values));
          }}
        >
          {/* Two columns once the dialog is wide: the incident and who's hurt on the left, where on the right. */}
          <FieldGroup className="lg:overflow-y-auto lg:px-4">
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
            <FieldSeparator />
            <VictimsField
              value={values.victims}
              onChange={(victims) =>
                setValues((prev) => ({ ...prev, victims }))
              }
            />
          </FieldGroup>
          <FieldGroup className="lg:overflow-y-auto lg:px-4">
            <LocationPicker
              withBarangay
              value={values.location}
              onChange={(location) =>
                setValues((prev) => ({ ...prev, location }))
              }
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="submit"
            form="new-report"
            disabled={create.isPending || !victimsValid(values.victims)}
          >
            {create.isPending ? 'Creating…' : 'Create report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
