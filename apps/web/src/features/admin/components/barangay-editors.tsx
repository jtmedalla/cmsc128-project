import {
  type Barangay,
  type BarangayUpdate,
  hazardTypeSchema,
} from '@repo/shared';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useUpdateBarangayMutation } from '@/features/geo';
import { label } from '@/lib/format';

/** Saves a change to one barangay, sending its other values unchanged. */
function useUpdateBarangay(barangay: Barangay) {
  const { mutate, isPending } = useUpdateBarangayMutation(barangay.id);
  const save = (changes: Partial<BarangayUpdate>) => {
    const { isCoastal, isUpland, hazards } = barangay;
    mutate(
      { isCoastal, isUpland, hazards, ...changes },
      {
        onError: () => {
          toast.error(`Couldn't update ${barangay.name}. Try again.`);
        },
      },
    );
  };
  return { save, pending: isPending };
}

export function FlagSwitch({
  barangay,
  flag,
}: {
  barangay: Barangay;
  flag: 'isCoastal' | 'isUpland';
}) {
  const { save, pending } = useUpdateBarangay(barangay);
  return (
    <Switch
      aria-label={`${barangay.name} is ${flag === 'isCoastal' ? 'coastal' : 'upland'}`}
      checked={barangay[flag]}
      disabled={pending}
      onCheckedChange={(checked) => save({ [flag]: checked })}
    />
  );
}

export function HazardToggles({ barangay }: { barangay: Barangay }) {
  const { save, pending } = useUpdateBarangay(barangay);
  return (
    <ToggleGroup
      multiple
      variant="outline"
      size="sm"
      aria-label={`${barangay.name} hazards`}
      value={barangay.hazards}
      disabled={pending}
      onValueChange={(values) =>
        save({ hazards: hazardTypeSchema.array().parse(values) })
      }
    >
      {hazardTypeSchema.options.map((hazard) => (
        <ToggleGroupItem key={hazard} value={hazard}>
          {label(hazard)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
